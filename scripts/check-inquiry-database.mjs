// Explicit integration runner: excluded from Node's automatic unit-test discovery.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import pg from 'pg'

const connectionString = process.env.INQUIRY_TEST_DATABASE_URL
if (!connectionString) throw Error('Set INQUIRY_TEST_DATABASE_URL to a disposable local PostgreSQL database.')
const target = new URL(connectionString)
if (!['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || !/^\/storefront_inquiry_test_[a-z0-9_]+$/.test(target.pathname)) throw Error('Only a disposable local storefront_inquiry_test_* database is allowed.')
const db = new pg.Client({ connectionString }); await db.connect()
let checks = 0
const check = (condition, message) => { assert.ok(condition, message); checks++ }
try {
  check((await db.query("select to_regclass('public.inquiries') as existing")).rows[0].existing === null, 'Database must be fresh')
  for (const role of ['anon', 'authenticated', 'service_role']) await db.query(`do $$ begin if not exists(select 1 from pg_roles where rolname='${role}') then create role ${role} ${role === 'service_role' ? 'bypassrls' : ''}; end if; end $$`)
  await db.query(await readFile(new URL('../supabase/migrations/20261003075844_storefront_inquiries.sql', import.meta.url), 'utf8'))
  check((await db.query("select count(*)::int as n from pg_class where oid in ('public.inquiries'::regclass,'public.inquiry_rate_limits'::regclass) and relrowsecurity")).rows[0].n === 2, 'Both tables have RLS')
  for (const role of ['anon', 'authenticated']) {
    await db.query(`set role ${role}`)
    for (const sql of [
      'select * from public.inquiries',
      "insert into public.inquiries(name,email,company,need,message,request_id,payload_hash) values('test','test@example.test','Test','sample','Test',gen_random_uuid(),repeat('a',64))",
      "update public.inquiries set status='read'", 'delete from public.inquiries',
      'select * from public.inquiry_rate_limits', "select public.consume_inquiry_rate_limit(repeat('a',64))",
    ]) { await assert.rejects(db.query(sql), { code: '42501' }); checks++ }
    await db.query('reset role')
  }
  await db.query('set role service_role')
  for (let attempt = 1; attempt <= 6; attempt++) check((await db.query("select public.consume_inquiry_rate_limit(repeat('a',64)) as allowed")).rows[0].allowed === (attempt <= 5), 'Durable rate cap is five per hour')
  await db.query("insert into public.inquiries(name,email,company,need,message,request_id,payload_hash) values('Test','test@example.test','Test','sample','Synthetic inquiry','10000000-0000-4000-8000-000000000001',repeat('b',64))")
  check((await db.query('select count(*)::int as n from public.inquiries')).rows[0].n === 1, 'Service can insert')
  await assert.rejects(db.query("insert into public.inquiries(name,email,company,need,message,request_id,payload_hash) values('Test','test@example.test','Test','sample','Duplicate','10000000-0000-4000-8000-000000000001',repeat('b',64))"), { code: '23505' }); checks++
  await assert.rejects(db.query("update public.inquiries set message=repeat('a',5001)"), { code: '23514' }); checks++
  await assert.rejects(db.query("update public.inquiries set need='arbitrary'"), { code: '23514' }); checks++
  const leases = await db.query("update public.inquiries set delivery_claim='20000000-0000-4000-8000-000000000002',delivery_claimed_at=now() where delivery_claim is null returning id")
  check(leases.rowCount === 1, 'First worker claims inquiry')
  check((await db.query("update public.inquiries set delivery_claim=gen_random_uuid() where delivery_claim is null returning id")).rowCount === 0, 'Second worker cannot claim active inquiry')
  await db.query('reset role')
  const connections = await Promise.all(Array.from({ length: 8 }, async () => { const c = new pg.Client({ connectionString }); await c.connect(); return c }))
  try {
    const attempts = await Promise.all(connections.map(async c => { await c.query('set role service_role'); return (await c.query("select public.consume_inquiry_rate_limit(repeat('c',64)) as allowed")).rows[0].allowed }))
    check(attempts.filter(Boolean).length === 5, 'Parallel PostgreSQL sessions cannot bypass rate cap')
  } finally { await Promise.all(connections.map(c => c.end())) }
  console.log(JSON.stringify({ result: 'passed', checks, remoteWrites: false, realEmails: false }))
} finally { await db.end() }

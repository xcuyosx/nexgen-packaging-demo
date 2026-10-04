// Real PostgreSQL + local HTTP adapters. No hosted credentials or live mail.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createServer } from 'node:http'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { createServer as createViteServer } from 'vite'
import { chromium } from 'playwright'
import { createQuoteStore } from '../supabase/functions/quote-notifications/store.ts'
import { createQuoteWorker } from '../supabase/functions/quote-notifications/worker.ts'
import { createQuoteMailer } from '../supabase/functions/quote-notifications/mail.ts'

const connectionString=process.env.QUOTE_TEST_DATABASE_URL
if(!connectionString)throw Error('Set QUOTE_TEST_DATABASE_URL to a disposable local database')
const target=new URL(connectionString)
if(!['127.0.0.1','localhost'].includes(target.hostname)||!/^\/storefront_quote_test_[0-9]+$/.test(target.pathname))throw Error('Only disposable local databases are allowed')
const pool=new pg.Pool({connectionString}),db=await pool.connect()
const user='11111111-1111-4111-8111-111111111111',other='33333333-3333-4333-8333-333333333333',lead='22222222-2222-4222-8222-222222222222'
const backend='http://127.0.0.1:54330', base='http://127.0.0.1:5187',secret='local-worker-secret-'.repeat(3),service='local-service-test'
const token=[Buffer.from('{}').toString('base64url'),Buffer.from(JSON.stringify({sub:user,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'local-test'].join('.')
const files=new Map(),deliveries=new Map(),mailAttempts=[],errors=[]
let checks=0, browser, page, vite, server, dropInsert=true, failReceiptReads=1, ambiguousMail=true
const check=(value,message)=>{assert.ok(value,message);checks++}
const query=async(sql,values=[])=>{const c=await pool.connect();try{return await c.query(sql,values)}finally{c.release()}}
const userQuery=async(sql,values=[],as=user)=>{const c=await pool.connect();try{await c.query('begin');await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true)",[as]);const r=await c.query(sql,values);await c.query('commit');return r}catch(e){await c.query('rollback');throw e}finally{c.release()}}
const sign=(path,expires)=>createHmac('sha256',secret).update(`${path}:${expires}`).digest('hex')
const body=async req=>{const chunks=[];for await(const chunk of req)chunks.push(chunk);return Buffer.concat(chunks)}
let worker
try{
 check((await db.query("select to_regclass('public.customer_quote_requests') existing")).rows[0].existing===null,'Fresh database required')
 await db.query(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;
 create table public.customer_quote_requests(id uuid primary key,user_id uuid not null references auth.users,lead_id uuid not null,request_number text unique not null,contact_snapshot jsonb,billing_snapshot jsonb,shipping_snapshot jsonb,purchase_order text,notes text,lines jsonb not null);
 alter table public.customer_quote_requests enable row level security;
 grant select,insert on public.customer_quote_requests to authenticated;
 create policy own_quotes on public.customer_quote_requests to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
 create table public.fixture_crm_quotes(request_id uuid primary key references public.customer_quote_requests);
 create table public.fixture_crm_lines(request_id uuid references public.customer_quote_requests,line jsonb);
 create function public.fixture_crm_bridge() returns trigger language plpgsql security definer set search_path=pg_catalog as $$begin insert into public.fixture_crm_quotes values(new.id);insert into public.fixture_crm_lines select new.id,value from jsonb_array_elements(new.lines);return new;end$$;
 create trigger customer_quote_request_create_crm_quote after insert on public.customer_quote_requests for each row execute function public.fixture_crm_bridge();`)
 await db.query('insert into auth.users values($1,$2,now()),($3,$4,null)',[user,'verified@example.test',other,'unverified@example.test'])
 await db.query(await fs.readFile(new URL('../supabase/migrations/20261004052321_storefront_quote_notifications.sql',import.meta.url),'utf8'))
 for(const role of ['anon','authenticated']){
  await db.query(`set role ${role}`)
  for(const sql of ['select * from public.quote_notification_jobs',"select * from public.claim_quote_notification(gen_random_uuid())",'select * from private.storefront_quote_rate']){
   await assert.rejects(db.query(sql),{code:'42501'});checks++
  }
  await db.query('reset role')
 }
 const sample=(id=crypto.randomUUID(),uid=user)=>({id,user_id:uid,lead_id:lead,request_number:`WEB-20261004-${id.slice(0,8).toUpperCase()}`,contact_snapshot:{email:'typed@example.test'},billing_snapshot:{},shipping_snapshot:{},purchase_order:'QA',notes:'Synthetic test',lines:[{sku:'QA',productName:'Test',cases:1}]})
 const insert=async(data,as=user)=>{const keys=Object.keys(data);return userQuery(`insert into customer_quote_requests(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(data).map(v=>typeof v==='object'?JSON.stringify(v):v),as)}
 const first=sample();await insert(first)
 check((await query('select count(*)::int n from quote_notification_jobs where request_id=$1',[first.id])).rows[0].n===2,'Exactly two durable jobs per request')
 check((await query('select verified_email from quote_notification_jobs where request_id=$1',[first.id])).rows.every(r=>r.verified_email==='verified@example.test'),'Recipient comes from verified Auth email')
 await assert.rejects(insert(first),{code:'23505'});checks++
 check((await userQuery('select * from customer_quote_requests',[],other)).rows.length===0,'Cross-customer quote isolation')
 const unverified=sample(undefined,other);await insert(unverified,other)
 check((await query("select stopped_reason from quote_notification_jobs where request_id=$1 and kind='customer'",[unverified.id])).rows[0].stopped_reason==='unverified_recipient','Unverified recipient stays blocked')
 const claims=await Promise.all(Array.from({length:8},async()=>{const c=await pool.connect();try{await c.query('begin');await c.query('set local role service_role');const r=await c.query('select * from public.claim_quote_notification($1)',[crypto.randomUUID()]);await c.query('commit');return r.rows}catch(e){await c.query('rollback');throw e}finally{c.release()}}))
 const identities=claims.flat().map(j=>j.request_id+j.kind);check(identities.length===3&&new Set(identities).size===3,'Concurrent workers cannot claim the same job')
 await db.query("update quote_notification_jobs set claim_until=now()-interval '1 second'")
 await db.query("update quote_notification_jobs set first_attempt_at=now()-interval '24 hours' where request_id=$1",[first.id])
 await db.query('set role service_role');await db.query('select * from claim_quote_notification(gen_random_uuid())');await db.query('reset role')
 check((await query("select count(*)::int n from quote_notification_jobs where request_id=$1 and stopped_reason='retry_window_expired'",[first.id])).rows[0].n===2,'Expired idempotency windows stop automatically')
 await db.query('truncate customer_quote_requests cascade');await db.query('truncate private.storefront_quote_rate')
 const limit=await Promise.allSettled(Array.from({length:25},()=>insert(sample())))
 check(limit.filter(r=>r.status==='fulfilled').length===20,'Concurrent submissions enforce 20/user/hour')
 check((await query('select count(*)::int n from quote_notification_jobs')).rows[0].n===40,'Rate-limit failures roll back both jobs')
 check((await query('select count(*)::int n from fixture_crm_quotes')).rows[0].n===20,'Rate-limit failures roll back CRM bridge writes')
 await db.query('truncate customer_quote_requests cascade');await db.query('truncate private.storefront_quote_rate')
 server=createServer(async(req,res)=>{
  const url=new URL(req.url,backend),auth=req.headers.authorization
  const reply=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))}
  res.setHeader('Access-Control-Allow-Origin',base);res.setHeader('Access-Control-Allow-Headers','authorization,apikey,content-type,prefer,x-upsert');res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS')
  if(req.method==='OPTIONS'){res.statusCode=204;res.end();return}
  try{
   if(url.pathname==='/worker'){
    const response=await worker(new Request(backend+'/worker',{method:req.method,headers:{Authorization:auth||''}}));return reply(response.status,await response.json())
   }
   if(url.pathname==='/auth/v1/token')return reply(200,{access_token:token,refresh_token:'local-refresh',expires_in:3600,user:{id:user}})
   if(url.pathname.startsWith('/storage/v1/object/sign/customer-quote-artwork/')){
    const path=url.pathname.split('/customer-quote-artwork/')[1],expires=Number(url.searchParams.get('expires')),given=Buffer.from(url.searchParams.get('token')||''),expected=Buffer.from(sign(path,expires))
    if(expires<Date.now()||given.length!==expected.length||!timingSafeEqual(given,expected)||!files.has(path))return reply(403,{error:'Invalid link'})
    res.setHeader('Content-Type','image/svg+xml');res.end(files.get(path));return
   }
   if(auth===`Bearer ${service}`){
    if(url.pathname==='/storage/v1/object/sign/customer-quote-artwork'){
     const data=JSON.parse((await body(req)).toString());const expires=Date.now()+data.expiresIn*1000
     return reply(200,data.paths.map(path=>({path,error:files.has(path)?null:'Missing',signedURL:`/object/sign/customer-quote-artwork/${path}?expires=${expires}&token=${sign(path,expires)}`})))
    }
    const c=await pool.connect();try{
     await c.query('begin');await c.query('set local role service_role');let rows
     if(url.pathname==='/rest/v1/rpc/claim_quote_notification')rows=(await c.query('select * from claim_quote_notification($1)',[JSON.parse((await body(req)).toString()).p_claim_id])).rows
     else if(url.pathname==='/rest/v1/quote_notification_jobs'&&req.method==='PATCH'){
      const data=JSON.parse((await body(req)).toString()), allowed=['prepared_mail','first_attempt_at','accepted_at','provider_id','claim_id','claim_until','stopped_reason','next_attempt_at'],keys=Object.keys(data)
      if(keys.some(k=>!allowed.includes(k)))throw Error('Unexpected job field')
      const values=Object.values(data).map(v=>v&&typeof v==='object'?JSON.stringify(v):v),n=values.length
      values.push(url.searchParams.get('request_id').slice(3),url.searchParams.get('kind').slice(3),url.searchParams.get('claim_id').slice(3))
      rows=(await c.query(`update quote_notification_jobs set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where request_id=$${n+1} and kind=$${n+2} and claim_id=$${n+3} and claim_until>now() returning request_id`,values)).rows
     }else throw Error('Unexpected service request')
     await c.query('commit');return reply(200,rows)
    }catch(e){await c.query('rollback');throw e}finally{c.release()}
   }
   if(auth!==`Bearer ${token}`)return reply(401,{error:'Unauthorized'})
   if(url.pathname==='/rest/v1/customer_accounts')return reply(200,[{id:user,user_id:user,lead_id:lead,company_name:'Local QA',contact_name:'QA Tester',email:'verified@example.test',revision:1}])
   if(url.pathname==='/rest/v1/customer_quote_requests'){
    if(req.method==='POST'){
     const data=JSON.parse((await body(req)).toString());const result=await insert(data)
     if(dropInsert){dropInsert=false;req.socket.destroy();return}return reply(201,result.rows)
    }
    if(!dropInsert&&failReceiptReads>0){failReceiptReads--;return reply(503,{error:'Simulated recovery outage'})}
    return reply(200,(await userQuery('select id,request_number from customer_quote_requests where id=$1',[url.searchParams.get('id').slice(3)])).rows)
   }
   if(url.pathname.startsWith('/storage/v1/object/customer-quote-artwork/')){
    const path=url.pathname.split('/customer-quote-artwork/')[1];if(!path.startsWith(user+'/'))return reply(403,{error:'Forbidden'})
    if(files.has(path))return reply(409,{error:'Duplicate'})
    files.set(path,await body(req));return reply(200,{Key:path})
   }
   if(url.pathname==='/rest/v1/rpc/customer_quote_history')return reply(200,(await userQuery('select request_number,now() submitted_at,lines items from customer_quote_requests')).rows)
   if(url.pathname.startsWith('/rest/v1/'))return reply(200,[])
   return reply(404,{error:'Not found'})
  }catch(e){if(e.code==='23505')return reply(409,{error:'Duplicate request'});errors.push(e.message);return reply(500,{error:'Local adapter failed'})}
 })
 await new Promise(resolve=>server.listen(54330,'127.0.0.1',resolve))
 const store=createQuoteStore(backend,service)
 const send=createQuoteMailer('local-provider-key',async(_url,init)=>{
  const key=init.headers['Idempotency-Key'];mailAttempts.push({key,body:init.body})
  if(!deliveries.has(key))deliveries.set(key,JSON.parse(init.body))
  else assert.equal(JSON.stringify(deliveries.get(key)),init.body)
  if(ambiguousMail){ambiguousMail=false;throw Error('Provider accepted but response lost')}
  return Response.json({id:`local-${key}`})
 })
 worker=createQuoteWorker({enabled:true,secret,store,send})
 process.env.VITE_SUPABASE_URL=backend;process.env.VITE_SUPABASE_ANON_KEY='local-public-test';process.env.VITE_NOINDEX='true'
 vite=await createViteServer({root:fileURLToPath(new URL('..',import.meta.url)),server:{host:'127.0.0.1',port:5187,strictPort:true},logLevel:'error'});await vite.listen()
 browser=await chromium.launch({headless:true});page=await browser.newPage({viewport:{width:1440,height:1000}})
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message))
 await page.goto(base+'/account');await page.getByLabel('Email',{exact:true}).fill('verified@example.test');await page.getByLabel('Password',{exact:true}).fill('local-test-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Local QA',exact:true}).waitFor()
 await page.goto(base+'/custom');const artwork='<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="45" fill="green"/></svg>'
 await page.locator('input[type="file"]').setInputFiles({name:'qa-logo.svg',mimeType:'image/svg+xml',buffer:Buffer.from(artwork)})
 await page.getByRole('button',{name:/add.*quote/i}).first().click();await page.locator('header a[href="/cart"]').click()
 await page.getByLabel('Name',{exact:true}).fill('QA Tester')
 await page.getByLabel('Company',{exact:true}).fill('Local QA')
 await page.getByLabel('Email',{exact:true}).fill('different-contact@example.test')
 await page.locator('.quote-request-form').evaluate(form=>{form.requestSubmit();form.requestSubmit()})
 await page.getByRole('alert').filter({hasText:/fetch|confirm|network/i}).waitFor()
 check((await query('select count(*)::int n from customer_quote_requests')).rows[0].n===1,'Double submit plus interrupted response stores one request')
 check(await page.locator('.cart-page-items article').count()===1,'Cart and artwork remain after uncertain response')
 await page.getByRole('button',{name:'Request quote',exact:true}).click();await page.getByRole('heading',{name:'Quote request received'}).waitFor()
 const saved=(await query('select * from customer_quote_requests')).rows[0]
 check((await page.getByRole('status').innerText()).includes(saved.request_number),'Browser displays persisted reference')
 check(files.size===1,'Retry does not upload duplicate artwork')
 check((await query('select count(*)::int n from fixture_crm_quotes')).rows[0].n===1,'One CRM bridge record')
 check((await query('select count(*)::int n from fixture_crm_lines')).rows[0].n===1,'One CRM line')
 const runWorker=()=>fetch(backend+'/worker',{method:'POST',headers:{Authorization:`Bearer ${secret}`}})
 const disabled=createQuoteWorker({enabled:false,secret,store,send});check((await disabled(new Request(backend+'/worker',{method:'POST'}))).status===503,'Disabled delivery makes no mail calls')
 await runWorker();check(deliveries.size===2,'Both recipients queued independently despite partial failure')
 await db.query('update quote_notification_jobs set next_attempt_at=now()')
 await Promise.all([runWorker(),runWorker(),runWorker()])
 check((await query('select count(*)::int n from quote_notification_jobs where accepted_at is not null')).rows[0].n===2,'Retry eventually records both provider acceptances')
 check(deliveries.size===2&&mailAttempts.length===3,'Ambiguous provider retry yields two distinct messages')
 const sales=[...deliveries.values()].find(m=>m.to[0]==='orders@nexgenpac.com'),customer=[...deliveries.values()].find(m=>m.to[0]==='verified@example.test')
 check(!!sales&&!!customer&&!customer.text.includes('token='),'Verified customer gets summary; only sales gets artwork URL')
 check(sales.text.includes(saved.request_number)&&customer.text.includes(saved.request_number),'Both messages contain stored reference')
 const signed=sales.text.match(/http:\/\/127\.0\.0\.1:54330\/storage[^\s]+/)[0]
 check(await (await fetch(signed)).text()===artwork,'Signed artwork download returns uploaded bytes')
 const tampered=new URL(signed);tampered.searchParams.set('token','bad');check((await fetch(tampered)).status===403,'Tampered artwork token denied')
 const expired=new URL(signed),objectPath=saved.lines[0].artworkPath,old=Date.now()-1000;expired.searchParams.set('expires',String(old));expired.searchParams.set('token',sign(objectPath,old));check((await fetch(expired)).status===403,'Expired signed artwork denied')
 check((await fetch(backend+'/storage/v1/object/customer-quote-artwork/'+objectPath)).status===401,'Anonymous private artwork denied')
 check(pageErrors.length===0&&errors.length===0,'No runtime or local adapter errors')
 const output=process.env.QUOTE_TEST_OUTPUT||'test-results/quote-notifications';await fs.mkdir(output,{recursive:true});await page.screenshot({path:output+'/quote-receipt.png'})
 await fs.writeFile(output+'/result.json',JSON.stringify({result:'passed',checks,realPostgres:true,realEmails:false,hostedWrites:false,providerMessages:deliveries.size,providerAttempts:mailAttempts.length,limitation:'Synthetic Auth, Storage gateway and CRM bridge fixtures; actual PostgreSQL migration, browser submission and worker adapters exercised.'},null,2))
 console.log(JSON.stringify({result:'passed',checks,providerMessages:deliveries.size,providerAttempts:mailAttempts.length,output}))
}catch(error){
 if(page){console.error('Synthetic browser state:',await page.locator('main').innerText());console.error('Local adapter errors:',errors)}
 throw error
}finally{await browser?.close();await vite?.close();if(server){server.closeAllConnections();await new Promise(r=>server.close(r))}db.release();await pool.end()}

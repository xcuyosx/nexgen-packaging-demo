import test from 'node:test'
import assert from 'node:assert/strict'
import { buildQuoteMail, deliverQuoteJob, createQuoteWorker } from '../supabase/functions/quote-notifications/worker.ts'
import { createQuoteMailer } from '../supabase/functions/quote-notifications/mail.ts'
import { createQuoteStore } from '../supabase/functions/quote-notifications/store.ts'
const id='10000000-0000-4000-8000-000000000001', user='20000000-0000-4000-8000-000000000002'
const path=`${user}/${id}/30000000-0000-4000-8000-000000000003.svg`
const job=kind=>({request_id:id,kind,created_at:'2026-10-06T15:00:00Z',verified_email:'verified@example.test',prepared_mail:null,first_attempt_at:null,claim_id:crypto.randomUUID(),attempts:1,
 snapshot:{id,user_id:user,request_number:'WEB-20261004-ABC12345',contact:{email:'arbitrary@example.test'},billing:{label:'Office'},shipping:{city:'Local QA'},notes:'<script>unsafe</script>',lines:[{productName:'Test cup',sku:'CUP-QA',cases:12,printColors:1,inkColors:['Black'],artworkName:'qa.svg',artworkPath:path}]}})
const fixture=()=>{let current; const accepted=[]; const stopped=[]; let signs=0; return {accepted,stopped,get signs(){return signs},get current(){return current},
 store:{claim:async()=>null,sign:async paths=>{signs++;return paths.map(p=>`https://local.test/${p}?token=fixed`)},prepare:async(j,m,t)=>{current={...j,prepared_mail:structuredClone(m),first_attempt_at:t}},accepted:async(j,p)=>{accepted.push({j,p})},release:async(j,why)=>{stopped.push(why)}}}}

test('reply, change-request and inquiry mail use whitelisted text and independent durable identities',async()=>{
 for(const kind of ['reply','changes','contact_sales','contact_visitor']){
  const f=fixture(),event={...job(kind),queue:'portal',notification_id:crypto.randomUUID(),snapshot:{...job(kind).snapshot,body:'Please review this change.',name:'QA Buyer',company:'QA Company',email:'verified@example.test',phone:'',need:'sample',message:'Please send samples.',cost:'PRIVATE_COST',internalNotes:'PRIVATE_NOTE'}}
  const mail=await buildQuoteMail(event,f.store)
  assert.doesNotMatch(mail.text,/PRIVATE_COST|PRIVATE_NOTE|token=/)
  assert.deepEqual(mail.to,[kind==='changes'||kind==='contact_sales'?'orders@nexgenpac.com':'verified@example.test'])
  const attempts=[];const send=async(message,key)=>{attempts.push({message,key});if(attempts.length===1)throw Error('Uncertain provider response');return 'accepted'}
  assert.equal(await deliverQuoteJob(event,f.store,send),'retry')
  assert.equal(await deliverQuoteJob(f.current,f.store,send),'accepted')
  assert.deepEqual(attempts[0],attempts[1]);assert.match(attempts[0].key,new RegExp(event.notification_id))
 }
})

test('both receipts include submitted details; customer receives no artwork links and only at verified address',async()=>{
 const f=fixture();const sales=await buildQuoteMail(job('sales'),f.store), customer=await buildQuoteMail(job('customer'),f.store)
 assert.deepEqual(sales.to,['orders@nexgenpac.com']);assert.equal(sales.reply_to,'verified@example.test')
 assert.match(sales.text,/token=fixed/);assert.match(sales.text,/24 hours/);assert.match(sales.text,/Local QA/)
 assert.deepEqual(customer.to,['verified@example.test']);assert.equal(customer.reply_to,'orders@nexgenpac.com')
 assert.match(customer.text,/CUP-QA/);assert.match(customer.text,/12/);assert.doesNotMatch(customer.text,/token=/)
 assert.match(customer.text,/Local QA/);assert.match(customer.text,/Office/);assert.match(customer.text,/within 1 business day/)
 assert.match(customer.text,/Submitted: Oct 6, 2026, 10:00 AM CDT/);assert.match(customer.text,/3. You review the quote/)
 assert.equal(f.signs,1);assert.equal(customer.from,'orders@nexgenpac.com')
})
test('an ambiguous provider acceptance retries the same key and exact signed-link payload',async()=>{
 const f=fixture(), attempts=[], delivered=new Map()
 const send=async(mail,key)=>{attempts.push({mail:structuredClone(mail),key});if(!delivered.has(key)) {delivered.set(key,mail);throw Error('response lost')}return 'same-provider-id'}
 assert.equal(await deliverQuoteJob(job('sales'),f.store,send),'retry')
 assert.equal(await deliverQuoteJob(f.current,f.store,send),'accepted')
 assert.equal(f.signs,1);assert.equal(delivered.size,1);assert.deepEqual(attempts[0],attempts[1]);assert.equal(f.accepted.length,1)
})
test('lost durable prepare response never sends and later recovers the saved payload',async()=>{
 const f=fixture(), prepare=f.store.prepare;let calls=0
 f.store.prepare=async(...args)=>{await prepare(...args);throw Error('ambiguous prepare')}
 const send=async()=>{calls++;return 'id'}
 assert.equal(await deliverQuoteJob(job('sales'),f.store,send),'retry');assert.equal(calls,0)
 assert.equal(await deliverQuoteJob(f.current,f.store,send),'accepted');assert.equal(calls,1);assert.equal(f.signs,1)
})
test('missing recipient and cross-customer artwork cannot send; expired retries stop',async()=>{
 for (const bad of [{...job('customer'),verified_email:'header\r\ninjection@example.test'}, {...job('sales'),snapshot:{...job('sales').snapshot,lines:[{artworkPath:path.replace(user,id)}]}}]) {
  const f=fixture();assert.equal(await deliverQuoteJob(bad,f.store,async()=>assert.fail('must not send')),'stopped');assert.deepEqual(f.stopped,['invalid_job'])
 }
 const f=fixture();assert.equal(await deliverQuoteJob({...job('sales'),first_attempt_at:new Date(Date.now()-23*3600000-1).toISOString()},f.store,async()=>assert.fail('must not send')),'stopped');assert.deepEqual(f.stopped,['retry_window_expired'])
})
test('worker is disabled by default and excludes public, authenticated and wrong-secret requests',async()=>{
 const f=fixture();let claims=0;f.store.claim=async()=>{claims++;return null}
 for(const [enabled,secret,authorization,expected] of [[false,'x'.repeat(32),'Bearer '+'x'.repeat(32),503],[true,'short','Bearer short',503],[true,'x'.repeat(32),'Bearer user-token',401],[true,'x'.repeat(32),'',401],[true,'x'.repeat(32),'Bearer '+'x'.repeat(32),200]]){
  const handler=createQuoteWorker({enabled,secret,store:f.store,send:async()=>assert.fail('no jobs')})
  const response=await handler(new Request('https://local.test/worker',{method:'POST',headers:{Authorization:authorization}}))
  assert.equal(response.status,expected)
 }
 assert.equal(claims,1)
})
test('provider malformed success and rejection remain retries without leaking errors',async()=>{
 for(const response of [()=>Response.json({}),()=>Response.json({error:'SECRET'},{status:500}),()=>{throw Error('SECRET')},()=>new Response('invalid')]){
  const send=createQuoteMailer('test-key',async()=>response());await assert.rejects(send({from:'a',to:['b'],subject:'x',text:'x',reply_to:'a'},'key'),{message:'Quote email acceptance could not be confirmed'})
 }
 let seen;const send=createQuoteMailer('test-key',async(url,init)=>{seen={url,init};return Response.json({id:'accepted-id'})})
 assert.equal(await send({from:'a',to:['b'],subject:'x',text:'x',reply_to:'a'},'stable-key'),'accepted-id');assert.equal(seen.init.headers['Idempotency-Key'],'stable-key');assert.equal(seen.init.redirect,'error')
})
test('signed-link adapter enforces private bucket paths, expiry, download and complete results',async()=>{
 let request;const store=createQuoteStore('https://project.supabase.co','service-test',async(url,init)=>{
  request={url,init};return Response.json([{path,signedURL:`/object/sign/customer-quote-artwork/${path}?token=signed`,error:null}])
 })
 const [link]=await store.sign([path]);assert.equal(JSON.parse(request.init.body).expiresIn,86400);assert.match(link,/download=/)
 const invalid=createQuoteStore('https://project.supabase.co','service-test',async()=>Response.json([{path,signedURL:'/object/sign/other-bucket/file?token=bad'}]))
 await assert.rejects(invalid.sign([path]),/Invalid artwork link/)
})

test('PostgreSQL jsonb key reordering cannot change provider retry bytes',async()=>{
 const requests=[], send=createQuoteMailer('local-key',async(_url,init)=>{requests.push(init.body);return Response.json({id:'same'})})
 const mail={from:'orders@nexgenpac.com',to:['qa@example.test'],reply_to:'orders@nexgenpac.com',subject:'Quote receipt',text:'Same receipt'}
 await send(mail,'stable');await send(Object.fromEntries(Object.entries(mail).reverse()),'stable')
 assert.equal(requests[0],requests[1])
})

test('status notices whitelist public fields and keep a separate retry identity per event',async()=>{
 const f=fixture(),first={...job('status'),notification_id:crypto.randomUUID()},keys=[]
 first.snapshot={...first.snapshot,status:'Quote ready',changed_at:'2026-10-06T15:00:00Z',cost:'PRIVATE',margin:'PRIVATE',internal_notes:'PRIVATE'}
 const mail=await buildQuoteMail(first,f.store)
 assert.deepEqual(mail.to,['verified@example.test']);assert.match(mail.text,/Status: Quote ready/);assert.match(mail.text,/request=WEB-20261004-ABC12345/)
 assert.doesNotMatch(mail.text,/PRIVATE|arbitrary@example|token=|unsafe/);assert.equal(f.signs,0)
 const send=async(_mail,key)=>{keys.push(key);return 'local-provider'}
 await deliverQuoteJob(first,f.store,send);await deliverQuoteJob(f.current,f.store,send)
 await deliverQuoteJob({...first,notification_id:crypto.randomUUID()},f.store,send)
 assert.equal(keys[0],keys[1]);assert.notEqual(keys[0],keys[2])
 await deliverQuoteJob({...job('customer'),notification_id:crypto.randomUUID()},f.store,send)
 assert.equal(keys[3],`storefront-quote/${id}/customer/v1`)
 for(const bad of [{...first,notification_id:undefined},{...first,snapshot:{...first.snapshot,status:'INTERNAL'}}])
   assert.equal(await deliverQuoteJob(bad,f.store,async()=>assert.fail('must not send')),'stopped')
})

test('status-job writes target exactly one event and require its active lease',async()=>{
 const event={...job('status'),notification_id:crypto.randomUUID()};let url
 const store=createQuoteStore('https://local.test','test-key',async(u)=>{url=u;return Response.json([{request_id:id}])})
 await store.accepted(event,'local-provider')
 assert.ok(url.includes(`notification_id=eq.${event.notification_id}`));assert.ok(url.includes(`claim_id=eq.${event.claim_id}`));assert.ok(url.includes('claim_until=gt.'))
})

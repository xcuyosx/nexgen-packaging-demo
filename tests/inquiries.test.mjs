import assert from 'node:assert/strict'
import test from 'node:test'
import {validateInquiry,inquiryLimits} from '../supabase/functions/submit-inquiry/validation.ts'
import {createInquiryHandler} from '../supabase/functions/submit-inquiry/handler.ts'
const fields={name:'QA Visitor',email:'visitor@example.test',phone:'',company:'QA Company',need:'sample',message:'Please send sample information.',website:''},origin='http://127.0.0.1:5182',requestId='10000000-0000-4000-8000-000000000001'
function fixture(overrides={}){const rows=new Map(),state={rateCalls:0,allowRate:true,addressHash:'',actor:null}
 const handler=createInquiryHandler({allowedOrigins:[origin],configured:true,rateSecret:'local-test-secret-more-than-32-characters',store:{async consumeRate(hash){state.rateCalls++;state.addressHash=hash;return state.allowRate},async save(data,id,hash,actor){state.actor=actor;if(!rows.has(id))rows.set(id,{id:'20000000-0000-4000-8000-000000000002',reference:'INQ-20261006-AB23CD',request_id:id,payload_hash:hash,...data,sales_notified_at:null,visitor_notified_at:null});return rows.get(id)}},...overrides})
 const request=(body={},headers={})=>new Request(origin,{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':'198.51.100.1',...headers},body:JSON.stringify({...fields,requestId,...body})})
 return{handler,request,rows,state}}
test('field lengths, required fields, optional phone, valid needs and header injection',()=>{
 assert.equal(validateInquiry(fields).kind,'valid');assert.equal(validateInquiry({...fields,need:'account_correction'}).kind,'valid')
 for(const [field,limit]of Object.entries(inquiryLimits))assert.ok(validateInquiry({...fields,[field]:'x'.repeat(limit+1)}).errors[field])
 for(const field of ['name','email','company','message'])assert.ok(validateInquiry({...fields,[field]:''}).errors[field])
 assert.ok(validateInquiry({...fields,email:'bad\nBcc: attacker@example.test'}).errors.email);assert.ok(validateInquiry({...fields,need:'unknown'}).errors.need);assert.equal(validateInquiry(null).kind,'invalid')
})
test('inquiry intake succeeds with email disabled and returns a reference without claiming delivery',async()=>{
 const f=fixture(),response=await f.handler(f.request());assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,reference:'INQ-20261006-AB23CD',emailConfirmed:false});assert.equal(f.rows.size,1)
 assert.match(f.state.addressHash,/^[a-f0-9]{64}$/);assert.equal(f.state.addressHash.includes('198.51.100.1'),false)
 assert.equal((await f.handler(f.request())).status,200);assert.equal(f.rows.size,1)
})
test('same identity cannot replace a saved inquiry with a different payload',async()=>{const f=fixture();await f.handler(f.request());assert.equal((await f.handler(f.request({message:'Different'}))).status,409);assert.equal(f.rows.get(requestId).message,fields.message)})
test('honeypot performs no writes',async()=>{const f=fixture({configured:false}),response=await f.handler(f.request({website:'spam'}));assert.equal(response.status,200);assert.equal(f.rows.size,0);assert.equal(f.state.rateCalls,0);assert.match((await response.json()).reference,/^INQ-/)})
test('unavailable database rejects intake without pretending it was saved',async()=>{const f=fixture({configured:false});assert.equal((await f.handler(f.request())).status,503);assert.equal(f.rows.size,0)})
test('only verified server-resolved identity is supplied to persistence',async()=>{const f=fixture({async resolveUser(){return 'verified-user'}});await f.handler(f.request({userId:'forged-user',is_test:true}));assert.equal(f.state.actor,'verified-user');assert.equal(f.rows.get(requestId).is_test,undefined)})
test('expired signed-in identity is rejected instead of silently creating a business test lead',async()=>{const f=fixture({async resolveUser(){throw Error('SESSION_INVALID')}});assert.equal((await f.handler(f.request())).status,401);assert.equal(f.rows.size,0)})
test('rate limits, hostile origins, malformed and huge bodies fail before save',async()=>{
 const f=fixture();f.state.allowRate=false;assert.equal((await f.handler(f.request())).status,429)
 assert.equal((await f.handler(f.request({},{origin:'https://untrusted.example'}))).status,403)
 assert.equal((await f.handler(f.request({email:'invalid'}))).status,400)
 assert.equal((await f.handler(f.request({message:'x'.repeat(25000)}))).status,413)
 assert.equal((await f.handler(f.request({},{'content-type':'text/plain'}))).status,415)
 assert.equal(f.rows.size,0)
})
test('allowed preflight permits the form without storing data',async()=>{const f=fixture(),r=await f.handler(new Request(origin,{method:'OPTIONS',headers:{origin}}));assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),origin);assert.equal(f.state.rateCalls,0)})

import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareQuoteAttempt } from '../src/quoteAttempt.ts'
import { submitQuoteAttempt } from '../src/quoteSubmission.ts'
import { createHash } from 'node:crypto'
const request=()=>({contact:{name:'Local Tester',email:'qa@example.test'},billing:{},shipping:{},purchaseOrder:'',notes:'Local QA',lines:[{productId:'cup',sku:'QA-CUP',productName:'Test cup',cases:3,artworkName:'qa.svg'}],artworkFiles:[{lineIndex:0,file:new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'],'qa.svg',{type:'image/svg+xml'})}]})
const options=(userId=crypto.randomUUID())=>({url:'https://local.test',key:'public-test',token:'user-test',userId,leadId:crypto.randomUUID(),request:request()})

test('retry identity survives re-created inputs and changes for changed file bytes',async()=>{
 const user=crypto.randomUUID(),a=await prepareQuoteAttempt(user,request()),b=await prepareQuoteAttempt(user,request())
 assert.equal(a.id,b.id);assert.equal(a.uploads[0].path,b.uploads[0].path)
 assert.match(a.uploads[0].path.split('/').at(-1),/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.svg$/)
 const changed=request();changed.artworkFiles[0].file=new File(['<svg>changed</svg>'],'qa.svg')
 const c=await prepareQuoteAttempt(user,changed);assert.notEqual(c.id,a.id)
})
test('lost insert response recovers persisted receipt with one insert and one upload',async()=>{
 const o=options();let stored,posts=0,uploads=0
 const fetcher=async(url,init={})=>{
  if(url.includes('/storage/')){uploads++;return Response.json({Key:'ok'})}
  if(url.endsWith('/submit_customer_quote_request')){posts++;stored=JSON.parse(init.body).p_request;throw Error('lost response')}
  return Response.json(stored?[stored]:[])
 }
 const result=await submitQuoteAttempt(o,fetcher);assert.equal(result.requestNumber,stored.request_number);assert.equal(posts,1);assert.equal(uploads,1)
})
test('ambiguous insert plus failed read can be retried without a second quote or upload',async()=>{
 const o=options();let stored,posts=0,reads=0,uploads=0,failRead=true
 const fetcher=async(url,init={})=>{
  if(url.includes('/storage/')){uploads++;return Response.json({Key:'ok'})}
  if(url.endsWith('/submit_customer_quote_request')){posts++;stored=JSON.parse(init.body).p_request;throw Error('lost response')}
  reads++;if(reads>1&&failRead)throw Error('network offline');return Response.json(stored?[stored]:[])
 }
 await assert.rejects(submitQuoteAttempt(o,fetcher));failRead=false
 const result=await submitQuoteAttempt(o,fetcher);assert.equal(result.requestNumber,stored.request_number);assert.equal(posts,1);assert.equal(uploads,1)
})
test('empty or wrong receipts cannot clear the cart or report success',async()=>{
 for(const payload of [[],[{id:crypto.randomUUID(),request_number:'WEB-20261004-WRONG'}]]){
  const fetcher=async(url,init={})=>Response.json(url.includes('/storage/')?{}:url.endsWith('/submit_customer_quote_request')?payload:[])
  await assert.rejects(submitQuoteAttempt(options(),fetcher),/receipt could not be confirmed/)
 }
})
test('persisted retry state holds only ID, number and digest, never contact or artwork bytes',async()=>{
 const values=new Map();globalThis.window={localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}}
 try{const o=options(),a=await prepareQuoteAttempt(o.userId,o.request);const saved=[...values.values()][0];assert.deepEqual(Object.keys(JSON.parse(saved)).sort(),['fingerprint','id','number']);assert.doesNotMatch(saved,/qa@example|<svg|Local Tester/);a.confirm();assert.equal(values.size,0)}finally{delete globalThis.window}
})

test('primary artwork retries keep identities and upload paths from the previous application version',async()=>{
 const userId=crypto.randomUUID(),input=request(),hash=value=>createHash('sha256').update(value).digest('hex')
 const digest=hash(Buffer.from(await input.artworkFiles[0].file.arrayBuffer()))
 const fingerprint=hash(JSON.stringify({userId,...input,lines:input.lines.map(line=>({...line,artworkPath:undefined})),artworkFiles:[{lineIndex:0,digest}]}))
 const id=crypto.randomUUID(),number='WEB-20261006-LEGACY01',values=new Map([[`nexgen-quote-attempt-v1:${userId}`,JSON.stringify({id,number,fingerprint})]])
 globalThis.window={localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}}
 try {
   const attempt=await prepareQuoteAttempt(userId,input)
   assert.equal(attempt.id,id);assert.equal(attempt.number,number)
   const h=hash(`0:${digest}`),objectId=`${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${((parseInt(h[16],16)&3)|8).toString(16)}${h.slice(17,20)}-${h.slice(20,32)}`
   assert.equal(attempt.uploads[0].path,`${userId}/${id}/${objectId}.svg`)
 }finally{delete globalThis.window}
})

test('supplementary artwork has separate stable upload paths and cannot silently disappear after reload',async()=>{
 const input=request(),user=crypto.randomUUID();input.lines[0].additionalArtwork=[{name:'prepress.pdf'}]
 input.artworkFiles.push({lineIndex:0,attachmentIndex:0,file:new File(['%PDF-1.4 local test'],'prepress.pdf',{type:'application/pdf'})})
 const a=await prepareQuoteAttempt(user,input),b=await prepareQuoteAttempt(user,input)
 assert.equal(a.id,b.id);assert.equal(a.uploads.length,2);assert.equal(a.lines[0].additionalArtwork[0].path,b.lines[0].additionalArtwork[0].path)
 assert.notEqual(a.lines[0].artworkPath,a.lines[0].additionalArtwork[0].path)
 input.artworkFiles.pop();await assert.rejects(prepareQuoteAttempt(user,input),/Reattach prepress.pdf/)
})

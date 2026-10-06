import test from 'node:test'
import assert from 'node:assert/strict'
test('private PDF tickets require ownership, expire, and recheck suspension before streaming',async()=>{
 const doc='10000000-0000-4000-8000-000000000001',user='20000000-0000-4000-8000-000000000002',base='https://documents.example.test'
 const nativeFetch=globalThis.fetch,nativeDeno=globalThis.Deno,nativeNow=Date.now
 let handler,active=true,storageReads=0
 globalThis.Deno={env:{get:name=>({SUPABASE_URL:base,SUPABASE_SERVICE_ROLE_KEY:'local-fixture-hmac-secret',SUPABASE_ANON_KEY:'local-anon'})[name]},serve:value=>{handler=value}}
 globalThis.fetch=async(input,options={})=>{
  const url=String(input),body=JSON.parse(options.body||'{}'),token=options.headers?.Authorization
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user},{status:token==='Bearer expired'?401:200})
  if(url.endsWith('/rpc/customer_quote_document_access'))return Response.json(token==='Bearer owner'&&active?{id:doc,fileName:'Quote-QA.pdf'}:null)
  if(url.endsWith('/rpc/portal_document_for_delivery'))return Response.json(active&&body.p_user_id===user&&body.p_document_id===doc?{path:user+'/'+doc+'/private.pdf',fileName:'Quote-QA.pdf'}:null)
  if(url.includes('/storage/v1/object/authenticated/')){storageReads++;return new Response('%PDF-1.4 local fixture')}
  throw Error('Unexpected test route')
 }
 try{
  await import('../supabase/functions/customer-quote-document/index.ts')
  const post=token=>handler(new Request(base,{method:'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json',Origin:'https://storefront-staging.vercel.app'},body:JSON.stringify({documentId:doc})}))
  assert.equal((await post()).status,401);assert.equal((await post('expired')).status,401);assert.equal((await post('other')).status,404)
  const response=await post('owner'),ticket=await response.json()
  assert.equal(response.status,200);assert.equal(ticket.expiresIn,60);assert.doesNotMatch(ticket.url,/private.pdf|customer-quote-documents/)
  const pdf=await handler(new Request(ticket.url));assert.equal(pdf.status,200);assert.match(await pdf.text(),/^%PDF/);assert.equal(pdf.headers.get('Cache-Control'),'no-store');assert.match(pdf.headers.get('Content-Disposition'),/Quote-QA.pdf/)
  assert.equal((await handler(new Request(ticket.url+'x'))).status,404)
  active=false;assert.equal((await handler(new Request(ticket.url))).status,404);assert.equal(storageReads,1)
  active=true;Date.now=()=>nativeNow()+61_000;assert.equal((await handler(new Request(ticket.url))).status,404);assert.equal(storageReads,1)
 }finally{globalThis.fetch=nativeFetch;globalThis.Deno=nativeDeno;Date.now=nativeNow}
})

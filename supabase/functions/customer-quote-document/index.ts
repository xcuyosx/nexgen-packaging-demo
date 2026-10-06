const encoder=new TextEncoder()
const encode=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')
const decode=(value:string)=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0))
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
Deno.serve(async request=>{
 const base=Deno.env.get('SUPABASE_URL')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',anon=Deno.env.get('SUPABASE_ANON_KEY')||''
 const origin=request.headers.get('origin')||''
 const allowed=/^https:\/\/storefront-staging(?:-[a-z0-9-]+)?\.vercel\.app$/.test(origin)||/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin)
 const headers:Record<string,string>={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',...(allowed?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})}
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json'}})
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, GET, OPTIONS'}})
 if(!base||!service||!anon)return reply(503,{error:'Document downloads are temporarily unavailable.'})
 async function rpc(name:string,body:unknown,token=service){const response=await fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:token===service?service:anon,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!response.ok)throw Error('not-found');return response.json()}
 try{
  const key=await crypto.subtle.importKey('raw',encoder.encode(service),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])
  if(request.method==='POST'){
   if(Number(request.headers.get('content-length')||0)>2048)return reply(413,{error:'Request too large.'})
   const raw=await request.text();if(raw.length>2048)return reply(413,{error:'Request too large.'})
   const input=JSON.parse(raw);if(!uuid.test(input.documentId))return reply(404,{error:'Document unavailable.'})
   const authorization=request.headers.get('authorization')||''
   if(!authorization.startsWith('Bearer '))return reply(401,{error:'Sign in to download your quote.'})
   const auth=await fetch(base+'/auth/v1/user',{headers:{apikey:anon,Authorization:authorization}})
   if(!auth.ok)return reply(401,{error:'Your session expired. Sign in again.'})
   const user=await auth.json(),access=await rpc('customer_quote_document_access',{p_document_id:input.documentId},authorization.slice(7))
   if(!access?.id)return reply(404,{error:'Document unavailable.'})
   const payload=encode(encoder.encode(JSON.stringify({doc:access.id,user:user.id,exp:Math.floor(Date.now()/1000)+60})))
   const signature=encode(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(payload))))
   return reply(200,{url:base+'/functions/v1/customer-quote-document?ticket='+payload+'.'+signature,expiresIn:60,fileName:access.fileName})
  }
  if(request.method!=='GET')return reply(405,{error:'Method not allowed.'})
  const ticket=new URL(request.url).searchParams.get('ticket')||''
  if(ticket.length>1200)return reply(404,{error:'Document unavailable.'})
  const [payload,signature,extra]=ticket.split('.')
  if(!payload||!signature||extra||!await crypto.subtle.verify('HMAC',key,decode(signature),encoder.encode(payload)))return reply(404,{error:'Document unavailable.'})
  const claims=JSON.parse(new TextDecoder().decode(decode(payload)))
  if(!uuid.test(claims.doc)||!uuid.test(claims.user)||!Number.isInteger(claims.exp)||claims.exp<Math.floor(Date.now()/1000)||claims.exp>Math.floor(Date.now()/1000)+65)return reply(404,{error:'Download link expired. Open your quote and try again.'})
  const document=await rpc('portal_document_for_delivery',{p_document_id:claims.doc,p_user_id:claims.user})
  if(!document?.path)return reply(404,{error:'Document unavailable.'})
  const file=await fetch(base+'/storage/v1/object/authenticated/customer-quote-documents/'+document.path.split('/').map(encodeURIComponent).join('/'),{headers:{apikey:service,Authorization:'Bearer '+service}})
  if(!file.ok)return reply(404,{error:'Document unavailable.'})
  return new Response(file.body,{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${document.fileName.replace(/[^a-zA-Z0-9._-]/g,'_')}"`}})
 }catch{return reply(404,{error:'Document unavailable. Open your quote and try again.'})}
})

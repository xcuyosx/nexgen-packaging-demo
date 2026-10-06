import {validateInquiry,type Inquiry} from './validation.ts'
export type StoredInquiry={id:string;created_at:string;request_id:string;payload_hash:string;sales_notified_at:string|null;visitor_notified_at:string|null}
export type InquiryMail={to:string[];from:string;replyTo:string;subject:string;text:string;idempotencyKey:string}
export type InquiryStore={consumeRate:(addressHash:string)=>Promise<boolean>;save:(data:Inquiry,requestId:string,hash:string,userId:string|null)=>Promise<StoredInquiry>}
export type InquiryDependencies={allowedOrigins:string[];configured:boolean;rateSecret:string;store:InquiryStore;resolveUser?:(request:Request)=>Promise<string|null>}
const encoder=new TextEncoder(),hex=(value:ArrayBuffer)=>Array.from(new Uint8Array(value),byte=>byte.toString(16).padStart(2,'0')).join('')
async function bodyText(request:Request){const reader=request.body?.getReader();if(!reader)return '';const chunks:Uint8Array[]=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>24000){await reader.cancel();throw Error('BODY_TOO_LARGE')}chunks.push(value)}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return new TextDecoder().decode(bytes)}
export function createInquiryHandler(deps:InquiryDependencies){return async(request:Request):Promise<Response>=>{
 const origin=request.headers.get('origin')||'',allowed=deps.allowedOrigins.includes(origin)
 const headers={'Content-Type':'application/json','Cache-Control':'no-store',Vary:'Origin',...(allowed?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-retry-count, traceparent, tracestate, baggage','Access-Control-Allow-Methods':'POST, OPTIONS'}
 const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers})
 if(!allowed)return reply(403,{error:'This form is not available from this website.'})
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers})
 if(request.method!=='POST')return reply(405,{error:'Use the contact form to submit an inquiry.'})
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply(415,{error:'Send a JSON form submission.'})
 let raw:Record<string,unknown>
 try{raw=JSON.parse(await bodyText(request))}catch(e){return reply(e instanceof Error&&e.message==='BODY_TOO_LARGE'?413:400,{error:'The form submission is invalid or too large.'})}
 const checked=validateInquiry(raw)
 if(checked.kind==='spam')return reply(200,{ok:true,reference:'INQ-'+crypto.randomUUID(),emailConfirmed:false})
 if(checked.kind==='invalid')return reply(400,{error:'Please check the highlighted fields.',fields:checked.errors})
 if(typeof raw.requestId!=='string'||!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(raw.requestId))return reply(400,{error:'Refresh the form and try again.'})
 if(!deps.configured||deps.rateSecret.length<32)return reply(503,{error:'The contact form is temporarily unavailable. Please contact NexGen by phone or email.'})
 const address=request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
 if(!address||address.length>100)return reply(503,{error:'Your submission could not be verified. Please contact NexGen by phone or email.'})
 try{
  const key=await crypto.subtle.importKey('raw',encoder.encode(deps.rateSecret),{name:'HMAC',hash:'SHA-256'},false,['sign'])
  if(!await deps.store.consumeRate(hex(await crypto.subtle.sign('HMAC',key,encoder.encode(address)))))return new Response(JSON.stringify({error:'Too many attempts. Please try again later.'}),{status:429,headers:{...headers,'Retry-After':'3600'}})
  const actor=await deps.resolveUser?.(request)??null,hash=hex(await crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify(checked.data))))
  const row=await deps.store.save(checked.data,raw.requestId,hash,actor)
  if(row.payload_hash!==hash)return reply(409,{error:'The form changed during submission. Please retry with a fresh submission.'})
  // Lead and outbox commit together. Sender setup never blocks contact intake.
  return reply(200,{ok:true,reference:'INQ-'+row.id,emailConfirmed:Boolean(row.visitor_notified_at)})
 }catch(e){return reply(e instanceof Error&&e.message==='SESSION_INVALID'?401:503,{error:e instanceof Error&&e.message==='SESSION_INVALID'?'Your session expired. Sign in again before submitting.':'Your inquiry could not be confirmed. Your message is still here; please try again.'})}
}}

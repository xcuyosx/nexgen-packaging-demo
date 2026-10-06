import type {InquiryStore} from './handler.ts'
export function createInquiryStore(url:string,serviceKey:string):InquiryStore{
 const rpc=async(name:string,body:unknown)=>{const response=await fetch(url.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('Inquiry storage unavailable');return response.json()}
 return {consumeRate:hash=>rpc('consume_inquiry_rate_limit',{p_address_hash:hash}),save:(data,requestId,hash,userId)=>rpc('save_website_inquiry',{p_data:data,p_request_id:requestId,p_payload_hash:hash,p_actor_user_id:userId})}
}

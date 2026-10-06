import {renderEmailPreviews} from './samples.ts'
export function createEmailPreviewHandler({url,key,request=fetch}:{url:string;key:string;request?:typeof fetch}){
 return async(input:Request)=>{
  const origin=input.headers.get('origin')||'',allowed=['https://nexgencrm.vercel.app','http://127.0.0.1:5173','http://localhost:5173']
  const headers={'Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':allowed.includes(origin)?origin:'https://nexgencrm.vercel.app','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'}
  if(input.method==='OPTIONS')return new Response(null,{status:204,headers})
  const respond=(status:number,body:unknown)=>Response.json(body,{status,headers})
  if(input.method!=='POST')return respond(405,{error:'Method not allowed'})
  const authorization=input.headers.get('authorization')||''
  if(!authorization.startsWith('Bearer '))return respond(401,{error:'Sign in required'})
  try{
   const admin=await request(url+'/rest/v1/rpc/is_nexgen_admin',{method:'POST',headers:{apikey:key,Authorization:authorization,'Content-Type':'application/json'},body:'{}'})
   if(!admin.ok||await admin.json()!==true)return respond(403,{error:'Administrator access required'})
   return respond(200,{previewOnly:true,sent:0,templates:await renderEmailPreviews()})
  }catch{return respond(503,{error:'Email previews are temporarily unavailable'})}
 }
}

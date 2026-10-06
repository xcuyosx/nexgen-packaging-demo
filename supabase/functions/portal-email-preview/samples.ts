import {buildQuoteMail,type QuoteJob,type QuoteStore} from '../quote-notifications/worker.ts'
const requestId='10000000-0000-4000-8000-000000000001',userId='10000000-0000-4000-8000-000000000002'
export async function renderEmailPreviews(){
 const base={request_id:requestId,notification_id:'10000000-0000-4000-8000-000000000003',verified_email:'bradley@nexgenpac.com',prepared_mail:null,first_attempt_at:null,claim_id:'preview',attempts:0,created_at:'2026-10-06T15:00:00Z'}
 const snapshot={id:requestId,user_id:userId,request_number:'WEB-20261006-PREVIEW',contact:{name:'Sample customer',company:'Example company',email:'bradley@nexgenpac.com'},billing:{label:'Main office'},shipping:{label:'Sample delivery location'},purchase_order:'EXAMPLE-PO',notes:'Sample quote request for email preview.',lines:[{productName:'Paper beverage cups',sku:'',cases:5,size:'12 oz',material:'Recycled paper',dimensions:'12 oz',casePack:'1,000/case',printColors:0,inkColors:[],artworkName:''}]}
 const jobs:{label:string;job:QuoteJob}[]=[
  {label:'Receipt',job:{...base,kind:'customer',snapshot}},
  {label:'Quote ready',job:{...base,kind:'status',snapshot:{...snapshot,status:'Quote ready',changed_at:'2026-10-06T16:00:00Z'}}},
  {label:'Reply',job:{...base,queue:'portal',kind:'reply',snapshot:{...snapshot,body:'We reviewed your request. Please open your quote to review the details.'}}},
  {label:'Changes requested',job:{...base,queue:'portal',kind:'changes',snapshot:{...snapshot,body:'Please update the quote to include 10 cases.'}}},
  {label:'Contact auto-reply',job:{...base,queue:'portal',kind:'contact_visitor',snapshot:{id:requestId,name:'Sample customer',company:'Example company',email:'bradley@nexgenpac.com',need:'Packaging quote',message:'Sample inquiry for preview.'}}},
 ]
 const store={sign:async()=>{throw Error('Email previews never create artwork links')}} as unknown as QuoteStore
 return await Promise.all(jobs.map(async({label,job})=>({label,mail:await buildQuoteMail(job,store)})))
}

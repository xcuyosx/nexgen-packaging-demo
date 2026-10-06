import {buildQuoteMail,type QuoteJob,type QuoteStore} from '../quote-notifications/worker.ts'
import {emailFixtures,runtimeEmailConfig,type EmailConfig} from '../_shared/portalEmail.ts'
export {emailFixtures}
export function previewJobs(fixture:string){
 if(!emailFixtures.includes(fixture as typeof emailFixtures[number]))throw Error('Unknown preview fixture')
 const requestId='10000000-0000-4000-8000-000000000001',userId='10000000-0000-4000-8000-000000000002',quoteId='10000000-0000-4000-8000-000000000004',leadId='10000000-0000-4000-8000-000000000005'
 const hostile=fixture==='Hostile text',name=hostile?'Zoë "<script>" & 😀':'Jordan Taylor',company=hostile?'Example & "Partners" <script>':'Example company'
 const message=hostile?('<script>alert("preview")</script> & 😀 café '+ 'Review the artwork — ').repeat(240).slice(0,5000):'Please update the quote to include the blue artwork and confirm delivery to our receiving dock.'
 const line={productName:'Paper beverage cups',sku:'',cases:fixture==='Printed'?5:1,size:'12 oz',material:'Recycled paper',dimensions:'12 oz',casePack:'1,000/case',printColors:fixture==='Printed'?2:0,inkColors:fixture==='Printed'?['Blue','Green']:[],artworkName:fixture==='Printed'?'Front artwork.pdf':hostile?'Logo <script> & "blue".svg':'',additionalArtwork:fixture==='Printed'?[{name:'Reverse artwork.svg'},{name:'Print proof.pdf'}]:[]}
 const lines=Array.from({length:fixture==='Long quote'?30:1},(_,i)=>({...line,productName:fixture==='Long quote'?'Paper beverage cups '+(i+1):line.productName}))
 const total=fixture==='Zero total'?0:1234.5*lines.length
 const snapshot={id:requestId,user_id:userId,quote_id:quoteId,lead_id:leadId,request_number:'WEB-20261006-PREVIEW2',reference:'INQ-20261006-AB23CD',contact:{name,company,email:'bradley@nexgenpac.com'},name,company,email:'bradley@nexgenpac.com',phone:'(314) 555-0100',need:'sample',message,body:message,billing:fixture==='Missing billing and ship-to'?{}:{label:'Main office',legalName:company,billingEmail:'bradley@nexgenpac.com',preference:'Invoice / net terms, subject to credit approval'},shipping:fixture==='Missing billing and ship-to'?{}:{label:'Receiving dock',address:'100 Example Street',city:'Bridgeton',state:'MO',postalCode:'63044',contact:name,phone:'(314) 555-0100',receivingHours:'Monday–Friday, 8 AM–4 PM',instructions:'Check in at the receiving desk.'},purchase_order:fixture==='Printed'?'SAMPLE-PO-42':'',notes:hostile?message:'',lines,status:'Quote ready',changed_at:'2026-10-06T14:18:00Z',submitted_at:'2026-10-06T14:18:00Z',quote_released:true,quote_number:'NGQ-WEB-261006-PREVIEW2',released_quote:{publicIdentityVersion:1,quoteNumber:'NGQ-WEB-261006-PREVIEW2',validThrough:'2026-11-05',total,items:lines.map(l=>({productName:l.productName,cases:l.cases,lineTotal:fixture==='Zero total'?0:1234.5}))}}
 const base={request_id:requestId,notification_id:'10000000-0000-4000-8000-000000000003',verified_email:'bradley@nexgenpac.com',prepared_mail:null,first_attempt_at:null,claim_id:'preview',attempts:0,created_at:'2026-10-06T14:18:00Z'}
 return [
 {id:'receipt',label:'Request received',job:{...base,kind:'customer',snapshot}},
 {id:'quote-ready',label:'Quote ready',job:{...base,kind:'status',snapshot}},
 {id:'reply',label:'NexGen replied',job:{...base,queue:'portal',kind:'reply',snapshot}},
 {id:'customer-response',label:'Customer response',job:{...base,queue:'portal',kind:'changes',snapshot:{...snapshot,action:'request_changes'}}},
 {id:'contact-auto-reply',label:'Message received',job:{...base,queue:'portal',kind:'contact_visitor',snapshot}},
 {id:'new-inquiry',label:'New website inquiry',job:{...base,queue:'portal',kind:'contact_sales',snapshot}},
 ] as {id:string;label:string;job:QuoteJob}[]
}
export async function renderEmailPreviews(fixture='Minimal',config:EmailConfig=runtimeEmailConfig()){
 const store={sign:async()=>{throw Error('Email previews never create artwork links')}} as unknown as QuoteStore
 return await Promise.all(previewJobs(fixture).map(async({id,label,job})=>({id,label,fixture,mail:await buildQuoteMail(job,store,config)})))
}

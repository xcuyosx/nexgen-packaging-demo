import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import {renderEmailPreviews,previewJobs,emailFixtures} from '../supabase/functions/portal-email-preview/samples.ts'
import {buildQuoteMail} from '../supabase/functions/quote-notifications/worker.ts'
import {createEmailPreviewHandler} from '../supabase/functions/portal-email-preview/handler.ts'
import {portalEmailConfig,emailDate} from '../supabase/functions/_shared/portalEmail.ts'
process.env.PORTAL_STOREFRONT_URL='https://portal.example.test'
process.env.PORTAL_CRM_URL='https://crm.example.test'
const config=portalEmailConfig(name=>process.env[name])
const snapshotPath=new URL('./snapshots/portal-emails.json',import.meta.url),actual={}
for(const fixture of emailFixtures)test('six multipart templates: '+fixture,async()=>{
 const templates=await renderEmailPreviews(fixture,config);assert.equal(templates.length,6)
 for(const {id,mail} of templates){
  for(const output of [mail.text,mail.html]){
   assert.doesNotMatch(output,/\{|\[object|\bundefined\b|\bnull\b|\bNaN\b|NexGenPac-|DRAFT-|\bcost\b|\bmargin\b/i)
   assert.doesNotMatch(output,/(?:PO \/ reference|Notes|Inks|Delivery|Billing):\s*(?:<\/p>|\n|$)/i)
   assert.doesNotMatch(output,/INQ-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-/i)
  }
  assert.doesNotMatch(mail.html,/<script>|onerror=|javascript:/i)
  assert.equal(mail.reply_to,'orders@nexgenpac.com')
  assert.match(mail.html,/#0A6A56/);assert.match(mail.html,/max-width:600px/);assert.match(mail.html,/NexGen Packaging Group/)
  if(['customer-response','new-inquiry'].includes(id))assert.match(mail.html,/https:\/\/crm.example.test\/\?workspace=/)
  if(['receipt','quote-ready','reply'].includes(id))assert.match(mail.text,/https:\/\/portal.example.test\/account\?view=quotes&request=WEB-20261006-PREVIEW2/)
  if(fixture==='Minimal'&&id==='receipt'){assert.doesNotMatch(mail.text,/Inks:|PO \/ reference:|Notes:|Dimensions:/);assert.match(mail.text,/1 case\b/)}
  if(fixture==='Printed'&&id==='receipt'){assert.match(mail.text,/2 colors/);for(const name of ['Front artwork.pdf','Reverse artwork.svg','Print proof.pdf'])assert(mail.text.includes(name))}
  if(fixture==='Missing billing and ship-to'&&id==='receipt')assert.doesNotMatch(mail.text,/Billing:|Delivery:/)
  if(fixture==='Long quote'&&id==='quote-ready'){assert.match(mail.text,/and 25 more items/);assert.doesNotMatch(mail.text,/cups 6 ·/);assert.match(mail.text,/\$37,035.00/)}
  if(fixture==='Hostile text'&&['receipt','reply','customer-response','contact-auto-reply','new-inquiry'].includes(id))assert.match(mail.html,/&lt;script&gt;/)
  if(fixture==='Zero total'&&id==='quote-ready')assert.match(mail.text,/Total \$0.00/)
  assert.doesNotMatch(mail.text,/\b1 cases\b/)
  actual[fixture+'/'+id]=crypto.createHash('sha256').update(JSON.stringify(mail)).digest('hex')
 }
})
test('configuration and release gates, truncation, expiry zone, preview authorization',async()=>{
 assert.throws(()=>portalEmailConfig(()=>''),/Configure HTTPS/)
 assert.equal(portalEmailConfig(name=>name==='PORTAL_EMAIL_LOGO_URL'?'https://assets.example.test/logo.png':process.env[name]).logoUrl,'https://assets.example.test/logo.png')
 assert.throws(()=>portalEmailConfig(name=>name==='PORTAL_EMAIL_LOGO_URL'?'javascript:alert(1)':process.env[name]),/HTTPS public email logo/)
 assert.equal(emailDate('2026-10-06T14:18:00Z'),'Oct 6, 2026, 9:18 AM CDT')
 assert.equal(emailDate('2026-11-05',true),'Nov 5, 2026, 11:59 PM CST')
 const job=previewJobs('Minimal').find(x=>x.id==='quote-ready').job
 await assert.rejects(buildQuoteMail({...job,snapshot:{...job.snapshot,quote_released:false}}, {},config),/released public quote/)
 const reply=previewJobs('Hostile text').find(x=>x.id==='reply').job
 const enabled=await buildQuoteMail(reply,{},config),disabled=await buildQuoteMail(reply,{}, {...config,includeMessage:false})
 assert.match(enabled.text,/…/);assert.doesNotMatch(disabled.text,/alert\(/)
 for(const allowed of [true,false]){
  let calls=0;const handler=createEmailPreviewHandler({url:'https://test.example',key:'public-test-key',request:async url=>{assert.match(url,/is_nexgen_admin$/);calls++;return Response.json(allowed)}})
  const response=await handler(new Request('https://test.example',{method:'POST',headers:{Authorization:'Bearer test-fixture'},body:JSON.stringify({fixture:'Printed'})}))
  assert.equal(response.status,allowed?200:403);assert.equal(calls,1)
  if(allowed){const data=await response.json();assert.equal(data.sent,0);assert.equal(data.templates.length,6)}
  assert.equal((await handler(new Request('https://test.example',{method:'POST'}))).status,401)
 }
})
test('all 42 rendered snapshots are stable',()=>{
 assert.equal(Object.keys(actual).length,42)
 if(process.env.UPDATE_EMAIL_SNAPSHOTS==='1'){fs.mkdirSync(new URL('./snapshots/',import.meta.url),{recursive:true});fs.writeFileSync(snapshotPath,JSON.stringify(actual,null,2))}
 assert.deepEqual(actual,JSON.parse(fs.readFileSync(snapshotPath,'utf8')))
})

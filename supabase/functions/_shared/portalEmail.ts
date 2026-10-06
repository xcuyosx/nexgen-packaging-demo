import {portalDefaults} from './portalConfig.ts'
export type Mail = {from:string;to:string[];reply_to:string;subject:string;text:string;html:string}
export type EmailConfig={storefrontUrl:string;crmUrl:string;logoUrl:string;includeMessage:boolean}
export class EmailDataError extends Error {}
type Data=Record<string,unknown>
type Block={kind:'paragraph'|'heading'|'quote';text:string}|{kind:'button';text:string;url:string}
const record=(v:unknown):Data=>v&&typeof v==='object'&&!Array.isArray(v)?v as Data:{}
const clean=(v:unknown,max=5000)=>typeof v==='string'&&!/^(null|undefined|\[object Object\])$/i.test(v.trim())?Array.from(v.replace(/\u0000/g,'').trim()).slice(0,max).join(''):typeof v==='number'&&Number.isFinite(v)?String(v):''
const join=(...values:unknown[])=>values.map(v=>clean(v)).filter(Boolean).join(' · ')
export const escapeEmailText=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
const p=(text:string):Block=>({kind:'paragraph',text})
const h=(text:string):Block=>({kind:'heading',text})
const q=(text:string):Block=>({kind:'quote',text})
const button=(text:string,url:string):Block=>({kind:'button',text,url})
const label=(name:string,value:string)=>value?p(`${name}: ${value}`):null
export const emailFixtures=['Minimal','Printed','Missing billing and ship-to','Long quote','Hostile text','Zero total','Singular case'] as const
const origin=(value:string)=>{
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error();return u.origin}catch{throw new EmailDataError('Configure HTTPS storefront and CRM base URLs before rendering email.')}
}
export function portalEmailConfig(env:(name:string)=>string|undefined):EmailConfig{
 const storefrontUrl=origin(env('PORTAL_STOREFRONT_URL')||''),crmUrl=origin(env('PORTAL_CRM_URL')||'')
 const logoUrl=env('PORTAL_EMAIL_LOGO_URL')||storefrontUrl+'/brand/logo.png'
 try{const u=new URL(logoUrl);if(u.protocol!=='https:'||u.username||u.password)throw Error()}catch{throw new EmailDataError('Configure an HTTPS public email logo URL.')}
 return {storefrontUrl,crmUrl,logoUrl,includeMessage:env('PORTAL_EMAIL_INCLUDE_MESSAGE')!=='false'}
}
export function runtimeEmailConfig(){
 const runtime=globalThis as unknown as {Deno?:{env:{get:(name:string)=>string|undefined}};process?:{env:Record<string,string|undefined>}}
 return portalEmailConfig(name=>runtime.Deno?.env.get(name)??runtime.process?.env[name])
}
export function emailDate(value:unknown,endOfDay=false){
 const raw=clean(value);if(!raw)return ''
 let date=new Date(raw)
 if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
  // Quote validity is a Chicago calendar date, inclusive through its last minute.
  const target=Date.parse(raw+`T${endOfDay?'23:59':'00:00'}:00Z`)
  let guess=target
  for(let i=0;i<2;i++){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess));const v=Object.fromEntries(parts.map(x=>[x.type,x.value]));const represented=Date.parse(`${v.year}-${v.month}-${v.day}T${v.hour}:${v.minute}:${v.second}Z`);guess+=target-represented}date=new Date(guess)
 }
 if(!Number.isFinite(date.getTime()))throw new EmailDataError('Invalid email date')
 return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short',timeZone:'America/Chicago'}).format(date)
}
export const cases=(value:unknown)=>{
 const n=Number(value);if(!Number.isSafeInteger(n)||n<1)throw new EmailDataError('Invalid case quantity')
 return `${n.toLocaleString('en-US')} ${n===1?'case':'cases'}`
}
export const money=(value:unknown)=>{
 if((typeof value!=='number'&&typeof value!=='string')||clean(value)==='')throw new EmailDataError('Missing released amount')
 const n=Number(value);if(!Number.isFinite(n)||n<0)throw new EmailDataError('Invalid released amount')
 return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)
}
const firstName=(value:unknown)=>clean(value,120).split(/\s+/)[0]||'there'
const truncate=(text:string,n:number)=>Array.from(text).length>n?Array.from(text).slice(0,n).join('')+'…':text
function url(base:string,values:Record<string,string>){const u=new URL(base);for(const [key,value] of Object.entries(values))u.searchParams.set(key,value);return u.href}
export function emailFrame(title:string,preheader:string,blocks:Block[],config:EmailConfig,customer:boolean){
 const why=customer?'You are receiving this because you submitted a request at NexGen.':'You are receiving this because this request is assigned to the NexGen sales inbox.'
 const footer='NexGen Packaging Group · Bridgeton, MO · (833) 853-1243 · orders@nexgenpac.com'
 const esc=escapeEmailText
 const blockHtml=blocks.map(b=>b.kind==='button'?`<p style="padding:12px 0"><a href="${esc(b.url)}" target="_blank" rel="noopener" style="display:inline-block;background-color:#0A6A56;color:#ffffff;border-radius:6px;padding:14px 22px;text-decoration:none;font-weight:bold">${esc(b.text)}</a></p>`:b.kind==='heading'?`<h2 style="font-size:18px;line-height:1.4;color:#123c31;padding-top:16px">${esc(b.text)}</h2>`:b.kind==='quote'?`<blockquote style="border-left:3px solid #0A6A56;padding:12px 16px;background-color:#f1f6f3;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word">${esc(b.text)}</blockquote>`:`<p style="white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word">${esc(b.text)}</p>`).join('\n')
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head><body leftmargin="0" topmargin="0" style="padding:0;background-color:#edf2ef;color:#183b31;font-family:Arial,Helvetica,sans-serif;line-height:1.6"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;table-layout:fixed;background-color:#ffffff"><tr><td bgcolor="#073b30" style="padding:26px 24px;background-color:#073b30"><img src="${esc(config.logoUrl)}" alt="NexGen Packaging Group" width="166" style="display:block;max-width:100%;height:auto;color:#ffffff"></td></tr><tr><td style="padding:24px"><h1 style="font-size:24px;line-height:1.3;color:#123c31">${esc(title)}</h1>${blockHtml}</td></tr><tr><td bgcolor="#f1f5f2" style="padding:22px 24px;font-size:12px;line-height:1.7;color:#536a60;overflow-wrap:anywhere">${esc(footer)}<br>${esc(why)}</td></tr></table></td></tr></table></body></html>`
 const text=[...blocks.map(b=>b.kind==='button'?`${b.text}: ${b.url}`:b.kind==='quote'?b.text.split('\n').map(l=>'> '+l).join('\n'):b.text),footer,why].join('\n\n')
 return {html,text}
}
export function renderPortalEmail(kind:string,data:Data,verifiedEmail:string,createdAt:string|undefined,config:EmailConfig):Mail{
 const contact=record(data.contact),billing=record(data.billing),shipping=record(data.shipping)
 const company=clean(contact.company||data.company,200),name=clean(contact.name||data.name,120),request=clean(data.request_number)
 const customer=!['sales','changes','contact_sales'].includes(kind)
 const quote=record(data.released_quote),quoteNumber=clean(quote.quoteNumber||data.quote_number)
 const portalLink=url(config.storefrontUrl+'/account',{view:'quotes',request})
 const quoteId=clean(data.quote_id),leadId=clean(data.lead_id)
 const crmLink=quoteId?url(config.crmUrl,{workspace:'quotes',quote:quoteId}):''
 const requireCrm=()=>{if(!crmLink)throw new EmailDataError('Missing CRM quote link');return crmLink}
 let subject='',preheader='',title='',blocks:Block[]=[]
 if(kind==='customer'||kind==='sales'){
  title=customer?'Request received':'New quote request';subject=customer?`We received your quote request ${request}`:`New quote request · ${company} · ${request}`;preheader=`Request ${request} · NexGen will follow up ${portalDefaults.responsePromiseClause}.`
  blocks=[p(customer?`Hi ${firstName(name)},`:`${name||'A customer'}${company?' at '+company:''} submitted a quote request.`)]
  if(customer)blocks.push(p(`Thanks for your request. NexGen has it and will follow up ${portalDefaults.responsePromiseClause}.`))
  blocks.push(h(`Request ${request}`))
  const submitted=emailDate(data.submitted_at||createdAt);if(submitted)blocks.push(p('Submitted '+submitted))
  blocks.push(h('Items'))
  const lines=Array.isArray(data.lines)?data.lines:[]
  for(const [i,value] of lines.entries()){
   const line=record(value),printed=Number(line.printColors)>0,artwork=[clean(line.artworkName),...(Array.isArray(line.additionalArtwork)?line.additionalArtwork.map(v=>clean(record(v).name)):[])].filter(Boolean)
   blocks.push(p(`${i+1}. ${clean(line.productName,240)}${clean(line.sku)?' · '+clean(line.sku):''} · ${cases(line.cases)}`))
   blocks.push(p(join(line.size,line.material,printed?`${Number(line.printColors)} color${Number(line.printColors)===1?'':'s'} · Printed`:'Unprinted')))
   const dimensions=clean(line.dimensions);if(dimensions&&dimensions!==clean(line.size))blocks.push(p('Dimensions: '+dimensions))
   if(printed&&Array.isArray(line.inkColors)){const inks=line.inkColors.map(x=>clean(x)).filter(Boolean).join(', ');if(inks)blocks.push(p('Inks: '+inks))}
   blocks.push(p('Artwork: '+(artwork.join(', ')||'None')))
  }
  const delivery=join(shipping.label,shipping.address,join(shipping.city,[clean(shipping.state),clean(shipping.postalCode||shipping.zip)].filter(Boolean).join(' ')),shipping.contact,shipping.phone,shipping.receivingHours||shipping.hours,shipping.instructions)
  const bill=join(billing.label,billing.legalName,billing.billingEmail,billing.preference)
  for(const b of [label('Delivery',delivery),label('Billing',bill),label('PO / reference',clean(data.purchase_order)),label('Notes',clean(data.notes))])if(b)blocks.push(b)
  blocks.push(button(customer?'Track your request':'Open in CRM',customer?portalLink:requireCrm()))
  if(customer)blocks.push(h('What happens next'),p('1. NexGen reviews your specifications and delivery requirements.\n2. We follow up with pricing or any questions.\n3. You review the quote before confirming how to proceed.'),p('No payment is collected when you request a quote.'))
 }else if(kind==='status'){
  const status=clean(data.status)
  if(status==='Quote ready'){
   if(data.quote_released!==true||quote.publicIdentityVersion!==1||!quoteNumber||!Array.isArray(quote.items)||!quote.items.length||!quote.validThrough)throw new EmailDataError('A released public quote is required')
   const total=money(quote.total),valid=emailDate(quote.validThrough,true)
   title='Your quote is ready';subject=`Your NexGen quote ${quoteNumber} is ready`;preheader=`Total ${total} · valid through ${valid}`
   blocks=[p(`Hi ${firstName(name)},`),p('Your quote is ready to review.'),h(`Quote ${quoteNumber}`),p(`Request ${request}`),p(`Total ${total} · Valid through ${valid}`)]
   for(const v of quote.items.slice(0,5)){const line=record(v);blocks.push(p(join(clean(line.productName,240),cases(line.cases),money(line.lineTotal))))}
   if(quote.items.length>5)blocks.push(p(`and ${quote.items.length-5} more items`))
   blocks.push(button('View quote',portalLink),p('The quote PDF is in your account under Documents.'),p('Questions? Reply to this email or call (833) 853-1243.'))
  }else{
   title='Quote request update';subject=`Your NexGen request ${request}: ${status}`;preheader=`Your request is now ${status.toLowerCase()}.`
   blocks=[p(`Hi ${firstName(name)},`),p(`Request ${request} · ${status}`),p('Updated '+emailDate(data.changed_at)),button('View request',portalLink)]
  }
 }else if(kind==='reply'){
  title='NexGen replied';subject=`NexGen replied on request ${request}`;preheader='There is a new message about your quote request.'
  blocks=[p(`Hi ${firstName(name)},`),p(`NexGen sent you a message about request ${request}:`)]
  if(config.includeMessage&&clean(data.body))blocks.push(q(truncate(clean(data.body),500)))
  blocks.push(button('Read and reply',portalLink))
 }else if(kind==='changes'){
  title=data.action==='request_changes'?'Changes requested':'Customer response';subject=`${title} · ${company} · ${request}`;preheader=`${name||'Your customer'} sent a response.`
  blocks=[p(`${name||'The customer'}${company?' at '+company:''} replied on request ${request}${quoteNumber?' (quote '+quoteNumber+')':''}:`)]
  if(clean(data.body))blocks.push(q(clean(data.body)))
  blocks.push(button('Open in CRM',requireCrm()))
 }else if(kind==='contact_visitor'||kind==='contact_sales'){
  const reference=clean(data.reference)
  if(!/^INQ-\d{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(reference))throw new EmailDataError('A short inquiry reference is required')
  const need=({standard:'packaging quote',sample:'sample',custom:'custom packaging',reorder:'repeat quote',sustainability:'sustainability',account_correction:'account correction'} as Record<string,string>)[clean(data.need)]||clean(data.need,120)
  if(customer){
   title='Message received';subject=`We received your message (${reference})`;preheader=`NexGen will reply ${portalDefaults.responsePromiseClause}.`
   blocks=[p(`Hi ${firstName(name)},`),p(`Thanks for contacting NexGen. We will reply ${portalDefaults.responsePromiseClause}.`)]
   if(clean(data.message))blocks.push(h('Your message'),q(clean(data.message)))
   blocks.push(p(`Reference ${reference}. You can reply to this email to add details.`))
  }else{
   if(!leadId)throw new EmailDataError('Missing CRM lead link')
   title='New website inquiry';subject=`New website inquiry · ${company} · ${need}`;preheader=`${name||'A visitor'} contacted NexGen.`
   blocks=[p(`${name} (${[clean(data.email),clean(data.phone)].filter(Boolean).join(', ')})${company?' at '+company:''} sent a ${need} inquiry:`)]
   if(clean(data.message))blocks.push(q(clean(data.message)))
   blocks.push(p('Reference '+reference),button('Open lead in CRM',url(config.crmUrl,{workspace:'customers',customer:leadId})))
  }
 }else throw new EmailDataError('Unknown email template')
 subject=subject.replace(/[\r\n]+/g,' ').slice(0,240)
 const output=emailFrame(title,preheader,blocks,config,customer)
 if(output.text.length>100000||/NexGenPac-[A-Za-z0-9_-]+-\d{4,}|DRAFT-[A-Za-z0-9_-]+|PIPE-[A-Za-z0-9_-]+/i.test(output.text))throw new EmailDataError('Email contains an internal identifier')
 return {from:portalDefaults.contactEmail,to:[customer?verifiedEmail:portalDefaults.contactEmail],reply_to:portalDefaults.contactEmail,subject,...output}
}

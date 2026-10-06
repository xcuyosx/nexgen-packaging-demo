export type ReleasedQuoteLine={sku:string;productName:string;specifications:string;cases:number;unitsPerCase:number;totalItems:number;pricePerCase:number;adjustments:number;lineTotal:number}
export type ReleasedQuote={quoteNumber:string;revision:number;validThrough:string;currency:string;items:ReleasedQuoteLine[];total:number;terms:string;customerMessage:string}
export type PortalDocument={id:string;fileName:string;revision:number}
export type PortalActivity={at:string;label:string;quoteNumber?:string;revision?:number}
export type QuoteViewFields={quote:ReleasedQuote|null;documents:PortalDocument[];activity:PortalActivity[];owner:{name:string;email:string;phone:string};acceptEnabled:boolean;needsReply:boolean}
const record=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
const text=(value:unknown)=>typeof value==='string'?value:''
const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:0
export function quoteViewFields(input:unknown):QuoteViewFields {
 const row=record(input),q=record(row.quote),owner=record(row.owner)
 const items=(Array.isArray(q.items)?q.items:[]).map(value=>{const v=record(value);return {sku:text(v.sku),productName:text(v.productName),specifications:text(v.specifications),cases:number(v.cases),unitsPerCase:number(v.unitsPerCase),totalItems:number(v.totalItems),pricePerCase:number(v.pricePerCase),adjustments:number(v.adjustments),lineTotal:number(v.lineTotal)}})
 return {quote:typeof q.total==='number'&&Number.isFinite(q.total)?{quoteNumber:text(q.quoteNumber),revision:number(q.revision),validThrough:text(q.validThrough),currency:text(q.currency)||'USD',items,total:number(q.total),terms:text(q.terms),customerMessage:text(q.customerMessage)}:null,
  documents:(Array.isArray(row.documents)?row.documents:[]).map(value=>{const v=record(value);return{id:text(v.id),fileName:text(v.fileName),revision:number(v.revision)}}),
  activity:(Array.isArray(row.activity)?row.activity:[]).map(value=>{const v=record(value);return{at:text(v.at),label:text(v.label),quoteNumber:text(v.quoteNumber),revision:number(v.revision)}}),
  owner:{name:text(owner.name),email:text(owner.email),phone:text(owner.phone)},acceptEnabled:row.acceptEnabled===true,needsReply:row.needsReply===true}
}

import { formatPortalDate, portalConfig } from './portalPresentation'
import { PortalSkeleton, PortalError, RequestActions } from './PortalFeedback'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCustomerQuoteDetail, downloadCustomerQuoteDocument } from './customerAccount'
import { QuoteRequestSummary } from './QuoteRequestSummary'
import type { QuoteReceipt } from './QuoteRequestSummary'
import { CustomerQuoteMessages } from './CustomerQuoteMessages'

export function CustomerQuoteDetail({token,requestNumber,refresh,onRequestAgain}:{token:string;requestNumber:string;refresh:unknown;onRequestAgain:(request:QuoteReceipt)=>void}) {
  const [result,setResult]=useState<{key:string;value:QuoteReceipt|null;error:string}|null>(null)
  const [retry,setRetry]=useState(0)
  const [downloading,setDownloading]=useState(''),[downloadError,setDownloadError]=useState('')
  const key=token+':'+requestNumber
  useEffect(()=>{
    const controller=new AbortController()
    fetchCustomerQuoteDetail(token,requestNumber,controller.signal).then(value=>{
      if(!controller.signal.aborted)setResult({key,value,error:''})
    }).catch(error=>{if(!controller.signal.aborted)setResult(previous=>({key,value:previous?.key===key?previous.value:null,error:error instanceof Error?error.message:'Unable to load this request.'}))})
    return ()=>controller.abort()
  },[token,requestNumber,key,refresh,retry])
  const current=result?.key===key?result:null
  const steps=['Submitted','In review','Quote ready','Accepted','In production','Shipped']
  const value=current?.value,quote=value?.quote
  const progressIndex=steps.indexOf(value?.status||'')>=0?steps.indexOf(value?.status||''):quote?2:1
  const money=(amount:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:quote?.currency||'USD'}).format(amount)
  const casePrice=(amount:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:quote?.currency||'USD',minimumFractionDigits:2,maximumFractionDigits:6}).format(amount)
  async function download(id:string){setDownloading(id);setDownloadError('');try{await downloadCustomerQuoteDocument(token,id)}catch(e){setDownloadError(e instanceof Error?e.message:'Download failed. Try again.')}finally{setDownloading('')}}
  return <section className="account-content-card" aria-label="Quote request details">
    <nav className="portal-breadcrumb" aria-label="Breadcrumb"><Link to="/account">Home</Link><span>/</span><Link to="/account?view=quotes">Back to all requests</Link><span>/</span><span>{requestNumber}</span></nav>
    {!current ? <PortalSkeleton label="Loading request…" /> : <>
      {current.error && <PortalError message={current.error} onRetry={()=>setRetry(value=>value+1)} />}
      {value && <>
        <header className="portal-quote-highlights"><div><p className="eyebrow">{quote?'Your quote':'Quote request'}</p><h2>{quote?.quoteNumber||requestNumber}</h2><span className="account-quote-status">{value.status}</span>{quote&&<p>Revision {quote.revision} · Request {requestNumber}</p>}<p>{value.owner?.name||'NexGen Sales'} · <a href={`mailto:${value.owner?.email||portalConfig.contactEmail}`}>{value.owner?.email||portalConfig.contactEmail}</a></p></div>
          <dl><div><dt>Submitted</dt><dd>{formatPortalDate(value.submittedAt)}</dd></div><div><dt>Valid through</dt><dd>{quote?formatPortalDate(quote.validThrough):'Available with your quote'}</dd></div>{quote&&<div><dt>Quote total</dt><dd className="portal-quote-total">{money(quote.total)}</dd></div>}</dl>
        </header>
        <ol className="quote-status-timeline" aria-label="Request progress">{steps.map((step,index)=><li key={step} aria-current={step===value.status?'step':undefined} data-complete={index<=progressIndex}>{step}</li>)}</ol>
        {value.status==='Expired'&&<p role="status">This quote has expired. Contact NexGen for updated pricing and validity.</p>}
        {value.status==='Quote withdrawn'&&<p role="status">NexGen withdrew this quote. Contact us to discuss the next step.</p>}
        <div className="portal-record-actions">{value.documents?.map(document=><button type="button" key={document.id} disabled={Boolean(downloading)} onClick={()=>void download(document.id)}>{downloading===document.id?'Downloading…':'Download quote PDF'}</button>)}</div>
        {downloadError&&<PortalError message={downloadError} onRetry={()=>{const id=value.documents?.[0]?.id;if(id)void download(id)}}/>}
        {quote&&<section className="portal-related-section" aria-label="Quoted items"><h3>Items</h3><div className="portal-quote-table"><table><thead><tr><th>Product</th><th>Cases</th><th>Items</th><th>Price / case</th><th>Line total</th></tr></thead><tbody>{quote.items.map((item,index)=><tr key={index}><td><strong>{item.productName}</strong><small>{[item.sku,item.specifications].filter(Boolean).join(' · ')}</small>{item.adjustments!==0&&<small>Adjustments: {money(item.adjustments)}</small>}</td><td>{item.cases.toLocaleString()}</td><td>{item.totalItems.toLocaleString()}</td><td>{casePrice(item.pricePerCase)}</td><td>{money(item.lineTotal)}</td></tr>)}</tbody></table></div><p className="portal-quote-total">Total {money(quote.total)}</p>{quote.terms&&<p>Terms: {quote.terms}</p>}{quote.customerMessage&&<p>{quote.customerMessage}</p>}</section>}
        <section className="portal-related-section"><h3>Request details, artwork and delivery</h3><QuoteRequestSummary request={value}/></section>
        <section className="portal-related-section" aria-label="Quote documents"><h3>Documents</h3>{value.documents?.length?<ul>{value.documents.map(document=><li key={document.id}><button type="button" disabled={Boolean(downloading)} onClick={()=>void download(document.id)}>{document.fileName}</button> · Revision {document.revision}</li>)}</ul>:<p>Your quote PDF will appear here when NexGen releases it.</p>}</section>
        <CustomerQuoteMessages token={token} request={value} onChanged={()=>setRetry(value=>value+1)}/>
        <section className="portal-related-section" aria-label="Quote activity"><h3>Activity</h3><ol>{value.activity?.map((event,index)=><li key={index}>{event.label}{event.revision?` · Revision ${event.revision}`:''} · {formatPortalDate(event.at)}</li>)}<li>Request submitted · {formatPortalDate(value.submittedAt)}</li></ol></section>
        <aside className="portal-record-contact"><h3>{value.owner?.name||'NexGen Sales'}</h3><a href={`mailto:${value.owner?.email||portalConfig.contactEmail}`}>{value.owner?.email||portalConfig.contactEmail}</a><span>{value.owner?.phone||portalConfig.contactPhone}</span></aside>
        <RequestActions request={value} onRequestAgain={onRequestAgain} />
      </>}
    </>}
  </section>
}

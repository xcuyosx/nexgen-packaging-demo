import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCustomerQuoteDetail } from './customerAccount'
import { QuoteRequestSummary } from './QuoteRequestSummary'
import type { QuoteReceipt } from './QuoteRequestSummary'

export function CustomerQuoteDetail({token,requestNumber,refresh}:{token:string;requestNumber:string;refresh:unknown}) {
  const [result,setResult]=useState<{key:string;value:QuoteReceipt|null;error:string}|null>(null)
  const key=token+':'+requestNumber
  useEffect(()=>{
    const controller=new AbortController()
    fetchCustomerQuoteDetail(token,requestNumber,controller.signal).then(value=>{
      if(!controller.signal.aborted)setResult({key,value,error:''})
    }).catch(error=>{if(!controller.signal.aborted)setResult(previous=>({key,value:previous?.key===key?previous.value:null,error:error instanceof Error?error.message:'Unable to load this request.'}))})
    return ()=>controller.abort()
  },[token,requestNumber,key,refresh])
  const current=result?.key===key?result:null
  const steps=['Submitted','In review','Quote ready','Accepted']
  return <section className="account-content-card" aria-label="Quote request details">
    <Link to="/account?view=quotes">Back to all requests</Link>
    {!current ? <p role="status">Loading request…</p> : <>
      {current.error && <p role="alert">{current.error}</p>}
      {current.value && <><h2>{requestNumber}</h2><p className="account-quote-status">{current.value.status}</p>
        <ol className="quote-status-timeline" aria-label="Request progress">{steps.map((step,index)=><li key={step} aria-current={step===current.value!.status?'step':undefined} data-complete={index<=steps.indexOf(current.value!.status||'')}>{step}</li>)}</ol>
        {current.value.issuedQuoteNumber && <p>Issued quote: {current.value.issuedQuoteNumber}</p>}
        {current.value.validThrough && <p>Valid through: {current.value.validThrough}</p>}
        <QuoteRequestSummary request={current.value}/>
      </>}
    </>}
  </section>
}

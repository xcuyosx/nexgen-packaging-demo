import {useEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import type {QuoteReceipt} from './QuoteRequestSummary'
import {customerQuoteRpc} from './customerAccount'
import {formatPortalDate} from './portalPresentation'
import {PortalError,PortalSkeleton} from './PortalFeedback'
type Message={id:string;authorKind:'staff'|'customer';authorName:string;body:string;createdAt:string;action:string}
type Action='message'|'request_changes'|'decline'|'accept'
export function CustomerQuoteMessages({token,request,onChanged,onRead}:{token:string;request:QuoteReceipt;onRead:()=>void;onChanged:()=>void}){
 const [messages,setMessages]=useState<Message[]|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0)
 const [action,setAction]=useState<Action>('message'),[body,setBody]=useState(''),[name,setName]=useState(''),[terms,setTerms]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
 const onReadRef=useRef(onRead)
 useEffect(()=>{onReadRef.current=onRead},[onRead])
 const activityKey=(request.activity||[]).map(event=>event.at+event.label).join('|')
 const attempt=useRef<{key:string;id:string}|null>(null)
 useEffect(()=>{let active=true;void customerQuoteRpc(token,'customer_quote_messages_read',{p_request_number:request.requestNumber,p_mark_read:true}).then(result=>{if(active){setMessages(Array.isArray(result)?result as Message[]:[]);setError('');if(request.needsReply)onReadRef.current()}}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Messages could not load.')});return()=>{active=false}},[token,request.requestNumber,request.needsReply,activityKey,retry])
 const ready=Boolean(request.quote&&['Quote ready','Changes requested','Expired','Declined'].includes(request.status||''))
 async function send(event:React.FormEvent){event.preventDefault();if(busy)return;setBusy(true);setError('');setNotice('')
  const payload={p_request_number:request.requestNumber,p_action:action,p_body:body,p_revision:request.quote?.revision??null,p_typed_name:name,p_terms_accepted:terms}
  const key=JSON.stringify(payload);if(attempt.current?.key!==key)attempt.current={key,id:crypto.randomUUID()}
  try{await customerQuoteRpc(token,'customer_quote_respond',{...payload,p_client_id:attempt.current.id});attempt.current=null;setBody('');setName('');setTerms(false);setAction('message');setNotice(action==='accept'?'Quote accepted. Your confirmation has been saved.':action==='request_changes'?'Your change request was sent to NexGen.':action==='decline'?'Your response was saved.':'Message sent to NexGen.');setRetry(value=>value+1);onChanged()}
  catch(e){setError(e instanceof Error?e.message:'Your response could not be saved. Try again.')}
  finally{setBusy(false)}
 }
 return <section className="portal-related-section" aria-label="Quote messages"><h3>Messages</h3>
 {messages===null&&!error?<PortalSkeleton label="Loading messages…"/>:null}
 {error&&<PortalError message={error} onRetry={()=>setRetry(value=>value+1)}/>}
 {messages?.length?<ol className="portal-message-thread">{messages.map(message=><li key={message.id} data-author={message.authorKind}><header><strong>{message.authorKind==='customer'?'You':message.authorName||'NexGen team'}</strong><time>{formatPortalDate(message.createdAt)}</time></header><p>{message.body}</p></li>)}</ol>:messages?<p>No messages yet. Ask a question or send details to NexGen here.</p>:null}
 <div className="portal-record-actions"><button type="button" disabled={busy} aria-pressed={action==='message'} onClick={()=>setAction('message')}>Message NexGen</button>{ready&&<><button type="button" disabled={busy} aria-pressed={action==='request_changes'} onClick={()=>setAction('request_changes')}>Request changes</button><button type="button" disabled={busy} aria-pressed={action==='decline'} onClick={()=>setAction('decline')}>Decline quote</button></>}{request.acceptEnabled&&ready&&request.status!=='Expired'&&<button type="button" disabled={busy} onClick={()=>setAction('accept')}>Accept quote</button>}</div>
 <form className="portal-message-form" onSubmit={event=>void send(event)}><fieldset disabled={busy}><legend>{action==='accept'?'Confirm acceptance':action==='request_changes'?'Tell us what needs to change':action==='decline'?'Reason for declining':'Your message'}</legend>
 {action==='accept'?<><p>You are accepting revision {request.quote?.revision} for {new Intl.NumberFormat('en-US',{style:'currency',currency:request.quote?.currency||'USD'}).format(request.quote?.total||0)}.</p><label>Full name<input required maxLength={300} value={name} onChange={e=>setName(e.target.value)}/></label><label className="portal-terms-check"><input type="checkbox" required checked={terms} onChange={e=>setTerms(e.target.checked)}/>I have reviewed and agree to the <Link to="/terms" target="_blank">Terms</Link> for this quote.</label></>:<label>{action==='decline'?'Reason':'Message'}<textarea aria-label={action === 'decline' ? 'Reason' : 'Message'} required maxLength={5000} rows={4} value={body} onChange={e=>setBody(e.target.value)}/><small>{body.length.toLocaleString()} / 5,000</small></label>}
 <button type="submit">{busy?'Saving…':action==='accept'?'Confirm acceptance':action==='request_changes'?'Send change request':action==='decline'?'Confirm decline':'Send message'}</button></fieldset></form>{notice&&<p role="status">{notice}</p>}
 </section>
}

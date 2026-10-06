import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {customerQuoteRpc,fetchCustomerQuoteDetail,type CustomerAccount,type CustomerQuoteHistoryEntry} from './customerAccount'
import type {QuoteReceipt} from './QuoteRequestSummary'
import {quoteLink,formatPortalDate,portalConfig} from './portalPresentation'
import {PortalError,PortalSkeleton} from './PortalFeedback'
import {attentionReason,unreadReplies} from './portalAttention'
export function PortalHome({account,requests,status,error,refresh,token,onRequestAgain}:{account:CustomerAccount;requests:CustomerQuoteHistoryEntry[];status:'loading'|'ready'|'error';error:string;refresh:()=>void;token:string;onRequestAgain:(request:QuoteReceipt)=>void}){
 const [owner,setOwner]=useState({name:'NexGen Sales',email:portalConfig.contactEmail as string,phone:portalConfig.contactPhone as string})
 useEffect(()=>{let current=true;void customerQuoteRpc(token,'customer_portal_config',{}).then(value=>{const contact=(value as {owner?:{name:string;email:string;phone:string}})?.owner;if(current&&contact?.name&&contact.email)setOwner(contact)}).catch(()=>{});return()=>{current=false}},[token])
 const [busy,setBusy]=useState(false),[repeatError,setRepeatError]=useState('')
 const attention=requests.map(request=>({request,reason:attentionReason(request)})).filter(item=>item.reason)
 const unread=requests.reduce((count,request)=>count+unreadReplies(request),0)
 const activities=requests.flatMap(request=>[{at:request.submittedAt,label:'Request submitted',number:request.requestNumber},...(request.activity||[]).map(event=>({at:event.at,label:event.label,number:request.requestNumber}))]).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,8)
 async function again(){if(!requests[0])return;setBusy(true);setRepeatError('');try{onRequestAgain(await fetchCustomerQuoteDetail(token,requests[0].requestNumber))}catch(e){setRepeatError(e instanceof Error?e.message:'Could not load this request.')}finally{setBusy(false)}}
 return <div className="portal-home-dashboard"><h2>Welcome, {account.contactName.split(' ')[0]||account.companyName}</h2>
 {status==='error'&&<PortalError message={error} onRetry={refresh}/>}
 <div className="portal-home-counters"><Link to="/account?view=quotes&unread=1"><strong>{unread}</strong><span>Unread replies</span></Link>{['In review','Quote ready','Accepted'].map(label=><Link to={'/account?view=quotes&status='+encodeURIComponent(label)} key={label}><strong>{status==='loading'&&!requests.length?'—':requests.filter(request=>request.status===label).length}</strong><span>{label}</span></Link>)}</div>
 {status==='loading'&&!requests.length?<PortalSkeleton label="Loading account activity…"/>:<div className="portal-home-columns"><section className="account-content-card"><h3>Needs your attention</h3>{attention.length?<ul>{attention.slice(0,5).map(({request,reason})=><li key={request.requestNumber}><span><strong>{request.issuedQuoteNumber||request.requestNumber}</strong><small>{reason}</small></span><Link to={quoteLink(request.requestNumber)}>Open</Link></li>)}</ul>:<p>You’re all caught up. Quote updates and replies will appear here.</p>}</section><section className="account-content-card"><h3>Recent activity</h3>{activities.length?<ol>{activities.map((event,index)=><li key={index}><Link to={quoteLink(event.number)}>{event.label} · {event.number}</Link><small>{formatPortalDate(event.at)}</small></li>)}</ol>:<p>No quote requests yet. Start with Request a quote.</p>}</section></div>}
 <div className="portal-home-columns"><section className="account-content-card"><h3>Quick actions</h3><div className="portal-record-actions"><Link to="/products">Request a quote</Link>{requests.length>0&&<button type="button" disabled={busy} onClick={()=>void again()}>{busy?'Loading…':'Request again'}</button>}<Link to="/contact?need=Account%20correction">Contact NexGen</Link></div>{repeatError&&<p role="alert">{repeatError}</p>}</section><aside className="account-content-card"><h3>Your NexGen contact</h3><strong>{owner.name}</strong><p><a href={'mailto:'+owner.email}>{owner.email}</a></p><p>{owner.phone}</p></aside></div>
 </div>
}

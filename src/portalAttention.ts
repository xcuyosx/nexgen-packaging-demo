import type {CustomerQuoteHistoryEntry} from './customerAccount'

export function unreadReplies(request:CustomerQuoteHistoryEntry){
 return request.unreadCount ?? (request.needsReply?1:0)
}

export function attentionReason(request:CustomerQuoteHistoryEntry,now=new Date()):string|null {
 if(unreadReplies(request)>0)return `NexGen replied on ${request.requestNumber}`
 if(request.status==='Changes requested'){
  const changes=request.activity?.filter(event=>event.label==='Changes requested').map(event=>event.at).sort().at(-1)
  const reply=request.activity?.filter(event=>event.label==='NexGen replied').map(event=>event.at).sort().at(-1)
  if(changes&&reply&&reply>changes)return 'NexGen answered your requested changes'
 }
 if(['Quote ready','Changes requested'].includes(request.status)&&request.validThrough){
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)
  const days=(Date.parse(request.validThrough.slice(0,10)+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000
  if(days>=0&&days<=7)return `Quote expires ${request.validThrough.slice(0,10)}`
 }
 if(request.status==='Quote ready')return 'Your quote is ready for a response'
 return null
}

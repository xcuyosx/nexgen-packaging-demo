/** Browser defaults to the customer's zone; server mail supplies its named zone. */
export function formatPortalDate(value:string|null|undefined,timeZone?:string){
 if(!value)return 'Not provided'
 const dateOnly=/^\d{4}-\d{2}-\d{2}$/.test(value),date=new Date(dateOnly?`${value}T12:00:00`:value)
 if(!Number.isFinite(date.getTime()))return 'Not provided'
 return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',...(timeZone?{timeZone}:{}),...(dateOnly?{}:{hour:'numeric',minute:'2-digit',timeZoneName:'short'})}).format(date)
}

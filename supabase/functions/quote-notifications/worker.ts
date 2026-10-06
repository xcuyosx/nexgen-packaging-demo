import {renderPortalEmail,runtimeEmailConfig,EmailDataError,type EmailConfig,type Mail} from '../_shared/portalEmail.ts'
export type {Mail} from '../_shared/portalEmail.ts'
export type QuoteJob = {
  notification_id?: string; queue?:'portal'; request_id: string; kind: 'sales' | 'customer' | 'status' | 'reply' | 'changes' | 'contact_sales' | 'contact_visitor'; snapshot: Record<string, unknown>
  verified_email: string | null; prepared_mail: Mail | null; first_attempt_at: string | null
  claim_id: string; attempts: number; created_at?: string
}
export type QuoteStore = {
  claim(id: string): Promise<QuoteJob | null>
  prepare(job: QuoteJob, mail: Mail, started: string): Promise<void>
  accepted(job: QuoteJob, providerId: string): Promise<void>
  release(job: QuoteJob, stopped: string | null): Promise<void>
  sign(paths: string[]): Promise<string[]>
}
const uuid = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
const validId = new RegExp(`^${uuid}$`, 'i')
const email = (value: unknown): value is string => typeof value === 'string' && value.length <= 254
  && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value)
const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : ''
const InvalidJob = EmailDataError

export async function buildQuoteMail(job:QuoteJob,_store:QuoteStore,config:EmailConfig=runtimeEmailConfig()):Promise<Mail>{
 const q=job.snapshot
 if(!validId.test(job.request_id)||q.id!==job.request_id)throw new InvalidJob('Invalid job identity')
 if(job.kind!=='sales'&&!email(job.verified_email))throw new InvalidJob('Invalid recipient')
 if(job.queue==='portal'){
  if(!validId.test(job.notification_id||''))throw new InvalidJob('Invalid portal event')
  if(!['reply','changes','contact_sales','contact_visitor'].includes(job.kind))throw new InvalidJob('Invalid portal kind')
  if(['reply','changes'].includes(job.kind)&&(!/^WEB-[0-9]{8}-[A-Z0-9-]{6,36}$/.test(text(q.request_number))||text(q.body).length>5000))throw new InvalidJob('Invalid conversation event')
 }else{
  if(!validId.test(text(q.user_id))||!/^WEB-[0-9]{8}-[A-Z0-9-]{6,36}$/.test(text(q.request_number)))throw new InvalidJob('Invalid quote job')
  if(job.kind==='status'){
   if(!validId.test(job.notification_id||'')||!['In review','Quote ready','Accepted','Quote withdrawn'].includes(text(q.status))||!Number.isFinite(Date.parse(text(q.changed_at))))throw new InvalidJob('Invalid status event')
  }else{
   if(!['sales','customer'].includes(job.kind)||!Array.isArray(q.lines)||!q.lines.length||q.lines.length>50)throw new InvalidJob('Invalid quote job')
   for(const value of q.lines){
    if(!value||typeof value!=='object')throw new InvalidJob('Invalid line')
    const line=value as Record<string,unknown>,additional=Array.isArray(line.additionalArtwork)?line.additionalArtwork:[]
    if(additional.length>9)throw new InvalidJob('Too many attachments')
    const paths=[line.artworkPath,...additional.map(v=>v&&typeof v==='object'?(v as Record<string,unknown>).path:'invalid')].filter(Boolean)
    for(const path of paths)if(!new RegExp('^'+q.user_id+'/'+job.request_id+'/'+uuid+'\\.(png|jpe?g|webp|svg|pdf|ai|eps)$','i').test(text(path)))throw new InvalidJob('Artwork ownership mismatch')
   }
  }
 }
 return renderPortalEmail(job.kind,q,job.verified_email||'',job.created_at,config)
}

export async function deliverQuoteJob(job: QuoteJob, store: QuoteStore, send: (mail: Mail, key: string) => Promise<string>, now = () => Date.now()) {
  try {
    if (job.first_attempt_at && (!Number.isFinite(Date.parse(job.first_attempt_at))
      || now() - Date.parse(job.first_attempt_at) >= 23 * 3600000)) {
      await store.release(job, 'retry_window_expired'); return 'stopped'
    }
    let mail = job.prepared_mail
    if (!mail) {
      mail = await buildQuoteMail(job, store)
      // Persist exact recipient, body and signed URLs BEFORE contacting Resend.
      // An ambiguous write never proceeds to send; the next lease reads it back.
      await store.prepare(job, mail, new Date(now()).toISOString())
    } else if (!job.first_attempt_at || !mail.html) throw new InvalidJob('Prepared job needs template review')
    // Existing receipt keys are unchanged, including retries prepared before the migration.
    if (job.kind === 'status' && !validId.test(job.notification_id || '')) throw new InvalidJob('Invalid status identity')
    const key = job.queue==='portal'?`storefront-portal/${job.notification_id}/v1`:job.kind === 'status' ? `storefront-quote/status/${job.notification_id}/v1` : `storefront-quote/${job.request_id}/${job.kind}/v1`
    const id = await send(mail, key)
    await store.accepted(job, id)
    return 'accepted'
  } catch (error) {
    await store.release(job, error instanceof InvalidJob ? 'invalid_job' : job.attempts >= 20 ? 'attempt_limit' : null)
    return error instanceof InvalidJob || job.attempts >= 20 ? 'stopped' : 'retry'
  }
}

export function createQuoteWorker(options: { enabled: boolean; secret: string; store: QuoteStore; send: (mail: Mail, key: string) => Promise<string> }) {
  return async (request: Request) => {
    const respond = (status: number, body: unknown) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
    if (request.method !== 'POST') return respond(405, { error: 'Method not allowed' })
    if (!options.enabled || options.secret.length < 32) return respond(503, { error: 'Quote email is disabled' })
    const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
    const a = await digest(request.headers.get('Authorization') || ''), b = await digest(`Bearer ${options.secret}`)
    if (a.reduce((difference, byte, i) => difference | (byte ^ b[i]), 0) !== 0) return respond(401, { error: 'Unauthorized' })
    const counts = { accepted: 0, retry: 0, stopped: 0 }
    try {
      // A small bounded batch fits the worker runtime and lease even on failures.
      for (let i = 0; i < 2; i++) {
        const job = await options.store.claim(crypto.randomUUID())
        if (!job) break
        counts[await deliverQuoteJob(job, options.store, options.send)]++
      }
      return respond(200, counts)
    } catch { return respond(503, { error: 'Quote notification worker unavailable' }) }
  }
}

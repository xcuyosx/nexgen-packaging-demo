export type Mail = { from: string; to: string[]; reply_to: string; subject: string; text: string }
export type QuoteJob = {
  request_id: string; kind: 'sales' | 'customer'; snapshot: Record<string, unknown>
  verified_email: string | null; prepared_mail: Mail | null; first_attempt_at: string | null
  claim_id: string; attempts: number
}
export type QuoteStore = {
  claim(id: string): Promise<QuoteJob | null>
  prepare(job: QuoteJob, mail: Mail, started: string): Promise<void>
  accepted(job: QuoteJob, providerId: string): Promise<void>
  release(job: QuoteJob, stopped: string | null): Promise<void>
  sign(paths: string[]): Promise<string[]>
}
const mailbox = 'orders@nexgenpac.com'
const uuid = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
const validId = new RegExp(`^${uuid}$`, 'i')
const email = (value: unknown): value is string => typeof value === 'string' && value.length <= 254
  && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value)
const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : ''
class InvalidJob extends Error {}

export async function buildQuoteMail(job: QuoteJob, store: QuoteStore): Promise<Mail> {
  const q = job.snapshot
  if (!validId.test(job.request_id) || q.id !== job.request_id || !validId.test(text(q.user_id))
    || !/^WEB-[0-9]{8}-[A-Z0-9-]{6,36}$/.test(text(q.request_number))
    || !Array.isArray(q.lines) || !q.lines.length || q.lines.length > 50) throw new InvalidJob('Invalid quote job')
  if (job.kind === 'customer' && !email(job.verified_email)) throw new InvalidJob('Invalid recipient')
  const paths: string[] = []
  const summaries = q.lines.map((value, index) => {
    if (!value || typeof value !== 'object') throw new InvalidJob('Invalid line')
    const line = value as Record<string, unknown>
    if (line.artworkPath) {
      const path = text(line.artworkPath)
      if (!new RegExp(`^${q.user_id}/${job.request_id}/${uuid}\\.(png|jpe?g|webp|svg|pdf|ai|eps)$`, 'i').test(path)) {
        throw new InvalidJob('Artwork ownership mismatch')
      }
      paths.push(path)
    }
    return `${index + 1}. ${text(line.productName)} | SKU: ${text(line.sku)} | Cases: ${text(line.cases)}\n`
      + `Size: ${text(line.size)} | Material: ${text(line.material)} | Dimensions: ${text(line.dimensions)} | Case pack: ${text(line.casePack)}\n`
      + `Print colors: ${text(line.printColors)} | Inks: ${Array.isArray(line.inkColors) ? line.inkColors.map(text).join(', ') : ''}\n`
      + `Artwork: ${text(line.artworkName) || 'None'}`
  }).join('\n\n')
  let body = `Quote request ${text(q.request_number)}\n\n`
  body += job.kind === 'sales' ? 'A customer submitted a quote request.\n\n' : 'We received your quote request.\n\n'
  body += summaries
  if (job.kind === 'sales') {
    body += `\n\nContact: ${JSON.stringify(q.contact || {})}\nBilling: ${JSON.stringify(q.billing || {})}\nReceiving: ${JSON.stringify(q.shipping || {})}`
    body += `\nPurchase order reference: ${text(q.purchase_order)}\nNotes: ${text(q.notes)}`
    if (paths.length) {
      const links = await store.sign(paths)
      if (links.length !== paths.length) throw new Error('Artwork links incomplete')
      body += '\n\nPrivate artwork downloads (expire 24 hours after link creation; do not forward):\n'
        + links.map((url, index) => `${paths[index].split('/').pop()}: ${url}`).join('\n')
    }
    body += '\n\nOpen the CRM quote library to review this request. Artwork remains available to authorized staff there after email links expire.'
  }
  body += '\n\nThis is a receipt of a request for pricing, not an order acceptance or a payment confirmation. NexGen will review the specifications and follow up.\nQuestions: orders@nexgenpac.com | (833) 853-1243\nNexGen Packaging Group'
  if (body.length > 200000) throw new InvalidJob('Message too large')
  return { from: mailbox, to: [job.kind === 'sales' ? mailbox : job.verified_email!],
    reply_to: job.kind === 'sales' && email(job.verified_email) ? job.verified_email : mailbox,
    subject: `${job.kind === 'sales' ? 'New quote request' : 'Quote request received'} ${text(q.request_number)}`, text: body }
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
    } else if (!job.first_attempt_at) throw new InvalidJob('Prepared job missing timestamp')
    const id = await send(mail, `storefront-quote/${job.request_id}/${job.kind}/v1`)
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

import type { QuoteJob, QuoteStore } from './worker.ts'

export function createQuoteStore(url: string, serviceKey: string, request: typeof fetch = fetch): QuoteStore {
  const base = url.replace(/\/$/, '')
  const call = async (path: string, method: string, body?: unknown) => {
    const response = await request(`${base}${path}`, { method, redirect: 'error',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error('Quote notification storage unavailable')
    return await response.json()
  }
  const patch = async (job: QuoteJob, body: unknown) => {
    const rows = await call(`/rest/v1/quote_notification_jobs?request_id=eq.${job.request_id}&kind=eq.${job.kind}&claim_id=eq.${job.claim_id}&claim_until=gt.${encodeURIComponent(new Date().toISOString())}&select=request_id`, 'PATCH', body)
    if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Quote notification lease expired')
  }
  return {
    async claim(id) {
      const rows = await call('/rest/v1/rpc/claim_quote_notification', 'POST', { p_claim_id: id })
      if (!Array.isArray(rows) || rows.length > 1) throw new Error('Invalid claim response')
      return rows[0] || null
    },
    prepare: (job, mail, started) => patch(job, { prepared_mail: mail, first_attempt_at: started }),
    accepted: (job, providerId) => patch(job, { accepted_at: new Date().toISOString(), provider_id: providerId, claim_id: null, claim_until: null }),
    release: (job, stopped) => patch(job, { stopped_reason: stopped, claim_id: null, claim_until: null,
      next_attempt_at: new Date(Date.now() + Math.min(3600, 30 * 2 ** Math.min(job.attempts, 7)) * 1000).toISOString() }),
    async sign(paths) {
      const data = await call('/storage/v1/object/sign/customer-quote-artwork', 'POST', { paths, expiresIn: 86400 })
      if (!Array.isArray(data) || data.length !== paths.length) throw new Error('Invalid artwork signing response')
      return paths.map(path => {
        const value = data.find(item => item.path === path)
        if (!value || value.error || typeof value.signedURL !== 'string') throw new Error('Artwork unavailable')
        const signed = new URL(`${base}/storage/v1${value.signedURL}`)
        if (signed.origin !== new URL(base).origin || signed.pathname !== `/storage/v1/object/sign/customer-quote-artwork/${path}`
          || !signed.searchParams.get('token')) throw new Error('Invalid artwork link')
        signed.searchParams.set('download', '')
        return signed.href
      })
    },
  }
}

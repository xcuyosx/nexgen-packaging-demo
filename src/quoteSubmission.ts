import type { CustomerQuoteRequestInput } from './customerAccount'
import { prepareQuoteAttempt } from './quoteAttempt.ts'

export async function submitQuoteAttempt(options: {
  url: string; key: string; token: string; userId: string; leadId: string
  request: CustomerQuoteRequestInput
}, fetcher: typeof fetch = fetch): Promise<{ requestNumber: string }> {
  const { url, key, token, userId, leadId, request } = options
  const attempt = await prepareQuoteAttempt(userId, request)
  const headers = { apikey: key, Authorization: `Bearer ${token}` }
  const receipt = (value: unknown) => Array.isArray(value) && value.length === 1
    && value[0]?.id === attempt.id && value[0]?.request_number === attempt.number
  const finish = () => { attempt.confirm(); return { requestNumber: attempt.number } }
  const lookup = async () => {
    const response = await fetcher(`${url}/rest/v1/customer_quote_requests?id=eq.${attempt.id}&user_id=eq.${userId}&select=id,request_number`, {
      headers, signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error('Unable to verify your earlier submission. Please try again before starting a new request.')
    const rows = await response.json()
    if (receipt(rows)) return true
    if (!Array.isArray(rows) || rows.length) throw new Error('The quote receipt could not be verified.')
    return false
  }
  if (await lookup()) return finish()
  try {
    for (const upload of attempt.uploads) {
      const response = await fetcher(`${url}/storage/v1/object/customer-quote-artwork/${upload.path}`, {
        method: 'POST', headers: { ...headers, 'Content-Type': upload.contentType, 'x-upsert': 'false' },
        body: upload.file, signal: AbortSignal.timeout(60000),
      })
      // The immutable path includes a digest of the file bytes and line index.
      // Retrying an interrupted upload reuses that object instead of overwriting it.
      const duplicate = response.status === 409 && (await response.json().catch(() => null))?.error === 'Duplicate'
      if (!response.ok && !duplicate) throw new Error('Artwork upload could not be confirmed. Your files are still selected; please try again.')
    }
    const response = await fetcher(`${url}/rest/v1/customer_quote_requests`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ id: attempt.id, user_id: userId, lead_id: leadId, request_number: attempt.number,
        contact_snapshot: request.contact, billing_snapshot: request.billing, shipping_snapshot: request.shipping,
        purchase_order: request.purchaseOrder, notes: request.notes, lines: attempt.lines }),
      signal: AbortSignal.timeout(30000),
    })
    const body = await response.json().catch(() => null)
    if (response.ok && receipt(body)) return finish()
    throw new Error('The quote receipt could not be confirmed. Please retry this request or check your quote history before creating another.')
  } catch (error) {
    // A timeout or empty success body can follow a committed insert. Confirm by
    // its stable ID; never generate a new ID or delete possibly submitted files.
    if (await lookup().catch(() => false)) return finish()
    throw error
  }
}

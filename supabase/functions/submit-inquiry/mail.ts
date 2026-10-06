import type { InquiryMail } from './handler.ts'

// D5: Bradley confirmed orders@nexgenpac.com as the inquiry sender and sales
// notification recipient on 2026-10-03. Configure both in server-side env vars.
// Resend's free plan is installed. Enable sending only after DNS verification.
// The key is server-only; provider response bodies must never reach the browser.
export function createInquiryMailer(apiKey: string, request: typeof fetch = fetch) {
  const key = apiKey.trim()
  return async (mail: InquiryMail): Promise<void> => {
    if (!key) throw new Error('Inquiry email provider has not been configured')
    try {
      const response = await request('https://api.resend.com/emails', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
          'Idempotency-Key': mail.idempotencyKey },
        body: JSON.stringify({ from: mail.from, to: mail.to, reply_to: mail.replyTo,
          subject: mail.subject, text: mail.text }),
      })
      if (!response.ok) throw new Error('Provider rejected email')
      const result: unknown = await response.json()
      if (!result || typeof result !== 'object' || !('id' in result)
        || typeof result.id !== 'string' || !result.id.trim()) {
        throw new Error('Provider did not acknowledge email')
      }
    } catch {
      // The handler keeps the row and retries the same deterministic key.
      // A 2xx response means accepted by Resend, not delivery to an inbox.
      throw new Error('Inquiry email could not be confirmed')
    }
  }
}

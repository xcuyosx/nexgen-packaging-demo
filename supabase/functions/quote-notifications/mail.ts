import type { Mail } from './worker.ts'
export function createQuoteMailer(apiKey: string, request: typeof fetch = fetch) {
  return async (mail: Mail, key: string): Promise<string> => {
    if (!apiKey.trim()) throw new Error('Quote email provider unavailable')
    try {
      const response = await request('https://api.resend.com/emails', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
        // PostgreSQL jsonb reorders object keys. Serialize a fixed shape so the
        // first attempt and the durable replay have identical provider bytes.
        body: JSON.stringify({ from: mail.from, to: mail.to, reply_to: mail.reply_to,
          subject: mail.subject, text: mail.text }),
      })
      if (!response.ok) throw new Error('Provider rejected email')
      const result = await response.json()
      if (typeof result?.id !== 'string' || !result.id.trim() || result.id.length > 200) throw new Error('Invalid receipt')
      return result.id
    } catch { throw new Error('Quote email acceptance could not be confirmed') }
  }
}

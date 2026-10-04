import { createQuoteWorker } from './worker.ts'
import { createQuoteStore } from './store.ts'
import { createQuoteMailer } from './mail.ts'
const env = (name: string) => Deno.env.get(name) || ''
const url = env('SUPABASE_URL'), serviceKey = env('SUPABASE_SERVICE_ROLE_KEY'), apiKey = env('RESEND_API_KEY')
Deno.serve(createQuoteWorker({
  enabled: env('QUOTE_EMAIL_ENABLED') === 'true' && !!url && !!serviceKey && !!apiKey,
  secret: env('QUOTE_WORKER_SECRET'), store: createQuoteStore(url, serviceKey), send: createQuoteMailer(apiKey),
}))

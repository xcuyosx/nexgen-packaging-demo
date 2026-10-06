import { createQuoteWorker } from './worker.ts'
import { createQuoteStore } from './store.ts'
import { createQuoteMailer } from './mail.ts'
const env = (name: string) => Deno.env.get(name) || ''
const url = env('SUPABASE_URL'), serviceKey = env('SUPABASE_SERVICE_ROLE_KEY'), apiKey = env('RESEND_API_KEY')
// Bradley authorized this inbox for proof-of-concept delivery; sending remains gated.
const allowedRecipients=(env('QUOTE_EMAIL_ALLOWED_RECIPIENTS')||'bradley@nexgenpac.com').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean)
const provider=createQuoteMailer(apiKey)
Deno.serve(createQuoteWorker({
  enabled: env('QUOTE_EMAIL_ENABLED') === 'true' && !!url && !!serviceKey && !!apiKey,
  secret: env('QUOTE_WORKER_SECRET'), store: createQuoteStore(url, serviceKey),
  async send(mail,key){
    // TODO(bradley): expand only after sender verification and authorized delivery tests.
    if(!mail.to.every(value=>allowedRecipients.includes(value.toLowerCase())))throw new Error('Recipient is not enabled for email delivery')
    const gate=await fetch(url+'/rest/v1/rpc/portal_email_delivery_enabled',{method:'POST',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'},body:'{}'})
    if(!gate.ok||await gate.json()!==true)throw new Error('Email sending is disabled')
    return provider(mail,key)
  },
}))

import { createInquiryHandler } from './handler.ts'
import { createInquiryStore } from './store.ts'

const env = (key: string) => Deno.env.get(key) || ''
const url = env('SUPABASE_URL'), serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')
Deno.serve(createInquiryHandler({
  allowedOrigins: (env('INQUIRY_ALLOWED_ORIGINS')||'https://storefront-staging.vercel.app').split(',').map(value => value.trim()).filter(Boolean),
  configured: !!url && !!serviceKey,
  rateSecret: env('INQUIRY_RATE_LIMIT_SECRET')||serviceKey,
  store: createInquiryStore(url, serviceKey),
  async resolveUser(request){
    const token=request.headers.get('authorization')?.replace(/^Bearer /,'')
    if(!token||token===env('SUPABASE_ANON_KEY'))return null
    const response=await fetch(url+'/auth/v1/user',{headers:{apikey:env('SUPABASE_ANON_KEY'),Authorization:'Bearer '+token}})
    if(!response.ok)throw Error('SESSION_INVALID')
    const user=await response.json();return user.id
  },
}))

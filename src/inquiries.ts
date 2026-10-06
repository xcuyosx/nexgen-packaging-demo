import { createClient, FunctionsHttpError } from '@supabase/supabase-js'
import type { InquiryErrors, InquiryFields } from '../supabase/functions/submit-inquiry/validation'

const url = String(import.meta.env.VITE_SUPABASE_URL || '')
const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '')
const client = url && key ? createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}) : null

export class InquirySubmissionError extends Error {
  fields: InquiryErrors
  constructor(message: string, fields: InquiryErrors = {}) { super(message); this.fields = fields }
}

export async function submitInquiry(fields: InquiryFields, requestId: string,token?:string): Promise<{reference:string;emailConfirmed:boolean}> {
  if (!client) throw new InquirySubmissionError('The contact form is temporarily unavailable. Please use the phone or email below.')
  const { data, error } = await client.functions.invoke('submit-inquiry', {
    body: { ...fields, requestId }, timeout: 25000,...(token?{headers:{Authorization:'Bearer '+token}}:{}),
  })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      if(error.context.status===401)window.dispatchEvent(new CustomEvent('nexgen:session-expired'))
      const body = await error.context.json().catch(() => null)
      throw new InquirySubmissionError(typeof body?.error === 'string' ? body.error : 'Your inquiry could not be sent. Please try again.', body?.fields || {})
    }
    throw new InquirySubmissionError('We could not confirm your submission. Your message is still here; please try again or contact us below.')
  }
  if (!data || data.ok !== true) throw new InquirySubmissionError('We could not confirm your submission. Please try again or contact us below.')
  return {reference:String(data.reference||''),emailConfirmed:data.emailConfirmed===true}
}

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { portalConfig } from './portalPresentation'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { Check, Mail, MapPin, Phone } from 'lucide-react'
import { inquiryLimits, inquiryNeeds, validateInquiry } from '../supabase/functions/submit-inquiry/validation'
import type { InquiryErrors, InquiryFields } from '../supabase/functions/submit-inquiry/validation'
import { InquirySubmissionError, submitInquiry } from './inquiries'

const empty: InquiryFields = { name: '', email: '', phone: '', company: '', need: 'standard', message: '', website: '' }

type Props = {
  token?:string
  prefill?:{name:string;email:string;company:string;phone:string}
  fields: InquiryFields
  setFields: Dispatch<SetStateAction<InquiryFields>>
  attemptRef: RefObject<{ payload: string; id: string }>
}

export function ContactPage({ fields, setFields, attemptRef,token,prefill }: Props) {
  const location=useLocation()
  useEffect(()=>{if(new URLSearchParams(location.search).get('need')==='Account correction')setFields(current=>({...current,need:'account_correction'}))},[location.search,setFields])
  useEffect(()=>{if(prefill?.email)setFields(current=>({...current,name:current.name||prefill.name,email:current.email||prefill.email,company:current.company||prefill.company,phone:current.phone||prefill.phone}))},[prefill?.name,prefill?.email,prefill?.company,prefill?.phone,setFields])
  const [errors, setErrors] = useState<InquiryErrors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [receipt,setReceipt]=useState<{reference:string;emailConfirmed:boolean}|null>(null)
  const busy = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const change = (field: keyof InquiryFields, value: string) => {
    setFields(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
    setError('')
  }
  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy.current) return
    const checked = validateInquiry(fields)
    if (checked.kind === 'invalid') {
      setErrors(checked.errors)
      setError('Please check the highlighted fields.')
      const first = Object.keys(checked.errors)[0]
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    busy.current = true
    setLoading(true); setErrors({}); setError('')
    const payload = JSON.stringify(fields)
    if (attemptRef.current.payload !== payload) attemptRef.current = { payload, id: crypto.randomUUID() }
    try {
      setReceipt(await submitInquiry(fields, attemptRef.current.id,token))
      setSentTo(fields.email.trim())
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Your inquiry could not be sent. Please try again.')
      if (failure instanceof InquirySubmissionError) setErrors(failure.fields)
    } finally { busy.current = false; setLoading(false) }
  }
  const fieldError = (field: keyof InquiryFields) => errors[field]
    ? <span className="contact-field-error" id={`inquiry-${field}-error`}>{errors[field]}</span> : null

  return <section className="contact-section page-section" id="contact">
    <div>
      <p className="eyebrow">Contact NexGen</p>
      <h1>Tell us what you need. We’ll help prepare your quote.</h1>
      <p>Share the product, quantity, artwork, timing, and delivery requirements. Our team will confirm specifications, pricing, availability, and next steps.</p>
      <address className="contact-details">
        <a href="tel:+18338531243"><Phone size={18} aria-hidden="true" />(833) 853-1243</a>
        <a href="mailto:orders@nexgenpac.com"><Mail size={18} aria-hidden="true" />orders@nexgenpac.com</a>
        <span><MapPin size={18} aria-hidden="true" />Bridgeton, MO</span>
      </address>
      {/* TODO(bradley): D3 — supply the full public mailing address; only the existing city is verified. */}
    </div>
    {sentTo ? <div className="contact-card contact-success" role="status" aria-live="polite">
      <Check size={28} aria-hidden="true" /><h3>Inquiry received</h3>
      <p>Reference: <strong>{receipt?.reference}</strong></p><p>{portalConfig.responsePromise}</p>
      <p>A member of the NexGen team will reply to {sentTo}.</p>{receipt?.emailConfirmed&&<p>We emailed a confirmation to {sentTo}.</p>}
      <button type="button" className="secondary-button" onClick={() => { setSentTo(''); setFields(empty); attemptRef.current = { payload: '', id: '' } }}>Send another inquiry</button>
    </div> : <form ref={form} className="contact-card" onSubmit={send} noValidate aria-busy={loading}>
      {(['name', 'email', 'phone', 'company'] as const).map(field => <div className="contact-field" key={field}>
        <label htmlFor={`inquiry-${field}`}>{{ name: 'Name', email: 'Email', phone: 'Phone (optional)', company: 'Company' }[field]}</label>
        <input id={`inquiry-${field}`} name={field} type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
          autoComplete={{ name: 'name', email: 'email', phone: 'tel', company: 'organization' }[field]}
          required={field !== 'phone'} maxLength={inquiryLimits[field]} value={fields[field]} disabled={loading}
          aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `inquiry-${field}-error` : undefined}
          onChange={event => change(field, event.target.value)} />{fieldError(field)}
      </div>)}
      <div className="contact-field"><label htmlFor="inquiry-need">Need</label>
        <select id="inquiry-need" name="need" value={fields.need} disabled={loading} onChange={event => change('need', event.target.value)}
          aria-invalid={!!errors.need} aria-describedby={errors.need ? 'inquiry-need-error' : undefined}>
          {Object.entries(inquiryNeeds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>{fieldError('need')}
      </div>
      <div className="contact-field"><label htmlFor="inquiry-message">Message</label>
        <textarea id="inquiry-message" name="message" required maxLength={inquiryLimits.message} value={fields.message} disabled={loading}
          placeholder="Products, quantities, artwork, timing, and delivery location"
          aria-invalid={!!errors.message} aria-describedby={errors.message ? 'inquiry-message-error' : undefined}
          onChange={event => change('message', event.target.value)} />{fieldError('message')}
      </div>
      <div className="contact-honeypot" aria-hidden="true"><label>Website
        <input name="website" autoComplete="off" tabIndex={-1} value={fields.website} onChange={event => change('website', event.target.value)} />
      </label></div>
      {error && <p className="contact-submit-error" role="alert">{error} You can also call (833) 853-1243 or email orders@nexgenpac.com.</p>}
      <button className="primary-button full-width" type="submit" disabled={loading}><Mail size={18} aria-hidden="true" />{loading ? 'Sending…' : 'Send inquiry'}</button>
    </form>}
  </section>
}

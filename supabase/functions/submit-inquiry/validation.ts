export const inquiryNeeds = {
  standard: 'Standard product quote request',
  sample: 'Product sample request',
  custom: 'Custom printed packaging',
  reorder: 'Reorder or account support',
  sustainability: 'Sustainable material program',
  account_correction: 'Account correction',
} as const

export const inquiryLimits = { name: 100, email: 254, phone: 40, company: 150, message: 5000 } as const
export type InquiryFields = { name: string; email: string; phone: string; company: string; need: string; message: string; website: string }
export type InquiryErrors = Partial<Record<keyof InquiryFields, string>>
export type Inquiry = Omit<InquiryFields, 'website'> & { need: keyof typeof inquiryNeeds }
type Validation = { kind: 'spam' } | { kind: 'invalid'; errors: InquiryErrors } | { kind: 'valid'; data: Inquiry }

export function validateInquiry(value: unknown): Validation {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  if (typeof raw.website === 'string' && raw.website.length > 0) return { kind: 'spam' }
  const errors: InquiryErrors = {}
  const fields = {} as Omit<Inquiry, 'need'>
  for (const field of Object.keys(inquiryLimits) as (keyof typeof inquiryLimits)[]) {
    const text = typeof raw[field] === 'string' ? raw[field].trim() : ''
    fields[field] = text
    if (raw[field] !== undefined && typeof raw[field] !== 'string') errors[field] = 'Enter a text value.'
    else if (!text && field !== 'phone') errors[field] = `Enter your ${field === 'message' ? 'message' : field}.`
    else if (text.length > inquiryLimits[field]) errors[field] = `Use ${inquiryLimits[field]} characters or fewer.`
    else if (field !== 'message' && [...text].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) errors[field] = 'Use a single line of text.'
    else if (field === 'message' && text.includes(String.fromCharCode(0))) errors[field] = 'Remove unsupported characters.'
  }
  if (!errors.email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fields.email)) errors.email = 'Enter a valid email address.'
  if (typeof raw.need !== 'string' || !Object.hasOwn(inquiryNeeds, raw.need)) errors.need = 'Choose a valid need.'
  if (raw.website !== undefined && typeof raw.website !== 'string') errors.website = 'Invalid form submission.'
  if (Object.keys(errors).length) return { kind: 'invalid', errors }
  return { kind: 'valid', data: { ...fields, need: raw.need as Inquiry['need'] } }
}

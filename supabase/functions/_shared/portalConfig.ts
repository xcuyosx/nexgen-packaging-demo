// Shared by the website and transactional email worker.
// TODO(bradley): approve Terms before enabling portal acceptance (D-1).
// TODO(bradley): finish sender-domain verification before enabling mail (D-9).
// D-4 was confirmed by Bradley in this chat: "Within 1 business day".
export const portalDefaults = {
  responsePromise: 'We follow up within 1 business day with pricing or any questions.',
  contactEmail: 'orders@nexgenpac.com',
  contactPhone: '(833) 853-1243',
  acceptEnabled: false,
  emailEnabled: false,
  quoteValidityDays: 30,
} as const

import type { CustomerAccount } from './customerAccount'
import type { QuoteContact } from './storefrontCart'

export const emptyQuoteContact: QuoteContact = { name: '', company: '', email: '', purchaseOrder: '', billingProfileId: '', receivingLocationId: '', postalCode: '', notes: '' }

export function selectedPreferenceId(items: { id: string; isDefault?: boolean }[], selected: string) {
  if (items.some(item => item.id === selected)) return selected
  const defaults = items.filter(item => item.isDefault === true)
  return defaults.length === 1 ? defaults[0].id : items.length === 1 ? items[0].id : ''
}

export function resolveQuoteContact(account: CustomerAccount, draft: Partial<QuoteContact>): QuoteContact {
  return { ...emptyQuoteContact, ...draft,
    name: draft.name ?? account.contactName, email: draft.email ?? account.email,
    company: account.companyName,
    billingProfileId: selectedPreferenceId(account.billingProfiles, draft.billingProfileId || ''),
    receivingLocationId: selectedPreferenceId(account.receivingLocations, draft.receivingLocationId || ''),
  }
}

export function quoteDeliveryError(account: CustomerAccount, contact: QuoteContact) {
  if (account.billingProfiles.length && !account.billingProfiles.some(item => item.id === contact.billingProfileId)) return 'Select a billing profile.'
  if (account.receivingLocations.length && !account.receivingLocations.some(item => item.id === contact.receivingLocationId)) return 'Select a delivery location.'
  if (!account.receivingLocations.length && !contact.postalCode.trim()) return 'Enter the delivery ZIP or postal code.'
  return ''
}

export function customerStatus(value: string) {
  return ({ 'Preparing your quote': 'In review', 'Quote sent': 'Quote ready', 'Customer Accepted': 'Accepted', Approved: 'Accepted', Sent: 'Quote ready', Drafting: 'In review', 'Needs Pricing': 'In review' } as Record<string,string>)[value] || value || 'Submitted'
}

import type { CustomerAccount } from './customerAccount'

/** Only customer-maintained fields cross this boundary. Identity is CRM-owned. */
export function customerPreferencePatch(next: CustomerAccount, original: CustomerAccount) {
  const patch: { billing_profiles?: CustomerAccount['billingProfiles']; receiving_locations?: CustomerAccount['receivingLocations'] } = {}
  if (JSON.stringify(next.billingProfiles) !== JSON.stringify(original.billingProfiles)) patch.billing_profiles = next.billingProfiles
  if (JSON.stringify(next.receivingLocations) !== JSON.stringify(original.receivingLocations)) patch.receiving_locations = next.receivingLocations
  return patch
}

export async function saveCustomerPreferences(
  config: { url: string; key: string; token: string },
  next: CustomerAccount, original: CustomerAccount, expectedRevision: number,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${config.url}/rest/v1/rpc/save_customer_account_preferences`, {
    method: 'POST',
    headers: { apikey: config.key, Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_expected_revision: original.syncRevision ?? expectedRevision, p_patch: customerPreferencePatch(next, original) }),
  })
  const rows: unknown = await response.json().catch(() => null)
  if (response.status === 401) throw new Error('Your customer session has expired. Please sign in again.')
  if (response.status === 409) throw new Error('Your account changed in another session. Reload the latest details before saving. Your edits have not been applied.')
  if (!response.ok) throw new Error('Unable to save your account preferences. Please try again or contact NexGen.')
  if (!Array.isArray(rows) || !rows[0] || typeof rows[0] !== 'object') throw new Error('The server did not confirm the saved account. Reload before trying again.')
  return rows[0] as Record<string, unknown>
}

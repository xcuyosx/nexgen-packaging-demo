import test from 'node:test'
import assert from 'node:assert/strict'
import { customerPreferencePatch, saveCustomerPreferences } from '../src/customerAccountPreferences.ts'
const original = { syncRevision: 4, companyName: 'CRM company', contactName: 'CRM contact', email: 'login@example.test', phone: '555-0100', billingProfiles: [], receivingLocations: [], paymentMethods: [] }
test('identity, login, and payment summaries never enter a customer preference patch', () => {
  assert.deepEqual(customerPreferencePatch({ ...original, companyName: 'Stale company', contactName: 'Stale contact', phone: 'different', email: 'changed@example.test', paymentMethods: [{ id: 'fake' }] }, original), {})
})
test('delivery-only changes do not replace billing preferences', () => {
  const locations = [{ id: 'dock-1', label: 'Receiving' }]
  assert.deepEqual(customerPreferencePatch({ ...original, receivingLocations: locations }, original), { receiving_locations: locations })
})
test('save pins the draft revision instead of a newer background revision', async t => {
  let body
  t.mock.method(globalThis, 'fetch', async (url, options) => { assert.match(url, /rpc\/save_customer_account_preferences$/); body=JSON.parse(options.body); return Response.json([{ revision: 5 }]) })
  await saveCustomerPreferences({ url: 'https://example.invalid', key: 'test', token: 'test' }, { ...original, billingProfiles: [{ id: 'billing' }] }, original, 99)
  assert.equal(body.p_expected_revision,4)
  assert.deepEqual(Object.keys(body.p_patch),['billing_profiles'])
})
test('conflicts and unconfirmed responses cannot report a successful save', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ message:'conflict' }, { status:409 }))
  await assert.rejects(saveCustomerPreferences({url:'https://example.invalid',key:'x',token:'x'},original,original,4), /changed in another session/)
  globalThis.fetch.mock.mockImplementation(async () => Response.json([]))
  await assert.rejects(saveCustomerPreferences({url:'https://example.invalid',key:'x',token:'x'},original,original,4), /did not confirm/)
})

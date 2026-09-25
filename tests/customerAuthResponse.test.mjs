import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyCustomerSignupResponse, parseCustomerPasswordRecoveryUrl } from '../src/customerAuthResponse.ts'

test('signup distinguishes a confirmed existing address from a new unconfirmed address', () => {
  assert.equal(classifyCustomerSignupResponse({ user: { identities: [] } }, true), 'existing-account')
  assert.equal(classifyCustomerSignupResponse({ identities: [] }, true), 'existing-account')
  assert.equal(classifyCustomerSignupResponse({ code: 'user_already_exists' }, false), 'existing-account')
  assert.equal(classifyCustomerSignupResponse({ user: { identities: [{ provider: 'email' }] } }, true), 'confirmation-required')
  assert.equal(classifyCustomerSignupResponse({ user: { id: 'pending' } }, true), 'confirmation-required')
  assert.equal(classifyCustomerSignupResponse({ access_token: 'token' }, true), 'signed-in')
})

test('recovery links accept valid tokens and reject expired or unrelated callbacks', () => {
  assert.deepEqual(
    parseCustomerPasswordRecoveryUrl('https://storefront.example/account?auth=recovery#access_token=abc&type=recovery'),
    { token: 'abc', error: '' },
  )
  assert.match(
    parseCustomerPasswordRecoveryUrl('https://storefront.example/account?auth=recovery#error_code=otp_expired')?.error || '',
    /expired or is invalid/,
  )
  assert.equal(parseCustomerPasswordRecoveryUrl('https://storefront.example/account#type=signup&access_token=abc'), null)
})

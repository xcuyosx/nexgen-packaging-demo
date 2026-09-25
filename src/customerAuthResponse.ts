export type CustomerPasswordRecoveryLink = { token: string; error: string }

export function isExistingAccountAuthError(value: unknown) {
  if (!value || typeof value !== 'object') return false
  const body = value as Record<string, unknown>
  const code = String(body.code || body.error_code || '')
  const message = String(body.msg || body.message || body.error_description || '')
  return /^(user_already_exists|email_exists)$/i.test(code) || /already registered|already exists/i.test(message)
}

export function classifyCustomerSignupResponse(body: unknown, responseOk: boolean) {
  if (isExistingAccountAuthError(body)) return 'existing-account'
  if (!responseOk) return 'error'
  if (!body || typeof body !== 'object') return 'confirmation-required'

  const result = body as Record<string, unknown>
  if (typeof result.access_token === 'string' && result.access_token) return 'signed-in'

  const user = result.user && typeof result.user === 'object' ? result.user as Record<string, unknown> : result
  // Confirmed existing emails may receive an obfuscated Supabase user with no identities.
  if (Array.isArray(user.identities) && user.identities.length === 0) return 'existing-account'
  return 'confirmation-required'
}

export function parseCustomerPasswordRecoveryUrl(urlString: string): CustomerPasswordRecoveryLink | null {
  const url = new URL(urlString)
  const fragment = new URLSearchParams(url.hash.slice(1))
  if (url.searchParams.get('auth') !== 'recovery' && fragment.get('type') !== 'recovery') return null

  if (fragment.get('error') || fragment.get('error_code')) {
    return { token: '', error: 'This password reset link has expired or is invalid. Request a new link.' }
  }
  const token = fragment.get('access_token') || ''
  return token
    ? { token, error: '' }
    : { token: '', error: 'This password reset link is invalid. Request a new link.' }
}

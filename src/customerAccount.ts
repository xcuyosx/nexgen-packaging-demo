import { classifyCustomerSignupResponse, isExistingAccountAuthError, parseCustomerPasswordRecoveryUrl } from './customerAuthResponse'

export type BillingPreference = 'Credit card' | 'Invoice / net terms' | 'Purchase order'

export type BillingProfile = {
  id: string
  label: string
  legalName: string
  billingEmail: string
  preference: BillingPreference
}

export type ReceivingLocation = {
  id: string
  label: string
  address: string
  city: string
  state: string
  postalCode: string
  contact: string
  phone: string
  receivingHours: string
  instructions: string
}

export type PaymentMethodSummary = {
  id: string
  brand: string
  lastFour: string
  expires: string
}

export type CustomerAccount = {
  companyName: string
  contactName: string
  email: string
  phone: string
  billingProfiles: BillingProfile[]
  receivingLocations: ReceivingLocation[]
  paymentMethods: PaymentMethodSummary[]
}

export type CustomerOrderLine = {
  productId: string
  productName: string
  sku: string
  cases: number
  size: string
  customPrint: boolean
  lineTotal: number | null
}

export type CustomerOrder = {
  id: string
  createdAt: string
  company: string
  status: 'Pending confirmation' | 'Confirmed' | 'In production' | 'Shipped'
  subtotal: number
  billingProfile?: string
  receivingLocation?: string
  items: CustomerOrderLine[]
}

export type CustomerAccountSyncRecord = {
  accountId: string
  crmCustomerId: string
  revision: number
  updatedAt: string
  updatedBy: string
  account: CustomerAccount
  orders: CustomerOrder[]
}

export type CustomerSession = {
  token: string
  refreshToken: string
  userId: string
  accountId: string
  expiresAt: string
  provider: 'supabase' | 'bridge'
}

export type CustomerLoginResult = CustomerSession & {
  record: CustomerAccountSyncRecord
}

export type CustomerRegistrationResult =
  | { status: 'existing-account' | 'confirmation-required'; login: null }
  | { status: 'signed-in'; login: CustomerLoginResult }

export type CustomerQuoteRequestLine = {
  productId: string
  sku: string
  productName: string
  category: string
  material: string
  dimensions: string
  casePack: string
  cases: number
  size: string
  printColors: number
  inkColors: string[]
  artworkName: string
  artworkPosition?: {
    size: number
    x: number
    y: number
    rotate: number
  }
}

export type CustomerQuoteRequestInput = {
  contact: Record<string, string>
  billing: Record<string, unknown>
  shipping: Record<string, unknown>
  purchaseOrder: string
  notes: string
  lines: CustomerQuoteRequestLine[]
}

const accountStorageKey = 'nexgen-customer-account-v1'
const orderStorageKey = 'nexgen-customer-orders-v1'
const sessionStorageKey = 'nexgen-customer-session-v1'
const accountSyncUrl = String(
  import.meta.env.VITE_CUSTOMER_ACCOUNT_SYNC_URL || (import.meta.env.DEV ? 'http://127.0.0.1:3003' : ''),
).replace(/\/$/, '')
const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '')
const useSupabaseCustomerAccounts = Boolean(supabaseUrl && supabaseAnonKey)

export const demoCustomerAccountId = 'summit-stadium-group'

export const emptyCustomerAccount: CustomerAccount = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  billingProfiles: [],
  receivingLocations: [],
  paymentMethods: [],
}

export const demoCustomerAccount: CustomerAccount = {
  companyName: 'Summit Stadium Group',
  contactName: 'Jordan Reyes',
  email: 'jordan@summitstadiumgroup.example',
  phone: '(312) 555-1000',
  billingProfiles: [
    {
      id: 'BILL-SUMMIT-CORP',
      label: 'Corporate AP',
      legalName: 'Summit Stadium Group LLC',
      billingEmail: 'ap@summitstadiumgroup.example',
      preference: 'Invoice / net terms',
    },
    {
      id: 'BILL-SUMMIT-GAMEDAY',
      label: 'Game-day purchasing',
      legalName: 'Summit Stadium Group LLC',
      billingEmail: 'purchasing@summitstadiumgroup.example',
      preference: 'Purchase order',
    },
  ],
  receivingLocations: [
    {
      id: 'SHIP-SUMMIT-STADIUM',
      label: 'Chicago stadium receiving',
      address: '1410 Special Olympics Drive',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60605',
      contact: 'Marcus Lee',
      phone: '(312) 555-1044',
      receivingHours: 'Mon–Fri, 7:00 AM–2:00 PM',
      instructions: 'Use south receiving gate. Delivery appointment required for full pallets.',
    },
    {
      id: 'SHIP-SUMMIT-COMMISSARY',
      label: 'West Loop commissary',
      address: '2200 W Fulton Street',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60612',
      contact: 'Alicia Grant',
      phone: '(312) 555-1078',
      receivingHours: 'Mon–Sat, 6:00 AM–12:00 PM',
      instructions: 'Check in at dock 3. Liftgate is not required.',
    },
  ],
  paymentMethods: [
    {
      id: 'PAY-SUMMIT-4108',
      brand: 'Corporate purchasing account',
      lastFour: '4108',
      expires: '11/28',
    },
  ],
}

export const demoCustomerOrders: CustomerOrder[] = [
  {
    id: 'SO-2026-001-04',
    createdAt: '2026-08-28T15:30:00.000Z',
    company: 'Summit Stadium Group',
    status: 'In production',
    subtotal: 74400,
    billingProfile: 'Corporate AP',
    receivingLocation: 'Chicago stadium receiving',
    items: [
      { productId: '40000000-0000-4000-8000-000000000002', productName: '20 oz stadium cup', sku: 'CUP20-CAT-02', cases: 400, size: '20 oz', customPrint: true, lineTotal: 58000 },
      { productId: '40000000-0000-4000-8000-000000000003', productName: 'Flat clear cup lid', sku: 'LID16-CAT-03', cases: 400, size: 'Fits 16-20 oz cup', customPrint: false, lineTotal: 16400 },
    ],
  },
  {
    id: 'SO-2026-001-03',
    createdAt: '2026-07-08T14:10:00.000Z',
    company: 'Summit Stadium Group',
    status: 'Shipped',
    subtotal: 28050,
    billingProfile: 'Game-day purchasing',
    receivingLocation: 'West Loop commissary',
    items: [
      { productId: '40000000-0000-4000-8000-000000000005', productName: '32 oz food container', sku: 'CONT32-CAT-05', cases: 150, size: '32 oz', customPrint: false, lineTotal: 19125 },
      { productId: '40000000-0000-4000-8000-000000000007', productName: '3-compartment fiber tray', sku: 'TRAY3C-CAT-07', cases: 100, size: '9 x 9 x 2 in', customPrint: false, lineTotal: 8850 },
      { productId: '40000000-0000-4000-8000-000000000016', productName: 'Branded tamper seal sticker', sku: 'SEAL3-CAT-16', cases: 5, size: '3 in round', customPrint: true, lineTotal: 75 },
    ],
  },
]

export function loadCustomerAccount(): CustomerAccount {
  try {
    const stored = window.sessionStorage.getItem(accountStorageKey)
    if (!stored) return emptyCustomerAccount
    const parsed = JSON.parse(stored) as Partial<CustomerAccount>
    return {
      ...emptyCustomerAccount,
      ...parsed,
      billingProfiles: Array.isArray(parsed.billingProfiles) ? parsed.billingProfiles : [],
      receivingLocations: Array.isArray(parsed.receivingLocations) ? parsed.receivingLocations : [],
      paymentMethods: Array.isArray(parsed.paymentMethods) ? parsed.paymentMethods : [],
    }
  } catch {
    return emptyCustomerAccount
  }
}

export function saveCustomerAccount(account: CustomerAccount) {
  try {
    window.sessionStorage.setItem(accountStorageKey, JSON.stringify(account))
  } catch {
    // The account remains usable for the current session when browser storage is unavailable.
  }
}

export function loadCustomerOrders(): CustomerOrder[] {
  try {
    const stored = window.sessionStorage.getItem(orderStorageKey)
    if (!stored) return []
    const parsed = JSON.parse(stored) as CustomerOrder[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCustomerOrders(orders: CustomerOrder[]) {
  try {
    window.sessionStorage.setItem(orderStorageKey, JSON.stringify(orders))
  } catch {
    // Order history remains usable for the current session when browser storage is unavailable.
  }
}

export function loadCustomerSession(): CustomerSession | null {
  try {
    const stored = window.sessionStorage.getItem(sessionStorageKey)
    if (!stored) return null
    const session = JSON.parse(stored) as Partial<CustomerSession>
    const incompatibleProvider = useSupabaseCustomerAccounts && session.provider !== 'supabase'
    const canRefresh = session.provider === 'supabase' && Boolean(session.refreshToken)
    const expiredWithoutRefresh = Date.parse(String(session.expiresAt || '')) <= Date.now() && !canRefresh
    if (incompatibleProvider || !session.token || !session.accountId || !session.expiresAt || expiredWithoutRefresh) {
      window.sessionStorage.removeItem(sessionStorageKey)
      return null
    }
    return {
      token: session.token,
      refreshToken: String(session.refreshToken || ''),
      userId: String(session.userId || session.accountId),
      accountId: session.accountId,
      expiresAt: session.expiresAt,
      provider: session.provider === 'supabase' ? 'supabase' : 'bridge',
    }
  } catch {
    return null
  }
}

export function saveCustomerSession(session: CustomerSession) {
  try {
    window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(session))
  } catch {
    // The user can still use the account until this page is refreshed.
  }
}

export function clearCustomerSession() {
  try {
    window.sessionStorage.removeItem(sessionStorageKey)
    window.sessionStorage.removeItem(accountStorageKey)
    window.sessionStorage.removeItem(orderStorageKey)
  } catch {
    // In-memory state is cleared even when browser storage is unavailable.
  }
}

export function createCustomerRecordId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export async function loginCustomerAccount(email: string, password: string): Promise<CustomerLoginResult> {
  if (useSupabaseCustomerAccounts) {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })
    const body = await readJson(response)
    if (!response.ok) throw new Error(authErrorMessage(body, 'Unable to sign in. Check your email and password.'))
    const session = sessionFromSupabase(body)
    const record = await fetchCustomerAccountSync(session.token)
    return { ...session, accountId: record.accountId, record }
  }

  if (!accountSyncUrl) throw new Error('Customer sign-in is not configured.')
  const response = await fetch(`${accountSyncUrl}/api/customer-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body?.error || 'Sign-in failed.')
  return {
    token: String(body.token || ''),
    refreshToken: '',
    userId: String(body.accountId || ''),
    accountId: String(body.accountId || ''),
    expiresAt: String(body.expiresAt || ''),
    provider: 'bridge',
    record: normalizeSyncRecord(body.record),
  }
}

export async function registerCustomerAccount(
  contactName: string,
  companyName: string,
  email: string,
  password: string,
): Promise<CustomerRegistrationResult> {
  if (!useSupabaseCustomerAccounts) throw new Error('Customer registration is not configured yet.')

  const redirectUrl = `${window.location.origin}/account`
  const response = await fetch(`${supabaseUrl}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectUrl)}`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      password,
      data: {
        contact_name: contactName.trim(),
        company_name: companyName.trim(),
      },
    }),
  })
  const body = await readJson(response)
  const responseKind = classifyCustomerSignupResponse(body, response.ok)
  if (responseKind === 'existing-account') return { status: 'existing-account', login: null }
  if (responseKind === 'error') throw new Error(authErrorMessage(body, 'Unable to create your account.'))
  if (responseKind === 'confirmation-required') return { status: 'confirmation-required', login: null }

  const session = sessionFromSupabase(body)
  const record = await fetchCustomerAccountWithRetry(session.token)
  return { status: 'signed-in', login: { ...session, accountId: record.accountId, record } }
}

export async function requestCustomerPasswordReset(email: string): Promise<void> {
  if (!useSupabaseCustomerAccounts) throw new Error('Password reset is not configured yet.')
  const redirectUrl = `${window.location.origin}/account?auth=recovery`
  const response = await fetch(`${supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectUrl)}`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim() }),
  })
  const body = await readJson(response)
  if (!response.ok) throw new Error(authErrorMessage(body, 'Unable to request a password reset.'))
}

export async function updateCustomerPassword(token: string, password: string): Promise<void> {
  if (!useSupabaseCustomerAccounts) throw new Error('Password reset is not configured yet.')
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const body = await readJson(response)
  if (!response.ok) throw new Error(authErrorMessage(body, 'Unable to update your password. Request a new reset link and try again.'))
}

export function readCustomerPasswordRecoveryLink() {
  return parseCustomerPasswordRecoveryUrl(window.location.href)
}

export async function refreshCustomerSession(session: CustomerSession): Promise<CustomerSession> {
  if (session.provider !== 'supabase' || !session.refreshToken) return session
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  })
  const body = await readJson(response)
  if (!response.ok) throw new Error(authErrorMessage(body, 'Your customer session has expired. Please sign in again.'))
  return { ...sessionFromSupabase(body), accountId: session.accountId }
}

export async function logoutCustomerAccount(token: string): Promise<void> {
  if (useSupabaseCustomerAccounts && token) {
    await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
    })
    return
  }
  if (!accountSyncUrl || !token) return
  await fetch(`${accountSyncUrl}/api/customer-auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function fetchCustomerAccountSync(token: string, signal?: AbortSignal): Promise<CustomerAccountSyncRecord> {
  if (useSupabaseCustomerAccounts) {
    const userId = userIdFromAccessToken(token)
    const [accountResponse, orderResponse] = await Promise.all([
      supabaseRequest(`customer_accounts?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`, token, { signal }),
      supabaseRequest(`customer_orders?user_id=eq.${encodeURIComponent(userId)}&select=*&order=order_date.desc`, token, { signal }),
    ])
    const accountRows = await readJson(accountResponse)
    const orderRows = await readJson(orderResponse)
    if (accountResponse.status === 401 || orderResponse.status === 401) throw new Error('Your customer session has expired. Please sign in again.')
    if (!accountResponse.ok) throw new Error(apiErrorMessage(accountRows, 'Unable to load your customer account.'))
    if (!orderResponse.ok) throw new Error(apiErrorMessage(orderRows, 'Unable to load your order history.'))
    if (!Array.isArray(accountRows) || !accountRows[0]) {
      throw new Error('This sign-in is not linked to a customer account. Use a separate email for a customer account or contact NexGen support.')
    }
    return normalizeSupabaseAccountRecord(accountRows[0], Array.isArray(orderRows) ? orderRows : [])
  }

  if (!accountSyncUrl) throw new Error('Customer account sync is not configured.')
  const response = await fetch(`${accountSyncUrl}/api/customer-account`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
    cache: 'no-store',
  })
  if (response.status === 401) throw new Error('Your customer session has expired. Please sign in again.')
  if (!response.ok) throw new Error(`Customer account sync failed with status ${response.status}.`)
  return normalizeSyncRecord(await response.json())
}

export async function saveCustomerAccountSync(
  account: CustomerAccount,
  orders: CustomerOrder[],
  expectedRevision: number,
  token: string,
): Promise<CustomerAccountSyncRecord> {
  if (useSupabaseCustomerAccounts) {
    const userId = userIdFromAccessToken(token)
    const response = await supabaseRequest(
      `customer_accounts?user_id=eq.${encodeURIComponent(userId)}&revision=eq.${expectedRevision}`,
      token,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          company_name: account.companyName,
          contact_name: account.contactName,
          phone: account.phone,
          billing_profiles: account.billingProfiles,
          receiving_locations: account.receivingLocations,
        }),
      },
    )
    const rows = await readJson(response)
    if (response.status === 401) throw new Error('Your customer session has expired. Please sign in again.')
    if (!response.ok) throw new Error(apiErrorMessage(rows, 'Unable to save your customer account.'))
    if (!Array.isArray(rows) || !rows[0]) throw new Error('This account changed in another session. Refresh and try again.')
    return normalizeSupabaseAccountRecord(rows[0], orders.map(customerOrderToSupabaseShape))
  }

  if (!accountSyncUrl) throw new Error('Customer account sync is not configured.')
  const response = await fetch(`${accountSyncUrl}/api/customer-account`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, orders, expectedRevision, updatedBy: 'Customer portal' }),
  })
  const body = await response.json()
  if (response.status === 401) throw new Error('Your customer session has expired. Please sign in again.')
  if (response.status === 409) throw new Error('This account changed in another session. Refresh and try again.')
  if (!response.ok) throw new Error(body?.error || `Customer account sync failed with status ${response.status}.`)
  return normalizeSyncRecord(body)
}

export async function submitCustomerQuoteRequest(
  token: string,
  request: CustomerQuoteRequestInput,
): Promise<{ requestNumber: string }> {
  if (!useSupabaseCustomerAccounts) throw new Error('Online quote requests are not configured yet.')
  const userId = userIdFromAccessToken(token)
  const accountResponse = await supabaseRequest(
    `customer_accounts?user_id=eq.${encodeURIComponent(userId)}&select=lead_id&limit=1`,
    token,
  )
  const accounts = await readJson(accountResponse)
  if (accountResponse.status === 401) throw new Error('Your customer session has expired. Please sign in again.')
  if (!accountResponse.ok) throw new Error(apiErrorMessage(accounts, 'Unable to identify your customer account.'))
  if (!Array.isArray(accounts) || !accounts[0]?.lead_id) throw new Error('This account is not linked to a NexGen customer record.')

  const requestNumber = `WEB-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
  const response = await supabaseRequest('customer_quote_requests', token, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: userId,
      lead_id: String(accounts[0].lead_id),
      request_number: requestNumber,
      contact_snapshot: request.contact,
      billing_snapshot: request.billing,
      shipping_snapshot: request.shipping,
      purchase_order: request.purchaseOrder,
      notes: request.notes,
      lines: request.lines,
    }),
  })
  const body = await readJson(response)
  if (response.status === 401) throw new Error('Your customer session has expired. Please sign in again.')
  if (!response.ok) throw new Error(apiErrorMessage(body, 'Unable to submit your quote request.'))
  return { requestNumber }
}

async function fetchCustomerAccountWithRetry(token: string) {
  let lastError: unknown
  for (const delay of [0, 180, 420, 800]) {
    if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay))
    try {
      return await fetchCustomerAccountSync(token)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unable to finish creating your customer account.')
}

function sessionFromSupabase(value: unknown): CustomerSession {
  if (!value || typeof value !== 'object') throw new Error('The sign-in service returned an invalid session.')
  const session = value as Record<string, unknown>
  const user = session.user && typeof session.user === 'object' ? session.user as Record<string, unknown> : {}
  const token = String(session.access_token || '')
  const userId = String(user.id || userIdFromAccessToken(token))
  const expiresAtSeconds = Number(session.expires_at || 0)
  const expiresInSeconds = Number(session.expires_in || 3600)
  if (!token || !userId) throw new Error('The sign-in service returned an incomplete session.')
  return {
    token,
    refreshToken: String(session.refresh_token || ''),
    userId,
    accountId: userId,
    expiresAt: new Date(expiresAtSeconds > 0 ? expiresAtSeconds * 1000 : Date.now() + expiresInSeconds * 1000).toISOString(),
    provider: 'supabase',
  }
}

function userIdFromAccessToken(token: string) {
  try {
    const payload = token.split('.')[1]
    if (!payload) throw new Error()
    const normalized = payload.replaceAll('-', '+').replaceAll('_', '/')
    const decoded = JSON.parse(window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))) as { sub?: string }
    if (!decoded.sub) throw new Error()
    return decoded.sub
  } catch {
    throw new Error('Your customer session is invalid. Please sign in again.')
  }
}

function supabaseRequest(path: string, token: string, options: RequestInit = {}) {
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function authErrorMessage(value: unknown, fallback: string) {
  if (!value || typeof value !== 'object') return fallback
  const body = value as Record<string, unknown>
  const code = String(body.code || body.error_code || '')
  const message = String(body.msg || body.message || body.error_description || '')
  if (isExistingAccountAuthError(body)) return 'An account already exists for this email. Sign in or reset your password.'
  if (/^(email_address_not_authorized|email_provider_disabled)$/i.test(code) || /email address not authorized/i.test(message)) {
    return 'We could not send an account email to this address. Please contact NexGen support.'
  }
  if (/over_email_send_rate_limit/i.test(code)) return 'Too many email requests. Wait a little and try again.'
  if (/email not confirmed/i.test(message)) return 'Confirm your email using the message we sent, then sign in.'
  if (/invalid login/i.test(message)) return 'That email and password do not match.'
  return message || fallback
}

function apiErrorMessage(value: unknown, fallback: string) {
  if (!value || typeof value !== 'object') return fallback
  const body = value as Record<string, unknown>
  return String(body.message || body.error_description || fallback)
}

function normalizeSupabaseAccountRecord(accountValue: unknown, orderValues: unknown[]): CustomerAccountSyncRecord {
  if (!accountValue || typeof accountValue !== 'object') throw new Error('Customer account data is invalid.')
  const row = accountValue as Record<string, unknown>
  return {
    accountId: String(row.id || ''),
    crmCustomerId: String(row.lead_id || ''),
    revision: Math.max(1, Number(row.revision || 1)),
    updatedAt: String(row.updated_at || ''),
    updatedBy: 'Shared customer database',
    account: {
      companyName: String(row.company_name || ''),
      contactName: String(row.contact_name || ''),
      email: String(row.email || ''),
      phone: String(row.phone || ''),
      billingProfiles: Array.isArray(row.billing_profiles) ? row.billing_profiles as BillingProfile[] : [],
      receivingLocations: Array.isArray(row.receiving_locations) ? row.receiving_locations as ReceivingLocation[] : [],
      paymentMethods: Array.isArray(row.payment_methods) ? row.payment_methods as PaymentMethodSummary[] : [],
    },
    orders: orderValues.map(customerOrderFromSupabase).filter((order): order is CustomerOrder => Boolean(order)),
  }
}

function customerOrderFromSupabase(value: unknown): CustomerOrder | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  return {
    id: String(row.order_number || row.id || ''),
    createdAt: String(row.order_date || row.created_at || ''),
    company: String(row.company || ''),
    status: normalizeOrderStatus(row.status),
    subtotal: Number(row.subtotal || 0),
    billingProfile: String(row.billing_profile || ''),
    receivingLocation: String(row.receiving_location || ''),
    items: Array.isArray(row.items) ? row.items as CustomerOrderLine[] : [],
  }
}

function customerOrderToSupabaseShape(order: CustomerOrder) {
  return {
    order_number: order.id,
    order_date: order.createdAt,
    company: order.company,
    status: order.status,
    subtotal: order.subtotal,
    billing_profile: order.billingProfile || '',
    receiving_location: order.receivingLocation || '',
    items: order.items,
  }
}

function normalizeOrderStatus(value: unknown): CustomerOrder['status'] {
  const status = String(value || '')
  return ['Pending confirmation', 'Confirmed', 'In production', 'Shipped'].includes(status)
    ? status as CustomerOrder['status']
    : 'Pending confirmation'
}

function normalizeSyncRecord(value: unknown): CustomerAccountSyncRecord {
  if (!value || typeof value !== 'object') throw new Error('Customer account sync returned an invalid record.')
  const record = value as Partial<CustomerAccountSyncRecord>
  const account = record.account && typeof record.account === 'object' ? record.account : demoCustomerAccount
  return {
    accountId: String(record.accountId || demoCustomerAccountId),
    crmCustomerId: String(record.crmCustomerId || ''),
    revision: Math.max(1, Number(record.revision || 1)),
    updatedAt: String(record.updatedAt || ''),
    updatedBy: String(record.updatedBy || ''),
    account: {
      ...emptyCustomerAccount,
      ...account,
      billingProfiles: Array.isArray(account.billingProfiles) ? account.billingProfiles : [],
      receivingLocations: Array.isArray(account.receivingLocations) ? account.receivingLocations : [],
      paymentMethods: Array.isArray(account.paymentMethods) ? account.paymentMethods : [],
    },
    orders: Array.isArray(record.orders) ? record.orders : [],
  }
}

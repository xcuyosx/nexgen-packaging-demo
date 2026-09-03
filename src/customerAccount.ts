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
  accountId: string
  expiresAt: string
}

export type CustomerLoginResult = CustomerSession & {
  record: CustomerAccountSyncRecord
}

const accountStorageKey = 'nexgen-customer-account-v1'
const orderStorageKey = 'nexgen-customer-orders-v1'
const sessionStorageKey = 'nexgen-customer-session-v1'
const accountSyncUrl = String(
  import.meta.env.VITE_CUSTOMER_ACCOUNT_SYNC_URL || (import.meta.env.DEV ? 'http://127.0.0.1:3003' : ''),
).replace(/\/$/, '')

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
    if (!session.token || !session.accountId || !session.expiresAt || Date.parse(session.expiresAt) <= Date.now()) {
      window.sessionStorage.removeItem(sessionStorageKey)
      return null
    }
    return { token: session.token, accountId: session.accountId, expiresAt: session.expiresAt }
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
    accountId: String(body.accountId || ''),
    expiresAt: String(body.expiresAt || ''),
    record: normalizeSyncRecord(body.record),
  }
}

export async function logoutCustomerAccount(token: string): Promise<void> {
  if (!accountSyncUrl || !token) return
  await fetch(`${accountSyncUrl}/api/customer-auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function fetchCustomerAccountSync(token: string, signal?: AbortSignal): Promise<CustomerAccountSyncRecord> {
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

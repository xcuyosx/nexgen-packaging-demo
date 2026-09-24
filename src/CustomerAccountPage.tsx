import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LogOut,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  ReceiptText,
  ShieldCheck,
  Trash2,
  Truck,
  UserRound,
} from 'lucide-react'
import type {
  BillingPreference,
  CustomerAccount,
  CustomerOrder,
  CustomerOrderLine,
  CustomerQuoteHistoryEntry,
} from './customerAccount'
import { createCustomerRecordId } from './customerAccount'

type AccountView = 'overview' | 'profile' | 'quotes' | 'orders' | 'billing' | 'locations'

type CustomerAccountPageProps = {
  account: CustomerAccount
  orders: CustomerOrder[]
  quoteRequests: CustomerQuoteHistoryEntry[]
  quoteRequestsStatus: 'loading' | 'ready' | 'error'
  quoteRequestsError: string
  onRefreshQuoteRequests: () => void
  onSave: (account: CustomerAccount) => void | Promise<void>
  onSignOut: () => void | Promise<void>
  syncStatus: 'loading' | 'connected' | 'saving' | 'saved' | 'offline'
  lastSyncedAt: string
}

type AccountMenuRowProps = {
  icon: ReactNode
  title: string
  description: string
  onClick: () => void
}

type AccountDetailHeaderProps = {
  title: string
  description: string
  onBack: () => void
  action?: ReactNode
}

const emptyBillingProfile = {
  label: '',
  legalName: '',
  billingEmail: '',
  preference: 'Invoice / net terms' as BillingPreference,
}

const emptyLocation = {
  label: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  contact: '',
  phone: '',
  receivingHours: '',
  instructions: '',
}

function accountViewFromSearch(search: string): AccountView {
  const view = new URLSearchParams(search).get('view')
  return view === 'quotes' || view === 'orders' || view === 'profile' || view === 'billing' || view === 'locations'
    ? view : 'overview'
}

function formatAccountDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'recently' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function AccountMenuRow({ icon, title, description, onClick }: AccountMenuRowProps) {
  return (
    <button className="account-menu-row" type="button" onClick={onClick}>
      <span className="account-menu-icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <ChevronRight size={20} aria-hidden="true" />
    </button>
  )
}

function AccountDetailHeader({ title, description, onBack, action }: AccountDetailHeaderProps) {
  return (
    <header className="account-detail-header">
      <button className="account-back-button" type="button" onClick={onBack}>
        <ChevronLeft size={19} /> Account
      </button>
      <div className="account-detail-title">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {action}
      </div>
    </header>
  )
}

export function CustomerAccountPage({ account, orders, quoteRequests, quoteRequestsStatus, quoteRequestsError, onRefreshQuoteRequests, onSave, onSignOut, syncStatus, lastSyncedAt }: CustomerAccountPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const activeView = accountViewFromSearch(location.search)
  const setActiveView = (view: AccountView) => navigate(view === 'overview' ? '/account' : `/account?view=${view}`)
  const [draft, setDraft] = useState<CustomerAccount | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showBillingForm, setShowBillingForm] = useState(false)
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [editingLocationId, setEditingLocationId] = useState('')
  const [billingForm, setBillingForm] = useState(emptyBillingProfile)
  const [locationForm, setLocationForm] = useState(emptyLocation)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeView])

  const currentAccount = draft ?? account
  const updateDraft = (updater: (current: CustomerAccount) => CustomerAccount) => {
    setDraft((current) => updater(current ?? structuredClone(account)))
  }

  const accountName = currentAccount.companyName || 'Your NexGen account'
  const initials = useMemo(() => {
    const source = currentAccount.contactName || currentAccount.companyName || 'NexGen customer'
    return source.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  }, [currentAccount.companyName, currentAccount.contactName])

  const saveAccount = async () => {
    setSaving(true)
    await onSave(currentAccount)
    setDraft(null)
    setSaving(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const addBillingProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateDraft((current) => ({
      ...current,
      billingProfiles: [
        ...current.billingProfiles,
        { ...billingForm, id: createCustomerRecordId('BILL') },
      ],
    }))
    setBillingForm(emptyBillingProfile)
    setShowBillingForm(false)
  }

  const addLocation = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateDraft((current) => ({
      ...current,
      receivingLocations: editingLocationId
        ? current.receivingLocations.map((location) => location.id === editingLocationId ? { ...locationForm, id: editingLocationId } : location)
        : [...current.receivingLocations, { ...locationForm, id: createCustomerRecordId('SHIP') }],
    }))
    setLocationForm(emptyLocation)
    setEditingLocationId('')
    setShowLocationForm(false)
  }

  const startNewLocation = () => {
    setLocationForm(emptyLocation)
    setEditingLocationId('')
    setShowLocationForm(true)
  }

  const startEditingLocation = (location: CustomerAccount['receivingLocations'][number]) => {
    setLocationForm({
      label: location.label,
      address: location.address,
      city: location.city,
      state: location.state,
      postalCode: location.postalCode,
      contact: location.contact,
      phone: location.phone,
      receivingHours: location.receivingHours,
      instructions: location.instructions,
    })
    setEditingLocationId(location.id)
    setShowLocationForm(true)
  }

  const requestPaymentSetup = () => {
    const body = [
      `Company: ${currentAccount.companyName || 'Not provided'}`,
      `Account email: ${currentAccount.email || 'Not provided'}`,
      '',
      'Please send a secure link to add a payment method to this NexGen account.',
    ].join('\n')
    window.open(`mailto:orders@nexgenpac.com?subject=${encodeURIComponent('Secure payment method setup')}&body=${encodeURIComponent(body)}`, '_self')
  }

  const returnToAccount = () => setActiveView('overview')

  return (
    <section className="account-page page-section">
      <div className="account-shell">
        {activeView === 'overview' && (
          <>
            <header className="account-home-header">
              <div>
                <p className="eyebrow">Customer account</p>
                <h1>{accountName}</h1>
                <p>Quote requests, orders, payments, billing, and delivery information in one place.</p>
              </div>
              <div className="account-home-actions">
                <button className="account-sign-out" type="button" onClick={() => void onSignOut()}>
                  <LogOut size={16} /> Sign out
                </button>
                <Link className="account-shop-link" to="/products">
                  Shop <ArrowRight size={17} />
                </Link>
              </div>
            </header>

            <section className="account-identity-card" aria-label="Account identity">
              <div className="account-avatar" aria-hidden="true">{initials}</div>
              <div>
                <strong>{currentAccount.contactName || 'Add your name'}</strong>
                <span>{currentAccount.email || 'Add your account email'}</span>
                <small className={`account-sync-line ${syncStatus}`}>
                  <Check size={13} aria-hidden="true" />
                  {accountSyncLabel(syncStatus, lastSyncedAt)}
                </small>
              </div>
              <button type="button" onClick={() => setActiveView('profile')}>Edit</button>
            </section>

            <div className="account-home-grid">
              <section className="account-group" aria-labelledby="account-purchases-heading">
                <h2 id="account-purchases-heading">Requests & purchases</h2>
                <AccountMenuRow
                  icon={<ReceiptText size={21} />}
                  title="Quote requests"
                  description={quoteRequests.length ? `${quoteRequests.length} recent request${quoteRequests.length === 1 ? '' : 's'}` : 'Track requests for pricing'}
                  onClick={() => setActiveView('quotes')}
                />
                <AccountMenuRow
                  icon={<PackageCheck size={21} />}
                  title="Orders"
                  description={orders.length ? `${orders.length} website order${orders.length === 1 ? '' : 's'}` : 'Track orders and reorder products'}
                  onClick={() => setActiveView('orders')}
                />
              </section>

              <section className="account-group" aria-labelledby="account-settings-heading">
                <h2 id="account-settings-heading">Account settings</h2>
                <AccountMenuRow
                  icon={<CreditCard size={21} />}
                  title="Payment & billing"
                  description={currentAccount.billingProfiles.length ? `${currentAccount.billingProfiles.length} billing profile${currentAccount.billingProfiles.length === 1 ? '' : 's'}` : 'Payment methods, invoices, and purchase orders'}
                  onClick={() => setActiveView('billing')}
                />
                <AccountMenuRow
                  icon={<MapPin size={21} />}
                  title="Delivery locations"
                  description={currentAccount.receivingLocations.length ? `${currentAccount.receivingLocations.length} saved location${currentAccount.receivingLocations.length === 1 ? '' : 's'}` : 'Addresses and receiving instructions'}
                  onClick={() => setActiveView('locations')}
                />
                <AccountMenuRow
                  icon={<UserRound size={21} />}
                  title="Account details"
                  description={currentAccount.companyName ? currentAccount.companyName : 'Company and contact information'}
                  onClick={() => setActiveView('profile')}
                />
              </section>
            </div>
          </>
        )}

        {activeView === 'profile' && (
          <>
            <AccountDetailHeader
              title="Account details"
              description="Keep your company and primary contact information current."
              onBack={returnToAccount}
              action={
                <button className="account-primary-action" type="submit" form="account-profile-form">
                  {saved ? <Check size={17} /> : null}{saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
                </button>
              }
            />
            <section className="account-content-card">
              <form id="account-profile-form" className="account-form" onSubmit={(event) => { event.preventDefault(); saveAccount() }}>
                <label>Company name<input value={currentAccount.companyName} autoComplete="organization" onChange={(event) => updateDraft((current) => ({ ...current, companyName: event.target.value }))} /></label>
                <label>Primary contact<input value={currentAccount.contactName} autoComplete="name" onChange={(event) => updateDraft((current) => ({ ...current, contactName: event.target.value }))} /></label>
                <label>Sign-in email<input value={currentAccount.email} type="email" autoComplete="email" readOnly aria-readonly="true" /></label>
                <label>Phone<input value={currentAccount.phone} type="tel" autoComplete="tel" onChange={(event) => updateDraft((current) => ({ ...current, phone: event.target.value }))} /></label>
              </form>
            </section>
          </>
        )}

        {activeView === 'orders' && (
          <>
            <AccountDetailHeader
              title="Orders"
              description="Select an order to view its products, shipping, billing, and status."
              onBack={returnToAccount}
              action={<Link className="account-primary-action" to="/products"><Plus size={17} /> New order</Link>}
            />
            <section className="account-content-card">
              {orders.length === 0 ? (
                <div className="account-empty-state">
                  <PackageCheck size={30} />
                  <strong>No website orders yet</strong>
                  <span>Orders placed through this website appear here.</span>
                  <Link to="/products">Shop products <ArrowRight size={16} /></Link>
                </div>
              ) : (
                <div className="account-order-list">
                  {orders.map((order) => (
                    <button
                      className="account-order-summary"
                      type="button"
                      key={order.id}
                      aria-label={`View order ${order.id} from ${new Date(order.createdAt).toLocaleDateString('en-US')} for ${formatMoney(order.subtotal)}`}
                      onClick={() => navigate(`/account/orders/${encodeURIComponent(order.id)}`)}
                    >
                      <div>
                        <strong>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                        <small>{order.id}</small>
                      </div>
                      <span className="account-order-summary-total">
                        <strong>{formatMoney(order.subtotal)}</strong>
                        <ChevronRight size={20} aria-hidden="true" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeView === 'quotes' && (
          <>
            <AccountDetailHeader
              title="Quote requests"
              description="See the requests you've sent to NexGen and their progress."
              onBack={returnToAccount}
              action={<Link className="account-primary-action" to="/products"><Plus size={17} /> New request</Link>}
            />
            <section className="account-content-card" aria-label="Quote request history">
              {quoteRequestsStatus === 'loading' && !quoteRequests.length ? (
                <div className="account-empty-state"><ReceiptText size={30} /><strong>Loading quote requests…</strong></div>
              ) : quoteRequestsStatus === 'error' && !quoteRequests.length ? (
                <div className="account-empty-state" role="alert">
                  <ReceiptText size={30} />
                  <strong>Could not load quote requests</strong>
                  <span>{quoteRequestsError}</span>
                  <button type="button" onClick={onRefreshQuoteRequests}>Try again</button>
                </div>
              ) : quoteRequests.length === 0 ? (
                <div className="account-empty-state">
                  <ReceiptText size={30} />
                  <strong>No quote requests yet</strong>
                  <span>Requests submitted through this website appear here.</span>
                  <Link to="/products">Browse products <ArrowRight size={16} /></Link>
                </div>
              ) : (
                <div className="account-quote-list">
                  {quoteRequestsStatus === 'error' ? <p className="account-quote-error" role="alert">{quoteRequestsError} Showing the last loaded list. <button type="button" onClick={onRefreshQuoteRequests}>Try again</button></p> : null}
                  {quoteRequests.map((request) => (
                    <article className="account-quote-summary" key={request.requestNumber}>
                      <div className="account-quote-summary-header">
                        <div>
                          <strong>{request.requestNumber}</strong>
                          <small>Submitted {formatAccountDate(request.submittedAt)}</small>
                        </div>
                        <span className="account-quote-status">{request.status}</span>
                      </div>
                      <ul>
                        {request.items.map((item, index) => (
                          <li key={`${item.sku}-${index}`}>
                            <span>{item.sku ? `Item ${item.sku} · ` : ''}{item.productName}</span>
                            <strong>{item.cases} case{item.cases === 1 ? '' : 's'}</strong>
                          </li>
                        ))}
                      </ul>
                      {request.issuedQuoteNumber ? <p>Issued quote <strong>{request.issuedQuoteNumber}</strong></p> : <p>NexGen will provide pricing when your quote is ready.</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeView === 'billing' && (
          <>
            <AccountDetailHeader
              title="Payment & billing"
              description="Manage payment methods, invoice preferences, and purchasing requirements."
              onBack={returnToAccount}
              action={<button className="account-primary-action" type="button" disabled={saving} onClick={() => void saveAccount()}>{saving ? 'Saving…' : saved ? 'Saved' : 'Save'}</button>}
            />
            <div className="account-detail-stack">
              <section className="account-content-card">
                <div className="account-section-heading">
                  <div><h2>Payment methods</h2><p>Payment information is handled through a secure, tokenized payment link.</p></div>
                  <button type="button" onClick={requestPaymentSetup}><Plus size={17} /> Add</button>
                </div>
                {currentAccount.paymentMethods.length ? (
                  <div className="account-record-list">
                    {currentAccount.paymentMethods.map((method) => (
                      <div className="account-record-row" key={method.id}>
                        <span className="account-menu-icon"><CreditCard size={20} /></span>
                        <div><strong>{method.brand} •••• {method.lastFour}</strong><small>Expires {method.expires}</small></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="account-empty-row"><ShieldCheck size={21} /><span>No payment method saved</span><button type="button" onClick={requestPaymentSetup}>Add payment method</button></div>
                )}
              </section>

              <section className="account-content-card">
                <div className="account-section-heading">
                  <div><h2>Billing profiles</h2><p>Use different billing details for divisions, brands, or purchasing programs.</p></div>
                  <button type="button" onClick={() => setShowBillingForm((open) => !open)}><Plus size={17} /> Add</button>
                </div>

                {showBillingForm && (
                  <form className="account-entry-form" onSubmit={addBillingProfile}>
                    <label>Profile name<input required placeholder="Corporate, Midwest division..." value={billingForm.label} onChange={(event) => setBillingForm((current) => ({ ...current, label: event.target.value }))} /></label>
                    <label>Legal company name<input required value={billingForm.legalName} onChange={(event) => setBillingForm((current) => ({ ...current, legalName: event.target.value }))} /></label>
                    <label>Billing email<input required type="email" value={billingForm.billingEmail} onChange={(event) => setBillingForm((current) => ({ ...current, billingEmail: event.target.value }))} /></label>
                    <label>Billing type<select value={billingForm.preference} onChange={(event) => setBillingForm((current) => ({ ...current, preference: event.target.value as BillingPreference }))}><option>Credit card</option><option>Invoice / net terms</option><option>Purchase order</option></select></label>
                    <button type="submit">Add billing profile</button>
                  </form>
                )}

                <div className="account-record-list">
                  {currentAccount.billingProfiles.map((profile) => (
                    <div className="account-record-row" key={profile.id}>
                      <span className="account-menu-icon"><ReceiptText size={20} /></span>
                      <div><strong>{profile.label}</strong><span>{profile.legalName}</span><small>{profile.preference} · {profile.billingEmail}</small></div>
                      <button className="account-remove-button" type="button" aria-label={`Remove ${profile.label}`} onClick={() => updateDraft((current) => ({ ...current, billingProfiles: current.billingProfiles.filter((item) => item.id !== profile.id) }))}><Trash2 size={17} /></button>
                    </div>
                  ))}
                  {currentAccount.billingProfiles.length === 0 ? <p className="account-inline-empty">No billing profiles saved.</p> : null}
                </div>
              </section>
            </div>
          </>
        )}

        {activeView === 'locations' && (
          <>
            <AccountDetailHeader
              title="Delivery locations"
              description="Save shipping addresses, receiving contacts, hours, and dock instructions."
              onBack={returnToAccount}
              action={<button className="account-primary-action" type="button" disabled={saving} onClick={() => void saveAccount()}>{saving ? 'Saving…' : saved ? 'Saved' : 'Save'}</button>}
            />
            <section className="account-content-card">
              <div className="account-section-heading">
                <div><h2>Saved locations</h2><p>Add every warehouse, restaurant group, or distribution point used for delivery.</p></div>
                <button type="button" onClick={startNewLocation}><Plus size={17} /> Add</button>
              </div>

              {showLocationForm && (
                <form className="account-entry-form location-form" onSubmit={addLocation}>
                  <label>Location name<input required placeholder="St. Louis warehouse" value={locationForm.label} onChange={(event) => setLocationForm((current) => ({ ...current, label: event.target.value }))} /></label>
                  <label>Street address<input required autoComplete="street-address" value={locationForm.address} onChange={(event) => setLocationForm((current) => ({ ...current, address: event.target.value }))} /></label>
                  <label>City<input required autoComplete="address-level2" value={locationForm.city} onChange={(event) => setLocationForm((current) => ({ ...current, city: event.target.value }))} /></label>
                  <label>State<input required autoComplete="address-level1" value={locationForm.state} onChange={(event) => setLocationForm((current) => ({ ...current, state: event.target.value }))} /></label>
                  <label>ZIP code<input required autoComplete="postal-code" value={locationForm.postalCode} onChange={(event) => setLocationForm((current) => ({ ...current, postalCode: event.target.value }))} /></label>
                  <label>Receiving contact<input value={locationForm.contact} onChange={(event) => setLocationForm((current) => ({ ...current, contact: event.target.value }))} /></label>
                  <label>Receiving phone<input type="tel" value={locationForm.phone} onChange={(event) => setLocationForm((current) => ({ ...current, phone: event.target.value }))} /></label>
                  <label>Receiving hours<input placeholder="Mon–Fri, 8:00–3:00" value={locationForm.receivingHours} onChange={(event) => setLocationForm((current) => ({ ...current, receivingHours: event.target.value }))} /></label>
                  <label className="location-instructions">Delivery instructions<textarea rows={2} placeholder="Dock, appointment, liftgate, or check-in details" value={locationForm.instructions} onChange={(event) => setLocationForm((current) => ({ ...current, instructions: event.target.value }))} /></label>
                  <button type="submit">{editingLocationId ? 'Update location' : 'Add location'}</button>
                </form>
              )}

              <div className="account-record-list">
                {currentAccount.receivingLocations.map((location) => (
                  <div className="account-record-row" key={location.id}>
                    <span className="account-menu-icon"><Building2 size={20} /></span>
                    <div>
                      <strong>{location.label}</strong>
                      <span>{location.address}, {location.city}, {location.state} {location.postalCode}</span>
                      <small>{[location.contact, location.phone, location.receivingHours].filter(Boolean).join(' · ')}</small>
                      {location.instructions ? <small>{location.instructions}</small> : null}
                    </div>
                    <div className="account-record-actions">
                      <button className="account-edit-button" type="button" aria-label={`Edit ${location.label}`} onClick={() => startEditingLocation(location)}><Pencil size={16} /></button>
                      <button className="account-remove-button" type="button" aria-label={`Remove ${location.label}`} onClick={() => updateDraft((current) => ({ ...current, receivingLocations: current.receivingLocations.filter((item) => item.id !== location.id) }))}><Trash2 size={17} /></button>
                    </div>
                  </div>
                ))}
                {currentAccount.receivingLocations.length === 0 ? <p className="account-inline-empty">No delivery locations saved.</p> : null}
              </div>
            </section>
          </>
        )}
      </div>
    </section>
  )
}

type CustomerOrderDetailPageProps = {
  account: CustomerAccount
  orders: CustomerOrder[]
  onReorder: (items: CustomerOrderLine[]) => void
}

export function CustomerOrderDetailPage({ account, orders, onReorder }: CustomerOrderDetailPageProps) {
  const { orderId = '' } = useParams()
  const navigate = useNavigate()
  const order = orders.find((item) => item.id === decodeURIComponent(orderId))

  if (!order) {
    return (
      <section className="account-page page-section">
        <div className="account-shell">
          <AccountDetailHeader
            title="Order not found"
            description="This order is not available in the current customer account."
            onBack={() => navigate('/account?view=orders')}
          />
          <section className="account-content-card account-empty-state">
            <PackageCheck size={30} />
            <strong>We couldn't find that order</strong>
            <Link to="/account?view=orders">Return to orders</Link>
          </section>
        </div>
      </section>
    )
  }

  const billingProfile = account.billingProfiles.find((profile) => profile.label === order.billingProfile)
  const receivingLocation = account.receivingLocations.find((location) => location.label === order.receivingLocation)
  const reorder = () => {
    onReorder(order.items)
    navigate('/#quote')
  }

  return (
    <section className="account-page order-detail-page page-section">
      <div className="account-shell">
        <header className="order-detail-header">
          <button className="account-back-button" type="button" onClick={() => navigate('/account?view=orders')}>
            <ChevronLeft size={19} /> Orders
          </button>
          <div className="order-detail-title-row">
            <div>
              <p className="eyebrow">Order details</p>
              <h1>{order.id}</h1>
              <span>Placed {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <span className="order-detail-status">{order.status}</span>
          </div>
        </header>

        <section className="order-detail-overview" aria-label="Order summary">
          <article>
            <CalendarDays size={19} aria-hidden="true" />
            <span>Order date</span>
            <strong>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
          </article>
          <article>
            <ReceiptText size={19} aria-hidden="true" />
            <span>Order total</span>
            <strong>{formatMoney(order.subtotal)}</strong>
          </article>
          <article>
            <CreditCard size={19} aria-hidden="true" />
            <span>Bill to</span>
            <strong>{billingProfile?.label || order.billingProfile || 'Confirm with NexGen'}</strong>
            {billingProfile ? <small>{billingProfile.preference} · {billingProfile.billingEmail}</small> : null}
          </article>
          <article>
            <Truck size={19} aria-hidden="true" />
            <span>Ship to</span>
            <strong>{receivingLocation?.label || order.receivingLocation || 'Confirm with NexGen'}</strong>
            {receivingLocation ? <small>{receivingLocation.address}, {receivingLocation.city}, {receivingLocation.state} {receivingLocation.postalCode}</small> : null}
          </article>
        </section>

        <section className="account-content-card order-detail-items">
          <div className="order-detail-section-heading">
            <div>
              <p className="eyebrow">Products</p>
              <h2>{order.items.length} item{order.items.length === 1 ? '' : 's'}</h2>
            </div>
          </div>

          <div className="order-detail-item-list">
            {order.items.map((item) => (
              <article key={`${order.id}-${item.productId}`}>
                <span className="account-menu-icon"><PackageCheck size={20} /></span>
                <div>
                  <strong>{item.productName}</strong>
                  <span>{item.sku} · {item.size}</span>
                  <small>{item.cases} case{item.cases === 1 ? '' : 's'}{item.customPrint ? ' · Custom print' : ''}</small>
                </div>
                <strong>{item.lineTotal == null ? 'Price pending' : formatMoney(item.lineTotal)}</strong>
              </article>
            ))}
          </div>

          <div className="order-detail-total">
            <div>
              <span>Order total</span>
              <strong>{formatMoney(order.subtotal)}</strong>
            </div>
            <button type="button" onClick={reorder}>Reorder these products</button>
          </div>
        </section>
      </div>
    </section>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
}

function accountSyncLabel(
  status: CustomerAccountPageProps['syncStatus'],
  lastSyncedAt: string,
) {
  if (status === 'loading') return 'Connecting to your NexGen customer record…'
  if (status === 'saving') return 'Updating the NexGen sales record…'
  if (status === 'saved') return 'NexGen sales record updated'
  if (status === 'offline') return 'Saved on this device; shared sync unavailable'
  if (!lastSyncedAt) return 'Connected to your NexGen customer record'
  return `Connected · Updated ${new Date(lastSyncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

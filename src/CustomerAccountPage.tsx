import { PortalHome } from './PortalHome'
import { PortalQuoteList } from './PortalQuoteList'
import { PortalSkeleton, PortalError } from './PortalFeedback'
import type { QuoteReceipt } from './QuoteRequestSummary'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  LogOut,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
} from 'lucide-react'
import type {
  BillingPreference,
  CustomerAccount,
  CustomerQuoteHistoryEntry,
} from './customerAccount'
import { createCustomerRecordId } from './customerAccount'
import { CustomerQuoteDetail } from './CustomerQuoteDetail'

type AccountView = 'overview' | 'profile' | 'quotes' | 'billing' | 'locations'

type CustomerAccountPageProps = {
  account: CustomerAccount
  token: string
  quoteRequests: CustomerQuoteHistoryEntry[]
  quoteRequestsStatus: 'loading' | 'ready' | 'error'
  quoteRequestsError: string
  onRefreshQuoteRequests: () => void
  onSave: (account: CustomerAccount, original: CustomerAccount) => void | Promise<void>
  onRequestAgain: (request: QuoteReceipt) => void
  onRefreshAccount: () => void
  onSignOut: () => void | Promise<void>
  syncStatus: 'loading' | 'connected' | 'saving' | 'saved' | 'offline'
  lastSyncedAt: string
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
  return view === 'quotes' || view === 'profile' || view === 'billing' || view === 'locations'
    ? view : 'overview'
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

export function CustomerAccountPage({ account, token, quoteRequests, quoteRequestsStatus, quoteRequestsError, onRefreshQuoteRequests, onSave, onSignOut, onRequestAgain, onRefreshAccount, syncStatus, lastSyncedAt }: CustomerAccountPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const activeView = accountViewFromSearch(location.search)
  const setActiveView = (view: AccountView) => { if (!unsaved || window.confirm('Leave without saving your current form?')) navigate(view === 'overview' ? '/account' : `/account?view=${view}`) }
  const [draft, setDraft] = useState<{ value: CustomerAccount; original: CustomerAccount } | null>(null)
  const [saved, setSaved] = useState(false)
  const [removed, setRemoved] = useState<{kind:'billing'; item:CustomerAccount['billingProfiles'][number]} | {kind:'location'; item:CustomerAccount['receivingLocations'][number]} | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showBillingForm, setShowBillingForm] = useState(false)
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [editingLocationId, setEditingLocationId] = useState('')
  const [editingBillingId, setEditingBillingId] = useState('')
  const savingRef = useRef(false)
  const [billingForm, setBillingForm] = useState(emptyBillingProfile)
  const [locationForm, setLocationForm] = useState(emptyLocation)
  const unsaved = Boolean(draft || (showBillingForm && JSON.stringify(billingForm) !== JSON.stringify(emptyBillingProfile)) || (showLocationForm && JSON.stringify(locationForm) !== JSON.stringify(emptyLocation)))
  useEffect(() => {
    if (!unsaved) return
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const followLink = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a[href]') && !window.confirm('Leave without saving your current form?')) { event.preventDefault(); event.stopPropagation() }
    }
    window.addEventListener('beforeunload', unload)
    document.addEventListener('click', followLink, true)
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', followLink, true) }
  }, [unsaved])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeView])

  const currentAccount = draft?.value ?? account
  const updateDraft = (updater: (current: CustomerAccount) => CustomerAccount) => {
    void saveAccount(updater(currentAccount))
  }

  const accountName = currentAccount.companyName || 'Your NexGen account'
  const initials = useMemo(() => {
    const source = currentAccount.contactName || currentAccount.companyName || 'NexGen customer'
    return source.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  }, [currentAccount.companyName, currentAccount.contactName])

  const saveAccount = async (next = currentAccount) => {
    if (savingRef.current) return false
    savingRef.current = true
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      await onSave(next, draft?.original ?? account)
      setDraft(null)
      setSaved(true)
      setShowBillingForm(false); setShowLocationForm(false)
      setBillingForm(emptyBillingProfile); setLocationForm(emptyLocation)
      setEditingBillingId(''); setEditingLocationId('')
      return true
    } catch (error) {
      setDraft({ value: next, original: draft?.original ?? account })
      setSaveError(error instanceof Error ? error.message : 'Unable to save your customer account right now.')
      return false
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const removePreference = async (kind:'billing'|'location', id:string) => {
    const item = kind === 'billing' ? currentAccount.billingProfiles.find(value => value.id === id) : currentAccount.receivingLocations.find(value => value.id === id)
    if (!item || !window.confirm('Remove "' + item.label + '"? You can undo this after removal.')) return
    const next = kind === 'billing' ? {...currentAccount,billingProfiles:currentAccount.billingProfiles.filter(value=>value.id!==id)} : {...currentAccount,receivingLocations:currentAccount.receivingLocations.filter(value=>value.id!==id)}
    if(await saveAccount(next)) setRemoved(kind === 'billing' ? {kind,item:item as CustomerAccount['billingProfiles'][number]} : {kind,item:item as CustomerAccount['receivingLocations'][number]})
  }
  const undoRemove = async () => {
    if(!removed) return
    const next = removed.kind === 'billing' ? {...currentAccount,billingProfiles:[...currentAccount.billingProfiles.filter(item=>item.id!==removed.item.id),{...removed.item,isDefault:removed.item.isDefault && !currentAccount.billingProfiles.some(item=>item.isDefault)}]} : {...currentAccount,receivingLocations:[...currentAccount.receivingLocations.filter(item=>item.id!==removed.item.id),{...removed.item,isDefault:removed.item.isDefault && !currentAccount.receivingLocations.some(item=>item.isDefault)}]}
    if(await saveAccount(next)) setRemoved(null)
  }

  const saveErrorNotice = saveError ? (
    <p className="account-save-error" role="alert">
      We couldn’t confirm this update was saved to your NexGen account. Your edits remain here so you can retry. {saveError}
      {' '}<button type="button" onClick={() => window.location.reload()}>Reload and discard these edits</button>
    </p>
  ) : null

  const addBillingProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const id = editingBillingId || createCustomerRecordId('BILL')
    setEditingBillingId(id)
    const previous = currentAccount.billingProfiles.find(item => item.id === id)
    const profile = { ...billingForm, id, isDefault: previous?.isDefault || currentAccount.billingProfiles.length === 0 }
    await saveAccount({ ...currentAccount, billingProfiles: previous ? currentAccount.billingProfiles.map(item => item.id === id ? profile : item) : [...currentAccount.billingProfiles, profile] })
  }

  const addLocation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const id = editingLocationId || createCustomerRecordId('SHIP')
    setEditingLocationId(id)
    const previous = currentAccount.receivingLocations.find(item => item.id === id)
    const entry = { ...locationForm, id, isDefault: previous?.isDefault || currentAccount.receivingLocations.length === 0 }
    await saveAccount({ ...currentAccount, receivingLocations: previous ? currentAccount.receivingLocations.map(item => item.id === id ? entry : item) : [...currentAccount.receivingLocations, entry] })
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

  const returnToAccount = () => setActiveView('overview')

  return (
    <section className="account-page page-section">
      <div className="account-shell portal-account-shell">
        <aside className="portal-left-nav" aria-label="Account navigation"><strong>{accountName}</strong><nav>
          <button type="button" aria-current={activeView==='overview'?'page':undefined} onClick={()=>setActiveView('overview')}>Home</button>
          <button type="button" aria-current={activeView==='quotes'?'page':undefined} onClick={()=>setActiveView('quotes')}>Quotes</button>
          <button type="button" aria-current={['profile','billing','locations'].includes(activeView)?'page':undefined} onClick={()=>setActiveView('profile')}>Company</button>
          <Link to="/contact?need=Account%20correction">Contact NexGen</Link>
        </nav><div className="portal-company-nav"><button type="button" onClick={()=>setActiveView('billing')}>Billing preferences</button><button type="button" onClick={()=>setActiveView('locations')}>Delivery locations</button></div></aside>
        <div className="portal-account-main">
        {syncStatus === 'loading' && <PortalSkeleton />}
        {syncStatus === 'offline' && <PortalError message="Your account could not be refreshed. Check your connection and retry." onRetry={onRefreshAccount} />}
        {removed && <div className="account-undo" role="status">Removed {removed.item.label}. <button type="button" disabled={saving} onClick={() => void undoRemove()}>Undo</button></div>}
        {(saving || saved) && <p className="account-save-status" role="status">{saving ? 'Saving…' : 'Saved to your NexGen account.'}</p>}
        {activeView === 'overview' && (
          <>
            <header className="account-home-header">
              <div>
                <p className="eyebrow">Customer account</p>
                <h1>{accountName}</h1>
                <p>Track quote requests and keep your company, billing, and delivery details together.</p>
              </div>
              <div className="account-home-actions">
                <button className="account-sign-out" type="button" onClick={() => void onSignOut()}>
                  <LogOut size={16} /> Sign out
                </button>
                <Link className="account-shop-link" to="/products">
                  Request a quote <ArrowRight size={17} />
                </Link>
              </div>
            </header>

            <section className="account-identity-card" aria-label="Account identity">
              <div className="account-avatar" aria-hidden="true">{initials}</div>
              <div>
                <strong>{currentAccount.contactName || 'Your company contact'}</strong>
                <span>{currentAccount.email || 'Your sign-in email'}</span>
                <small className={`account-sync-line ${syncStatus}`}>
                  <Check size={13} aria-hidden="true" />
                  {accountSyncLabel(syncStatus, lastSyncedAt)}
                </small>
              </div>
              <button type="button" onClick={() => setActiveView('profile')}>View details</button>
            </section>

            <PortalHome account={account} requests={quoteRequests} status={quoteRequestsStatus} error={quoteRequestsError} refresh={onRefreshQuoteRequests} token={token} onRequestAgain={onRequestAgain}/>
          </>
        )}

        {activeView === 'profile' && (
          <>
            <AccountDetailHeader
              title="Company details"
              description="Company and primary contact details are maintained by the NexGen team."
              onBack={returnToAccount}
              action={<Link className="account-primary-action" to="/contact?need=Account%20correction">Request a correction</Link>}
            />
            {saveErrorNotice}
            <section className="account-content-card">
              <div className="account-form">
                <label>Company name<input value={account.companyName} autoComplete="organization" readOnly aria-readonly="true" /></label>
                <label>Primary contact<input value={account.contactName} autoComplete="name" readOnly aria-readonly="true" /></label>
                <label>Your sign-in email<input value={account.email} type="email" autoComplete="email" readOnly aria-readonly="true" /></label>
                <label>Primary contact phone<input value={account.phone} type="tel" autoComplete="tel" readOnly aria-readonly="true" /></label>
              </div>
              <p>Your sign-in email identifies your login and may differ from the company’s primary contact. Contact NexGen if either needs updating.</p>
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
            {new URLSearchParams(location.search).get('request') ? <CustomerQuoteDetail token={token} requestNumber={new URLSearchParams(location.search).get('request')!} refresh={quoteRequests} onRequestAgain={onRequestAgain} /> : <PortalQuoteList requests={quoteRequests} status={quoteRequestsStatus} error={quoteRequestsError} refresh={onRefreshQuoteRequests}/>}

          </>
        )}

        {activeView === 'billing' && (
          <>
            <AccountDetailHeader
              title="Billing preferences"
              description="Save billing contacts and purchasing preferences for your quote requests."
              onBack={returnToAccount}
              action={<button className="account-primary-action" type="button" disabled={saving || !draft} onClick={() => void saveAccount()}>{saving ? 'Saving…' : draft ? 'Retry save' : 'Saved'}</button>}
            />
            {saveErrorNotice}
            <div className="account-detail-stack">
              <section className="account-content-card">
                <div className="account-section-heading">
                  <div><h2>Billing profiles</h2><p>Use different billing details for divisions, brands, or purchasing programs. Selecting invoice or net terms is a preference; credit terms require NexGen approval.</p></div>
                  <button type="button" disabled={saving} onClick={() => { setEditingBillingId(''); setBillingForm(emptyBillingProfile); setShowBillingForm(true) }}><Plus size={17} /> Add</button>
                </div>

                {showBillingForm && (
                  <form className="account-entry-form" onSubmit={addBillingProfile}>
                    <label>Profile name<input disabled={saving} required placeholder="Corporate, Midwest division..." value={billingForm.label} onChange={(event) => setBillingForm((current) => ({ ...current, label: event.target.value }))} /></label>
                    <label>Legal company name<input disabled={saving} required value={billingForm.legalName} onChange={(event) => setBillingForm((current) => ({ ...current, legalName: event.target.value }))} /></label>
                    <label>Billing email<input disabled={saving} required type="email" value={billingForm.billingEmail} onChange={(event) => setBillingForm((current) => ({ ...current, billingEmail: event.target.value }))} /></label>
                    <label>Billing type<select disabled={saving} value={billingForm.preference} onChange={(event) => setBillingForm((current) => ({ ...current, preference: event.target.value as BillingPreference }))}><option>Credit card</option><option>Invoice / net terms</option><option>Purchase order</option></select></label>
                    <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingBillingId ? 'Save billing profile' : 'Add billing profile'}</button>
                  </form>
                )}

                <div className="account-record-list">
                  {currentAccount.billingProfiles.map((profile) => (
                    <div className="account-record-row" key={profile.id}>
                      <span className="account-menu-icon"><ReceiptText size={20} /></span>
                      <div><strong>{profile.label}{profile.isDefault ? ' · Default' : ''}</strong><span>{profile.legalName}</span><small>{profile.preference} · {profile.billingEmail}</small></div>
                      <div className="account-record-actions">
                      <button className="account-edit-button" type="button" aria-label={`Edit ${profile.label}`} disabled={saving} onClick={() => { setEditingBillingId(profile.id); setBillingForm({label:profile.label,legalName:profile.legalName,billingEmail:profile.billingEmail,preference:profile.preference}); setShowBillingForm(true) }}><Pencil size={16} /></button>
                      {!profile.isDefault && <button type="button" disabled={saving} onClick={() => updateDraft(current => ({...current,billingProfiles:current.billingProfiles.map(item => ({...item,isDefault:item.id === profile.id}))}))}>Make default</button>}
                      <button className="account-remove-button" disabled={saving} type="button" aria-label={`Remove ${profile.label}`} onClick={() => void removePreference('billing',profile.id)}><Trash2 size={17} /></button></div>
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
              action={<button className="account-primary-action" type="button" disabled={saving || !draft} onClick={() => void saveAccount()}>{saving ? 'Saving…' : draft ? 'Retry save' : 'Saved'}</button>}
            />
            {saveErrorNotice}
            <section className="account-content-card">
              <div className="account-section-heading">
                <div><h2>Saved locations</h2><p>Add every warehouse, restaurant group, or distribution point used for delivery.</p></div>
                <button type="button" disabled={saving} onClick={startNewLocation}><Plus size={17} /> Add</button>
              </div>

              {showLocationForm && (
                <form className="account-entry-form location-form" onSubmit={addLocation}>
                  <label>Location name<input disabled={saving} required placeholder="St. Louis warehouse" value={locationForm.label} onChange={(event) => setLocationForm((current) => ({ ...current, label: event.target.value }))} /></label>
                  <label>Street address<input disabled={saving} required autoComplete="street-address" value={locationForm.address} onChange={(event) => setLocationForm((current) => ({ ...current, address: event.target.value }))} /></label>
                  <label>City<input disabled={saving} required autoComplete="address-level2" value={locationForm.city} onChange={(event) => setLocationForm((current) => ({ ...current, city: event.target.value }))} /></label>
                  <label>State<input disabled={saving} required autoComplete="address-level1" value={locationForm.state} onChange={(event) => setLocationForm((current) => ({ ...current, state: event.target.value }))} /></label>
                  <label>ZIP code<input disabled={saving} required autoComplete="postal-code" value={locationForm.postalCode} onChange={(event) => setLocationForm((current) => ({ ...current, postalCode: event.target.value }))} /></label>
                  <label>Receiving contact<input disabled={saving} value={locationForm.contact} onChange={(event) => setLocationForm((current) => ({ ...current, contact: event.target.value }))} /></label>
                  <label>Receiving phone<input disabled={saving} type="tel" value={locationForm.phone} onChange={(event) => setLocationForm((current) => ({ ...current, phone: event.target.value }))} /></label>
                  <label>Receiving hours<input disabled={saving} placeholder="Mon–Fri, 8:00–3:00" value={locationForm.receivingHours} onChange={(event) => setLocationForm((current) => ({ ...current, receivingHours: event.target.value }))} /></label>
                  <label className="location-instructions">Delivery instructions<textarea disabled={saving} rows={2} placeholder="Dock, appointment, liftgate, or check-in details" value={locationForm.instructions} onChange={(event) => setLocationForm((current) => ({ ...current, instructions: event.target.value }))} /></label>
                  <button type="submit" disabled={saving}>{editingLocationId ? 'Update location' : 'Add location'}</button>
                </form>
              )}

              <div className="account-record-list">
                {currentAccount.receivingLocations.map((location) => (
                  <div className="account-record-row" key={location.id}>
                    <span className="account-menu-icon"><Building2 size={20} /></span>
                    <div>
                      <strong>{location.label}{location.isDefault ? ' · Default' : ''}</strong>
                      <span>{location.address}, {location.city}, {location.state} {location.postalCode}</span>
                      <small>{[location.contact, location.phone, location.receivingHours].filter(Boolean).join(' · ')}</small>
                      {location.instructions ? <small>{location.instructions}</small> : null}
                    </div>
                    <div className="account-record-actions">
                      {!location.isDefault && <button type="button" disabled={saving} onClick={() => updateDraft(current => ({...current,receivingLocations:current.receivingLocations.map(item => ({...item,isDefault:item.id === location.id}))}))}>Make default</button>}
                      <button className="account-edit-button" disabled={saving} type="button" aria-label={`Edit ${location.label}`} onClick={() => startEditingLocation(location)}><Pencil size={16} /></button>
                      <button className="account-remove-button" disabled={saving} type="button" aria-label={`Remove ${location.label}`} onClick={() => void removePreference('location',location.id)}><Trash2 size={17} /></button>
                    </div>
                  </div>
                ))}
                {currentAccount.receivingLocations.length === 0 ? <p className="account-inline-empty">No delivery locations saved.</p> : null}
              </div>
            </section>
          </>
        )}
        </div>
      </div>
    </section>
  )
}

function accountSyncLabel(
  status: CustomerAccountPageProps['syncStatus'],
  lastSyncedAt: string,
) {
  if (status === 'loading') return 'Connecting to your NexGen customer record…'
  if (status === 'saving') return 'Updating the NexGen sales record…'
  if (status === 'saved') return 'NexGen sales record updated'
  if (status === 'offline') return 'NexGen sync unavailable; changes may be only on this device'
  if (!lastSyncedAt) return 'Connected to your NexGen customer record'
  return `Connected · Updated ${new Date(lastSyncedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

import type { FormEvent } from 'react'
import { Check, ChevronRight, FileImage, Mail, Minus, PackageOpen, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CustomerAccount } from './customerAccount'
import type { CartLine, QuoteContact } from './storefrontCart'
import { artworkNeedsReattachment } from './artworkUpload'
import { ArtworkImage } from './ArtworkImage'
import { QuoteRequestSummary } from './QuoteRequestSummary'
import type { QuoteReceipt } from './QuoteRequestSummary'

type CartPageProps = {
  items: CartLine[]
  totalCases: number
  account: CustomerAccount
  signedIn: boolean
  contact: QuoteContact
  requestReady: boolean
  requestNumber: string
  receipt: QuoteReceipt | null
  requestLoading: boolean
  requestError: string
  onContactChange: (field: keyof QuoteContact, value: string) => void
  onQuantityChange: (lineId: string, delta: number) => void
  onRemove: (lineId: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
}

export function CartPage({
  items,
  totalCases,
  account,
  signedIn,
  contact,
  requestReady,
  requestNumber,
  receipt,
  requestLoading,
  requestError,
  onContactChange,
  onQuantityChange,
  onRemove,
  onSubmit,
}: CartPageProps) {
  const billing = account.billingProfiles.find(profile => profile.id === contact.billingProfileId)
  const shipping = account.receivingLocations.find(location => location.id === contact.receivingLocationId)
  return (
    <section className="cart-page page-section">
      <div className="cart-page-shell">
        <header className="cart-page-header">
          <p className="eyebrow">Quote builder</p>
          <h1>Your cart</h1>
          <p>Review quantities and specifications, then send the completed list to NexGen for pricing.</p>
        </header>

        {requestReady && requestNumber ? (
          <section className="cart-page-empty" role="status">
            <Check size={36} />
            <h2>Quote request received</h2>
            <p>Request <strong>{requestNumber}</strong> is with NexGen for review. You can track its status in your account.</p>
            {receipt && <QuoteRequestSummary request={receipt} />}
            <Link className="primary-button" to={`/account?view=quotes&request=${encodeURIComponent(requestNumber)}`}>Track your request <ChevronRight size={17} /></Link>
          </section>
        ) : items.length === 0 ? (
          <section className="cart-page-empty">
            <PackageOpen size={36} />
            <h2>Your cart is empty</h2>
            <p>Choose products and configure any printing or artwork requirements before requesting a quote.</p>
            <Link className="primary-button" to="/products">Browse products <ChevronRight size={17} /></Link>
          </section>
        ) : (
          <div className="cart-page-layout">
            <section className="cart-page-items" aria-labelledby="cart-products-heading">
              <div className="cart-page-section-heading">
                <div>
                  <p className="eyebrow">Products</p>
                  <h2 id="cart-products-heading">{items.length} configured item{items.length === 1 ? '' : 's'}</h2>
                </div>
                <span>{totalCases} case{totalCases === 1 ? '' : 's'}</span>
              </div>

              <div className="cart-page-item-list">
                {items.map((item) => (
                  <article key={item.lineId}>
                    <Link className={`cart-page-item-image${item.product.id === 'plastic-entree-containers' && item.component === 'Lid' ? ' cart-lid-placeholder' : ''}`} to={`/products/${item.product.id}?cartLine=${encodeURIComponent(item.lineId)}`} aria-label={`View ${item.productName || item.product.name}`}>
                      {item.product.id === 'plastic-entree-containers' && item.component === 'Lid'
                        ? <span aria-hidden="true"><PackageOpen size={22} /><small>Lid image pending</small></span>
                        : <img src={item.product.image} alt="" />}
                      {item.artworkPreview ? <ArtworkImage className="cart-artwork-preview" file={item.artworkFile} alt={`Artwork selected for ${item.productName || item.product.name}`} /> : null}
                    </Link>

                    <div className="cart-page-item-copy">
                      <span>{item.itemNumber ? `Item ${item.itemNumber}` : item.product.sku || item.product.category}</span>
                      <Link to={`/products/${item.product.id}?cartLine=${encodeURIComponent(item.lineId)}`}>{item.productName || item.product.name}</Link>
                      <small>{item.size || item.product.sizes[0]}</small>
                      <small>{item.material || item.product.material}</small>
                      {item.product.imageNote && item.component !== 'Lid' ? <small>Image: {item.product.imageNote}</small> : null}
                      {item.product.id === 'plastic-entree-containers' && !item.component ? <small role="alert">Remove this line and choose a specific base or lid before requesting pricing.</small> : null}
                      {artworkNeedsReattachment(item.artworkName, item.artworkFile) ? <small role="alert">Reattach {item.artworkName} on the product page before requesting pricing.</small> : null}
                      {(item.additionalArtworkNames || []).filter(name => !(item.additionalArtworkFiles || []).some(file => file.name === name)).map((name, index) => <small role="alert" key={index}>Reattach {name} on the product page before requesting pricing.</small>)}
                      {item.printColors > 0 ? (
                        <div className="cart-print-summary">
                          <FileImage size={15} />
                          <span>{item.printColors}-color printing{item.artworkName ? ` · ${item.artworkName}` : ' · Artwork to follow'}</span>
                          {item.additionalArtworkNames?.length ? <span>{item.additionalArtworkNames.join(', ')}</span> : null}
                          {item.inkColors?.length ? (
                            <span className="cart-ink-swatches" aria-label={`Requested print colors: ${item.inkColors.join(', ')}`}>
                              {item.inkColors.map((color, index) => (
                                <i key={`${color}-${index}`} style={{ backgroundColor: color }} />
                              ))}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="cart-print-summary plain">Unprinted</div>
                      )}
                    </div>

                    <div className="cart-page-item-actions">
                      <div className="quantity-control" aria-label={`Case quantity for ${item.productName || item.product.name}`}>
                        <button type="button" onClick={() => onQuantityChange(item.lineId, -1)} aria-label={`Remove one case of ${item.productName || item.product.name}`}><Minus size={15} /></button>
                        <span>{item.cases}</span>
                        <button type="button" onClick={() => onQuantityChange(item.lineId, 1)} aria-label={`Add one case of ${item.productName || item.product.name}`}><Plus size={15} /></button>
                      </div>
                      <button className="cart-remove-item" type="button" onClick={() => onRemove(item.lineId)} aria-label={`Remove ${item.productName || item.product.name} from cart`}><Trash2 size={17} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="quote-request-panel" aria-labelledby="quote-request-heading">
              <div className="quote-request-heading">
                <p className="eyebrow">Final step</p>
                <h2 id="quote-request-heading">{signedIn ? 'Request pricing' : 'Sign in to request pricing'}</h2>
                <p>No payment is collected. NexGen will review specifications, volume, freight, and availability before returning a quote.</p>
              </div>

              {!signedIn ? (
                <div className="quote-request-signin">
                  <p>Products and quantities stay in this browser while you sign in. If you reload the page, reattach any artwork before submitting.</p>
                  <Link className="primary-button full-width" to="/account?checkout=1">Sign in or create an account <ChevronRight size={17} /></Link>
                </div>
              ) : null}

              <div className="quote-request-totals">
                <span><strong>{items.length}</strong> Products</span>
                <span><strong>{totalCases}</strong> Cases</span>
                <span><strong>Pending</strong> Final pricing</span>
              </div>

              {signedIn ? <form className="quote-request-form" onSubmit={onSubmit}>
                <label>Name<input required autoComplete="name" value={contact.name} onChange={(event) => onContactChange('name', event.target.value)} /></label>
                <label>Company<input required autoComplete="organization" value={contact.company} readOnly aria-readonly="true" /></label>
                <label>Email<input required type="email" autoComplete="email" value={contact.email} onChange={(event) => onContactChange('email', event.target.value)} /></label>
                <label>PO / reference <span>Optional</span><input value={contact.purchaseOrder} onChange={(event) => onContactChange('purchaseOrder', event.target.value)} /></label>

                {account.billingProfiles.length > 0 ? (
                  <label>
                    Bill to
                    <select required value={contact.billingProfileId} onChange={(event) => onContactChange('billingProfileId', event.target.value)}>
                      <option value="">Select a billing profile</option>
                      {account.billingProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label} · {profile.preference}</option>)}
                    </select>
                  </label>
                ) : null}

                {billing && <div className="quote-address-preview" aria-label="Selected billing profile"><strong>{billing.legalName}</strong><span>{billing.billingEmail}</span><span>{billing.preference}</span></div>}
                {!account.billingProfiles.length && <p><Link to="/account?view=billing">Add a billing profile</Link></p>}
                {account.receivingLocations.length > 0 ? (
                  <label>
                    Ship to
                    <select required value={contact.receivingLocationId} onChange={(event) => onContactChange('receivingLocationId', event.target.value)}>
                      <option value="">Select a delivery location</option>
                      {account.receivingLocations.map((location) => <option key={location.id} value={location.id}>{location.label} · {location.city}, {location.state}</option>)}
                    </select>
                  </label>
                ) : null}

                {shipping && <div className="quote-address-preview" aria-label="Selected delivery location"><strong>{shipping.label}</strong><span>{shipping.address}, {shipping.city}, {shipping.state} {shipping.postalCode}</span><span>{[shipping.contact, shipping.phone, shipping.receivingHours, shipping.instructions].filter(Boolean).join(' · ')}</span></div>}
                {!account.receivingLocations.length && <><p><Link to="/account?view=locations">Add a delivery location</Link>, or provide a ZIP code for this quote.</p><label>Delivery ZIP / postal code<input required autoComplete="postal-code" value={contact.postalCode} onChange={event => onContactChange('postalCode',event.target.value)} /></label></>}
                <p>We follow up within 1 business day.</p>
                <label className="quote-request-notes">Notes <span>Optional</span><textarea rows={3} value={contact.notes} onChange={(event) => onContactChange('notes', event.target.value)} /></label>

                {requestError ? <p className="quote-request-error" role="alert">{requestError}</p> : null}

                <button className="primary-button full-width" type="submit" disabled={requestLoading || requestReady}>
                  {requestReady ? <Check size={18} /> : <Mail size={18} />}
                  {requestLoading ? 'Submitting…' : requestReady ? 'Request submitted' : 'Request quote'}
                </button>
                {requestReady && requestNumber ? (
                  <p className="quote-request-receipt" role="status">
                    Request <strong>{requestNumber}</strong> was received. <Link to="/account?view=quotes">Track it in your account</Link>.
                  </p>
                ) : null}
              </form> : null}

              <small className="quote-request-disclaimer">Your request is sent directly to the NexGen quote workspace for pricing and follow-up.</small>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

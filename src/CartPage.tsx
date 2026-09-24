import type { FormEvent } from 'react'
import { ArrowLeft, Check, ChevronRight, FileImage, Mail, Minus, PackageOpen, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CustomerAccount } from './customerAccount'
import type { CartLine, QuoteContact } from './storefrontCart'

type CartPageProps = {
  items: CartLine[]
  totalCases: number
  account: CustomerAccount
  signedIn: boolean
  contact: QuoteContact
  requestReady: boolean
  requestNumber: string
  requestLoading: boolean
  requestError: string
  onContactChange: (field: keyof QuoteContact, value: string) => void
  onQuantityChange: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
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
  requestLoading,
  requestError,
  onContactChange,
  onQuantityChange,
  onRemove,
  onSubmit,
}: CartPageProps) {
  return (
    <section className="cart-page page-section">
      <div className="cart-page-shell">
        <header className="cart-page-header">
          <Link to="/products"><ArrowLeft size={17} /> Continue shopping</Link>
          <p className="eyebrow">Quote builder</p>
          <h1>Your cart</h1>
          <p>Review quantities and specifications, then send the completed list to NexGen for pricing.</p>
        </header>

        {items.length === 0 ? (
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
                  <article key={item.productId}>
                    <Link className="cart-page-item-image" to={`/products/${item.product.id}`} aria-label={`Edit ${item.product.name}`}>
                      <img src={item.product.image} alt="" />
                      {item.artworkPreview ? <img className="cart-artwork-preview" src={item.artworkPreview} alt={`Artwork selected for ${item.product.name}`} /> : null}
                    </Link>

                    <div className="cart-page-item-copy">
                      <span>{item.product.sku || item.product.category}</span>
                      <Link to={`/products/${item.product.id}`}>{item.product.name}</Link>
                      <small>{item.size || item.product.sizes[0]}</small>
                      <small>{item.material || item.product.material}</small>
                      {item.printColors > 0 ? (
                        <div className="cart-print-summary">
                          <FileImage size={15} />
                          <span>{item.printColors}-color printing{item.artworkName ? ` · ${item.artworkName}` : ' · Artwork to follow'}</span>
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
                      <div className="quantity-control" aria-label={`Case quantity for ${item.product.name}`}>
                        <button type="button" onClick={() => onQuantityChange(item.productId, -1)} aria-label={`Remove one case of ${item.product.name}`}><Minus size={15} /></button>
                        <span>{item.cases}</span>
                        <button type="button" onClick={() => onQuantityChange(item.productId, 1)} aria-label={`Add one case of ${item.product.name}`}><Plus size={15} /></button>
                      </div>
                      <button className="cart-remove-item" type="button" onClick={() => onRemove(item.productId)} aria-label={`Remove ${item.product.name} from cart`}><Trash2 size={17} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="quote-request-panel" aria-labelledby="quote-request-heading">
              <div className="quote-request-heading">
                <p className="eyebrow">Final step</p>
                <h2 id="quote-request-heading">Request pricing</h2>
                <p>No payment is collected. NexGen will review specifications, volume, freight, and availability before returning a quote.</p>
              </div>

              <div className="quote-request-totals">
                <span><strong>{items.length}</strong> Products</span>
                <span><strong>{totalCases}</strong> Cases</span>
                <span><strong>Pending</strong> Final pricing</span>
              </div>

              <form className="quote-request-form" onSubmit={onSubmit}>
                <label>Name<input required autoComplete="name" value={contact.name} onChange={(event) => onContactChange('name', event.target.value)} /></label>
                <label>Company<input required autoComplete="organization" value={contact.company} onChange={(event) => onContactChange('company', event.target.value)} /></label>
                <label>Email<input required type="email" autoComplete="email" value={contact.email} onChange={(event) => onContactChange('email', event.target.value)} /></label>
                <label>PO / reference <span>Optional</span><input value={contact.purchaseOrder} onChange={(event) => onContactChange('purchaseOrder', event.target.value)} /></label>

                {account.billingProfiles.length > 0 ? (
                  <label>
                    Bill to
                    <select value={contact.billingProfileId} onChange={(event) => onContactChange('billingProfileId', event.target.value)}>
                      {account.billingProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label} · {profile.preference}</option>)}
                    </select>
                  </label>
                ) : null}

                {account.receivingLocations.length > 0 ? (
                  <label>
                    Ship to
                    <select value={contact.receivingLocationId} onChange={(event) => onContactChange('receivingLocationId', event.target.value)}>
                      {account.receivingLocations.map((location) => <option key={location.id} value={location.id}>{location.label} · {location.city}, {location.state}</option>)}
                    </select>
                  </label>
                ) : null}

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
              </form>

              {!signedIn ? <p className="quote-request-account-note"><Link to="/account">Sign in or create an account</Link> to submit this request and use saved billing and delivery locations.</p> : null}
              <small className="quote-request-disclaimer">Your request is sent directly to the NexGen quote workspace for pricing and follow-up.</small>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

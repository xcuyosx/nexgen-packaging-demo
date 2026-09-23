import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  ClipboardList,
  Download,
  Factory,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Phone,
  PackageOpen,
  Plus,
  Pizza,
  Recycle,
  RotateCcw,
  Ruler,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Utensils,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import {
  paperProducts,
  plasticProducts,
  products as curatedProducts,
  quoteQuantityOptions,
} from './catalog'
import type { Product, ProductDivision } from './catalog'
import { industries } from './industries'
import { fetchStorefrontProducts, storefrontFallbackProducts } from './storefrontCatalog'
import { TradeShowCalendar } from './TradeShowCalendar'
import { CustomerAccountPage, CustomerOrderDetailPage } from './CustomerAccountPage'
import { CustomerLoginPage } from './CustomerLoginPage'
import { CartPage } from './CartPage'
import {
  clearCustomerSession,
  emptyCustomerAccount,
  fetchCustomerAccountSync,
  loadCustomerSession,
  loadCustomerAccount,
  loadCustomerOrders,
  loginCustomerAccount,
  logoutCustomerAccount,
  refreshCustomerSession,
  readCustomerPasswordRecoveryLink,
  registerCustomerAccount,
  requestCustomerPasswordReset,
  saveCustomerAccount,
  saveCustomerAccountSync,
  saveCustomerOrders,
  saveCustomerSession,
  submitCustomerQuoteRequest,
  updateCustomerPassword,
} from './customerAccount'
import type { CustomerAccount, CustomerOrder, CustomerOrderLine, CustomerSession } from './customerAccount'
import type { CartConfiguration, CartItem, PrintColorCount, QuoteContact } from './storefrontCart'
import './App.css'

const heroImage =
  'https://static.wixstatic.com/media/067fd2_0ee5edd567cf45428f5ca53176428944~mv2.jpg/v1/fill/w_980,h_548,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/067fd2_0ee5edd567cf45428f5ca53176428944~mv2.jpg'

const nexgenLogo =
  'https://static.wixstatic.com/media/067fd2_442e8edbc68c491ea121fea22fc5f107~mv2.png/v1/fill/w_918,h_218,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/067fd2_442e8edbc68c491ea121fea22fc5f107~mv2.png'

type ArtworkAdjustment = {
  size: number
  x: number
  y: number
  rotate: number
}

const defaultArtworkAdjustment: ArtworkAdjustment = {
  size: 58,
  x: 0,
  y: 0,
  rotate: 0,
}

function RouteScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
      return
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [hash, pathname])

  return null
}

function App() {
  const { pathname } = useLocation()
  const [passwordRecovery, setPasswordRecovery] = useState(readCustomerPasswordRecoveryLink)
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(() => passwordRecovery ? null : loadCustomerSession())
  const customerSessionToken = customerSession?.token || ''
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(storefrontFallbackProducts)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerAccount, setCustomerAccount] = useState<CustomerAccount>(() => customerSession ? loadCustomerAccount() : emptyCustomerAccount)
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(() => customerSession ? loadCustomerOrders() : [])
  const [customerSyncStatus, setCustomerSyncStatus] = useState<'loading' | 'connected' | 'saving' | 'saved' | 'offline'>(customerSession ? 'loading' : 'offline')
  const [customerLastSyncedAt, setCustomerLastSyncedAt] = useState('')
  const [customerLoginLoading, setCustomerLoginLoading] = useState(false)
  const [customerLoginError, setCustomerLoginError] = useState(passwordRecovery?.error || '')
  const [customerLoginMessage, setCustomerLoginMessage] = useState('')
  const customerSyncRevisionRef = useRef(1)
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerBrandVisible, setHeaderBrandVisible] = useState(pathname !== '/')
  const [quoteRequestReady, setQuoteRequestReady] = useState(false)
  const [quoteRequestLoading, setQuoteRequestLoading] = useState(false)
  const [quoteRequestError, setQuoteRequestError] = useState('')
  const [buyer, setBuyer] = useState<QuoteContact>({
    name: '',
    company: '',
    email: '',
    purchaseOrder: '',
    billingProfileId: '',
    receivingLocationId: '',
    notes: '',
  })

  useLayoutEffect(() => {
    if (!passwordRecovery) return
    const url = new URL(window.location.href)
    url.searchParams.delete('auth')
    url.hash = ''
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`)
    clearCustomerSession()
  }, [passwordRecovery])
  const [contactRequest, setContactRequest] = useState({ company: '', need: 'standard', message: '' })
  const [contactEmailOpened, setContactEmailOpened] = useState(false)

  useEffect(() => {
    const updateHeaderBrand = () => {
      const visible = pathname !== '/' || window.scrollY > 72
      setHeaderBrandVisible((current) => current === visible ? current : visible)
    }

    updateHeaderBrand()
    window.addEventListener('scroll', updateHeaderBrand, { passive: true })
    return () => window.removeEventListener('scroll', updateHeaderBrand)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  useEffect(() => {
    const controller = new AbortController()
    fetchStorefrontProducts(controller.signal)
      .then((remoteProducts) => {
        if (remoteProducts.length) setCatalogProducts(remoteProducts)
      })
      .catch(() => {
        // The curated/local catalog remains usable while the shared backend is unavailable.
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!customerSession || customerSession.provider !== 'supabase' || !customerSession.refreshToken) return
    const refreshIn = Math.max(0, Date.parse(customerSession.expiresAt) - Date.now() - 60_000)
    const timer = window.setTimeout(() => {
      refreshCustomerSession(customerSession)
        .then((nextSession) => {
          saveCustomerSession(nextSession)
          setCustomerSession(nextSession)
        })
        .catch(() => {
          clearCustomerSession()
          setCustomerSession(null)
          setCustomerAccount(emptyCustomerAccount)
          setCustomerOrders([])
          setCustomerLoginError('Your customer session has expired. Please sign in again.')
        })
    }, refreshIn)
    return () => window.clearTimeout(timer)
  }, [customerSession])

  useEffect(() => {
    if (!customerSessionToken) return
    if (
      customerSession?.provider === 'supabase' &&
      customerSession.refreshToken &&
      Date.parse(customerSession.expiresAt) <= Date.now() + 30_000
    ) return
    const controller = new AbortController()
    fetchCustomerAccountSync(customerSessionToken, controller.signal)
      .then((record) => {
        customerSyncRevisionRef.current = record.revision
        setCustomerAccount(record.account)
        setCustomerOrders(record.orders)
        saveCustomerAccount(record.account)
        saveCustomerOrders(record.orders)
        setCustomerLastSyncedAt(record.updatedAt)
        setCustomerSyncStatus('connected')
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setCustomerSyncStatus('offline')
        if (error instanceof Error && error.message.includes('session has expired')) {
          clearCustomerSession()
          setCustomerSession(null)
          setCustomerAccount(emptyCustomerAccount)
          setCustomerOrders([])
          setCustomerLoginError(error.message)
        }
      })
    return () => controller.abort()
  }, [customerSession?.expiresAt, customerSession?.provider, customerSession?.refreshToken, customerSessionToken])

  const signInCustomer = async (email: string, password: string) => {
    setCustomerLoginLoading(true)
    setCustomerLoginError('')
    setCustomerLoginMessage('')
    try {
      const result = await loginCustomerAccount(email, password)
      const session: CustomerSession = {
        token: result.token,
        refreshToken: result.refreshToken,
        userId: result.userId,
        accountId: result.accountId,
        expiresAt: result.expiresAt,
        provider: result.provider,
      }
      saveCustomerSession(session)
      customerSyncRevisionRef.current = result.record.revision
      setCustomerSession(session)
      setCustomerAccount(result.record.account)
      setCustomerOrders(result.record.orders)
      saveCustomerAccount(result.record.account)
      saveCustomerOrders(result.record.orders)
      setCustomerLastSyncedAt(result.record.updatedAt)
      setCustomerSyncStatus('connected')
      setBuyer((current) => ({
        ...current,
        name: current.name || result.record.account.contactName,
        company: current.company || result.record.account.companyName,
        email: current.email || result.record.account.email,
        billingProfileId: current.billingProfileId || result.record.account.billingProfiles[0]?.id || '',
        receivingLocationId: current.receivingLocationId || result.record.account.receivingLocations[0]?.id || '',
      }))
    } catch (error) {
      setCustomerLoginError(error instanceof Error ? error.message : 'Sign-in failed. Please try again.')
    } finally {
      setCustomerLoginLoading(false)
    }
  }

  const registerCustomer = async (contactName: string, companyName: string, email: string, password: string) => {
    setCustomerLoginLoading(true)
    setCustomerLoginError('')
    setCustomerLoginMessage('')
    try {
      const registration = await registerCustomerAccount(contactName, companyName, email, password)
      if (!registration.login) {
        if (registration.status === 'existing-account') {
          setCustomerLoginError('This email already has a sign-in. Sign in or reset your password. A separate customer account needs a different email.')
        } else {
          setCustomerLoginMessage('If this is a new account, check your email for a confirmation link. Already have a sign-in? Sign in or reset your password.')
        }
        return
      }
      const result = registration.login
      const session: CustomerSession = {
        token: result.token,
        refreshToken: result.refreshToken,
        userId: result.userId,
        accountId: result.accountId,
        expiresAt: result.expiresAt,
        provider: result.provider,
      }
      saveCustomerSession(session)
      customerSyncRevisionRef.current = result.record.revision
      setCustomerSession(session)
      setCustomerAccount(result.record.account)
      setCustomerOrders(result.record.orders)
      saveCustomerAccount(result.record.account)
      saveCustomerOrders(result.record.orders)
      setCustomerLastSyncedAt(result.record.updatedAt)
      setCustomerSyncStatus('connected')
      setBuyer((current) => ({
        ...current,
        name: result.record.account.contactName,
        company: result.record.account.companyName,
        email: result.record.account.email,
      }))
    } catch (error) {
      setCustomerLoginError(error instanceof Error ? error.message : 'Account creation failed. Please try again.')
    } finally {
      setCustomerLoginLoading(false)
    }
  }

  const requestPasswordReset = async (email: string) => {
    setCustomerLoginLoading(true)
    setCustomerLoginError('')
    setCustomerLoginMessage('')
    try {
      await requestCustomerPasswordReset(email)
      setCustomerLoginMessage('If this email has a sign-in, check for a reset link. If none arrives, contact NexGen support.')
    } catch (error) {
      setCustomerLoginError(error instanceof Error ? error.message : 'Password reset request failed. Please try again.')
    } finally {
      setCustomerLoginLoading(false)
    }
  }

  const changePassword = async (password: string) => {
    const token = passwordRecovery?.token
    if (!token) return false
    setCustomerLoginLoading(true)
    setCustomerLoginError('')
    setCustomerLoginMessage('')
    try {
      await updateCustomerPassword(token, password)
      setPasswordRecovery(null)
      setCustomerLoginMessage('Password updated. Sign in with your new password.')
      return true
    } catch (error) {
      setCustomerLoginError(error instanceof Error ? error.message : 'Unable to update your password. Request a new reset link.')
      return false
    } finally {
      setCustomerLoginLoading(false)
    }
  }

  const clearCustomerLoginFeedback = () => {
    setCustomerLoginError('')
    setCustomerLoginMessage('')
    setPasswordRecovery(null)
  }

  const signOutCustomer = async () => {
    const token = customerSession?.token || ''
    clearCustomerSession()
    setCustomerSession(null)
    setCustomerAccount(emptyCustomerAccount)
    setCustomerOrders([])
    setCustomerLastSyncedAt('')
    setCustomerSyncStatus('offline')
    setCustomerLoginError('')
    setCustomerLoginMessage('')
    try {
      await logoutCustomerAccount(token)
    } catch {
      // Local session state is cleared even if the demo service is temporarily unavailable.
    }
  }

  const allProducts = useMemo(() => {
    const catalogIds = new Set(catalogProducts.map((product) => product.id))
    return [...catalogProducts, ...curatedProducts.filter((product) => !catalogIds.has(product.id))]
  }, [catalogProducts])
  const productMap = useMemo(() => new Map(allProducts.map((product) => [product.id, product])), [allProducts])

  const cartDetails = useMemo(() => {
    return cart
      .map((item) => ({
        ...item,
        product: productMap.get(item.productId),
      }))
      .filter((item): item is CartItem & { product: Product } => Boolean(item.product))
  }, [cart, productMap])

  const totalCases = cartDetails.reduce((total, item) => total + item.cases, 0)

  const updateCart = (productId: string, delta: number, size?: string, configuration?: CartConfiguration) => {
    setQuoteRequestReady(false)
    setQuoteRequestError('')
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      if (!existing && delta > 0) {
        return [...current, {
          productId,
          cases: delta,
          size,
          material: configuration?.material,
          printColors: configuration?.printColors || 0,
          inkColors: configuration?.inkColors,
          artworkName: configuration?.artworkName,
          artworkPreview: configuration?.artworkPreview,
          artworkPosition: configuration?.artworkPosition,
        }]
      }

      return current
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                cases: Math.max(0, item.cases + delta),
                size: size ?? item.size,
                material: configuration?.material ?? item.material,
                printColors: configuration?.printColors ?? item.printColors,
                inkColors: configuration?.inkColors ?? item.inkColors,
                artworkName: configuration?.artworkName ?? item.artworkName,
                artworkPreview: configuration?.artworkPreview ?? item.artworkPreview,
                artworkPosition: configuration?.artworkPosition ?? item.artworkPosition,
              }
            : item,
        )
        .filter((item) => item.cases > 0)
    })
  }

  const removeCartItem = (productId: string) => {
    setQuoteRequestReady(false)
    setQuoteRequestError('')
    setCart((current) => current.filter((item) => item.productId !== productId))
  }

  const updateQuoteContact = (field: keyof QuoteContact, value: string) => {
    setQuoteRequestReady(false)
    setQuoteRequestError('')
    setBuyer((current) => ({ ...current, [field]: value }))
  }

  const syncCustomerRecord = async (nextAccount: CustomerAccount, nextOrders: CustomerOrder[]) => {
    if (!customerSession) return
    setCustomerSyncStatus('saving')
    try {
      const record = await saveCustomerAccountSync(nextAccount, nextOrders, customerSyncRevisionRef.current, customerSession.token)
      customerSyncRevisionRef.current = record.revision
      setCustomerAccount(record.account)
      setCustomerOrders(record.orders)
      saveCustomerAccount(record.account)
      saveCustomerOrders(record.orders)
      setCustomerLastSyncedAt(record.updatedAt)
      setCustomerSyncStatus('saved')
      window.setTimeout(() => setCustomerSyncStatus('connected'), 1800)
    } catch {
      setCustomerSyncStatus('offline')
    }
  }

  const updateCustomerAccount = async (nextAccount: CustomerAccount) => {
    setCustomerAccount(nextAccount)
    saveCustomerAccount(nextAccount)
    await syncCustomerRecord(nextAccount, customerOrders)
  }

  const reorderFromHistory = (items: CustomerOrderLine[]) => {
    setCart((current) => {
      const next = new Map(current.map((item) => [item.productId, item]))
      items.forEach((item) => {
        if (!productMap.has(item.productId)) return
        const existing = next.get(item.productId)
        next.set(item.productId, {
          productId: item.productId,
          cases: (existing?.cases || 0) + item.cases,
          printColors: item.customPrint ? 1 : 0,
          size: item.size,
        })
      })
      return Array.from(next.values())
    })
  }

  const sendQuoteRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cartDetails.length) return
    if (quoteRequestReady) return

    setQuoteRequestError('')
    setQuoteRequestReady(false)
    if (!customerSession) {
      setQuoteRequestError('Sign in or create a customer account before submitting this quote request.')
      return
    }

    const billingProfile = customerAccount.billingProfiles.find((profile) => profile.id === buyer.billingProfileId)
    const receivingLocation = customerAccount.receivingLocations.find((location) => location.id === buyer.receivingLocationId)
    setQuoteRequestLoading(true)
    try {
      await submitCustomerQuoteRequest(customerSession.token, {
        contact: {
          name: buyer.name,
          company: buyer.company,
          email: buyer.email,
        },
        billing: billingProfile ? { ...billingProfile } : {},
        shipping: receivingLocation ? { ...receivingLocation } : {},
        purchaseOrder: buyer.purchaseOrder,
        notes: buyer.notes,
        lines: cartDetails.map((item) => ({
          productId: item.product.id,
          sku: item.product.sku || '',
          productName: item.product.name,
          category: item.product.category,
          material: item.material || item.product.material,
          dimensions: item.product.description,
          casePack: item.product.casePack,
          cases: item.cases,
          size: item.size || item.product.sizes[0],
          printColors: item.printColors,
          inkColors: item.inkColors || [],
          artworkName: item.artworkName || '',
          artworkPosition: item.artworkPosition,
        })),
      })
      setQuoteRequestReady(true)
    } catch (error) {
      setQuoteRequestError(error instanceof Error ? error.message : 'Unable to submit this quote request.')
    } finally {
      setQuoteRequestLoading(false)
    }
  }

  const sendContactRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const needLabels: Record<string, string> = {
      standard: 'Standard product order',
      sample: 'Product sample request',
      custom: 'Custom printed packaging',
      reorder: 'Reorder or account support',
      sustainability: 'Sustainable material program',
    }
    const body = [
      `Company: ${contactRequest.company}`,
      `Need: ${needLabels[contactRequest.need] || contactRequest.need}`,
      '',
      contactRequest.message,
    ].join('\n')

    window.open(`mailto:orders@nexgenpac.com?subject=${encodeURIComponent(`Packaging inquiry — ${contactRequest.company}`)}&body=${encodeURIComponent(body)}`, '_self')
    setContactEmailOpened(true)
  }

  return (
    <div className="site-shell">
      <RouteScrollManager />
      <header className="site-header">
        <Link className={`header-brand${headerBrandVisible ? ' visible' : ''}`} to="/" aria-label="Nexgen Packaging Group home">
          <img src={nexgenLogo} alt="" />
        </Link>
        <button
          className="mobile-menu"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav id="primary-navigation" className={menuOpen ? 'open' : ''} aria-label="Primary navigation">
          <NavLink to="/custom" onClick={() => setMenuOpen(false)}>Custom</NavLink>
          <NavLink to="/products" onClick={() => setMenuOpen(false)}>Products</NavLink>
          <NavLink to="/industries" onClick={() => setMenuOpen(false)}>Industries</NavLink>
          <NavLink to="/capabilities" onClick={() => setMenuOpen(false)}>Capabilities</NavLink>
          <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
        </nav>

        <button
          className={`mobile-menu-backdrop${menuOpen ? ' open' : ''}`}
          type="button"
          aria-label="Close navigation menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
        />

        <div className="header-controls">
          <NavLink className="account-action" to="/account" aria-label={customerSession ? 'Open customer account' : 'Customer sign in'}>
            <UserRound size={19} />
          </NavLink>
          <Link className="header-action" to="/cart" aria-label="Open quote cart">
            <ShoppingCart size={17} />
          </Link>
        </div>
      </header>

      <main id="top">
        <Routes>
          <Route
            path="/"
            element={
              <>
        <section className="hero-section">
          <div className="hero-media" aria-hidden="true">
            <picture>
              <source media="(max-width: 560px)" srcSet="/hero/mobile-storefront-hero-v2.jpg" />
              <img src={heroImage} alt="" />
            </picture>
          </div>

          <div className="hero-copy">
            <img className="hero-logo" src={nexgenLogo} alt="Nexgen Packaging Group" />
            <p>Packaging procurement, built for modern foodservice teams.</p>
            <div className="hero-actions">
              <Link className="primary-button" to="/custom">
                <Sparkles className="hero-action-icon" size={17} />
                <span>Design a custom cup</span>
                <ArrowRight className="hero-action-arrow" size={17} />
              </Link>
              <Link className="secondary-button" to="/products">
                <PackageOpen className="hero-action-icon" size={17} />
                <span>Browse products</span>
                <ArrowRight className="hero-action-arrow" size={17} />
              </Link>
              <Link className="secondary-button" to="/capabilities">
                <Settings2 className="hero-action-icon" size={17} />
                <span>See capabilities</span>
                <ArrowRight className="hero-action-arrow" size={17} />
              </Link>
            </div>
          </div>

          <aside className="hero-order quote-start-card" aria-label="Start a quote request">
            <div className="panel-heading">
              <span className="icon-tile">
                <ClipboardList size={20} />
              </span>
              <div>
                <p className="eyebrow">Quote builder</p>
                <h2>Build the right packaging program.</h2>
              </div>
            </div>

            <p className="quote-start-copy">Choose products, configure quantities and printing, upload artwork, and send one complete request to the NexGen sales team.</p>
            <ol className="quote-start-steps">
              <li><span>1</span>Select products and sizes</li>
              <li><span>2</span>Add printing and artwork</li>
              <li><span>3</span>Request final pricing</li>
            </ol>
            {cartDetails.length > 0 ? (
              <div className="quote-start-progress">
                <span><strong>{cartDetails.length}</strong> product{cartDetails.length === 1 ? '' : 's'}</span>
                <span><strong>{totalCases}</strong> case{totalCases === 1 ? '' : 's'}</span>
              </div>
            ) : null}
            <Link className="primary-button full-width" to={cartDetails.length > 0 ? '/cart' : '/products'}>
              {cartDetails.length > 0 ? 'Review cart' : 'Browse products'} <ArrowRight size={18} />
            </Link>
          </aside>
        </section>

        <section className="trust-band" aria-label="Nexgen strengths">
          {[
            ['5', 'manufacturing and distribution locations'],
            ['500k+', 'square feet in St. Louis and New Jersey'],
            ['50+', 'paper converting and plastic processing machines'],
            ['SQF', 'food-grade packaging certification story'],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section className="home-paths" aria-labelledby="home-paths-title">
          <div className="section-intro">
            <p className="eyebrow">Choose where to start</p>
            <h2 id="home-paths-title">A clearer path to the packaging you need.</h2>
          </div>
          <div className="home-path-grid">
            <Link to="/products">
              <Boxes size={24} />
              <span>Browse the catalog</span>
              <small>Explore organized product families, applications, and specifications.</small>
              <ArrowRight size={18} />
            </Link>
            <Link to="/industries">
              <Store size={24} />
              <span>Shop by industry</span>
              <small>Start with pizza, prepared foods, convenience, delivery, or processing.</small>
              <ArrowRight size={18} />
            </Link>
            <Link to="/custom">
              <Sparkles size={24} />
              <span>Create a custom product</span>
              <small>Choose a NexGen cup, add artwork, and prepare a custom-print request.</small>
              <ArrowRight size={18} />
            </Link>
            <Link to="/contact">
              <Mail size={24} />
              <span>Start with the sales team</span>
              <small>Send a custom requirement when the right product is not obvious.</small>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
        <TradeShowCalendar />
              </>
            }
          />

          <Route
            path="/custom"
            element={
              <CustomProductBuilderPage
                products={allProducts}
                onAdd={(productId, cases, size, configuration) =>
                  updateCart(productId, cases, size, configuration)
                }
              />
            }
          />
          <Route path="/build-a-box" element={<Navigate replace to="/custom" />} />

          <Route path="/products" element={<CatalogHubPage />} />
          <Route path="/products/paper" element={<ProductCollectionPage division="paper" products={paperProducts} />} />
          <Route path="/products/plastic" element={<ProductCollectionPage division="plastic" products={plasticProducts} />} />

          <Route
            path="/products/:productId"
            element={
              <ProductDetailPage
                products={allProducts}
                cart={cart}
                onAdd={(productId, cases, size, configuration) => updateCart(productId, cases, size, configuration)}
                onRequestSample={(itemNumber) => setContactRequest((current) => ({
                  ...current,
                  need: 'sample',
                  message: current.message || `I would like to request a sample of Item ${itemNumber}.`,
                }))}
              />
            }
          />

          <Route
            path="/cart"
            element={
              <CartPage
                items={cartDetails}
                totalCases={totalCases}
                account={customerAccount}
                signedIn={Boolean(customerSession)}
                contact={buyer}
                requestReady={quoteRequestReady}
                requestLoading={quoteRequestLoading}
                requestError={quoteRequestError}
                onContactChange={updateQuoteContact}
                onQuantityChange={(productId, delta) => updateCart(productId, delta)}
                onRemove={removeCartItem}
                onSubmit={sendQuoteRequest}
              />
            }
          />

          <Route path="/industries" element={<IndustriesHubPage />} />
          <Route path="/industries/:industryId" element={<IndustryDetailPage />} />

          <Route
            path="/account"
            element={
              customerSession ? (
                <CustomerAccountPage
                  account={customerAccount}
                  orders={customerOrders}
                  onSave={updateCustomerAccount}
                  onSignOut={signOutCustomer}
                  syncStatus={customerSyncStatus}
                  lastSyncedAt={customerLastSyncedAt}
                />
              ) : (
                <CustomerLoginPage
                  logoUrl={nexgenLogo}
                  loading={customerLoginLoading}
                  error={customerLoginError}
                  message={customerLoginMessage}
                  recoveryToken={passwordRecovery?.token || ''}
                  recoveryError={passwordRecovery?.error || ''}
                  onLogin={signInCustomer}
                  onRegister={registerCustomer}
                  onResetRequest={requestPasswordReset}
                  onPasswordUpdate={changePassword}
                  onClearFeedback={clearCustomerLoginFeedback}
                />
              )
            }
          />
          <Route
            path="/account/orders/:orderId"
            element={
              customerSession ? (
                <CustomerOrderDetailPage
                  account={customerAccount}
                  orders={customerOrders}
                  onReorder={reorderFromHistory}
                />
              ) : (
                <CustomerLoginPage
                  logoUrl={nexgenLogo}
                  loading={customerLoginLoading}
                  error={customerLoginError}
                  message={customerLoginMessage}
                  recoveryToken={passwordRecovery?.token || ''}
                  recoveryError={passwordRecovery?.error || ''}
                  onLogin={signInCustomer}
                  onRegister={registerCustomer}
                  onResetRequest={requestPasswordReset}
                  onPasswordUpdate={changePassword}
                  onClearFeedback={clearCustomerLoginFeedback}
                />
              )
            }
          />
          <Route path="/portal" element={<Navigate to="/account" replace />} />

          <Route
            path="/capabilities"
            element={<section className="capabilities-section page-section" id="capabilities">
          <div className="section-intro">
            <p className="eyebrow">NexGen capabilities</p>
            <h2>Manufacturing, customization, and supply support in one packaging partner.</h2>
          </div>

          <div className="capability-grid">
            {[
              [Factory, 'Domestic manufacturing', 'Paper converting, plastic extrusion, thermoforming, printing, and distribution under one supply strategy.'],
              [Sparkles, 'Custom brand packaging', 'Structural development, sampling, flexographic printing, dry-offset plastic printing, dielines, and short-to-medium runs.'],
              [Leaf, 'Eco-advanced materials', 'Recycled paper, recycled plastic, compostable, biodegradable, recyclable, PFAS-free, and food-contact safe options.'],
              [Boxes, 'Mixed truckload programs', 'Paper and plastic items consolidated into smarter replenishment programs for multi-unit operators.'],
              [ShieldCheck, 'Compliance tracking', 'Spec approvals, food-grade certifications, responsible sourcing documents, and branded item control.'],
              [Recycle, 'Sustainability reporting', 'Material recommendations and account-level sustainability summaries customers can use internally.'],
            ].map(([Icon, title, copy]) => (
              <article className="capability-card" key={title as string}>
                <span className="icon-tile">
                  <Icon size={20} />
                </span>
                <h3>{title as string}</h3>
                <p>{copy as string}</p>
              </article>
            ))}
          </div>
        </section>}
          />

          <Route
            path="/contact"
            element={<section className="contact-section page-section" id="contact">
          <div>
            <p className="eyebrow">Contact NexGen</p>
            <h2>Tell us what you need. We’ll help complete the order.</h2>
            <p>
              Share the product, quantity, artwork, timing, and delivery requirements. Our team will
              confirm specifications, pricing, availability, and next steps.
            </p>
          </div>

          <form className="contact-card" onSubmit={sendContactRequest}>
            <label>
              Company
              <input
                required
                autoComplete="organization"
                placeholder="Company name"
                value={contactRequest.company}
                onChange={(event) => setContactRequest((current) => ({ ...current, company: event.target.value }))}
              />
            </label>
            <label>
              Need
              <select
                value={contactRequest.need}
                onChange={(event) => setContactRequest((current) => ({ ...current, need: event.target.value }))}
              >
                <option value="standard">Standard product order</option>
                <option value="sample">Product sample request</option>
                <option value="custom">Custom printed packaging</option>
                <option value="reorder">Reorder or account support</option>
                <option value="sustainability">Sustainable material program</option>
              </select>
            </label>
            <label>
              Message
              <textarea
                required
                placeholder="Products, quantities, artwork, timing, and delivery location"
                value={contactRequest.message}
                onChange={(event) => setContactRequest((current) => ({ ...current, message: event.target.value }))}
              />
            </label>
            <button className="primary-button full-width" type="submit">
              {contactEmailOpened ? <Check size={18} /> : <Mail size={18} />}
              {contactEmailOpened ? 'Email ready' : 'Email NexGen sales'}
            </button>
          </form>
        </section>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer>
        <div className="footer-links">
          <span>
            <Phone size={15} /> (833) 853-1243
          </span>
          <span>
            <Mail size={15} /> orders@nexgenpac.com
          </span>
          <span>
            <MapPin size={15} /> Bridgeton, MO
          </span>
        </div>
        <Link to="/">
          Home <ChevronRight size={15} />
        </Link>
      </footer>
    </div>
  )
}

export default App

type CustomProductBuilderProps = {
  products: Product[]
  onAdd: (productId: string, cases: number, size: string, configuration: CartConfiguration) => void
}

const defaultInkColors = ['#0a6a56', '#f58220', '#0b78a3', '#d33f32']

function CustomProductBuilderPage({ products, onAdd }: CustomProductBuilderProps) {
  const cupProducts = useMemo(
    () => products.filter((product) => {
      const name = product.name.toLowerCase()
      const standaloneLid = name.includes('lid') && !name.includes('cups')
      return name.includes('cup') && !standaloneLid && !name.includes('sleeve') && product.maxPrintColors !== 0
    }),
    [products],
  )
  const [selectedProductId, setSelectedProductId] = useState(cupProducts[0]?.id || '')
  const selectedProduct = cupProducts.find((product) => product.id === selectedProductId) || cupProducts[0]
  const productSizes = selectedProduct?.sizes.length ? selectedProduct.sizes : ['Size confirmed with quote']
  const [selectedSize, setSelectedSize] = useState(productSizes[0] || '')
  const [cases, setCases] = useState(100)
  const [printColors, setPrintColors] = useState<PrintColorCount>(1)
  const [inkColors, setInkColors] = useState(defaultInkColors)
  const [artworkName, setArtworkName] = useState('')
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null)
  const [artworkAdjustment, setArtworkAdjustment] = useState<ArtworkAdjustment>(defaultArtworkAdjustment)
  const [dragStart, setDragStart] = useState<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null)
  const [added, setAdded] = useState(false)

  useEffect(() => () => {
    if (artworkPreview) URL.revokeObjectURL(artworkPreview)
  }, [artworkPreview])

  if (!selectedProduct) {
    return (
      <section className="box-builder-section page-section">
        <div className="section-intro">
          <p className="eyebrow">Custom</p>
          <h2>Custom products are being prepared.</h2>
          <p>Please contact the NexGen team to start a custom-print program.</p>
        </div>
      </section>
    )
  }

  const maxPrintColors = Math.max(1, selectedProduct.maxPrintColors || 4)
  const activePrintColors = Math.min(printColors, maxPrintColors) as PrintColorCount
  const selectedCupIsPlastic = selectedProduct.division === 'plastic' ||
    /plastic|polypropylene|\bpet\b|\bpp\b|\bpla\b/i.test(selectedProduct.material)
  const updateArtwork = <Key extends keyof ArtworkAdjustment>(key: Key, value: ArtworkAdjustment[Key]) => {
    setArtworkAdjustment((current) => ({ ...current, [key]: value }))
    setAdded(false)
  }

  const selectProduct = (productId: string) => {
    const product = cupProducts.find((item) => item.id === productId)
    if (!product) return
    setSelectedProductId(productId)
    setSelectedSize(product.sizes[0] || 'Size confirmed with quote')
    setPrintColors((current) => Math.min(current, Math.max(1, product.maxPrintColors || 4)) as PrintColorCount)
    setAdded(false)
  }

  const uploadArtwork = (file: File | undefined) => {
    if (!file) return
    setArtworkPreview(URL.createObjectURL(file))
    setArtworkName(file.name)
    setArtworkAdjustment(defaultArtworkAdjustment)
    setAdded(false)
  }

  return (
    <section className="box-builder-section custom-builder-section page-section" id="custom-builder">
      <div className="section-intro custom-builder-intro">
        <div>
          <p className="eyebrow">Custom product studio</p>
          <h2>Put your brand on a NexGen cup.</h2>
          <p>
            Start with a cup already in the NexGen catalog, upload your artwork, choose up to four
            print colors, and arrange the logo for a custom quote.
          </p>
        </div>
        <div className="custom-studio-assurances" aria-label="Custom program process">
          <span><Check size={15} /> NexGen product base</span>
          <span><Check size={15} /> Up to four print colors</span>
          <span><Check size={15} /> Prepress review included</span>
        </div>
      </div>

      <div className="box-builder-layout custom-builder-layout">
        <div className="box-controls custom-builder-controls" aria-label="Custom cup controls">
          <div className="custom-builder-step">
            <div className="custom-builder-step-heading">
              <span>1</span>
              <div>
                <h3>Choose a cup</h3>
                <p>Select a current NexGen product as the starting point.</p>
              </div>
            </div>
            <label>
              Product
              <select value={selectedProduct.id} onChange={(event) => selectProduct(event.target.value)}>
                {cupProducts.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <div className="custom-selected-product">
              <img src={selectedProduct.image} alt="" />
              <div>
                <strong>{selectedProduct.name}</strong>
                <span>{selectedProduct.material}</span>
                <small>{selectedProduct.casePack}</small>
              </div>
            </div>
          </div>

          <div className="custom-builder-step">
            <div className="custom-builder-step-heading">
              <span>2</span>
              <div>
                <h3>Choose size and quantity</h3>
                <p>NexGen will confirm minimums and final case pack.</p>
              </div>
            </div>
            <div className="custom-size-quantity-grid">
              <label>
                Size or format
                <select value={selectedSize} onChange={(event) => { setSelectedSize(event.target.value); setAdded(false) }}>
                  {productSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <label>
                Estimated cases
                <input
                  min={1}
                  max={10000}
                  type="number"
                  value={cases}
                  onChange={(event) => { setCases(Math.max(1, Number(event.target.value) || 1)); setAdded(false) }}
                />
              </label>
            </div>
          </div>

          <div className="custom-builder-step">
            <div className="custom-builder-step-heading">
              <span>3</span>
              <div>
                <h3>Add artwork</h3>
                <p>PNG, JPG, SVG, or WebP files work for this placement preview.</p>
              </div>
            </div>
            <label className="custom-artwork-upload">
              <Upload size={18} />
              <span>{artworkName || 'Upload a logo or graphic'}</span>
              <small>{artworkName ? 'Choose a different file' : 'High-resolution or vector artwork is recommended'}</small>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp"
                onChange={(event) => uploadArtwork(event.target.files?.[0])}
              />
            </label>

            <div className="custom-artwork-controls">
              <label>
                Logo size
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={artworkAdjustment.size}
                  onChange={(event) => updateArtwork('size', Number(event.target.value))}
                />
              </label>
              <div className="logo-slider-grid">
                <label>
                  Left / right
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={artworkAdjustment.x}
                    onChange={(event) => updateArtwork('x', Number(event.target.value))}
                  />
                </label>
                <label>
                  Up / down
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={artworkAdjustment.y}
                    onChange={(event) => updateArtwork('y', Number(event.target.value))}
                  />
                </label>
              </div>
              <label>
                Rotation
                <input
                  type="range"
                  min={-45}
                  max={45}
                  value={artworkAdjustment.rotate}
                  onChange={(event) => updateArtwork('rotate', Number(event.target.value))}
                />
              </label>
              <button type="button" onClick={() => { setArtworkAdjustment(defaultArtworkAdjustment); setAdded(false) }}>
                <RotateCcw size={15} /> Reset placement
              </button>
            </div>
          </div>

          <div className="custom-builder-step">
            <div className="custom-builder-step-heading">
              <span>4</span>
              <div>
                <h3>Choose print colors</h3>
                <p>Select the number of spot colors, then set the requested ink colors.</p>
              </div>
            </div>
            <div className="print-count-options" aria-label="Number of print colors">
              {([1, 2, 3, 4] as PrintColorCount[]).filter((count) => count <= maxPrintColors).map((count) => (
                <button
                  className={activePrintColors === count ? 'selected' : ''}
                  key={count}
                  type="button"
                  aria-pressed={activePrintColors === count}
                  onClick={() => { setPrintColors(count); setAdded(false) }}
                >
                  {count} color{count === 1 ? '' : 's'}
                </button>
              ))}
            </div>
            <div className="custom-ink-grid">
              {inkColors.slice(0, activePrintColors).map((color, index) => (
                <label key={index}>
                  Color {index + 1}
                  <span className="custom-ink-picker">
                    <input
                      type="color"
                      value={color}
                      aria-label={`Choose print color ${index + 1}`}
                      onChange={(event) => {
                        setInkColors((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))
                        setAdded(false)
                      }}
                    />
                    {color.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            className="primary-button full-width"
            type="button"
            onClick={() => {
              onAdd(selectedProduct.id, cases, selectedSize, {
                material: selectedProduct.material,
                printColors: activePrintColors,
                inkColors: inkColors.slice(0, activePrintColors),
                artworkName: artworkName || 'Artwork to follow',
                artworkPreview: artworkPreview || undefined,
                artworkPosition: artworkAdjustment,
              })
              setAdded(true)
            }}
          >
            <Plus size={18} /> Add custom cup to quote
          </button>
          {added ? (
            <div className="custom-builder-added" role="status">
              <Check size={17} />
              <span>Custom cup added.</span>
              <Link to="/cart">Review quote <ArrowRight size={15} /></Link>
            </div>
          ) : null}
        </div>

        <div className="box-preview-panel custom-preview-panel">
          <div
            className={dragStart ? 'box-preview-stage custom-preview-stage dragging' : 'box-preview-stage custom-preview-stage'}
            onPointerDown={(event) => {
              if (!artworkPreview) return
              event.currentTarget.setPointerCapture(event.pointerId)
              setDragStart({
                pointerX: event.clientX,
                pointerY: event.clientY,
                x: artworkAdjustment.x,
                y: artworkAdjustment.y,
              })
            }}
            onPointerMove={(event) => {
              if (!dragStart) return
              setArtworkAdjustment((current) => ({
                ...current,
                x: Math.max(-50, Math.min(50, dragStart.x + (event.clientX - dragStart.pointerX) * 0.25)),
                y: Math.max(-50, Math.min(50, dragStart.y + (event.clientY - dragStart.pointerY) * 0.25)),
              }))
              setAdded(false)
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
              setDragStart(null)
            }}
            onPointerCancel={() => setDragStart(null)}
            role="img"
            aria-label={`Live custom preview of ${selectedProduct.name}`}
          >
            <div className="custom-preview-badge"><i /> Live product mockup</div>
            <div className={`custom-cup-model ${selectedCupIsPlastic ? 'plastic' : 'paper'}`}>
              <img
                className="custom-cup-product-image"
                src={selectedCupIsPlastic
                  ? '/product-images/custom-builder/blank-plastic-cup-v1.png'
                  : '/product-images/custom-builder/blank-paper-cup-v1.png'}
                alt=""
              />
              <div className="custom-artwork-window">
                {artworkPreview ? (
                  <img
                    src={artworkPreview}
                    alt="Uploaded artwork preview"
                    style={{
                      width: `${artworkAdjustment.size}%`,
                      height: `${artworkAdjustment.size}%`,
                      transform: `translate(calc(-50% + ${artworkAdjustment.x}%), calc(-50% + ${artworkAdjustment.y}%)) rotate(${artworkAdjustment.rotate}deg)`,
                    }}
                  />
                ) : (
                  <span style={{ color: inkColors[0] }}>YOUR<br />ARTWORK</span>
                )}
              </div>
            </div>
            <div className="custom-preview-instruction">
              <Sparkles size={16} />
              {artworkPreview ? 'Drag the artwork on the cup to reposition it' : 'Upload artwork to begin arranging it'}
            </div>
          </div>

          <div className="box-spec-summary custom-spec-summary">
            <span><strong>{selectedCupIsPlastic ? 'Plastic' : 'Paper'}</strong>Product</span>
            <span><strong>{selectedSize}</strong>Selected size</span>
            <span><strong>{activePrintColors}</strong>Print color{activePrintColors === 1 ? '' : 's'}</span>
            <span><strong>{cases}</strong>Estimated cases</span>
          </div>

          <div className="box-preview-notes custom-preview-notes">
            <div className="custom-preview-title">
              <div>
                <p>{selectedProduct.name}</p>
                <small>{selectedProduct.material}</small>
              </div>
              <div className="custom-preview-inks" aria-label="Selected print colors">
                {inkColors.slice(0, activePrintColors).map((color, index) => (
                  <i key={index} style={{ backgroundColor: color }} title={`Color ${index + 1}: ${color}`} />
                ))}
              </div>
            </div>
            <small>
              This is a placement preview. NexGen prepress will confirm the production artwork,
              color matches, printable area, minimums, and final pricing before production.
            </small>
          </div>
        </div>
      </div>
    </section>
  )
}

function CatalogHubPage() {
  return (
    <section className="catalog-hub-page page-section">
      <header className="catalog-hub-intro">
        <p className="eyebrow">Products</p>
        <h1>Start with the material.</h1>
        <p>Choose paper or plastic, then open a product family to select its exact size, material, quantity, and printing.</p>
      </header>

      <div className="catalog-division-grid">
        <Link className="catalog-division-card paper" to="/products/paper">
          <div className="catalog-division-copy">
            <span>Paper</span>
            <h2>Paper packaging</h2>
            <p>Cups, food boxes, trays, pizza packaging, bags, and accessories.</p>
            <strong>Explore paper <ArrowRight size={18} /></strong>
          </div>
          <div className="catalog-division-images" aria-hidden="true">
            <img src="/product-images/catalog/24oz-fiber-bowl.jpg" alt="" />
            <img src="/product-images/catalog/16in-pizza-box.jpg" alt="" />
          </div>
        </Link>

        <Link className="catalog-division-card plastic" to="/products/plastic">
          <div className="catalog-division-copy">
            <span>Plastic</span>
            <h2>Plastic packaging</h2>
            <p>Beverage cups, food cups, trays, bowls, entrée containers, and bottles.</p>
            <strong>Explore plastic <ArrowRight size={18} /></strong>
          </div>
          <div className="catalog-division-images" aria-hidden="true">
            <img src="/product-images/catalog/20oz-stadium-cup.jpg" alt="" />
            <img src="/product-images/catalog/32oz-pp-container.jpg" alt="" />
          </div>
        </Link>
      </div>

      <div className="catalog-hub-note">
        <ShieldCheck size={20} />
        <p><strong>Built from NexGen’s current line cards.</strong> Product families are grouped so every available size lives on one page. Case packs, minimums, and final availability are confirmed with the quote.</p>
      </div>
    </section>
  )
}

type ProductCollectionPageProps = {
  division: Exclude<ProductDivision, 'both'>
  products: Product[]
}

function ProductCollectionPage({ division, products }: ProductCollectionPageProps) {
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const title = division === 'paper' ? 'Paper packaging' : 'Plastic packaging'
  const description = division === 'paper'
    ? 'Cups, cartons, trays, pizza packaging, and foodservice accessories in one organized collection.'
    : 'Cups, lids, food containers, produce trays, party formats, and beverage bottles.'
  const categories = ['All', ...Array.from(new Set(products.map((product) => product.category)))]
  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category
    const text = `${product.name} ${product.description} ${product.material} ${product.badges.join(' ')}`.toLowerCase()
    return matchesCategory && text.includes(query.trim().toLowerCase())
  })

  return (
    <section className={`product-collection-page page-section ${division}`}>
      <div className="product-breadcrumb">
        <Link to="/products"><ArrowLeft size={16} /> All products</Link>
        <span>/</span>
        <span>{title}</span>
      </div>

      <header className="product-collection-hero">
        <div className="product-collection-hero-copy">
          <p className="eyebrow">{division} collection</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <h1 className="product-collection-mobile-title">{division} collection</h1>
        <span className="collection-count"><strong>{products.length}</strong> product families</span>
      </header>

      <div className="product-collection-tools">
        <div className="product-collection-categories" aria-label={`${title} categories`}>
          {categories.map((item) => (
            <button key={item} type="button" className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>
              {item === 'All' ? 'All products' : item}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${division} products`} />
        </label>
      </div>

      <div className="product-collection-results">
        <div className="results-bar">
          <div>
            <p className="eyebrow">{category === 'All' ? title : category}</p>
            <h2>{filteredProducts.length} product {filteredProducts.length === 1 ? 'family' : 'families'}</h2>
          </div>
          <span>Open a product to choose its available options.</span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="catalog-empty" role="status">
            <Search size={22} />
            <div><strong>No matching product family.</strong><span>Clear the search or choose another category.</span></div>
          </div>
        )}
      </div>
    </section>
  )
}

type ProductCardProps = {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <Link className="product-image-link" to={`/products/${product.id}`}>
        <img src={product.image} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-card-body">
        <div className="product-meta">
          <span>{product.category}</span>
          <span>{product.stockType || `${product.sizes.length} format ${product.sizes.length === 1 ? 'option' : 'options'}`}</span>
        </div>
        <Link className="product-name-link" to={`/products/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <p>{product.description}</p>
        <div className="badge-list">
          {product.badges.slice(0, 2).map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
        <Link
          className="product-card-open"
          to={`/products/${product.id}`}
          aria-label={`Open ${product.name}`}
          title={`Open ${product.name}`}
        >
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  )
}

const industryIcons: Record<string, typeof Factory> = {
  'pizza-qsr': Pizza,
  'deli-bakery-prepared-foods': Utensils,
  'convenience-foodservice': Store,
  'takeout-delivery': ShoppingBag,
  'food-processors': Factory,
}

function IndustriesHubPage() {
  return (
    <section className="industries-hub page-section">
      <div className="industry-hub-intro">
        <p className="eyebrow">Industries</p>
        <h1>Start with how the packaging will be used.</h1>
        <p>
          Different foodservice operations ask different things of a package. Choose the closest
          industry to see a focused group of products and the requirements worth discussing first.
        </p>
      </div>

      <div className="industry-card-grid">
        {industries.map((industry, index) => {
          const Icon = industryIcons[industry.id] ?? Boxes
          return (
            <Link key={industry.id} to={`/industries/${industry.id}`}>
              <div className="industry-card-heading">
                <span className="industry-number">0{index + 1}</span>
                <span className="icon-tile"><Icon size={20} /></span>
              </div>
              <h2>{industry.title}</h2>
              <p>{industry.shortDescription}</p>
              <span className="industry-card-link">
                Explore industry <ArrowRight size={17} />
              </span>
            </Link>
          )
        })}
      </div>

      <div className="industry-hub-guidance">
        <div>
          <p className="eyebrow">Not sure where to start?</p>
          <h2>Describe the food, operation, and delivery path.</h2>
        </div>
        <p>
          NexGen can help narrow the format once the team understands what is being packed, how it
          is filled, where it is sold, and how it reaches the customer.
        </p>
        <Link className="primary-button" to="/contact">
          Start a project <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  )
}

function IndustryDetailPage() {
  const { industryId } = useParams()
  const industry = industries.find((item) => item.id === industryId)

  if (!industry) {
    return <Navigate to="/industries" replace />
  }

  const Icon = industryIcons[industry.id] ?? Boxes
  const industryProducts = industry.productIds
    .map((productId) => curatedProducts.find((product) => product.id === productId))
    .filter((product): product is Product => Boolean(product))

  return (
    <section className="industry-detail-page page-section">
      <div className="product-breadcrumb">
        <Link to="/industries">
          <ArrowLeft size={16} /> All industries
        </Link>
        <span>/</span>
        <span>{industry.title}</span>
      </div>

      <div className="industry-detail-hero">
        <div>
          <span className="industry-hero-icon"><Icon size={28} /></span>
          <p className="eyebrow">{industry.title}</p>
          <h1>{industry.headline}</h1>
        </div>
        <div className="industry-detail-copy">
          <p>{industry.description}</p>
          <Link className="primary-button" to="/contact">
            Discuss a program <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      <div className="industry-needs" aria-label={`Common ${industry.title} packaging needs`}>
        {industry.needs.map((need, index) => (
          <div key={need}>
            <span>0{index + 1}</span>
            <strong>{need}</strong>
          </div>
        ))}
      </div>

      <div className="industry-products-section">
        <div className="industry-section-heading">
          <div>
            <p className="eyebrow">Relevant product families</p>
            <h2>A focused place to begin.</h2>
          </div>
          <Link to="/products">
            View the full catalog <ArrowRight size={16} />
          </Link>
        </div>

        <div className="industry-product-grid">
          {industryProducts.map((product) => (
            <Link key={product.id} to={`/products/${product.id}`}>
              <img src={product.image} alt="" loading="lazy" />
              <div>
                <small>{product.category}</small>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <span>View options <ChevronRight size={16} /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="industry-operating-model">
        <div className="industry-section-heading">
          <div>
            <p className="eyebrow">Connected support</p>
            <h2>More than a product search.</h2>
          </div>
        </div>
        <div className="industry-support-grid">
          <article>
            <Ruler size={20} />
            <h3>Define the requirement</h3>
            <p>Start with the food, format, operational constraints, quantity, timing, and distribution path.</p>
          </article>
          <article>
            <Sparkles size={20} />
            <h3>Develop the package</h3>
            <p>Coordinate structure, material route, tooling, print, artwork, sourcing, and samples.</p>
          </article>
          <article>
            <Truck size={20} />
            <h3>Plan the supply program</h3>
            <p>Align production or sourcing with inventory, replenishment, warehousing, and freight needs.</p>
          </article>
        </div>
      </div>

      <div className="industry-final-cta">
        <div>
          <p className="eyebrow">Build the program</p>
          <h2>Bring the known requirements. NexGen can help narrow the rest.</h2>
        </div>
        <Link className="primary-button" to="/contact">
          Start a packaging request <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  )
}

type ProductDetailPageProps = {
  products: Product[]
  cart: CartItem[]
  onAdd: (productId: string, cases: number, size: string, configuration?: CartConfiguration) => void
  onRequestSample: (itemNumber: string) => void
}

function ProductDetailPage({ products, cart, onAdd, onRequestSample }: ProductDetailPageProps) {
  const { productId } = useParams()
  const product = products.find((item) => item.id === productId)

  if (!product) {
    return <Navigate to="/products" replace />
  }

  const cartItem = cart.find((item) => item.productId === product.id)
  return <ProductDetailContent key={product.id} product={product} products={products} cartItem={cartItem} onAdd={onAdd} onRequestSample={onRequestSample} />
}

type ProductDetailContentProps = {
  product: Product
  products: Product[]
  cartItem?: CartItem
  onAdd: ProductDetailPageProps['onAdd']
  onRequestSample: ProductDetailPageProps['onRequestSample']
}

function ProductDetailContent({ product, products, cartItem, onAdd, onRequestSample }: ProductDetailContentProps) {
  const optionGroups = product.optionGroups || [{ label: 'Size or format', options: product.sizes }]
  const firstOption = optionGroups.length > 1
    ? `${optionGroups[0]?.label}: ${optionGroups[0]?.options[0] || ''}`
    : optionGroups[0]?.options[0] || ''
  const [selectedSize, setSelectedSize] = useState(cartItem?.size || firstOption)
  const [selectedMaterial, setSelectedMaterial] = useState(cartItem?.material || product.materials?.[0] || product.material)
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [printColors, setPrintColors] = useState<PrintColorCount>(cartItem?.printColors || 0)
  const [artworkName, setArtworkName] = useState(cartItem?.artworkName || '')
  const [artworkPreview, setArtworkPreview] = useState(cartItem?.artworkPreview || '')
  const [artworkError, setArtworkError] = useState('')
  const [mobileStep, setMobileStep] = useState(1)
  const printableProduct = Boolean(product.maxPrintColors)
  const spec = product.publicSpec
  const relatedPool = product.division
    ? products.filter((item) => item.division === product.division)
    : products
  const relatedProducts = relatedPool
    .filter((item) => item.id !== product.id && (item.category === product.category || item.applications.some((application) => product.applications.includes(application))))
    .slice(0, 3)

  const selectArtwork = (file: File | undefined) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setArtworkError('Artwork files must be 10 MB or smaller for this preview.')
      return
    }

    setArtworkError('')
    setArtworkName(file.name)
    if (printColors === 0) setPrintColors(1)

    if (!file.type.startsWith('image/')) {
      setArtworkPreview('')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setArtworkPreview(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => setArtworkError('This artwork could not be previewed. Try a PNG, JPG, or SVG file.')
    reader.readAsDataURL(file)
  }

  const addConfiguredProduct = () => onAdd(product.id, selectedQuantity, selectedSize, {
    material: selectedMaterial,
    printColors: printableProduct ? printColors : 0,
    artworkName: printableProduct ? artworkName : undefined,
    artworkPreview: printableProduct ? artworkPreview : undefined,
  })

  return (
    <section className="product-detail-page page-section">
      <div className="product-breadcrumb">
        <Link to={product.division ? `/products/${product.division}` : '/products'}>
          <ArrowLeft size={16} /> Back to {product.division || 'all'} products
        </Link>
        <span>/</span>
        <span>{product.category}</span>
      </div>

      <header className="product-detail-mobile-heading">
        <p className="eyebrow">{spec ? `Item ${spec.itemNumber}` : `${product.category} packaging`}</p>
        <h1>{product.name}</h1>
      </header>

      <div className="product-detail-layout">
        <div className="product-detail-media">
          <div className="product-detail-image-stage">
            <img src={product.image} alt={product.name} />
          </div>
          <div className="product-media-caption">
            <span>{spec ? `Item ${spec.itemNumber}` : product.division ? `${product.division} collection` : product.sku || product.category}</span>
            <strong>{spec?.imageStatus === 'Concept' ? 'Concept image · Photography pending' : selectedMaterial}</strong>
          </div>
        </div>

        <div className="product-detail-copy">
          <p className="eyebrow">{spec ? `Item ${spec.itemNumber}` : `${product.category} packaging`}</p>
          <h1>{product.name}</h1>
          <p className="product-detail-lead">{product.description}</p>
          <div className="badge-list product-detail-badges">
            {product.badges.map((badge) => <span key={badge}>{badge}</span>)}
          </div>

          <div className="product-configurator-intro">
            <p className="eyebrow">Configure for a quote</p>
            <h2>Choose what you need.</h2>
            <p>Make each selection below. NexGen will confirm availability, freight, minimums, and final pricing.</p>
          </div>

          <fieldset className={`product-choice-group product-mobile-step${mobileStep === 1 ? ' mobile-open' : ''}`}>
            <legend>
              <button
                className="product-step-trigger"
                type="button"
                aria-expanded={mobileStep === 1}
                aria-controls={`product-size-options-${product.id}`}
                onClick={() => setMobileStep((current) => current === 1 ? 0 : 1)}
              >
                <span className="product-step-number">1</span>
                <span className="product-step-label"><strong>Size or format</strong><small>{selectedSize}</small></span>
                <ChevronRight className="product-step-chevron" size={18} />
              </button>
            </legend>
            <div className="product-option-groups product-step-content" id={`product-size-options-${product.id}`}>
              {optionGroups.map((group) => (
                <div className="product-option-group" key={group.label}>
                  {optionGroups.length > 1 ? <h3>{group.label}</h3> : null}
                  <div className="product-choice-grid">
                    {group.options.map((size) => {
                      const optionValue = optionGroups.length > 1 ? `${group.label}: ${size}` : size
                      return (
                        <label key={optionValue} className={selectedSize === optionValue ? 'selected' : ''}>
                          <input
                            type="radio"
                            name={`product-size-${product.id}`}
                            value={optionValue}
                            checked={selectedSize === optionValue}
                            onChange={() => {
                              setSelectedSize(optionValue)
                              setMobileStep(2)
                            }}
                          />
                          <span>
                            <strong>{size}</strong>
                            <small>{product.casePack}</small>
                          </span>
                          {selectedSize === optionValue ? <Check size={18} /> : null}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className={`product-choice-group product-mobile-step${mobileStep === 2 ? ' mobile-open' : ''}`}>
            <legend>
              <button
                className="product-step-trigger"
                type="button"
                aria-expanded={mobileStep === 2}
                aria-controls={`product-material-options-${product.id}`}
                onClick={() => setMobileStep((current) => current === 2 ? 0 : 2)}
              >
                <span className="product-step-number">2</span>
                <span className="product-step-label"><strong>Material</strong><small>{selectedMaterial}</small></span>
                <ChevronRight className="product-step-chevron" size={18} />
              </button>
            </legend>
            <div className="product-choice-grid material-choice-grid product-step-content" id={`product-material-options-${product.id}`}>
              {(product.materials || [product.material]).map((material) => (
                <label key={material} className={selectedMaterial === material ? 'selected' : ''}>
                  <input
                    type="radio"
                    name={`product-material-${product.id}`}
                    value={material}
                    checked={selectedMaterial === material}
                    onChange={() => {
                      setSelectedMaterial(material)
                      setMobileStep(3)
                    }}
                  />
                  <span><strong>{material}</strong><small>Final compatibility confirmed by NexGen</small></span>
                  {selectedMaterial === material ? <Check size={18} /> : null}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={`product-choice-group product-mobile-step${mobileStep === 3 ? ' mobile-open' : ''}`}>
            <legend>
              <button
                className="product-step-trigger"
                type="button"
                aria-expanded={mobileStep === 3}
                aria-controls={`product-quantity-options-${product.id}`}
                onClick={() => setMobileStep((current) => current === 3 ? 0 : 3)}
              >
                <span className="product-step-number">3</span>
                <span className="product-step-label"><strong>Quantity</strong><small>{selectedQuantity} {selectedQuantity === 1 ? 'case' : 'cases'}</small></span>
                <ChevronRight className="product-step-chevron" size={18} />
              </button>
            </legend>
            <div className="product-quantity-grid product-step-content" id={`product-quantity-options-${product.id}`}>
              {quoteQuantityOptions.map((quantity) => (
                <label key={quantity} className={selectedQuantity === quantity ? 'selected' : ''}>
                  <input
                    type="radio"
                    name={`product-quantity-${product.id}`}
                    value={quantity}
                    checked={selectedQuantity === quantity}
                    onChange={() => {
                      setSelectedQuantity(quantity)
                      if (printableProduct) setMobileStep(4)
                    }}
                  />
                  <strong>{quantity}</strong>
                  <span>{quantity === 1 ? 'case' : 'cases'}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {printableProduct ? (
            <section className={`cup-print-config product-mobile-step${mobileStep === 4 ? ' mobile-open' : ''}`} aria-labelledby="cup-print-heading">
              <button
                className="cup-print-heading product-step-trigger"
                type="button"
                aria-expanded={mobileStep === 4}
                aria-controls={`product-print-options-${product.id}`}
                onClick={() => setMobileStep((current) => current === 4 ? 0 : 4)}
              >
                <span className="product-step-number">4</span>
                <span className="product-step-label">
                  <strong id="cup-print-heading">Custom printing</strong>
                  <small>{printColors === 0 ? 'Unprinted' : `${printColors} color${printColors === 1 ? '' : 's'}`}</small>
                </span>
                <ChevronRight className="product-step-chevron" size={18} />
              </button>

              <div className="product-step-content" id={`product-print-options-${product.id}`}>
                <fieldset className="print-color-options">
                  <legend>Number of print colors</legend>
                  {([0, 1, 2, 3, 4] as PrintColorCount[]).filter((count) => count <= (product.maxPrintColors || 0)).map((count) => (
                    <label key={count} className={printColors === count ? 'selected' : ''}>
                      <input type="radio" name={`print-colors-${product.id}`} value={count} checked={printColors === count} onChange={() => setPrintColors(count)} />
                      <strong>{count === 0 ? 'None' : count}</strong>
                      <span>{count === 0 ? 'Unprinted' : `${count} color${count === 1 ? '' : 's'}`}</span>
                    </label>
                  ))}
                </fieldset>

                {printColors > 0 ? (
                  <div className="cup-artwork-area">
                    <label className="cup-artwork-upload">
                      <Upload size={19} />
                      <span><strong>{artworkName || 'Add your artwork'}</strong><small>PNG, JPG, SVG, PDF, AI, or EPS · 10 MB max</small></span>
                      <input type="file" accept=".ai,.eps,.pdf,.png,.jpg,.jpeg,.svg,image/*" onChange={(event) => selectArtwork(event.target.files?.[0])} />
                    </label>
                    {artworkPreview ? <div className="cup-artwork-preview"><img src={artworkPreview} alt="Uploaded product artwork preview" /><span>Artwork preview</span></div> : null}
                    {artworkError ? <p className="cup-artwork-error" role="alert">{artworkError}</p> : null}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="product-detail-note">
            <ShieldCheck size={20} />
            <div>
              <strong>Reviewed by a packaging specialist.</strong>
              <span>We verify print coverage, lid compatibility, minimums, freight, and delivery timing before sending your quote.</span>
            </div>
          </div>

          <div className="product-detail-actions">
            <button
              className="primary-button"
              type="button"
              onClick={addConfiguredProduct}
            >
              <PackageOpen size={18} />
              Add to quote
              <ArrowRight size={18} />
            </button>
            {cartItem ? <Link className="product-view-cart" to="/cart">View cart <ArrowRight size={17} /></Link> : null}
          </div>

          {spec ? (
            <div className="product-spec-resource-links" aria-label="Product resources">
              <a href={spec.specSheetUrl} download><Download size={17} /> Download specification</a>
              <Link to="/contact" onClick={() => onRequestSample(spec.itemNumber)}>Request a sample <ArrowRight size={16} /></Link>
            </div>
          ) : null}

          <Link className="text-link" to="/contact">
            Need a variation that is not listed? Talk to the sales team <ArrowRight size={16} />
          </Link>
        </div>

        <aside className="product-quote-summary" aria-label="Current quote configuration">
          <p className="eyebrow">Your configuration</p>
          <h2>Quote summary</h2>
          <dl className="product-quote-summary-list">
            <div>
              <dt>Size or format</dt>
              <dd>{selectedSize}</dd>
              <Check size={17} aria-hidden="true" />
            </div>
            <div>
              <dt>Material</dt>
              <dd>{selectedMaterial}</dd>
              <Check size={17} aria-hidden="true" />
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{selectedQuantity} {selectedQuantity === 1 ? 'case' : 'cases'}</dd>
              <Check size={17} aria-hidden="true" />
            </div>
            <div>
              <dt>Printing</dt>
              <dd>
                {printableProduct
                  ? printColors === 0
                    ? 'Unprinted'
                    : `${printColors}-color print${artworkName ? ` · ${artworkName}` : ''}`
                  : 'Standard product'}
              </dd>
              <Check size={17} aria-hidden="true" />
            </div>
          </dl>

          <div className="product-quote-summary-actions">
            <button className="primary-button" type="button" onClick={addConfiguredProduct}>
              Add to quote <ArrowRight size={17} />
            </button>
            {spec ? <a href={spec.specSheetUrl} download><Download size={15} /> Download specification</a> : null}
            {spec ? <Link to="/contact" onClick={() => onRequestSample(spec.itemNumber)}>Request a sample</Link> : null}
            {cartItem ? <Link to="/cart">View quote cart</Link> : null}
          </div>

          <div className="product-summary-trust">
            <ShieldCheck size={17} />
            <span><strong>Reviewed before pricing.</strong> A NexGen specialist confirms compatibility, minimums, freight, and timing.</span>
          </div>
        </aside>
      </div>

      <section className="product-details-strip" aria-labelledby="product-details-title">
        <div>
          <p className="eyebrow">At a glance</p>
          <h2 id="product-details-title">Product details.</h2>
          {spec ? <p className="product-public-spec-note">{spec.sourceNote}</p> : null}
        </div>
        <dl className="product-spec-grid">
          {spec ? (
            <>
              <div><dt>Item / capacity</dt><dd>{spec.itemNumber} · {spec.capacity}</dd></div>
              <div><dt>Dimensions / weight</dt><dd>{spec.dimensions} · {spec.gramWeight}</dd></div>
              <div><dt>Case pack</dt><dd>{product.unitsPerCase || spec.sleevesPerCase * spec.unitsPerSleeve} units · {spec.sleevesPerCase} × {spec.unitsPerSleeve}</dd></div>
              <div><dt>Pallet</dt><dd>{spec.casesPerPallet} cases</dd></div>
            </>
          ) : (
            <>
              <div><dt>Material</dt><dd>{selectedMaterial}</dd></div>
              <div><dt>Case pack</dt><dd>{product.casePack}</dd></div>
              <div><dt>Lead time</dt><dd>{product.leadTime}</dd></div>
              <div><dt>Best for</dt><dd>{product.applications.join(', ')}</dd></div>
            </>
          )}
        </dl>
      </section>

      {relatedProducts.length > 0 && (
        <div className="related-products">
          <div>
            <p className="eyebrow">Related options</p>
            <h2>Continue exploring.</h2>
          </div>
          <div className="related-product-links">
            {relatedProducts.map((item) => (
              <Link key={item.id} to={`/products/${item.id}`}>
                <img src={item.image} alt="" loading="lazy" />
                <span>
                  <small>{item.category}</small>
                  <strong>{item.name}</strong>
                </span>
                <ChevronRight size={17} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

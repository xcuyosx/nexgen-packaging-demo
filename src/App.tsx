import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  ClipboardList,
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
  products as curatedProducts,
  quoteQuantityOptions,
} from './catalog'
import type { Product } from './catalog'
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
  saveCustomerAccount,
  saveCustomerAccountSync,
  saveCustomerOrders,
  saveCustomerSession,
} from './customerAccount'
import type { CustomerAccount, CustomerOrder, CustomerOrderLine, CustomerSession } from './customerAccount'
import type { CartConfiguration, CartItem, PrintColorCount, QuoteContact } from './storefrontCart'
import './App.css'

const heroImage =
  'https://static.wixstatic.com/media/067fd2_0ee5edd567cf45428f5ca53176428944~mv2.jpg/v1/fill/w_980,h_548,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/067fd2_0ee5edd567cf45428f5ca53176428944~mv2.jpg'

const nexgenLogo =
  'https://static.wixstatic.com/media/067fd2_442e8edbc68c491ea121fea22fc5f107~mv2.png/v1/fill/w_918,h_218,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/067fd2_442e8edbc68c491ea121fea22fc5f107~mv2.png'

const boxStyles = ['Mailer box', 'Pizza box', 'Tuck top carton', 'Auto-lock bottom'] as const
const boxMaterials = ['Kraft E-flute', 'White corrugate', 'Recycled paperboard', 'Premium SBS'] as const
const boxPrints = ['No print', 'One-color logo', 'Full-color outside', 'Inside and outside print'] as const
const logoPlacementOptions = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left side' },
  { id: 'right', label: 'Right side' },
  { id: 'top', label: 'Top' },
] as const

type LogoSide = (typeof logoPlacementOptions)[number]['id']

type LogoAdjustment = {
  fit: 'contain' | 'cover'
  size: number
  x: number
  y: number
  rotate: number
}

type BoxSpec = {
  length: number
  width: number
  height: number
  style: (typeof boxStyles)[number]
  material: (typeof boxMaterials)[number]
  print: (typeof boxPrints)[number]
  quantity: number
}

const materialColors: Record<(typeof boxMaterials)[number], string> = {
  'Kraft E-flute': '#b78b5c',
  'White corrugate': '#e9ece5',
  'Recycled paperboard': '#9b8d70',
  'Premium SBS': '#f8f6ef',
}

const catalogCategoryIcons: Record<string, typeof Boxes> = {
  All: Sparkles,
  'Cups & Lids': Utensils,
  'Food Containers': Boxes,
  Pizza,
  'Paper Packaging': Leaf,
  Accessories: ShoppingBag,
}

const defaultLogoAdjustment: LogoAdjustment = {
  fit: 'contain',
  size: 64,
  x: 0,
  y: 0,
  rotate: 0,
}

function RouteScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView())
      return
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [hash, pathname])

  return null
}

function App() {
  const { pathname } = useLocation()
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(loadCustomerSession)
  const customerSessionToken = customerSession?.token || ''
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(storefrontFallbackProducts)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeApplication, setActiveApplication] = useState('All applications')
  const [query, setQuery] = useState('')
  const [visibleProductCount, setVisibleProductCount] = useState(10)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerAccount, setCustomerAccount] = useState<CustomerAccount>(() => customerSession ? loadCustomerAccount() : emptyCustomerAccount)
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>(() => customerSession ? loadCustomerOrders() : [])
  const [customerSyncStatus, setCustomerSyncStatus] = useState<'loading' | 'connected' | 'saving' | 'saved' | 'offline'>(customerSession ? 'loading' : 'offline')
  const [customerLastSyncedAt, setCustomerLastSyncedAt] = useState('')
  const [customerLoginLoading, setCustomerLoginLoading] = useState(false)
  const [customerLoginError, setCustomerLoginError] = useState('')
  const customerSyncRevisionRef = useRef(1)
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerBrandVisible, setHeaderBrandVisible] = useState(pathname !== '/')
  const [quoteRequestReady, setQuoteRequestReady] = useState(false)
  const [buyer, setBuyer] = useState<QuoteContact>({
    name: '',
    company: '',
    email: '',
    purchaseOrder: '',
    billingProfileId: '',
    receivingLocationId: '',
    notes: '',
  })
  const [contactRequest, setContactRequest] = useState({ company: '', need: 'standard', message: '' })
  const [contactEmailOpened, setContactEmailOpened] = useState(false)
  const [boxRotation, setBoxRotation] = useState({ x: -18, y: -28 })
  const [boxDragStart, setBoxDragStart] = useState<{
    x: number
    y: number
    rotation: { x: number; y: number }
  } | null>(null)
  const [logoPanelOpen, setLogoPanelOpen] = useState(false)
  const [logoSides, setLogoSides] = useState<Record<LogoSide, boolean>>({
    front: true,
    back: false,
    left: false,
    right: false,
    top: false,
  })
  const [logoUploads, setLogoUploads] = useState<Record<LogoSide, string | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
    top: null,
  })
  const [activeLogoSide, setActiveLogoSide] = useState<LogoSide>('front')
  const [logoAdjustments, setLogoAdjustments] = useState<Record<LogoSide, LogoAdjustment>>({
    front: defaultLogoAdjustment,
    back: defaultLogoAdjustment,
    left: defaultLogoAdjustment,
    right: defaultLogoAdjustment,
    top: defaultLogoAdjustment,
  })
  const [boxSpec, setBoxSpec] = useState<BoxSpec>({
    length: 12,
    width: 9,
    height: 4,
    style: boxStyles[0],
    material: boxMaterials[0],
    print: boxPrints[1],
    quantity: 500,
  })

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
    if (!customerSessionToken) return
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
  }, [customerSessionToken])

  const signInCustomer = async (email: string, password: string) => {
    setCustomerLoginLoading(true)
    setCustomerLoginError('')
    try {
      const result = await loginCustomerAccount(email, password)
      const session = { token: result.token, accountId: result.accountId, expiresAt: result.expiresAt }
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

  const signOutCustomer = async () => {
    const token = customerSession?.token || ''
    clearCustomerSession()
    setCustomerSession(null)
    setCustomerAccount(emptyCustomerAccount)
    setCustomerOrders([])
    setCustomerLastSyncedAt('')
    setCustomerSyncStatus('offline')
    setCustomerLoginError('')
    try {
      await logoutCustomerAccount(token)
    } catch {
      // Local session state is cleared even if the demo service is temporarily unavailable.
    }
  }

  const categoryOptions = useMemo(
    () => ['All', ...Array.from(new Set(catalogProducts.map((product) => product.category)))],
    [catalogProducts],
  )
  const applicationOptions = useMemo(
    () => ['All applications', ...Array.from(new Set(catalogProducts.flatMap((product) => product.applications))).sort()],
    [catalogProducts],
  )
  const allProducts = useMemo(() => {
    const catalogIds = new Set(catalogProducts.map((product) => product.id))
    return [...catalogProducts, ...curatedProducts.filter((product) => !catalogIds.has(product.id))]
  }, [catalogProducts])
  const productMap = useMemo(() => new Map(allProducts.map((product) => [product.id, product])), [allProducts])

  const filteredProducts = useMemo(() => {
    return catalogProducts.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory
      const matchesApplication =
        activeApplication === 'All applications' || product.applications.includes(activeApplication)
      const text = `${product.name} ${product.material} ${product.description} ${product.badges.join(' ')}`
      return matchesCategory && matchesApplication && text.toLowerCase().includes(query.toLowerCase())
    })
  }, [activeApplication, activeCategory, catalogProducts, query])

  const visibleProducts = filteredProducts.slice(0, visibleProductCount)

  const cartDetails = useMemo(() => {
    return cart
      .map((item) => ({
        ...item,
        product: productMap.get(item.productId),
      }))
      .filter((item): item is CartItem & { product: Product } => Boolean(item.product))
  }, [cart, productMap])

  const totalCases = cartDetails.reduce((total, item) => total + item.cases, 0)
  const boxPreviewStyle = useMemo(
    () =>
      ({
        '--box-width': `${Math.max(160, Math.min(320, boxSpec.length * 16))}px`,
        '--box-depth': `${Math.max(92, Math.min(190, boxSpec.width * 15))}px`,
        '--box-slant': `${Math.max(54, Math.min(112, boxSpec.width * 8))}px`,
        '--box-height': `${Math.max(58, Math.min(160, boxSpec.height * 17))}px`,
        '--box-color': materialColors[boxSpec.material],
        '--box-rotation-x': `${boxRotation.x}deg`,
        '--box-rotation-y': `${boxRotation.y}deg`,
      }) as CSSProperties,
    [boxSpec, boxRotation],
  )

  const estimatedCases = Math.max(1, Math.ceil(boxSpec.quantity / 100))
  const selectedLogoSides = logoPlacementOptions.filter((side) => logoSides[side.id])
  const visibleLogoSide = logoSides[activeLogoSide] ? activeLogoSide : selectedLogoSides[0]?.id

  const updateBoxNumber = (field: 'length' | 'width' | 'height' | 'quantity', value: number) => {
    const limits = {
      length: [4, 30],
      width: [3, 24],
      height: [1, 18],
      quantity: [50, 10000],
    } as const

    const [min, max] = limits[field]
    setBoxSpec((current) => ({
      ...current,
      [field]: Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)),
    }))
  }

  const updateCart = (productId: string, delta: number, size?: string, configuration?: CartConfiguration) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      if (!existing && delta > 0) {
        return [...current, {
          productId,
          cases: delta,
          size,
          printColors: configuration?.printColors || 0,
          artworkName: configuration?.artworkName,
          artworkPreview: configuration?.artworkPreview,
        }]
      }

      return current
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                cases: Math.max(0, item.cases + delta),
                size: size ?? item.size,
                printColors: configuration?.printColors ?? item.printColors,
                artworkName: configuration?.artworkName ?? item.artworkName,
                artworkPreview: configuration?.artworkPreview ?? item.artworkPreview,
              }
            : item,
        )
        .filter((item) => item.cases > 0)
    })
  }

  const removeCartItem = (productId: string) => setCart((current) => current.filter((item) => item.productId !== productId))

  const updateQuoteContact = (field: keyof QuoteContact, value: string) => {
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

  const sendQuoteRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cartDetails.length) return

    const billingProfile = customerAccount.billingProfiles.find((profile) => profile.id === buyer.billingProfileId)
    const receivingLocation = customerAccount.receivingLocations.find((location) => location.id === buyer.receivingLocationId)

    const lines = cartDetails.map((item) => {
      const printing = item.printColors > 0 ? `${item.printColors}-color print${item.artworkName ? ` — artwork: ${item.artworkName}` : ' — artwork to follow'}` : 'unprinted'
      return `${item.cases} case${item.cases === 1 ? '' : 's'} — ${item.product.name} (${item.product.sku || item.product.id}) — ${item.size || item.product.sizes[0]} — ${printing}`
    })
    const body = [
      `Name: ${buyer.name}`,
      `Company: ${buyer.company}`,
      `Email: ${buyer.email}`,
      `PO / reference: ${buyer.purchaseOrder || 'Not provided'}`,
      `Billing: ${billingProfile ? `${billingProfile.label} — ${billingProfile.preference}` : 'Confirm with customer'}`,
      `Ship to: ${receivingLocation ? `${receivingLocation.label} — ${receivingLocation.address}, ${receivingLocation.city}, ${receivingLocation.state} ${receivingLocation.postalCode}` : 'Confirm with customer'}`,
      '',
      'Products requested:',
      ...lines,
      '',
      buyer.notes ? `Notes: ${buyer.notes}` : '',
      '',
      'Please provide final pricing, minimums, freight, availability, and delivery timing for this quote request.',
    ].filter(Boolean).join('\n')

    window.open(`mailto:orders@nexgenpac.com?subject=${encodeURIComponent(`Website quote request — ${buyer.company}`)}&body=${encodeURIComponent(body)}`, '_self')
    setQuoteRequestReady(true)
  }

  const sendContactRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const needLabels: Record<string, string> = {
      standard: 'Standard product order',
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

  const toggleLogoSide = (side: LogoSide) => {
    setLogoSides((current) => ({ ...current, [side]: !current[side] }))
    if (!logoSides[side] && boxSpec.print === 'No print') {
      setBoxSpec((current) => ({ ...current, print: 'One-color logo' }))
    }
  }

  const handleLogoUpload = (side: LogoSide, file: File | undefined) => {
    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    setLogoUploads((current) => {
      if (current[side]) {
        URL.revokeObjectURL(current[side])
      }
      return { ...current, [side]: imageUrl }
    })
    setActiveLogoSide(side)
  }

  const updateLogoAdjustment = <Key extends keyof LogoAdjustment>(
    side: LogoSide,
    key: Key,
    value: LogoAdjustment[Key],
  ) => {
    setLogoAdjustments((current) => ({
      ...current,
      [side]: {
        ...current[side],
        [key]: value,
      },
    }))
  }

  const renderBoxLogo = (side: LogoSide) => {
    if (!logoSides[side]) return null
    if (logoUploads[side]) {
      const adjustment = logoAdjustments[side]
      return (
        <img
          className="box-logo-image"
          src={logoUploads[side]}
          alt={`${side} logo preview`}
          style={{
            width: `${adjustment.size}%`,
            height: `${adjustment.size}%`,
            objectFit: adjustment.fit,
            transform: `translate(${adjustment.x}%, ${adjustment.y}%) rotate(${adjustment.rotate}deg)`,
          }}
        />
      )
    }

    return <span>YOUR LOGO</span>
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
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={menuOpen ? 'open' : ''} aria-label="Primary navigation">
          <NavLink to="/build-a-box" onClick={() => setMenuOpen(false)}>Build a box</NavLink>
          <NavLink to="/products" onClick={() => setMenuOpen(false)}>Products</NavLink>
          <NavLink to="/industries" onClick={() => setMenuOpen(false)}>Industries</NavLink>
          <NavLink to="/capabilities" onClick={() => setMenuOpen(false)}>Capabilities</NavLink>
          <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
        </nav>

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
            <img src={heroImage} alt="" />
          </div>

          <div className="hero-copy">
            <img className="hero-logo" src={nexgenLogo} alt="Nexgen Packaging Group" />
            <p>Packaging procurement, built for modern foodservice teams.</p>
            <div className="hero-actions">
              <Link className="primary-button" to="/build-a-box">
                <Boxes className="hero-action-icon" size={17} />
                <span>Build a box</span>
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
            <Link to="/build-a-box">
              <Ruler size={24} />
              <span>Configure a custom box</span>
              <small>Set dimensions, material, print, quantity, and logo placement.</small>
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
            path="/build-a-box"
            element={<section className="box-builder-section page-section" id="box-builder">
          <div className="section-intro">
            <p className="eyebrow">Build a box</p>
            <h2>Configure a custom package and add it to your order.</h2>
            <p>
              Enter dimensions, select structural and print options, position your artwork, and
              review the package in real time.
            </p>
          </div>

          <div className="box-builder-layout">
            <div className="box-controls" aria-label="Custom box controls">
              <div className="control-group">
                <div className="control-heading">
                  <Ruler size={18} />
                  <h3>Dimensions</h3>
                </div>
                <div className="dimension-grid">
                  {[
                    ['length', 'Length'],
                    ['width', 'Width'],
                    ['height', 'Height'],
                  ].map(([field, label]) => (
                    <label key={field}>
                      {label}
                      <span>
                        <input
                          min={field === 'height' ? 1 : 3}
                          max={field === 'length' ? 30 : field === 'width' ? 24 : 18}
                          type="number"
                          value={boxSpec[field as 'length' | 'width' | 'height']}
                          onChange={(event) =>
                            updateBoxNumber(field as 'length' | 'width' | 'height', Number(event.target.value))
                          }
                        />
                        in
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="control-group">
                <h3>Build options</h3>
                <label>
                  Box style
                  <select
                    value={boxSpec.style}
                    onChange={(event) =>
                      setBoxSpec((current) => ({
                        ...current,
                        style: event.target.value as (typeof boxStyles)[number],
                      }))
                    }
                  >
                    {boxStyles.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Material
                  <select
                    value={boxSpec.material}
                    onChange={(event) =>
                      setBoxSpec((current) => ({
                        ...current,
                        material: event.target.value as (typeof boxMaterials)[number],
                      }))
                    }
                  >
                    {boxMaterials.map((material) => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Print
                  <select
                    value={boxSpec.print}
                    onChange={(event) =>
                      setBoxSpec((current) => ({
                        ...current,
                        print: event.target.value as (typeof boxPrints)[number],
                      }))
                    }
                  >
                    {boxPrints.map((print) => (
                      <option key={print} value={print}>
                        {print}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="logo-placement">
                  <button
                    className="logo-panel-toggle"
                    type="button"
                    onClick={() => setLogoPanelOpen((open) => !open)}
                    aria-expanded={logoPanelOpen}
                  >
                    <span>
                      Logo placement
                      <small>
                        {selectedLogoSides.length
                          ? `${selectedLogoSides.length} side${selectedLogoSides.length === 1 ? '' : 's'} selected`
                          : 'Optional artwork'}
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>

                  {logoPanelOpen && (
                    <div className="logo-panel-body">
                      <p>Select every side that should include customer artwork.</p>
                      <div className="logo-placement-grid">
                        {logoPlacementOptions.map((side) => (
                          <label
                            className={logoSides[side.id] ? 'logo-side-option selected' : 'logo-side-option'}
                            key={side.id}
                          >
                            <input
                              checked={logoSides[side.id]}
                              type="checkbox"
                              onChange={() => toggleLogoSide(side.id)}
                            />
                            <span>{side.label}</span>
                          </label>
                        ))}
                      </div>
                      {selectedLogoSides.length > 0 && (
                        <div className="side-upload-list">
                          {selectedLogoSides.map((side) => (
                            <label className="side-logo-upload" key={side.id}>
                              <Upload size={16} />
                              <span>{logoUploads[side.id] ? `${side.label} logo loaded` : `${side.label} logo file`}</span>
                              <input
                                type="file"
                                accept=".png,.jpg,.jpeg,.svg,.webp"
                                onChange={(event) => handleLogoUpload(side.id, event.target.files?.[0])}
                              />
                            </label>
                          ))}
                        </div>
                      )}
                      {visibleLogoSide && logoUploads[visibleLogoSide] && (
                        <div className="logo-adjustment-panel">
                          <label>
                            Editing side
                            <select
                              value={visibleLogoSide}
                              onChange={(event) => setActiveLogoSide(event.target.value as LogoSide)}
                            >
                              {selectedLogoSides.map((side) => (
                                <option key={side.id} value={side.id}>
                                  {side.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Fit
                            <select
                              value={logoAdjustments[visibleLogoSide].fit}
                              onChange={(event) =>
                                updateLogoAdjustment(
                                  visibleLogoSide,
                                  'fit',
                                  event.target.value as LogoAdjustment['fit'],
                                )
                              }
                            >
                              <option value="contain">Fit inside</option>
                              <option value="cover">Fill area</option>
                            </select>
                          </label>
                          <label>
                            Size
                            <input
                              max={120}
                              min={24}
                              type="range"
                              value={logoAdjustments[visibleLogoSide].size}
                              onChange={(event) =>
                                updateLogoAdjustment(visibleLogoSide, 'size', Number(event.target.value))
                              }
                            />
                          </label>
                          <div className="logo-slider-grid">
                            <label>
                              X position
                              <input
                                max={60}
                                min={-60}
                                type="range"
                                value={logoAdjustments[visibleLogoSide].x}
                                onChange={(event) =>
                                  updateLogoAdjustment(visibleLogoSide, 'x', Number(event.target.value))
                                }
                              />
                            </label>
                            <label>
                              Y position
                              <input
                                max={60}
                                min={-60}
                                type="range"
                                value={logoAdjustments[visibleLogoSide].y}
                                onChange={(event) =>
                                  updateLogoAdjustment(visibleLogoSide, 'y', Number(event.target.value))
                                }
                              />
                            </label>
                          </div>
                          <label>
                            Rotate
                            <input
                              max={180}
                              min={-180}
                              type="range"
                              value={logoAdjustments[visibleLogoSide].rotate}
                              onChange={(event) =>
                                updateLogoAdjustment(visibleLogoSide, 'rotate', Number(event.target.value))
                              }
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setLogoAdjustments((current) => ({
                                ...current,
                                [visibleLogoSide]: defaultLogoAdjustment,
                              }))
                            }
                          >
                            Reset logo
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <label>
                  Quantity
                  <input
                    min={50}
                    max={10000}
                    step={50}
                    type="number"
                    value={boxSpec.quantity}
                    onChange={(event) => updateBoxNumber('quantity', Number(event.target.value))}
                  />
                </label>
              </div>

              <button
                className="primary-button full-width"
                type="button"
                onClick={() => {
                  updateCart(
                    'custom-program',
                    estimatedCases,
                    `${boxSpec.length} × ${boxSpec.width} × ${boxSpec.height} in`,
                    { printColors: boxSpec.print === 'No print' ? 0 : 1 },
                  )
                }}
              >
                <Plus size={18} />
                Add custom box to order
              </button>
            </div>

            <div className="box-preview-panel">
              <div
                className={boxDragStart ? 'box-preview-stage dragging' : 'box-preview-stage'}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId)
                  setBoxDragStart({ x: event.clientX, y: event.clientY, rotation: boxRotation })
                }}
                onPointerMove={(event) => {
                  if (!boxDragStart) return
                  const nextX = boxDragStart.rotation.x - (event.clientY - boxDragStart.y) * 0.55
                  const nextY = boxDragStart.rotation.y + (event.clientX - boxDragStart.x) * 0.7
                  setBoxRotation({
                    x: Math.max(-72, Math.min(58, nextX)),
                    y: nextY,
                  })
                }}
                onPointerUp={(event) => {
                  event.currentTarget.releasePointerCapture(event.pointerId)
                  setBoxDragStart(null)
                }}
                onPointerCancel={() => setBoxDragStart(null)}
                role="img"
                aria-label="Drag to rotate the custom box preview"
              >
                <div className="box-model" style={boxPreviewStyle} aria-label="Live custom box preview">
                  <div className="box-face box-face-front">
                    {renderBoxLogo('front')}
                  </div>
                  <div className="box-face box-face-back">
                    {renderBoxLogo('back')}
                  </div>
                  <div className="box-face box-face-top">
                    {renderBoxLogo('top')}
                  </div>
                  <div className="box-face box-face-bottom" />
                  <div className="box-face box-face-side box-face-right">
                    {renderBoxLogo('right')}
                  </div>
                  <div className="box-face box-face-side box-face-left">
                    {renderBoxLogo('left')}
                  </div>
                  <div className="box-lid box-lid-left" />
                  <div className="box-lid box-lid-right" />
                </div>
                <div className="rotate-hint">
                  <span>Drag to spin</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setBoxRotation({ x: -18, y: -28 })
                    }}
                    aria-label="Reset box rotation"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              <div className="box-spec-summary">
                <span>
                  <strong>{boxSpec.length}"</strong>
                  Length
                </span>
                <span>
                  <strong>{boxSpec.width}"</strong>
                  Width
                </span>
                <span>
                  <strong>{boxSpec.height}"</strong>
                  Height
                </span>
                <span>
                  <strong>{estimatedCases}</strong>
                  Order cases
                </span>
              </div>

              <div className="box-preview-notes">
                <p>
                  {boxSpec.style} · {boxSpec.material} · {boxSpec.print}
                </p>
                <small>
                  NexGen prepress confirms the final dieline, flute, board grade, and print layout
                  with you before production.
                </small>
              </div>
            </div>
          </div>
        </section>}
          />

          <Route
            path="/products"
            element={<section className="section-grid product-catalog-page" id="products">
          <header className="catalog-hero">
            <p className="eyebrow">Product catalog</p>
            <h1>All products. Take your pick.</h1>
            <p>
              Browse NexGen’s packaging catalog, choose your configuration, and build one complete
              quote request for your business.
            </p>
          </header>

          <section className="catalog-category-section" aria-labelledby="catalog-category-title">
            <div className="catalog-section-heading">
              <div>
                <p className="eyebrow">Shop by category</p>
                <h2 id="catalog-category-title">What are you looking for?</h2>
              </div>
              <span>{catalogProducts.length} products available</span>
            </div>

            <div className="catalog-category-rail" aria-label="Product category filter">
              {categoryOptions.map((category) => {
                const CategoryIcon = catalogCategoryIcons[category] ?? Boxes
                const categoryCount = category === 'All'
                  ? catalogProducts.length
                  : catalogProducts.filter((product) => product.category === category).length

                return (
                  <button
                    className={activeCategory === category ? 'active' : ''}
                    key={category}
                    type="button"
                    aria-pressed={activeCategory === category}
                    onClick={() => {
                      setActiveCategory(category)
                      setVisibleProductCount(10)
                    }}
                  >
                    <span><CategoryIcon size={23} /></span>
                    <strong>{category === 'All' ? 'All products' : category}</strong>
                    <small>{categoryCount} item{categoryCount === 1 ? '' : 's'}</small>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="catalog-browser" aria-labelledby="catalog-results-title">
            <div className="catalog-toolbar" aria-label="Search and filter products">
              <label className="search-box">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setVisibleProductCount(10)
                  }}
                  placeholder="Search products..."
                />
              </label>

              <label className="catalog-application-filter">
                <span>Use</span>
                <select
                  className="application-select"
                  aria-label="Product application filter"
                  value={activeApplication}
                  onChange={(event) => {
                    setActiveApplication(event.target.value)
                    setVisibleProductCount(10)
                  }}
                >
                  {applicationOptions.map((application) => (
                    <option key={application} value={application}>
                      {application}
                    </option>
                  ))}
                </select>
              </label>

              {(activeCategory !== 'All' || activeApplication !== 'All applications' || query) ? (
                <button
                  className="catalog-clear-button"
                  type="button"
                  onClick={() => {
                    setActiveCategory('All')
                    setActiveApplication('All applications')
                    setQuery('')
                    setVisibleProductCount(10)
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="catalog-results">
              <div className="results-bar">
                <div>
                  <p className="eyebrow">{activeCategory === 'All' ? 'All products' : activeCategory}</p>
                  <h2 id="catalog-results-title">{filteredProducts.length} result{filteredProducts.length === 1 ? '' : 's'}</h2>
                </div>
                <span>Choose a product to see sizes, printing, and specifications.</span>
              </div>

              <div className="product-grid">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {visibleProductCount < filteredProducts.length && (
                <button
                  className="catalog-load-more"
                  type="button"
                  onClick={() => setVisibleProductCount((count) => count + 10)}
                >
                  Show more products
                  <span>{filteredProducts.length - visibleProductCount} remaining</span>
                </button>
              )}

              {filteredProducts.length === 0 && (
                <div className="catalog-empty" role="status">
                  <Search size={22} />
                  <div>
                    <strong>No exact match yet.</strong>
                    <span>Clear a filter or start a custom packaging request.</span>
                  </div>
                  <Link to="/contact">Start a custom request</Link>
                </div>
              )}
            </div>
          </section>
        </section>}
          />

          <Route
            path="/products/:productId"
            element={
              <ProductDetailPage
                products={allProducts}
                cart={cart}
                onAdd={(productId, cases, size, configuration) => updateCart(productId, cases, size, configuration)}
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
                  onLogin={signInCustomer}
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
                  onLogin={signInCustomer}
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
          <span>{product.stockType || `${product.sizes.length} format options`}</span>
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
}

function ProductDetailPage({ products, cart, onAdd }: ProductDetailPageProps) {
  const { productId } = useParams()
  const product = products.find((item) => item.id === productId)

  if (!product) {
    return <Navigate to="/products" replace />
  }

  const cartItem = cart.find((item) => item.productId === product.id)
  return <ProductDetailContent key={product.id} product={product} products={products} cartItem={cartItem} onAdd={onAdd} />
}

type ProductDetailContentProps = {
  product: Product
  products: Product[]
  cartItem?: CartItem
  onAdd: ProductDetailPageProps['onAdd']
}

function ProductDetailContent({ product, products, cartItem, onAdd }: ProductDetailContentProps) {
  const [selectedSize, setSelectedSize] = useState(cartItem?.size || product.sizes[0] || '')
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [printColors, setPrintColors] = useState<PrintColorCount>(cartItem?.printColors || 0)
  const [artworkName, setArtworkName] = useState(cartItem?.artworkName || '')
  const [artworkPreview, setArtworkPreview] = useState(cartItem?.artworkPreview || '')
  const [artworkError, setArtworkError] = useState('')
  const printableCup = product.category === 'Cups & Lids' && !product.name.toLowerCase().includes('lid')
  const relatedProducts = products
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

  return (
    <section className="product-detail-page page-section">
      <div className="product-breadcrumb">
        <Link to="/products">
          <ArrowLeft size={16} /> Back to all products
        </Link>
        <span>/</span>
        <span>{product.category}</span>
      </div>

      <div className="product-detail-layout">
        <div className="product-detail-media">
          <div className="product-detail-image-stage">
            <img src={product.image} alt={product.name} />
          </div>
          <div className="product-media-caption">
            <span>{product.sku || product.category}</span>
            <strong>{product.material}</strong>
          </div>
        </div>

        <div className="product-detail-copy">
          <p className="eyebrow">{product.category} packaging</p>
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

          <fieldset className="product-choice-group">
            <legend>
              <span>1</span>
              <strong>Size or format.</strong>
              <small>Choose the product configuration.</small>
            </legend>
            <div className="product-choice-grid">
              {product.sizes.map((size) => (
                <label key={size} className={selectedSize === size ? 'selected' : ''}>
                  <input
                    type="radio"
                    name={`product-size-${product.id}`}
                    value={size}
                    checked={selectedSize === size}
                    onChange={() => setSelectedSize(size)}
                  />
                  <span>
                    <strong>{size}</strong>
                    <small>{product.casePack}</small>
                  </span>
                  {selectedSize === size ? <Check size={18} /> : null}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="product-choice-group">
            <legend>
              <span>2</span>
              <strong>Quantity.</strong>
              <small>How many cases do you need?</small>
            </legend>
            <div className="product-quantity-grid">
              {quoteQuantityOptions.map((quantity) => (
                <label key={quantity} className={selectedQuantity === quantity ? 'selected' : ''}>
                  <input
                    type="radio"
                    name={`product-quantity-${product.id}`}
                    value={quantity}
                    checked={selectedQuantity === quantity}
                    onChange={() => setSelectedQuantity(quantity)}
                  />
                  <strong>{quantity}</strong>
                  <span>{quantity === 1 ? 'case' : 'cases'}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {printableCup ? (
            <section className="cup-print-config" aria-labelledby="cup-print-heading">
              <div className="cup-print-heading">
                <span>3</span>
                <div>
                  <h2 id="cup-print-heading">Printing.</h2>
                  <p>Choose unprinted or add up to four print colors.</p>
                </div>
              </div>

              <fieldset className="print-color-options">
                <legend>Number of print colors</legend>
                {([0, 1, 2, 3, 4] as PrintColorCount[]).map((count) => (
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
                  {artworkPreview ? <div className="cup-artwork-preview"><img src={artworkPreview} alt="Uploaded cup artwork preview" /><span>Artwork preview</span></div> : null}
                  {artworkError ? <p className="cup-artwork-error" role="alert">{artworkError}</p> : null}
                </div>
              ) : null}
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
              onClick={() => onAdd(product.id, selectedQuantity, selectedSize, {
                printColors: printableCup ? printColors : 0,
                artworkName: printableCup ? artworkName : undefined,
                artworkPreview: printableCup ? artworkPreview : undefined,
              })}
            >
              <ShoppingCart size={17} />
              Add {selectedQuantity} {selectedQuantity === 1 ? 'case' : 'cases'} to quote cart
            </button>
            {cartItem ? <Link className="product-view-cart" to="/cart">View cart <ArrowRight size={17} /></Link> : null}
          </div>

          <Link className="text-link" to="/contact">
            Need a variation that is not listed? Talk to the sales team <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <section className="product-details-strip" aria-labelledby="product-details-title">
        <div>
          <p className="eyebrow">At a glance</p>
          <h2 id="product-details-title">Product details.</h2>
        </div>
        <dl className="product-spec-grid">
          <div>
            <dt>Material</dt>
            <dd>{product.material}</dd>
          </div>
          <div>
            <dt>Case pack</dt>
            <dd>{product.casePack}</dd>
          </div>
          <div>
            <dt>Lead time</dt>
            <dd>{product.leadTime}</dd>
          </div>
          <div>
            <dt>Best for</dt>
            <dd>{product.applications.join(', ')}</dd>
          </div>
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

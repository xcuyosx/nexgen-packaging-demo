import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarClock,
  Check,
  ChevronRight,
  ClipboardList,
  Factory,
  FileText,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Minus,
  Phone,
  Plus,
  Recycle,
  RotateCcw,
  Ruler,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Upload,
  X,
} from 'lucide-react'
import './App.css'

type Product = {
  id: string
  name: string
  category: 'Paper' | 'Plastic' | 'Pizza' | 'Custom'
  material: string
  description: string
  casePack: string
  leadTime: string
  image: string
  badges: string[]
  applications: string[]
}

type CartItem = {
  productId: string
  cases: number
  customPrint: boolean
}

const products: Product[] = [
  {
    id: 'paper-cups',
    name: 'EcoBio paper beverage cups',
    category: 'Paper',
    material: '100% recycled paper',
    description: 'Single-wall and double-wall cup programs with sleeves, lids, and custom print options.',
    casePack: '1,000 / case',
    leadTime: 'Stock or custom',
    image:
      'https://static.wixstatic.com/media/067fd2_cd63d937ea0b4f5d970719418042c4a7~mv2.jpeg/v1/crop/x_1830,y_0,w_5340,h_6000/fill/w_890,h_1000,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/papercupwithpapersleeve.jpeg',
    badges: ['Recyclable', 'Custom print', 'PFAS free'],
    applications: ['Coffee', 'QSR', 'Foodservice'],
  },
  {
    id: 'clear-cups',
    name: 'Clear cold cups and lids',
    category: 'Plastic',
    material: 'Virgin, recycled, or biodegradable plastic',
    description: 'High-clarity beverage cups for chains, stadiums, convenience, and prepared beverage programs.',
    casePack: '600 / case',
    leadTime: 'Fast repeat runs',
    image:
      'https://static.wixstatic.com/media/067fd2_dcba4a3a1e104ac3b9fb7399dc7eb054~mv2.jpg/v1/fill/w_890,h_514,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/plasticcupbeerserving.jpg',
    badges: ['Recycled content', 'Logo ready', 'Food safe'],
    applications: ['Beverage', 'Events', 'Retail'],
  },
  {
    id: 'produce-trays',
    name: 'Anti-fog produce and protein trays',
    category: 'Plastic',
    material: 'RPET and PET programs',
    description: 'Two-piece and hinged containers that merchandise prepared foods, produce, and proteins.',
    casePack: '300 / case',
    leadTime: 'Program based',
    image:
      'https://static.wixstatic.com/media/067fd2_59fab9c03a7c41599a037342b9aebc94~mv2.jpeg/v1/crop/x_118,y_565,w_4769,h_2540/fill/w_1858,h_990,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/plastic%20cup%20with%20fruit.jpeg',
    badges: ['Anti-fog', 'Retail ready', 'Recyclable'],
    applications: ['Supermarket', 'C-store', 'Processor'],
  },
  {
    id: 'pizza-boxes',
    name: 'Pizza boxes and liners',
    category: 'Pizza',
    material: 'Recycled E-flute and paperboard',
    description: 'Branded pizza packaging with liners, venting, grease resistance, and delivery-friendly sizing.',
    casePack: '50 / bundle',
    leadTime: 'Custom program',
    image:
      'https://static.wixstatic.com/media/067fd2_81c9663dd29449a29611123b88c3816b~mv2.jpeg/v1/fill/w_896,h_610,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/papercupscheers.jpeg',
    badges: ['Custom size', 'Grease resistant', 'Recycled fiber'],
    applications: ['Pizza', 'Delivery', 'Ghost kitchen'],
  },
  {
    id: 'custom-program',
    name: 'Custom printed packaging program',
    category: 'Custom',
    material: 'Paper, plastic, or mixed bill of goods',
    description: 'Artwork, prototyping, forecasting, warehousing, and direct-to-distribution replenishment.',
    casePack: 'MOQ by item',
    leadTime: 'Program launch',
    image:
      'https://static.wixstatic.com/media/067fd2_95949ec8a878425ca9c1c55b49f201dc~mv2.jpeg/v1/crop/x_0,y_17,w_4000,h_4125/fill/w_894,h_922,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/plasticcup.jpeg',
    badges: ['8-10 color print', 'Forecasting', 'Compliance'],
    applications: ['Multi-unit', 'Private label', 'Franchise'],
  },
]

const categoryOptions = ['All', 'Paper', 'Plastic', 'Pizza', 'Custom'] as const

const reorderLists = [
  { id: 'stadium', label: 'Stadium beverage kit', items: 4, volume: '188 cases/mo', status: 'Ready' },
  { id: 'pizza', label: 'Pizza launch bundle', items: 3, volume: '72 bundles/mo', status: 'Artwork due' },
  { id: 'market', label: 'Prepared foods tray set', items: 6, volume: '241 cases/mo', status: 'Scheduled' },
]

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

function App() {
  const [activeCategory, setActiveCategory] = useState<(typeof categoryOptions)[number]>('All')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([
    { productId: 'paper-cups', cases: 12, customPrint: true },
    { productId: 'produce-trays', cases: 8, customPrint: false },
  ])
  const [selectedQuoteProduct, setSelectedQuoteProduct] = useState(products[0].id)
  const [customLogoRequested, setCustomLogoRequested] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<'order' | 'artwork' | 'forecast'>('order')
  const [submitted, setSubmitted] = useState(false)
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
  const [boxSpec, setBoxSpec] = useState<BoxSpec>({
    length: 12,
    width: 9,
    height: 4,
    style: boxStyles[0],
    material: boxMaterials[0],
    print: boxPrints[1],
    quantity: 500,
  })

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory
      const text = `${product.name} ${product.material} ${product.description} ${product.badges.join(' ')}`
      return matchesCategory && text.toLowerCase().includes(query.toLowerCase())
    })
  }, [activeCategory, query])

  const cartDetails = useMemo(() => {
    return cart
      .map((item) => ({
        ...item,
        product: products.find((product) => product.id === item.productId),
      }))
      .filter((item): item is CartItem & { product: Product } => Boolean(item.product))
  }, [cart])

  const totalCases = cartDetails.reduce((total, item) => total + item.cases, 0)
  const customItems = cartDetails.filter((item) => item.customPrint).length

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

  const updateCart = (productId: string, delta: number) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      if (!existing && delta > 0) {
        return [...current, { productId, cases: 1, customPrint: false }]
      }

      return current
        .map((item) =>
          item.productId === productId ? { ...item, cases: Math.max(0, item.cases + delta) } : item,
        )
        .filter((item) => item.cases > 0)
    })
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
  }

  const renderBoxLogo = (side: LogoSide) => {
    if (!logoSides[side]) return null
    if (logoUploads[side]) {
      return <img className="box-logo-image" src={logoUploads[side]} alt={`${side} logo preview`} />
    }

    return <span>YOUR LOGO</span>
  }

  const togglePrint = (productId: string) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId)
      if (!existing) {
        return [...current, { productId, cases: 1, customPrint: true }]
      }

      return current.map((item) =>
        item.productId === productId ? { ...item, customPrint: !item.customPrint } : item,
      )
    })
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <button className="mobile-menu" type="button" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={menuOpen ? 'open' : ''} aria-label="Primary navigation">
          <a href="#box-builder">Build a box</a>
          <a href="#products">Products</a>
          <a href="#portal">Customer portal</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#contact">Contact</a>
        </nav>

        <a className="header-action" href="#quote" aria-label="Open quote cart">
          <ShoppingCart size={17} />
        </a>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-media" aria-hidden="true">
            <img src={heroImage} alt="" />
          </div>

          <div className="hero-copy">
            <p className="eyebrow">Nexgen Packaging Group</p>
            <div className="hero-chip-row" aria-label="Platform highlights">
              <span>
                <ShieldCheck size={15} />
                SQF-ready
              </span>
              <span>
                <Factory size={15} />
                Domestic manufacturing
              </span>
            </div>
            <img className="hero-logo" src={nexgenLogo} alt="Nexgen Packaging Group" />
            <p>Packaging procurement, built for modern foodservice teams.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#box-builder">
                Build a box <ArrowRight size={18} />
              </a>
              <a className="secondary-button" href="#capabilities">
                See capabilities
              </a>
            </div>
          </div>

          <aside className="hero-order" id="quote" aria-label="Order request summary">
            <div className="panel-heading">
              <span className="icon-tile">
                <ShoppingCart size={20} />
              </span>
              <div>
                <p className="eyebrow">Quote cart</p>
                <h2>Build a packaging request</h2>
              </div>
            </div>

            <div className="order-stats">
              <span>
                <strong>{totalCases}</strong>
                Cases
              </span>
              <span>
                <strong>{customItems}</strong>
                Custom items
              </span>
              <span>
                <strong>48h</strong>
                Target reply
              </span>
            </div>

            <div className="cart-list">
              {cartDetails.map((item) => (
                <article key={item.productId}>
                  <div>
                    <strong>{item.product.name}</strong>
                    <small>{item.customPrint ? 'Custom print requested' : item.product.material}</small>
                  </div>
                  <div className="quantity-control">
                    <button type="button" onClick={() => updateCart(item.productId, -1)} aria-label="Remove case">
                      <Minus size={15} />
                    </button>
                    <span>{item.cases}</span>
                    <button type="button" onClick={() => updateCart(item.productId, 1)} aria-label="Add case">
                      <Plus size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="quote-picker">
              <label htmlFor="quote-product">Available options</label>
              <select
                id="quote-product"
                value={selectedQuoteProduct}
                onChange={(event) => setSelectedQuoteProduct(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => updateCart(selectedQuoteProduct, 1)}>
                <Plus size={17} />
                Add more
              </button>
            </div>

            <div className="custom-logo-box">
              <label className="checkbox-row">
                <input
                  checked={customLogoRequested}
                  type="checkbox"
                  onChange={(event) => setCustomLogoRequested(event.target.checked)}
                />
                <span>Custom logo</span>
              </label>

              {customLogoRequested && (
                <label className="logo-upload">
                  <Upload size={17} />
                  <span>Upload logo or artwork file</span>
                  <input type="file" accept=".ai,.eps,.pdf,.png,.jpg,.jpeg,.svg" />
                </label>
              )}
            </div>

            <button className="primary-button full-width" type="button" onClick={() => setSubmitted(true)}>
              {submitted ? <Check size={18} /> : <Mail size={18} />}
              {submitted ? 'Request drafted' : 'Start quote'}
            </button>

            <div className="quote-meta">
              <span>
                <BadgeCheckIcon />
                Account pricing ready
              </span>
              <span>ERP sync next</span>
            </div>
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

        <section className="box-builder-section" id="box-builder">
          <div className="section-intro">
            <p className="eyebrow">Build a box</p>
            <h2>Configure a custom package before you ever request a quote.</h2>
            <p>
              Customers can enter dimensions, select structural and print options, and preview the
              package in real time before sending the request to your team.
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
                  setSelectedQuoteProduct('custom-program')
                  updateCart('custom-program', estimatedCases)
                  setCustomLogoRequested(boxSpec.print !== 'No print' || selectedLogoSides.length > 0)
                }}
              >
                <Plus size={18} />
                Add custom box to quote
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
                  Quote cases
                </span>
              </div>

              <div className="box-preview-notes">
                <p>
                  {boxSpec.style} · {boxSpec.material} · {boxSpec.print}
                </p>
                <small>
                  Preview is for quoting direction. Final dielines, flute, board grade, and print
                  layout would be confirmed by Nexgen prepress.
                </small>
              </div>
            </div>
          </div>
        </section>

        <section className="section-grid" id="products">
          <div className="section-intro">
            <p className="eyebrow">Product discovery</p>
            <h2>Turn the PDF catalog into a searchable order surface.</h2>
            <p>
              Customers should filter by material, application, custom print, sustainability target,
              and recurring program. The line card becomes a working commerce experience.
            </p>
          </div>

          <div className="catalog-tools">
            <label className="search-box">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cups, trays, pizza, PFAS..."
              />
            </label>

            <div className="category-tabs" aria-label="Product category filter">
              {categoryOptions.map((category) => (
                <button
                  className={activeCategory === category ? 'active' : ''}
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.productId === product.id)
              return (
                <article className="product-card" key={product.id}>
                  <img src={product.image} alt={product.name} />
                  <div className="product-card-body">
                    <div className="product-meta">
                      <span>{product.category}</span>
                      <span>{product.casePack}</span>
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div className="badge-list">
                      {product.badges.map((badge) => (
                        <span key={badge}>{badge}</span>
                      ))}
                    </div>
                    <div className="application-list">
                      {product.applications.map((application) => (
                        <span key={application}>{application}</span>
                      ))}
                    </div>
                    <div className="product-actions">
                      <button type="button" onClick={() => updateCart(product.id, 1)}>
                        <Plus size={16} />
                        {cartItem ? `${cartItem.cases} cases` : 'Add'}
                      </button>
                      <button
                        className={cartItem?.customPrint ? 'selected' : ''}
                        type="button"
                        onClick={() => togglePrint(product.id)}
                      >
                        <FileText size={16} />
                        Print
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="portal-section" id="portal">
          <div className="section-intro">
            <p className="eyebrow">Customer portal</p>
            <h2>Give buyers the controls they expect from a strategic supplier.</h2>
          </div>

          <div className="portal-layout">
            <div className="portal-tabs" aria-label="Portal views">
              {[
                ['order', 'Order center', <ClipboardList size={18} />],
                ['artwork', 'Artwork approval', <Upload size={18} />],
                ['forecast', 'Forecasting', <CalendarClock size={18} />],
              ].map(([id, label, icon]) => (
                <button
                  className={activePanel === id ? 'active' : ''}
                  key={id as string}
                  type="button"
                  onClick={() => setActivePanel(id as 'order' | 'artwork' | 'forecast')}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            <div className="portal-panel">
              {activePanel === 'order' && (
                <>
                  <div className="panel-heading">
                    <span className="icon-tile blue">
                      <Truck size={20} />
                    </span>
                    <div>
                      <p className="eyebrow">Reorder lists</p>
                      <h3>Approved programs stay one click away.</h3>
                    </div>
                  </div>
                  <div className="reorder-list">
                    {reorderLists.map((list) => (
                      <article key={list.id}>
                        <div>
                          <strong>{list.label}</strong>
                          <small>
                            {list.items} items · {list.volume}
                          </small>
                        </div>
                        <span>{list.status}</span>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {activePanel === 'artwork' && (
                <div className="artwork-panel">
                  <div className="upload-box">
                    <Upload size={26} />
                    <strong>Upload dielines, logos, and color specs</strong>
                    <span>PDF, AI, EPS, PNG, and linked brand guidelines</span>
                  </div>
                  <div className="approval-steps">
                    {['Prepress review', 'Digital proof', 'Production approval'].map((step, index) => (
                      <span key={step}>
                        <Check size={15} />
                        {index + 1}. {step}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'forecast' && (
                <div className="forecast-panel">
                  <div className="forecast-chart" aria-label="Forecast by month">
                    {[64, 78, 72, 86, 92, 81, 97, 108].map((height, index) => (
                      <span key={index} style={{ height: `${height}%` }} />
                    ))}
                  </div>
                  <div>
                    <p className="eyebrow">Inventory planning</p>
                    <h3>Min/max programs can be visible to the customer.</h3>
                    <p>
                      Forecasted consumption, next production window, safety stock, and freight
                      consolidation can live inside the portal instead of spreadsheets.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="capabilities-section" id="capabilities">
          <div className="section-intro">
            <p className="eyebrow">What should stand out</p>
            <h2>The rebuilt site should sell the operating system behind the packaging.</h2>
          </div>

          <div className="capability-grid">
            {[
              [Factory, 'Domestic manufacturing', 'Paper converting, plastic extrusion, thermoforming, printing, and distribution under one supply strategy.'],
              [Sparkles, 'Custom brand packaging', 'Prototype services, flexographic printing, dry-offset plastic printing, dielines, and short-to-medium runs.'],
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
        </section>

        <section className="contact-section" id="contact">
          <div>
            <p className="eyebrow">Launch path</p>
            <h2>Start with ordering, then connect the portal to ERP and sales ops.</h2>
            <p>
              The public site can launch quickly with quote requests and reorder lists. Phase two
              can authenticate customers, expose account pricing, sync item numbers, and push order
              requests into your ERP or CRM.
            </p>
          </div>

          <form className="contact-card">
            <label>
              Company
              <input placeholder="Multi-unit operator, distributor, processor..." />
            </label>
            <label>
              Need
              <select defaultValue="custom">
                <option value="custom">Custom printed packaging</option>
                <option value="reorder">Reorder portal</option>
                <option value="sustainability">Sustainable material program</option>
                <option value="erp">ERP-connected ordering</option>
              </select>
            </label>
            <label>
              Message
              <textarea placeholder="Tell the sales team about products, quantities, artwork, and timing." />
            </label>
            <a className="primary-button full-width" href="mailto:orders@nexgenpac.com">
              <Mail size={18} />
              Send to orders@nexgenpac.com
            </a>
          </form>
        </section>
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
        <a href="#top">
          Back to top <ChevronRight size={15} />
        </a>
      </footer>
    </div>
  )
}

export default App

function BadgeCheckIcon() {
  return <BadgeCheck size={15} />
}

import type { Product } from './catalog'
import type { CustomerQuoteRequestLine } from './customerAccount'

export type PrintColorCount = 0 | 1 | 2 | 3 | 4

export type CartConfiguration = {
  material?: string
  component?: 'Base' | 'Lid'
  itemNumber?: string
  productName?: string
  printColors?: PrintColorCount
  inkColors?: string[]
  artworkName?: string
  artworkPreview?: string
  artworkFile?: File
  artworkPosition?: {
    size: number
    x: number
    y: number
    rotate: number
  }
}

export type CartItem = {
  lineId: string
  productId: string
  cases: number
  size?: string
  material?: string
  component?: 'Base' | 'Lid'
  itemNumber?: string
  productName?: string
  printColors: PrintColorCount
  inkColors?: string[]
  artworkName?: string
  artworkPreview?: string
  artworkFile?: File
  artworkPosition?: CartConfiguration['artworkPosition']
}

export type CartLine = CartItem & {
  product: Product
}

type CartVariant = Omit<CartItem, 'lineId' | 'cases'>

function configuredVariant(productId: string, size: string | undefined, configuration: CartConfiguration): CartVariant {
  return {
    productId,
    size,
    material: configuration.material,
    component: configuration.component,
    itemNumber: configuration.itemNumber,
    productName: configuration.productName,
    printColors: configuration.printColors || 0,
    inkColors: configuration.inkColors,
    artworkName: configuration.artworkName,
    artworkPreview: configuration.artworkPreview,
    artworkFile: configuration.artworkFile,
    artworkPosition: configuration.artworkPosition,
  }
}

function sameCartVariant(left: CartVariant, right: CartVariant): boolean {
  const leftColors = left.inkColors || []
  const rightColors = right.inkColors || []
  const leftPosition = left.artworkPosition
  const rightPosition = right.artworkPosition
  return left.productId === right.productId
    && left.size === right.size
    && left.material === right.material
    && left.component === right.component
    && left.itemNumber === right.itemNumber
    && left.productName === right.productName
    && left.printColors === right.printColors
    && leftColors.length === rightColors.length
    && leftColors.every((color, index) => color === rightColors[index])
    && left.artworkName === right.artworkName
    && left.artworkPreview === right.artworkPreview
    && left.artworkFile === right.artworkFile
    && (leftPosition === rightPosition || Boolean(leftPosition && rightPosition
      && leftPosition.size === rightPosition.size
      && leftPosition.x === rightPosition.x
      && leftPosition.y === rightPosition.y
      && leftPosition.rotate === rightPosition.rotate))
}

export function addConfiguredCartItem(
  cart: CartItem[],
  productId: string,
  cases: number,
  size?: string,
  configuration: CartConfiguration = {},
  newLineId = globalThis.crypto.randomUUID(),
): CartItem[] {
  if (cases <= 0) return cart

  const variant = configuredVariant(productId, size, configuration)
  const existing = cart.find((item) => sameCartVariant(item, variant))
  if (existing) {
    return cart.map((item) => item.lineId === existing.lineId ? { ...item, cases: item.cases + cases } : item)
  }

  return [...cart, { ...variant, lineId: newLineId, cases }]
}

export function replaceConfiguredCartLine(
  cart: CartItem[],
  lineId: string,
  productId: string,
  cases: number,
  size?: string,
  configuration: CartConfiguration = {},
): CartItem[] {
  if (cases <= 0 || !cart.some((item) => item.lineId === lineId && item.productId === productId)) return cart

  const variant = configuredVariant(productId, size, configuration)
  return cart.map((item) => item.lineId === lineId ? { ...variant, lineId, cases } : item)
}

export function changeCartLineCases(cart: CartItem[], lineId: string, delta: number): CartItem[] {
  return cart
    .map((item) => item.lineId === lineId ? { ...item, cases: Math.max(0, item.cases + delta) } : item)
    .filter((item) => item.cases > 0)
}

export function removeCartLine(cart: CartItem[], lineId: string): CartItem[] {
  return cart.filter((item) => item.lineId !== lineId)
}

export function buildQuoteRequestLine(item: CartLine): CustomerQuoteRequestLine {
  return {
    productId: item.product.id,
    sku: item.itemNumber || item.product.sku || '',
    productName: item.productName || item.product.name,
    category: item.product.category,
    material: item.material || item.product.material,
    dimensions: item.size || item.product.description,
    casePack: item.product.casePack,
    cases: item.cases,
    size: item.size || item.product.sizes[0],
    printColors: item.printColors,
    inkColors: item.inkColors || [],
    artworkName: item.artworkName || '',
    artworkPosition: item.artworkPosition,
  }
}

export type QuoteContact = {
  name: string
  company: string
  email: string
  purchaseOrder: string
  billingProfileId: string
  receivingLocationId: string
  notes: string
}

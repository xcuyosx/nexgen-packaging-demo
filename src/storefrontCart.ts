import type { Product } from './catalog'

export type PrintColorCount = 0 | 1 | 2 | 3 | 4

export type CartConfiguration = {
  material?: string
  printColors?: PrintColorCount
  inkColors?: string[]
  artworkName?: string
  artworkPreview?: string
  artworkPosition?: {
    size: number
    x: number
    y: number
    rotate: number
  }
}

export type CartItem = {
  productId: string
  cases: number
  size?: string
  material?: string
  printColors: PrintColorCount
  inkColors?: string[]
  artworkName?: string
  artworkPreview?: string
  artworkPosition?: CartConfiguration['artworkPosition']
}

export type CartLine = CartItem & {
  product: Product
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

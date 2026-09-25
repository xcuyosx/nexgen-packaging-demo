import type { CartItem, PrintColorCount } from './storefrontCart'

const storageKey = 'nexgen-quote-cart-v1'

export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.flatMap((value): CartItem[] => {
      if (!value || typeof value !== 'object') return []
      const item = value as Record<string, unknown>
      if (typeof item.lineId !== 'string' || !item.lineId || typeof item.productId !== 'string' || !item.productId) return []
      if (typeof item.cases !== 'number' || !Number.isSafeInteger(item.cases) || item.cases < 1) return []
      const printColors = typeof item.printColors === 'number' && Number.isInteger(item.printColors)
        && item.printColors >= 0 && item.printColors <= 4 ? item.printColors as PrintColorCount : 0
      const position = item.artworkPosition && typeof item.artworkPosition === 'object'
        ? item.artworkPosition as Record<string, unknown> : null
      const artworkPosition = position && ['size', 'x', 'y', 'rotate'].every((key) => typeof position[key] === 'number' && Number.isFinite(position[key]))
        ? { size: position.size as number, x: position.x as number, y: position.y as number, rotate: position.rotate as number }
        : undefined
      return [{
        lineId: item.lineId,
        productId: item.productId,
        cases: item.cases,
        size: typeof item.size === 'string' ? item.size : undefined,
        material: typeof item.material === 'string' ? item.material : undefined,
        component: item.component === 'Base' || item.component === 'Lid' ? item.component : undefined,
        itemNumber: typeof item.itemNumber === 'string' ? item.itemNumber : undefined,
        productName: typeof item.productName === 'string' ? item.productName : undefined,
        printColors,
        inkColors: Array.isArray(item.inkColors) ? item.inkColors.filter((color): color is string => typeof color === 'string') : undefined,
        artworkName: typeof item.artworkName === 'string' ? item.artworkName : undefined,
        artworkPosition,
      }]
    })
  } catch {
    return []
  }
}

export function serializeCart(cart: CartItem[]): string {
  return JSON.stringify(cart.map((item) => ({ ...item, artworkPreview: undefined, artworkFile: undefined })))
}

export function loadCart(): CartItem[] {
  try {
    return parseStoredCart(window.localStorage.getItem(storageKey))
  } catch {
    return []
  }
}

export function saveCart(cart: CartItem[]): void {
  try {
    if (cart.length) window.localStorage.setItem(storageKey, serializeCart(cart))
    else window.localStorage.removeItem(storageKey)
  } catch {
    // Storage may be disabled; the in-memory cart still works for this visit.
  }
}

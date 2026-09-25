import type { Product } from './catalog'

function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function productMatchesSearch(product: Product, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query.trim())
  if (!normalizedQuery) return true

  const componentTerms = Object.values(product.specDownloadsBySize || {})
    .flatMap((resources) => resources.flatMap(({ itemNumber, productName }) => [itemNumber, productName]))
  const searchableText = [
    product.name,
    product.description,
    product.material,
    product.sku,
    product.publicSpec?.itemNumber,
    ...product.badges,
    ...product.sizes,
    ...componentTerms,
  ].filter(Boolean).join(' ')

  return normalizeSearchText(searchableText).includes(normalizedQuery)
}

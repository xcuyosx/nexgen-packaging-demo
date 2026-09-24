import type { Product } from './catalog'

export function productMatchesSearch(product: Product, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()
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
  ].filter(Boolean).join(' ').toLowerCase()

  return searchableText.includes(normalizedQuery)
}

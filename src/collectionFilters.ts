export type CollectionFilterKey = 'category' | 'q'

export function readCollectionFilters(searchParams: URLSearchParams, categories: readonly string[]) {
  const requestedCategory = searchParams.get('category')

  return {
    category: requestedCategory && categories.includes(requestedCategory) ? requestedCategory : 'All',
    query: searchParams.get('q') ?? '',
  }
}

export function updateCollectionFilter(searchParams: URLSearchParams, key: CollectionFilterKey, value: string) {
  const next = new URLSearchParams(searchParams)

  if (!value || (key === 'category' && value === 'All')) {
    next.delete(key)
  } else {
    next.set(key, value)
  }

  return next
}

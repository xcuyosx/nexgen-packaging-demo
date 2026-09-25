import assert from 'node:assert/strict'
import test from 'node:test'
import { readCollectionFilters, updateCollectionFilter } from '../src/collectionFilters.ts'

const categories = ['All', 'Food Containers', 'Cups & Lids', 'Accessories']

test('collection filters round-trip through a shareable URL', () => {
  const initial = new URLSearchParams('source=home')
  const withCategory = updateCollectionFilter(initial, 'category', 'Food Containers')
  const withSearch = updateCollectionFilter(withCategory, 'q', '620 lid')

  assert.deepEqual(readCollectionFilters(new URLSearchParams(withSearch.toString()), categories), {
    category: 'Food Containers',
    query: '620 lid',
  })
  assert.equal(withSearch.get('source'), 'home')
  assert.equal(initial.toString(), 'source=home')
})

test('clearing filters removes only their URL parameters', () => {
  const initial = new URLSearchParams('source=home&category=Food+Containers&q=620')
  const withoutCategory = updateCollectionFilter(initial, 'category', 'All')
  const withoutSearch = updateCollectionFilter(withoutCategory, 'q', '')

  assert.equal(withoutSearch.toString(), 'source=home')
  assert.equal(initial.get('category'), 'Food Containers')
})

test('unknown category links fall back to all products', () => {
  assert.deepEqual(readCollectionFilters(new URLSearchParams('category=Unknown&q=620'), categories), {
    category: 'All',
    query: '620',
  })
})

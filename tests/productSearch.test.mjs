import assert from 'node:assert/strict'
import test from 'node:test'
import { products } from '../src/catalog.ts'
import { productMatchesSearch } from '../src/productSearch.ts'

test('search finds the entrée family by a verified component item number', () => {
  const entree = products.find((product) => product.id === 'plastic-entree-containers')
  const deli = products.find((product) => product.id === 'plastic-deli-cups')

  assert.ok(entree)
  assert.ok(deli)
  assert.equal(productMatchesSearch(entree, '817'), true)
  assert.equal(productMatchesSearch(entree, '32 oz Medium Entrée Base'), true)
  assert.equal(productMatchesSearch(entree, 'entree'), true)
  assert.equal(productMatchesSearch(entree, 'ENTREE'), true)
  assert.equal(productMatchesSearch(deli, '817'), false)
  assert.equal(productMatchesSearch(deli, 'entree'), false)
})

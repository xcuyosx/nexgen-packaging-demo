import assert from 'node:assert/strict'
import test from 'node:test'
import { parseStoredCart, serializeCart } from '../src/cartPersistence.ts'
import type { CartItem } from '../src/storefrontCart.ts'

test('configured quote lines survive refresh without storing temporary artwork data', () => {
  const item: CartItem = {
    lineId: 'line-817',
    productId: 'plastic-entree-containers',
    cases: 5,
    size: 'Medium · 32 oz',
    component: 'Base',
    itemNumber: '817',
    productName: '32 oz Medium Entrée Base',
    printColors: 1,
    artworkName: 'logo.png',
    artworkPreview: 'data:image/png;base64,large-preview',
    artworkFile: new File(['preview'], 'logo.png', { type: 'image/png' }),
  }
  const saved = serializeCart([item])
  assert.equal(saved.includes('large-preview'), false)
  assert.equal(saved.includes('artworkFile'), false)
  const restored = parseStoredCart(saved)[0]
  assert.equal(restored.lineId, 'line-817')
  assert.equal(restored.cases, 5)
  assert.equal(restored.itemNumber, '817')
  assert.equal(restored.artworkName, 'logo.png')
  assert.equal('artworkPreview' in restored, false)
  assert.equal('artworkFile' in restored, false)
})

test('invalid stored cart data cannot create quote lines', () => {
  assert.deepEqual(parseStoredCart('{broken'), [])
  assert.deepEqual(parseStoredCart(JSON.stringify([{ lineId: 'bad', productId: 'item', cases: -1 }])), [])
})

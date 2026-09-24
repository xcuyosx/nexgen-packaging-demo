import assert from 'node:assert/strict'
import test from 'node:test'
import { addConfiguredCartItem, buildQuoteRequestLine, changeCartLineCases, removeCartLine } from '../src/storefrontCart.ts'

const productId = 'plastic-entree-containers'
const smallFormat = 'Small · 24 oz · 8 × 6 in (base 620 / lid 620)'
const mediumFormat = 'Medium · 32 oz · 10 × 7 in (base 817 / lid 820)'
const base = { component: 'Base', itemNumber: '620', productName: '24 oz Small Entrée Base', material: 'Polypropylene (PP)' }
const lid = { component: 'Lid', itemNumber: '620', productName: '24 oz Small Entrée Lid', material: 'Polyethylene terephthalate (PET)' }
const mediumBase = { component: 'Base', itemNumber: '817', productName: '32 oz Medium Entrée Base', material: 'Polypropylene (PP)' }

test('separate sizes and components stay separate while an identical choice adds cases', () => {
  let cart = addConfiguredCartItem([], productId, 1, smallFormat, base)
  const smallBaseId = cart[0].lineId
  cart = addConfiguredCartItem(cart, productId, 1, mediumFormat, mediumBase)
  cart = addConfiguredCartItem(cart, productId, 2, smallFormat, lid)
  cart = addConfiguredCartItem(cart, productId, 3, smallFormat, base)

  assert.equal(cart.length, 3)
  assert.deepEqual(cart.map(({ cases }) => cases), [4, 1, 2])
  assert.equal(cart[0].lineId, smallBaseId)
  assert.equal(new Set(cart.map(({ lineId }) => lineId)).size, 3)

  cart = changeCartLineCases(cart, cart[1].lineId, 2)
  assert.deepEqual(cart.map(({ cases }) => cases), [4, 3, 2])
  cart = removeCartLine(cart, cart[2].lineId)
  assert.deepEqual(cart.map(({ cases }) => cases), [4, 3])
})

test('submitted quote lines carry the selected entrée component, item number, and material', () => {
  const [cartItem] = addConfiguredCartItem([], productId, 2, mediumFormat, mediumBase)
  const product = {
    id: productId,
    name: 'Plastic entrée containers and lids',
    category: 'Food Containers',
    material: 'PP bases; PET lids except square (PP)',
    description: 'Separate base-and-lid systems',
    casePack: 'Confirmed with quote',
    sizes: [smallFormat, mediumFormat],
  }
  const line = buildQuoteRequestLine({ ...cartItem, product })

  assert.equal(line.sku, '817')
  assert.equal(line.productName, '32 oz Medium Entrée Base')
  assert.equal(line.material, 'Polypropylene (PP)')
  assert.equal(line.size, mediumFormat)
  assert.equal(line.cases, 2)
})

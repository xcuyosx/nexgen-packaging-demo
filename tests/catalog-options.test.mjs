import test from 'node:test'
import assert from 'node:assert/strict'
import {products,isManualQuoteSize} from '../src/catalog.ts'
import {caseLabel} from '../src/portalPresentation.ts'
test('pizza sizes are unique and retained',()=>{const p=products.find(p=>p.id==='pizza-slice-boxes');assert.equal(p.sizes.length,5);assert.equal(new Set(p.sizes).size,5)})
test('generic sizes carry manual quote data',()=>{for(const p of products)for(const size of p.sizes)if(isManualQuoteSize(size))assert(p.manualQuoteSizes.includes(size));assert.equal(isManualQuoteSize('12 oz'),false)})
test('custom studio quantity wording stays singular for one',()=>{assert.equal(caseLabel(1),'case');assert.equal(caseLabel(5),'cases')})

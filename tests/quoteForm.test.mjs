import test from 'node:test'
import assert from 'node:assert/strict'
import { selectedPreferenceId, resolveQuoteContact, quoteDeliveryError, customerStatus } from '../src/quoteForm.ts'
const account={companyName:'CRM company',contactName:'Casey',email:'casey@example.com',billingProfiles:[],receivingLocations:[]}
test('untouched single profiles select the actual saved records',()=>{assert.equal(selectedPreferenceId([{id:'one'}],''),'one')})
test('multiple profiles require a choice unless exactly one is default',()=>{assert.equal(selectedPreferenceId([{id:'a'},{id:'b'}],''),'');assert.equal(selectedPreferenceId([{id:'a'},{id:'b',isDefault:true}],''),'b');assert.equal(selectedPreferenceId([{id:'a'},{id:'b',isDefault:true}],'a'),'a')})
test('missing and deleted profiles cannot silently submit a stale selection',()=>{assert.equal(selectedPreferenceId([],'old'),'');assert.equal(selectedPreferenceId([{id:'a'},{id:'b'}],'old'),'');assert.match(quoteDeliveryError(account,resolveQuoteContact(account,{})),/postal code/);assert.equal(quoteDeliveryError(account,resolveQuoteContact(account,{postalCode:'63044'})),'')})
test('identity prefills but request contact edits survive; company remains CRM-owned',()=>{assert.deepEqual(Object.values(resolveQuoteContact(account,{})).slice(0,3),['Casey','CRM company','casey@example.com']);const contact=resolveQuoteContact(account,{name:'',email:'other@example.com',company:'Forged'});assert.equal(contact.name,'');assert.equal(contact.email,'other@example.com');assert.equal(contact.company,'CRM company')})
test('customer statuses use the approved vocabulary',()=>{assert.equal(customerStatus('Quote sent'),'Quote ready');assert.equal(customerStatus('Preparing your quote'),'In review');assert.equal(customerStatus('Approved'),'Accepted')})

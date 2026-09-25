import assert from 'node:assert/strict'
import test from 'node:test'
import { artworkFileDetails, artworkNeedsReattachment, artworkStoragePath } from '../src/artworkUpload.ts'

test('artwork validation bounds the file types and size accepted for upload', () => {
  assert.deepEqual(artworkFileDetails({ name: 'logo.AI', size: 1024 }), {
    extension: 'ai', contentType: 'application/vnd.adobe.illustrator',
  })
  assert.throws(() => artworkFileDetails({ name: 'payload.exe', size: 1024 }), /Choose a PNG/)
  assert.throws(() => artworkFileDetails({ name: 'large.pdf', size: 10 * 1024 * 1024 + 1 }), /10 MB/)
})

test('saved artwork names need a real file before quote submission', () => {
  assert.equal(artworkNeedsReattachment('logo.svg', undefined), true)
  assert.equal(artworkNeedsReattachment('Artwork to follow', undefined), false)
  assert.equal(artworkNeedsReattachment('logo.svg', { name: 'logo.svg' }), false)
})

test('artwork object paths are scoped by customer and quote request', () => {
  assert.equal(artworkStoragePath('user-id', 'request-id', 'object-id', 'pdf'), 'user-id/request-id/object-id.pdf')
})

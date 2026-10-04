import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { build } from 'vite'

// Exercise real production compilation; values below are synthetic and never sent.
const directory = await mkdtemp(path.join(tmpdir(), 'nexgen-production-check-'))
const keys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const original = Object.fromEntries(keys.map(key => [key, process.env[key]]))
const config = { logLevel: 'silent', build: { outDir: directory, emptyOutDir: true, copyPublicDir: false } }
try {
  for (const [url, key] of [['', ''], ['http://127.0.0.1:54329', ''], ['', 'local-build-test-key']]) {
    process.env.VITE_SUPABASE_URL = url
    process.env.VITE_SUPABASE_ANON_KEY = key
    await assert.rejects(build(config), /Storefront build requires/)
  }
  process.env.VITE_SUPABASE_URL = 'http://127.0.0.1:54329'
  process.env.VITE_SUPABASE_ANON_KEY = 'local-build-test-key'
  await build(config)
  const assets = await readdir(path.join(directory, 'assets'))
  for (const asset of assets.filter(file => file.endsWith('.js'))) {
    const source = await readFile(path.join(directory, 'assets', asset), 'utf8')
    assert.doesNotMatch(source, /summitstadiumgroup|summit-stadium-group|Summit Stadium|Jordan Reyes|555-1000|BILL-SUMMIT|SHIP-SUMMIT|PAY-SUMMIT/)
    assert.doesNotMatch(source, /http:\/\/127\.0\.0\.1:3003/)
  }
  console.log('PASS: three missing-config builds rejected; configured production build excludes demo account data and local bridge URL.')
} finally {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key]
    else process.env[key] = original[key]
  }
  // mkdtemp returned this exact isolated directory; never remove a computed repo path.
  await rm(directory, { recursive: true, force: true })
}

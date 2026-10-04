import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { build, preview } from 'vite'

const directory = await mkdtemp(path.join(tmpdir(), 'nexgen-search-check-'))
const keys = ['VITE_SITE_URL', 'VITE_NOINDEX', 'VERCEL_ENV', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const original = Object.fromEntries(keys.map(key => [key, process.env[key]]))
let server
try {
  process.env.VITE_SUPABASE_URL = 'http://127.0.0.1:54329'
  process.env.VITE_SUPABASE_ANON_KEY = 'local-search-test-key'
  for (const [origin, environment, flag, noindex] of [
    ['https://storefront-staging.vercel.app', 'production', '', true],
    ['https://launch.example', 'preview', 'false', true],
    ['https://launch.example', 'production', '', false],
  ]) {
    process.env.VITE_SITE_URL = origin
    process.env.VITE_NOINDEX = flag
    process.env.VERCEL_ENV = environment
    await build({ logLevel: 'silent', build: { outDir: directory, emptyOutDir: true, copyPublicDir: false } })
    const html = await readFile(path.join(directory, 'index.html'), 'utf8')
    assert.equal(html.includes('content="noindex,nofollow"'), noindex)
    const sitemap = await readFile(path.join(directory, 'sitemap.xml'), 'utf8')
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
    assert.equal(urls.length, 53)
    assert.equal(new Set(urls).size, 53)
    assert.equal(urls.filter(url => url.startsWith(origin + '/products/')).length, 42)
    assert.equal(urls.filter(url => url.startsWith(origin + '/industries/')).length, 5)
    assert.ok(urls.every(url => new URL(url).origin === origin))
    assert.ok(!urls.some(url => /\/(cart|account)/.test(url)))
    assert.match(sitemap, /^<\?xml version="1.0" encoding="UTF-8"\?>/)
    const robots = await readFile(path.join(directory, 'robots.txt'), 'utf8')
    assert.equal(robots, `User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /account\nSitemap: ${origin}/sitemap.xml\n`)
  }
  server = await preview({ logLevel: 'silent', build: { outDir: directory }, preview: { host: '127.0.0.1', port: 5184, strictPort: true } })
  const robotsResponse = await fetch('http://127.0.0.1:5184/robots.txt')
  assert.match(robotsResponse.headers.get('content-type'), /text\/plain/)
  const sitemapResponse = await fetch('http://127.0.0.1:5184/sitemap.xml')
  assert.match(sitemapResponse.headers.get('content-type'), /(?:application|text)\/xml/)
  assert.match(await sitemapResponse.text(), /<urlset /)
  console.log('PASS: 53 unique public sitemap URLs, correct MIME types, staging and preview noindex, public production indexable.')
} finally {
  if (server) await new Promise(resolve => server.httpServer.close(resolve))
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key]
    else process.env[key] = original[key]
  }
  await rm(directory, { recursive: true, force: true })
}

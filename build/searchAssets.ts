import type { Plugin } from 'vite'
import { publicRoutes } from '../src/publicRoutes'

const stagingOrigin = 'https://storefront-staging.vercel.app'

export function getSiteSettings(env: Record<string, string>, mode: string) {
  // TODO(bradley): Confirm the final public hostname before launch.
  const site = new URL(env.VITE_SITE_URL || stagingOrigin)
  if (site.protocol !== 'https:' || site.username || site.password || site.search || site.hash || site.pathname !== '/') {
    throw new Error('VITE_SITE_URL must be an HTTPS origin, without a path, query, or credentials.')
  }
  const noindex = mode !== 'production' || process.env.VERCEL_ENV === 'preview'
    || site.origin === stagingOrigin || env.VITE_NOINDEX === 'true'
  return { origin: site.origin, noindex }
}

export function searchAssets(site: ReturnType<typeof getSiteSettings>): Plugin {
  const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
  const robots = `User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /account\nSitemap: ${site.origin}/sitemap.xml\n`
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicRoutes.map(route => `  <url><loc>${escape(site.origin + route)}</loc></url>`).join('\n')}\n</urlset>\n`
  return {
    name: 'storefront-search-assets',
    transformIndexHtml() {
      return site.noindex ? [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex,nofollow' }, injectTo: 'head' }] : []
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const route = req.url?.split('?')[0]
        if (route !== '/robots.txt' && route !== '/sitemap.xml') return next()
        res.setHeader('Content-Type', route === '/robots.txt' ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8')
        res.end(route === '/robots.txt' ? robots : sitemap)
      })
    },
  }
}

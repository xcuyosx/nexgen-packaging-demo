import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { Product } from './catalog'
import { getPageMetadata } from './pageMetadata'

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

export function DocumentMeta({ products, signedIn = false }: { products: Product[]; signedIn?: boolean }) {
  const { pathname, search } = useLocation()
  const metadata = getPageMetadata(pathname, products)
  const view = new URLSearchParams(search).get('view') || 'overview'
  const titles: Record<string,string> = { overview:'My account', quotes:'My quote requests', billing:'Billing preferences', locations:'Delivery locations', profile:'Company details' }
  const { description, noindex } = metadata
  const title = pathname === '/account' && signedIn ? (new URLSearchParams(search).has('request') ? 'Quote request details' : titles[view] || 'My account') + ' | NexGen' : metadata.title
  useEffect(() => {
    const canonicalUrl = new URL(import.meta.env.VITE_SITE_URL)
    canonicalUrl.pathname = pathname.replace(/\/+$/, '') || '/'
    const canonical = canonicalUrl.href
    const image = `${import.meta.env.VITE_SITE_URL}/og-default.png`
    document.title = title
    setMeta('name', 'description', description)
    for (const [key, value] of Object.entries({ title, description, url: canonical, type: 'website', image })) setMeta('property', `og:${key}`, value)
    for (const [key, value] of Object.entries({ card: 'summary_large_image', title, description, image })) setMeta('name', `twitter:${key}`, value)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canonical
    if (import.meta.env.VITE_NOINDEX === 'true') setMeta('name', 'robots', 'noindex,nofollow')
    else if (noindex) setMeta('name', 'robots', 'noindex')
    else document.head.querySelector('meta[name="robots"]')?.remove()
  }, [pathname, title, description, noindex])
  return null
}

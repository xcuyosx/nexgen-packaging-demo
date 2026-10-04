import { paperProducts, plasticProducts, products } from './catalog'
import type { Product } from './catalog'
import { industries } from './industries'
import { legalDocuments } from './legalDocuments'

export type PageMetadata = { title: string; description: string; noindex?: boolean }
export const homeMetadata: PageMetadata = {
  title: 'NexGen Eco Advanced | Foodservice Packaging',
  description: 'Request pricing on paper and plastic foodservice packaging, including custom-printed cups, from NexGen Packaging Group in Bridgeton, MO.',
}
const pages: Record<string, PageMetadata> = {
  '/': homeMetadata,
  '/products': { title: 'Paper and Plastic Packaging Catalog | NexGen', description: `Browse ${products.length} foodservice packaging families in paper and plastic. Pick sizes, materials and printing, then request a quote.` },
  '/products/paper': { title: 'Paper Packaging for Foodservice | NexGen', description: `${paperProducts.length} paper product families, from beverage cups and pizza boxes to takeout bags and trays. Configure and request a quote.` },
  '/products/plastic': { title: 'Plastic Packaging for Foodservice | NexGen', description: `${plasticProducts.length} plastic product families, including beverage cups, deli and dessert cups, and entrée containers. Configure and request a quote.` },
  '/custom': { title: 'Custom Printed Cups | NexGen Packaging', description: 'Upload your logo, preview its placement on a NexGen cup, choose up to four print colors and request a custom-print quote.' },
  '/industries': { title: 'Packaging by Industry | NexGen', description: 'Packaging for pizza and QSR, deli and bakery, convenience, takeout and delivery, and food processors.' },
  '/capabilities': { title: 'Manufacturing and Custom Packaging | NexGen', description: 'Paper converting, plastic extrusion and thermoforming, custom printing and mixed-truckload programs from one supply partner.' },
  '/contact': { title: 'Contact the NexGen Sales Team', description: 'Send product, quantity, artwork and delivery details to the NexGen sales team, or call (833) 853-1243.' },
  '/cart': { title: 'Quote Cart | NexGen', description: 'Review your selected products, quantities and artwork, then send a quote request to the NexGen team for pricing and follow-up.', noindex: true },
  '/account': { title: 'Sign In | NexGen', description: 'Sign in to your NexGen account to manage quote requests, review your account details and provide billing and delivery information.', noindex: true },
}

const shorten = (text: string, limit = 155) => text.length <= limit ? text : `${text.slice(0, limit - 1).replace(/\s+\S*$/, '').replace(/[.,;:]$/, '')}…`

export function getPageMetadata(pathname: string, catalog: Product[] = products): PageMetadata {
  const route = pathname.replace(/\/+$/, '').toLowerCase() || '/'
  if (pages[route]) return pages[route]
  const legal = route === '/privacy' ? legalDocuments.privacy : route === '/terms' ? legalDocuments.terms : undefined
  if (legal) return { title: `${legal.title} | NexGen`, description: legal.description, noindex: !legal.published }
  const product = catalog.find(item => `/products/${item.id}` === route)
  if (product) return {
    title: `${product.name} | NexGen Packaging`,
    description: `${shorten(product.description.replace(/[.!?]$/, ''), 98)}. Choose size, material and quantity, then request a quote.`,
  }
  const industry = industries.find(item => `/industries/${item.id}` === route)
  if (industry) return { title: `${industry.title} Packaging | NexGen`, description: shorten(industry.description) }
  if (/^\/account\/orders\/[^/]+$/.test(route)) return {
    title: 'Order Details | NexGen', description: 'View the products, shipping information and status of an order in your NexGen account, or start a new quote request.', noindex: true,
  }
  return { title: 'Page not found | NexGen Packaging Group', description: 'We couldn’t find that NexGen page. Browse paper and plastic packaging products or contact our team for help with your quote request.', noindex: true }
}

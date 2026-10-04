import { products } from './catalog'
import { industries } from './industries'
import { legalDocuments } from './legalDocuments'

export const publicRoutes = [
  '/', '/products', '/products/paper', '/products/plastic', '/custom',
  '/industries', '/capabilities', '/contact',
  ...products.map(product => `/products/${product.id}`),
  ...industries.map(industry => `/industries/${industry.id}`),
  ...Object.entries(legalDocuments).filter(([, document]) => document.published).map(([id]) => `/${id}`),
]

import { products } from './catalog'
import { industries } from './industries'

export const publicRoutes = [
  '/', '/products', '/products/paper', '/products/plastic', '/custom',
  '/industries', '/capabilities', '/contact',
  ...products.map(product => `/products/${product.id}`),
  ...industries.map(industry => `/industries/${industry.id}`),
]

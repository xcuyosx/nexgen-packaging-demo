import { products as curatedProducts } from './catalog'
import type { Product, ProductCategory } from './catalog'

type StorefrontCatalogRow = {
  id: string
  storefront_slug?: string | null
  sku: string
  product_name: string
  category: string
  image_path: string
  material: string
  dimensions: string
  case_pack: string
  sell_price: number
  lead_time: string
  stock_type: string
  item_number?: string | null
  capacity?: string | null
  sleeves_per_case?: number | null
  units_per_sleeve?: number | null
  cases_per_pallet?: number | null
  gram_weight?: string | null
  public_description?: string | null
  public_applications?: string[] | null
  spec_sheet_path?: string | null
  public_image_status?: 'Concept' | 'Approved' | null
}

const productImages: Record<string, string> = {
  'beverage-napkin.png': 'https://static.wixstatic.com/media/067fd2_81c9663dd29449a29611123b88c3816b~mv2.jpeg/v1/fill/w_896,h_610,al_c,q_85,enc_avif,quality_auto/papercupscheers.jpeg',
  'clear-cup.png': 'https://static.wixstatic.com/media/067fd2_dcba4a3a1e104ac3b9fb7399dc7eb054~mv2.jpg/v1/fill/w_890,h_514,al_c,q_85,enc_avif,quality_auto/plasticcupbeerserving.jpg',
  'clear-lid.png': 'https://static.wixstatic.com/media/067fd2_dcba4a3a1e104ac3b9fb7399dc7eb054~mv2.jpg/v1/fill/w_890,h_514,al_c,q_85,enc_avif,quality_auto/plasticcupbeerserving.jpg',
  'fiber-bowl.png': 'https://static.wixstatic.com/media/067fd2_59fab9c03a7c41599a037342b9aebc94~mv2.jpeg/v1/crop/x_118,y_565,w_4769,h_2540/fill/w_1858,h_990,al_c,q_85,enc_avif,quality_auto/plastic%20cup%20with%20fruit.jpeg',
  'fiber-tray.png': 'https://static.wixstatic.com/media/067fd2_59fab9c03a7c41599a037342b9aebc94~mv2.jpeg/v1/crop/x_118,y_565,w_4769,h_2540/fill/w_1858,h_990,al_c,q_85,enc_avif,quality_auto/plastic%20cup%20with%20fruit.jpeg',
  'kraft-bag.png': 'https://static.wixstatic.com/media/067fd2_81c9663dd29449a29611123b88c3816b~mv2.jpeg/v1/fill/w_896,h_610,al_c,q_85,enc_avif,quality_auto/papercupscheers.jpeg',
  'kraft-liner.png': 'https://static.wixstatic.com/media/067fd2_81c9663dd29449a29611123b88c3816b~mv2.jpeg/v1/fill/w_896,h_610,al_c,q_85,enc_avif,quality_auto/papercupscheers.jpeg',
  'pizza-box.png': 'https://static.wixstatic.com/media/067fd2_95949ec8a878425ca9c1c55b49f201dc~mv2.jpeg/v1/crop/x_0,y_17,w_4000,h_4125/fill/w_894,h_922,al_c,q_85,enc_avif,quality_auto/plasticcup.jpeg',
  'tamper-seal.png': 'https://static.wixstatic.com/media/067fd2_95949ec8a878425ca9c1c55b49f201dc~mv2.jpeg/v1/crop/x_0,y_17,w_4000,h_4125/fill/w_894,h_922,al_c,q_85,enc_avif,quality_auto/plasticcup.jpeg',
}

const catalogProductImages: Record<string, string> = {
  'CUP20-CAT-02': '/product-images/catalog/20oz-stadium-cup.jpg',
  'LID16-CAT-03': '/product-images/catalog/flat-clear-cup-lid.jpg',
  'SLV12-CAT-04': '/product-images/catalog/kraft-cup-sleeve.jpg',
  'CONT32-CAT-05': '/product-images/catalog/32oz-pp-container.jpg',
  'BOWL24-CAT-06': '/product-images/catalog/24oz-fiber-bowl.jpg',
  'TRAY3C-CAT-07': '/product-images/catalog/three-compartment-fiber-tray.jpg',
  'CLAM96-CAT-08': '/product-images/catalog/9x6-fiber-clamshell.jpg',
  'PBOX12-CAT-09': '/product-images/catalog/12in-pizza-box.jpg',
  'PBOX16-CAT-11': '/product-images/catalog/16in-pizza-box.jpg',
  'LINER12-CAT-12': '/product-images/catalog/grease-resistant-liner.jpg',
  'BAG12-CAT-13': '/product-images/catalog/kraft-takeout-bag.jpg',
  'TRAY96-CAT-14': '/product-images/catalog/9x6-compostable-tray.jpg',
  'BOWL32-CAT-15': '/product-images/catalog/32oz-compostable-bowl.jpg',
  'SEAL3-CAT-16': '/product-images/catalog/tamper-seal-roll.jpg',
  'LBL2-CAT-17': '/product-images/catalog/product-label-roll.jpg',
  'NAPBEV-CAT-18': '/product-images/catalog/beverage-napkin.jpg',
  'SAMPTRAY-CAT-20': '/product-images/catalog/mixed-sample-pack.jpg',
}

// Local preview records mirror the current CRM seed. Production replaces these
// with the active records returned by the safe storefront_catalog RPC.
const previewRows: StorefrontCatalogRow[] = [
  ['40000000-0000-4000-8000-000000000002', 'CUP20-CAT-02', '20 oz stadium cup', 'Custom printed cups', '/product-images/clear-cup.png', 'PET', '20 oz', '1,000/case', 0.145, '21 days', 'Custom'],
  ['40000000-0000-4000-8000-000000000003', 'LID16-CAT-03', 'Flat clear cup lid', 'Custom printed cups', '/product-images/clear-lid.png', 'PET', 'Fits 16-20 oz cup', '1,000/case', 0.041, '14 days', 'Stocked'],
  ['40000000-0000-4000-8000-000000000004', 'SLV12-CAT-04', 'Custom kraft cup sleeve', 'Custom printed cups', '/product-images/kraft-liner.png', 'Kraft paperboard', '12-20 oz fit', '1,500/case', 0.068, '18 days', 'Custom'],
  ['40000000-0000-4000-8000-000000000005', 'CONT32-CAT-05', '32 oz food container', 'Food containers', '/product-images/fiber-tray.png', 'PP', '32 oz', '500/case', 0.255, '14 days', 'Stocked'],
  ['40000000-0000-4000-8000-000000000006', 'BOWL24-CAT-06', '24 oz fiber bowl', 'Food containers', '/product-images/fiber-bowl.png', 'Molded fiber', '24 oz', '300/case', 0.215, '18 days', 'Stocked'],
  ['40000000-0000-4000-8000-000000000007', 'TRAY3C-CAT-07', '3-compartment fiber tray', 'Food containers', '/product-images/fiber-tray.png', 'Molded fiber', '9 x 9 x 2 in', '300/case', 0.295, '18 days', 'Stocked'],
  ['40000000-0000-4000-8000-000000000008', 'CLAM96-CAT-08', '9x6 hinged fiber clamshell', 'Food containers', '/product-images/fiber-tray.png', 'Molded fiber', '9 x 6 x 3 in', '250/case', 0.335, '20 days', 'Stocked'],
  ['40000000-0000-4000-8000-000000000009', 'PBOX12-CAT-09', '12 inch branded pizza box', 'Pizza packaging', '/product-images/pizza-box.png', 'B-flute corrugate', '12 x 12 x 1.75 in', '100/bundle', 0.72, '28 days', 'Made-to-order'],
  ['40000000-0000-4000-8000-000000000011', 'PBOX16-CAT-11', '16 inch branded pizza box', 'Pizza packaging', '/product-images/pizza-box.png', 'B-flute corrugate', '16 x 16 x 1.75 in', '100/bundle', 1.02, '30 days', 'Made-to-order'],
  ['40000000-0000-4000-8000-000000000012', 'LINER12-CAT-12', 'Grease-resistant box liner', 'Pizza packaging', '/product-images/kraft-liner.png', 'Coated kraft', '12 x 12 in', '2,000/case', 0.052, '10 days', 'Stocked'],
  ['40000000-0000-4000-8000-000000000013', 'BAG12-CAT-13', 'Printed kraft takeout bag', 'Sustainable packaging', '/product-images/kraft-bag.png', 'Recycled kraft', '12 x 7 x 14 in', '250/case', 0.31, '21 days', 'Custom'],
  ['40000000-0000-4000-8000-000000000014', 'TRAY96-CAT-14', '9x6 compostable food tray', 'Sustainable packaging', '/product-images/fiber-tray.png', 'Molded fiber', '9 x 6 x 2 in', '400/case', 0.19, '14 days', 'Stocked'],
  ['40000000-0000-4000-8000-000000000015', 'BOWL32-CAT-15', '32 oz compostable bowl', 'Sustainable packaging', '/product-images/fiber-bowl.png', 'Molded fiber', '32 oz', '300/case', 0.235, '18 days', 'Stocked'],
  ['40000000-0000-4000-8000-000000000016', 'SEAL3-CAT-16', 'Branded tamper seal sticker', 'Retail packaging', '/product-images/tamper-seal.png', 'Paper label stock', '3 in round', '5,000/roll', 0.035, '12 days', 'Custom'],
  ['40000000-0000-4000-8000-000000000017', 'LBL2-CAT-17', 'Custom product label roll', 'Retail packaging', '/product-images/tamper-seal.png', 'BOPP label stock', '2 x 3 in', '5,000/roll', 0.042, '12 days', 'Custom'],
  ['40000000-0000-4000-8000-000000000018', 'NAPBEV-CAT-18', 'Custom beverage napkin', 'Retail packaging', '/product-images/beverage-napkin.png', '2-ply paper', '5 x 5 in', '4,000/case', 0.021, '24 days', 'Custom'],
  ['40000000-0000-4000-8000-000000000020', 'SAMPTRAY-CAT-20', 'Mixed container sample pack', 'Samples', '/product-images/fiber-tray.png', 'Assorted packaging', 'Assorted', '10 kits/case', 0, '3 days', 'Stocked'],
].map(([id, sku, product_name, category, image_path, material, dimensions, case_pack, sell_price, lead_time, stock_type]) => ({
  id: String(id), sku: String(sku), product_name: String(product_name), category: String(category), image_path: String(image_path),
  material: String(material), dimensions: String(dimensions), case_pack: String(case_pack), sell_price: Number(sell_price),
  lead_time: String(lead_time), stock_type: String(stock_type),
}))

export const previewStorefrontProducts = previewRows.map(mapStorefrontProduct)

export async function fetchStorefrontProducts(signal?: AbortSignal): Promise<Product[]> {
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  if (!supabaseUrl || !anonKey) return []

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/storefront_catalog`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
    body: '{}',
    signal,
  })
  if (!response.ok) throw new Error('The storefront catalog is temporarily unavailable.')
  const rows = await response.json() as StorefrontCatalogRow[]
  return rows.map(mapStorefrontProduct)
}

export function storefrontFallbackProducts() {
  if (import.meta.env.DEV) return previewStorefrontProducts
  return curatedProducts.map((product) => ({ ...product, source: 'curated' as const, unitPrice: null }))
}

export function productCasePrice(product: Product) {
  if (!product.unitPrice || !product.unitsPerCase) return null
  return product.unitPrice * product.unitsPerCase
}

function mapStorefrontProduct(row: StorefrontCatalogRow): Product {
  const category = storefrontCategory(row.category)
  const dimensions = row.dimensions.trim() || 'Standard format'
  const casePack = row.case_pack.trim() || 'Case pack confirmed with order'
  const imageName = row.image_path.split('/').pop() || ''
  const applications = row.public_applications?.filter(Boolean) || applicationsForCategory(category)
  const hasPublicSpec = Boolean(row.item_number && row.spec_sheet_path)
  return {
    id: row.storefront_slug?.trim() || row.id,
    sku: row.sku,
    name: row.product_name,
    category,
    division: hasPublicSpec
      ? (row.material.toLowerCase().includes('paper') || row.material.toLowerCase().includes('fiber') ? 'paper' : 'plastic')
      : undefined,
    material: row.material || 'Material confirmed with order',
    description: row.public_description?.trim() || `${row.product_name} in ${dimensions}, supplied as ${casePack}. Availability and delivery timing are confirmed before release.`,
    casePack,
    leadTime: row.lead_time || 'Confirmed with order',
    image: catalogProductImages[row.sku] || productImages[imageName] || curatedProducts[0].image,
    badges: [row.stock_type || 'Program item', dimensions, casePack],
    applications,
    sizes: [dimensions],
    unitPrice: Number(row.sell_price) || null,
    unitsPerCase: unitsFromCasePack(casePack),
    stockType: row.stock_type,
    source: 'crm',
    publicSpec: hasPublicSpec ? {
      itemNumber: String(row.item_number),
      capacity: String(row.capacity || ''),
      dimensions,
      sleevesPerCase: Number(row.sleeves_per_case || 0),
      unitsPerSleeve: Number(row.units_per_sleeve || 0),
      casesPerPallet: Number(row.cases_per_pallet || 0),
      gramWeight: String(row.gram_weight || ''),
      specSheetUrl: String(row.spec_sheet_path),
      imageStatus: row.public_image_status === 'Approved' ? 'Approved' : 'Concept',
      sourceNote: 'Published product facts are maintained in the NexGen product master.',
    } : undefined,
  }
}

function storefrontCategory(category: string): ProductCategory {
  const value = category.toLowerCase()
  if (value.includes('cup') || value.includes('lid')) return 'Cups & Lids'
  if (value.includes('container') || value.includes('tray') || value.includes('bowl')) return 'Food Containers'
  if (value.includes('pizza')) return 'Pizza'
  if (value.includes('paper') || value.includes('retail') || value.includes('sustainable')) return 'Paper Packaging'
  if (value.includes('sample') || value.includes('accessor') || value.includes('bag')) return 'Accessories'
  return 'Custom'
}

function applicationsForCategory(category: ProductCategory) {
  const values: Record<ProductCategory, string[]> = {
    'Cups & Lids': ['Beverage', 'QSR', 'Foodservice'],
    'Food Containers': ['Prepared foods', 'Takeout', 'Foodservice'],
    'Paper Packaging': ['Takeout', 'Retail', 'Delivery'],
    Pizza: ['Pizza', 'QSR', 'Delivery'],
    Accessories: ['Foodservice', 'QSR', 'Events'],
    Custom: ['Private label', 'Multi-unit', 'Food processors'],
  }
  return values[category]
}

function unitsFromCasePack(casePack: string) {
  const match = casePack.match(/[\d,]+/)
  if (!match) return 0
  return Number(match[0].replaceAll(',', '')) || 0
}

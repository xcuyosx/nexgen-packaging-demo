export const categoryOptions = [
  'All',
  'Cups & Lids',
  'Food Containers',
  'Paper Packaging',
  'Pizza',
  'Accessories',
  'Custom',
] as const

export type ProductCategory = Exclude<(typeof categoryOptions)[number], 'All'>
export type ProductDivision = 'paper' | 'plastic' | 'both'

export type ProductOptionGroup = {
  label: string
  options: string[]
}

export type ProductPublicSpec = {
  itemNumber: string
  capacity: string
  dimensions: string
  sleevesPerCase: number
  unitsPerSleeve: number
  casesPerPallet: number
  gramWeight: string
  specSheetUrl: string
  imageStatus: 'Concept' | 'Approved'
  sourceNote: string
}

export type ProductSpecDownload = {
  label: string
  url: string
}

export type Product = {
  id: string
  sku?: string
  name: string
  category: ProductCategory
  division?: ProductDivision
  material: string
  materials?: string[]
  description: string
  casePack: string
  leadTime: string
  image: string
  imageNote?: string
  badges: string[]
  applications: string[]
  sizes: string[]
  optionGroups?: ProductOptionGroup[]
  maxPrintColors?: 0 | 1 | 2 | 3 | 4
  unitPrice?: number | null
  unitsPerCase?: number
  stockType?: string
  source?: 'crm' | 'curated'
  publicSpec?: ProductPublicSpec
  specDownloadsBySize?: Record<string, ProductSpecDownload[]>
}

type ProductSeed = Omit<Product, 'sizes' | 'casePack' | 'leadTime' | 'source'> & {
  optionGroups: ProductOptionGroup[]
  casePack?: string
  leadTime?: string
}

const familyImage = (name: string) => `/product-images/families/${name}`
const confirmCasePack = 'Confirmed with quote'
const confirmLeadTime = 'Confirmed with quote'

const paperCupMaterials = [
  'Virgin paper - standard',
  'EcoBio Paper - 100% recycled paper',
  'EcoBio Earth - 100% biodegradable',
  'EcoBio Natura - 100% compostable',
]

const paperBoxMaterials = [
  'Virgin paper - standard',
  'EcoBio Paper - 100% recycled paper',
  'EcoBio Flute - 100% recycled fiber',
  'EcoBio Earth - 100% biodegradable',
  'EcoBio Natura - 100% compostable',
]

const plasticMaterials = [
  'Virgin plastic - standard',
  'EcoBio Plastic - 100% recycled',
  'EcoBio Earth - 100% biodegradable',
  'EcoBio Natura - 100% compostable',
]

const entreeFormats = {
  small: 'Small · 24 oz · 8 × 6 in (base 620 / lid 620)',
  medium: 'Medium · 32 oz · 10 × 7 in (base 817 / lid 820)',
  large: 'Large · 64 oz · 12 × 8.5 in (base 920 / lid 920)',
  square: 'Square · 32 oz · 8 × 8 in (base 520 / lid 520)',
} as const

const family = (seed: ProductSeed): Product => ({
  ...seed,
  sizes: seed.optionGroups.flatMap((group) => group.options),
  casePack: seed.casePack || confirmCasePack,
  leadTime: seed.leadTime || confirmLeadTime,
  source: 'curated',
})

export const products: Product[] = [
  {
    id: '620-24oz-small-entree-base',
    sku: '620',
    name: '24 oz Small Entrée Base',
    category: 'Food Containers',
    division: 'plastic',
    material: 'Polypropylene (PP)',
    materials: ['Polypropylene (PP)'],
    description: 'An 8 × 6 × 1.7 inch black polypropylene base for 24 oz entrée and prepared-food programs.',
    casePack: '400/case',
    leadTime: 'Confirmed with quote',
    image: '/product-images/specifications/item-620-concept.png',
    badges: ['24 oz capacity', 'Item 620', '400 per case'],
    applications: [],
    sizes: ['8 × 6 × 1.7 in'],
    optionGroups: [{ label: 'Product size', options: ['8 × 6 × 1.7 in · 24 oz'] }],
    unitsPerCase: 400,
    stockType: 'Program item',
    source: 'curated',
    publicSpec: {
      itemNumber: '620',
      capacity: '24 oz',
      dimensions: '8 × 6 × 1.7 in',
      sleevesPerCase: 2,
      unitsPerSleeve: 200,
      casesPerPallet: 24,
      gramWeight: '18 g',
      specSheetUrl: '/specifications/NexGenPac-620-24oz-Small-Entree-Base-Spec-Sheet.pdf',
      imageStatus: 'Concept',
      sourceNote: 'Published fields are drawn from the VeriSmart master cost model. Additional technical claims will appear only after verification.',
    },
  },
  family({
    id: 'paper-beverage-cups', name: 'Paper beverage cups', category: 'Cups & Lids', division: 'paper',
    material: 'Coated paper cupstock', materials: paperCupMaterials,
    description: 'Hot and cold beverage cups with coordinated rim formats and custom-print programs.',
    image: familyImage('paper-beverage-cups-v2.jpg'), badges: ['6-32 oz', '77-105 mm rims', 'Up to 4-color print'],
    applications: ['Coffee', 'Beverage', 'QSR', 'Convenience'],
    optionGroups: [{ label: 'Cup size', options: ['6 oz - 77 mm', '12 oz - 88 mm', '16 oz - 88 mm', '21 oz - 88 mm', '32 oz - 105 mm'] }],
    maxPrintColors: 4,
  }),
  family({
    id: 'beverage-sleeves', name: 'Beverage sleeves', category: 'Cups & Lids', division: 'paper',
    material: 'Paperboard', materials: paperCupMaterials,
    description: 'Insulating paper sleeves coordinated with the NexGen beverage-cup program.',
    image: '/product-images/catalog/kraft-cup-sleeve.jpg', badges: ['88 mm', 'Cup matched', 'Custom print'],
    applications: ['Coffee', 'Beverage', 'QSR'], optionGroups: [{ label: 'Sleeve size', options: ['88 mm'] }], maxPrintColors: 4,
  }),
  family({
    id: 'beverage-carriers', name: 'Beverage carriers', category: 'Paper Packaging', division: 'paper',
    material: 'Paperboard or molded fiber', materials: paperBoxMaterials,
    description: 'Carry solutions for individual and group beverage orders.',
    image: familyImage('beverage-carriers-v2.jpg'), badges: ['2 cell', '4 cell', 'Cup matched'],
    applications: ['Coffee', 'Beverage', 'Takeout', 'Delivery'], optionGroups: [{ label: 'Carrier format', options: ['2 cell', '4 cell'] }],
  }),
  family({
    id: 'paper-food-cups', name: 'Paper food cups and lids', category: 'Cups & Lids', division: 'paper',
    material: 'Coated paperboard', materials: paperCupMaterials,
    description: 'Round paper food cups for sides, soups, desserts, and prepared foods.',
    image: familyImage('paper-food-cups-v2.jpg'), badges: ['6-32 oz', '98 or 117 mm rim', 'Lid matching'],
    applications: ['Prepared foods', 'Takeout', 'Deli & bakery', 'QSR'],
    optionGroups: [
      { label: '98 mm rim', options: ['6 oz - 98 mm', '8 oz - 98 mm', '12 oz - 98 mm', '16 oz - 98 mm'] },
      { label: '117 mm rim', options: ['12 oz - 117 mm', '16 oz - 117 mm', '24 oz - 117 mm', '32 oz - 117 mm'] },
    ], maxPrintColors: 4,
  }),
  family({
    id: 'paper-food-buckets', name: 'Paper food buckets and lids', category: 'Paper Packaging', division: 'paper',
    material: 'Coated paperboard', materials: paperCupMaterials,
    description: 'Large-capacity buckets for chicken, snacks, shared meals, and entertainment venues.',
    image: familyImage('paper-food-buckets-v2.jpg'), badges: ['32-128 oz', '170 mm rim', 'Custom print'],
    applications: ['QSR', 'Events', 'Takeout', 'Delivery'],
    optionGroups: [{ label: 'Bucket size - 170 mm rim', options: ['32 oz', '40 oz', '48 oz', '56 oz', '64 oz', '88 oz', '128 oz'] }], maxPrintColors: 4,
  }),
  family({
    id: 'pizza-plates', name: 'Pizza plates', category: 'Pizza', division: 'paper', material: 'Paperboard', materials: paperCupMaterials,
    description: 'Round paper plates sized for individual pizza service.', image: familyImage('pizza-plates-v2.jpg'),
    badges: ['9 inch', 'Foodservice', 'Paper'], applications: ['Pizza', 'QSR', 'Events'],
    optionGroups: [{ label: 'Plate size', options: ['9 in × 0.25 in'] }],
  }),
  family({
    id: 'smartbox-food-boxes', name: 'SmartBox food boxes', category: 'Food Containers', division: 'paper',
    material: 'Formed paperboard', materials: paperBoxMaterials,
    description: 'Formed paper food boxes for takeout, prepared foods, and branded service.', image: familyImage('smartbox-v2.jpg'),
    badges: ['4 sizes', 'Formed carton', 'Custom print'], applications: ['Takeout', 'Prepared foods', 'QSR'],
    optionGroups: [{ label: 'Box size', options: ['#1S - 5 × 4.5 × 2.5 in', '#8M - 6.75 × 5.5 × 2.5 in', '#3L - 8.5 × 6.25 × 2.5 in', '#4XL - 8.5 × 6.25 × 3.5 in'] }], maxPrintColors: 4,
  }),
  family({
    id: 'smartview-food-boxes', name: 'SmartView windowed boxes', category: 'Food Containers', division: 'paper',
    material: 'Windowed paperboard', materials: paperBoxMaterials,
    description: 'Display-focused paper food boxes with a product-view window.', image: familyImage('smartview-v2.jpg'),
    badges: ['Windowed', '4 sizes', 'Retail display'], applications: ['Deli & bakery', 'Retail', 'Prepared foods', 'Takeout'],
    optionGroups: [{ label: 'Box size', options: ['#1S - 5 × 4.5 × 2.5 in', '#8M - 6.75 × 5.5 × 2.5 in', '#3L - 8.5 × 6.25 × 2.5 in', '#4XL - 8.5 × 6.25 × 3.5 in'] }], maxPrintColors: 4,
  }),
  family({
    id: 'takeout-handle-boxes', name: 'Takeout handle boxes', category: 'Paper Packaging', division: 'paper',
    material: 'Paperboard', materials: paperBoxMaterials,
    description: 'Handled takeout cartons for meals, catering, and carryout service.', image: familyImage('takeout-handle-boxes-v2.jpg'),
    badges: ['Small-large', 'Built-in handle', 'Custom print'], applications: ['Takeout', 'Catering', 'Delivery'],
    optionGroups: [{ label: 'Box size', options: ['Small', 'Medium', 'Large'] }], maxPrintColors: 4,
  }),
  family({
    id: 'takeout-chicken-boxes', name: 'Takeout chicken boxes', category: 'Paper Packaging', division: 'paper',
    material: 'Paperboard', materials: paperBoxMaterials,
    description: 'Ventable paper cartons for chicken and hot-food takeout programs.', image: familyImage('chicken-boxes-v2.jpg'),
    badges: ['Medium', 'Hot food', 'Takeout'], applications: ['QSR', 'Takeout', 'Delivery'],
    optionGroups: [{ label: 'Box size', options: ['Medium'] }], maxPrintColors: 4,
  }),
  family({
    id: 'paper-food-trays', name: 'Paper food trays', category: 'Paper Packaging', division: 'paper',
    material: 'Paperboard', materials: paperBoxMaterials,
    description: 'Open-top trays for concessions, sides, sampling, and fast-casual service.', image: '/product-images/catalog/9x6-compostable-tray.jpg',
    badges: ['5 sizes', 'Open top', 'Custom print'], applications: ['Events', 'QSR', 'Prepared foods', 'Convenience'],
    optionGroups: [{ label: 'Tray size', options: ['#1 - 5.5 × 4.25 × 1.5 in', '#2 - 6.5 × 4.75 × 1.5 in', '#3 - 7.75 × 5.75 × 2 in', '#4 - 8.5 × 5 × 2.25 in', '#5 - 9.5 × 6.5 × 2.25 in'] }], maxPrintColors: 4,
  }),
  family({
    id: 'french-fry-boxes', name: 'French fry boxes', category: 'Paper Packaging', division: 'paper',
    material: 'Paperboard', materials: paperBoxMaterials,
    description: 'Purpose-built cartons for french fries and side-item service.', image: familyImage('french-fry-boxes-v2.jpg'),
    badges: ['2 sizes', 'Open top', 'Custom print'], applications: ['QSR', 'Takeout', 'Events'],
    optionGroups: [{ label: 'Box size', options: ['Regular - 3 × 2.25 × 2 in', 'Large - 3.5 × 2.5 × 2.75 in'] }], maxPrintColors: 4,
  }),
  family({
    id: 'burger-sandwich-boxes', name: 'Burger and sandwich boxes', category: 'Paper Packaging', division: 'paper',
    material: 'Paperboard or E-flute', materials: paperBoxMaterials,
    description: 'Hinged paper cartons for burgers, sandwiches, and compact meals.', image: familyImage('burger-sandwich-boxes-v2.jpg'),
    badges: ['3 sizes', 'Hinged', 'Custom print'], applications: ['QSR', 'Takeout', 'Delivery'],
    optionGroups: [{ label: 'Box size', options: ['4 × 4 × 2.75 in', '5 × 5 × 2.75 in', '6 × 6 × 2.75 in'] }], maxPrintColors: 4,
  }),
  family({
    id: 'hot-dog-burrito-boxes', name: 'Hot dog and burrito boxes', category: 'Paper Packaging', division: 'paper',
    material: 'Paperboard or E-flute', materials: paperBoxMaterials,
    description: 'Long-form paper cartons for hot dogs, burritos, and similar menu items.', image: familyImage('hot-dog-burrito-boxes-v2.jpg'),
    badges: ['6 inch', 'Hinged', 'Custom print'], applications: ['QSR', 'Takeout', 'Convenience'],
    optionGroups: [{ label: 'Box size', options: ['6 × 2.75 × 2.5 in'] }], maxPrintColors: 4,
  }),
  family({
    id: 'snack-appetizer-boxes', name: 'Snack and appetizer boxes', category: 'Paper Packaging', division: 'paper',
    material: 'Paperboard or E-flute', materials: paperBoxMaterials,
    description: 'Compact cartons for appetizers, sides, snacks, and shareable items.', image: familyImage('snack-appetizer-boxes-v2.jpg'),
    badges: ['4 sizes', 'Hinged', 'Custom print'], applications: ['QSR', 'Takeout', 'Events'],
    optionGroups: [{ label: 'Box size', options: ['5 × 3 × 2.75 in', '6 × 4 × 2.75 in', '7 × 5 × 2.75 in', '8 × 6 × 2.75 in'] }], maxPrintColors: 4,
  }),
  family({
    id: 'sub-hoagie-boxes', name: 'Sub, hoagie and grinder boxes', category: 'Paper Packaging', division: 'paper',
    material: 'Paperboard or E-flute', materials: paperBoxMaterials,
    description: 'Long hinged cartons for subs, hoagies, grinders, and sandwiches.', image: familyImage('sub-hoagie-boxes-v2.jpg'),
    badges: ['7-11 inch', 'Hinged', 'Custom print'], applications: ['QSR', 'Takeout', 'Delivery'],
    optionGroups: [{ label: 'Box size', options: ['7 × 3.5 × 2.75 in', '9 × 3.5 × 2.75 in', '11 × 3.5 × 2.75 in'] }], maxPrintColors: 4,
  }),
  family({
    id: 'pizza-boxes', name: 'Pizza boxes', category: 'Pizza', division: 'paper',
    material: 'B-flute or E-flute corrugate', materials: paperBoxMaterials,
    description: 'Full-size pizza boxes for dine-out, takeout, and delivery programs.', image: '/product-images/catalog/16in-pizza-box.jpg',
    badges: ['7-18 inch', 'B-flute options', 'Custom print'], applications: ['Pizza', 'QSR', 'Takeout', 'Delivery'],
    optionGroups: [{ label: 'Box size', options: ['7 × 7 × 2 in', '8 × 8 × 2 in', '9 × 9 × 2 in', '10 × 10 × 2 in', '12 × 12 × 2 in', '14 × 14 × 2 in', '16 × 16 × 2 in', '18 × 18 × 2 in'] }], maxPrintColors: 4,
  }),
  family({
    id: 'pizza-slice-boxes', name: 'Personal pizza and slice boxes', category: 'Pizza', division: 'paper',
    material: 'Paperboard or E-flute', materials: paperBoxMaterials,
    description: 'Compact boxes for personal pizzas, slices, and grab-and-go service.', image: '/product-images/catalog/12in-pizza-box.jpg',
    badges: ['Personal and slice', '5 sizes', 'Custom print'], applications: ['Pizza', 'Convenience', 'QSR', 'Takeout'],
    optionGroups: [
      { label: 'Personal pizza box', options: ['10 in - 6 × 6 × 2.75 in', '12 in - 6.5 × 6.5 × 2.75 in', '14 in - 7 × 7 × 2.75 in', '16 in - 8 × 8 × 2.75 in', '18 in - 9.5 × 9.5 × 2.75 in'] },
      { label: 'Pizza slice box', options: ['10 in - 6 × 6 × 2.75 in', '12 in - 6.5 × 6.5 × 2.75 in', '14 in - 7 × 7 × 2.75 in', '16 in - 8 × 8 × 2.75 in', '18 in - 9.5 × 9.5 × 2.75 in'] },
    ], maxPrintColors: 4,
  }),
  family({
    id: 'pizza-box-liners', name: 'Pizza box liners', category: 'Pizza', division: 'paper',
    material: 'Grease-resistant paper', materials: paperCupMaterials,
    description: 'Paper liners coordinated with pizza boxes, product size, and delivery time.', image: '/product-images/catalog/grease-resistant-liner.jpg',
    badges: ['Box matched', 'Grease resistant', 'Paper'], applications: ['Pizza', 'Takeout', 'Delivery'],
    optionGroups: [{ label: 'Liner size', options: ['Match selected pizza box', 'Custom liner size'] }],
  }),
  family({
    id: 'meat-seafood-trays', name: 'Meat and seafood trays', category: 'Food Containers', division: 'paper',
    material: 'Paperboard or fiber', materials: paperBoxMaterials,
    description: 'Retail-display trays for meat, seafood, and refrigerated food programs.', image: familyImage('meat-seafood-trays-v2.jpg'),
    badges: ['Retail display', 'Food contact', 'Multiple formats'], applications: ['Retail', 'Food processors', 'Prepared foods'],
    optionGroups: [{ label: 'Tray format', options: ['Standard format - confirm with quote', 'Custom format'] }],
  }),
  family({
    id: 'catering-trays', name: 'Catering trays', category: 'Food Containers', division: 'paper',
    material: 'Paperboard or fiber', materials: paperBoxMaterials,
    description: 'Larger trays for catering, party service, and prepared-food presentation.', image: familyImage('catering-trays-v2.jpg'),
    badges: ['Large format', 'Presentation ready', 'Lid options'], applications: ['Catering', 'Prepared foods', 'Takeout'],
    optionGroups: [{ label: 'Tray format', options: ['Standard format - confirm with quote', 'Custom format'] }],
  }),
  family({
    id: 'paper-entree-containers', name: 'Paper entrée containers', category: 'Food Containers', division: 'paper',
    material: 'Paperboard or fiber', materials: paperBoxMaterials,
    description: 'Paper-based meal containers for entrées, sides, and prepared-food programs.', image: '/product-images/catalog/24oz-fiber-bowl.jpg',
    badges: ['Meal format', 'Lid options', 'Custom program'], applications: ['Prepared foods', 'Takeout', 'Catering'],
    optionGroups: [{ label: 'Container format', options: ['Standard format - confirm with quote', 'Custom format'] }],
  }),
  family({
    id: 'paper-clamshells', name: 'Paper clamshells', category: 'Food Containers', division: 'paper',
    material: 'Paperboard or fiber', materials: paperBoxMaterials,
    description: 'Hinged paper containers for takeout meals, sandwiches, and prepared foods.', image: '/product-images/catalog/9x6-fiber-clamshell.jpg',
    badges: ['Hinged', 'Takeout', 'Multiple formats'], applications: ['QSR', 'Takeout', 'Prepared foods'],
    optionGroups: [{ label: 'Clamshell format', options: ['Standard format - confirm with quote', 'Custom format'] }], maxPrintColors: 4,
  }),
  family({
    id: 'paper-plates', name: 'Paper plates', category: 'Paper Packaging', division: 'paper',
    material: 'Paperboard or fiber', materials: paperCupMaterials,
    description: 'Disposable paper plates for foodservice, events, and prepared meals.', image: familyImage('paper-plates-v2.jpg'),
    badges: ['Foodservice', 'Multiple formats', 'Renewable options'], applications: ['Events', 'Foodservice', 'QSR'],
    optionGroups: [{ label: 'Plate format', options: ['Standard format - confirm with quote', 'Custom format'] }],
  }),
  family({
    id: 'ecotemp-takeout-bags', name: 'EcoTemp takeout bags', category: 'Accessories', division: 'paper',
    material: 'Paper', materials: paperCupMaterials,
    description: 'Paper carryout bags coordinated with food packaging and delivery programs.', image: '/product-images/catalog/kraft-takeout-bag.jpg',
    badges: ['Paper', 'Takeout', 'Program matched'], applications: ['Takeout', 'Delivery', 'QSR'],
    optionGroups: [{ label: 'Bag format', options: ['EcoTemp standard', 'Custom bag format'] }], maxPrintColors: 4,
  }),
  family({
    id: 'cutlery-kits', name: 'Cutlery kits', category: 'Accessories', division: 'paper',
    material: 'Wood or program-specific material', materials: ['Wood - standard', 'Alternative material - confirm with quote'],
    description: 'Coordinated utensil kits for takeout, delivery, and foodservice.', image: familyImage('cutlery-kits-v2.jpg'),
    badges: ['Complete kit', 'Foodservice', 'Sourced option'], applications: ['Takeout', 'Delivery', 'Foodservice'],
    optionGroups: [{ label: 'Kit contents', options: ['Fork', 'Knife', 'Spoon', 'Napkin', 'Salt and pepper', 'Complete kit'] }],
  }),
  family({
    id: 'food-wrap', name: 'Food wrap', category: 'Accessories', division: 'paper', material: 'Food-contact paper', materials: paperCupMaterials,
    description: 'Food-contact wrap for sandwiches, bakery, deli, and takeout service.', image: familyImage('food-wrap-v2.jpg'),
    badges: ['10 × 10 inch', 'Food contact', 'Paper'], applications: ['Deli & bakery', 'QSR', 'Takeout'],
    optionGroups: [{ label: 'Sheet size', options: ['10 × 10 in'] }],
  }),
  family({
    id: 'beverage-straws', name: 'Beverage straws', category: 'Accessories', division: 'paper',
    material: 'Paper', materials: ['Paper - standard', 'Alternative material - confirm with quote'],
    description: 'Paper beverage straws for coordinated cup and foodservice programs.', image: familyImage('beverage-straws-v2.jpg'),
    badges: ['8 inch', 'Paper', 'Beverage'], applications: ['Beverage', 'QSR', 'Convenience'],
    optionGroups: [{ label: 'Straw size', options: ['8 in'] }],
  }),
  family({
    id: 'plastic-beverage-cups', name: 'Plastic beverage cups and lids', category: 'Cups & Lids', division: 'plastic',
    material: 'PET-family plastic', materials: plasticMaterials,
    description: 'Clear beverage cups spanning sampler, taster, cold-drink, and large-format programs.', image: '/product-images/catalog/20oz-stadium-cup.jpg',
    badges: ['1-30 oz', 'Multiple rim formats', 'Up to 4-color print'], applications: ['Beverage', 'Events', 'Convenience', 'Foodservice'],
    optionGroups: [
      { label: 'Sampler and taster', options: ['1 oz', '2 oz', '3.5 oz', '5 oz', '7 oz', '9 oz'] },
      { label: '92 mm rim', options: ['4 oz insert - 92 mm', '9 oz squat - 92 mm', '12 oz - 92 mm', '14 oz - 92 mm', '16 oz - 92 mm', '18 oz - 92 mm', '20 oz - 92 mm'] },
      { label: '98 mm rim', options: ['14 oz - 98 mm', '16 oz - 98 mm', '18 oz - 98 mm', '20 oz - 98 mm', '24 oz - 98 mm'] },
      { label: '105 mm rim', options: ['30 oz - 105 mm'] },
    ], maxPrintColors: 4,
  }),
  family({
    id: 'portion-control-cups', name: 'Portion control cups and lids', category: 'Cups & Lids', division: 'plastic',
    material: 'Food-contact plastic', materials: plasticMaterials,
    description: 'Compact cups for sauces, condiments, tastings, and portion control.', image: familyImage('portion-cups-v2.jpg'),
    badges: ['1-2 oz', 'Lid matching', 'Foodservice'], applications: ['QSR', 'Prepared foods', 'Convenience'],
    optionGroups: [{ label: 'Cup size', options: ['1 oz', '2 oz'] }], maxPrintColors: 4,
  }),
  family({
    id: 'plastic-deli-cups', name: 'Plastic deli cups and lids', category: 'Food Containers', division: 'plastic',
    material: 'Clear food-contact plastic', materials: plasticMaterials,
    description: 'Clear round containers for deli sides, salads, prepared foods, and merchandising.', image: familyImage('deli-cups-v2.jpg'),
    badges: ['8-32 oz', 'Standard and XL', 'Lid matching'], applications: ['Deli & bakery', 'Prepared foods', 'Retail'],
    optionGroups: [{ label: 'Cup size', options: ['8 oz', '8 oz XL (12)', '16 oz', '16 oz XL (20)', '32 oz', '32 oz XL (36)'] }], maxPrintColors: 4,
  }),
  family({
    id: 'plastic-dessert-cups', name: 'Plastic dessert cups and lids', category: 'Food Containers', division: 'plastic',
    material: 'Clear food-contact plastic', materials: plasticMaterials,
    description: 'Specialty dessert formats for parfaits, sundaes, chilled desserts, and grab-and-go service.', image: familyImage('dessert-cups-v2.jpg'),
    badges: ['Parfait', 'Dome lids', 'Specialty formats'], applications: ['Dessert', 'Deli & bakery', 'Retail', 'Convenience'],
    optionGroups: [
      { label: 'Cup format', options: ['Small', 'Medium', 'Large', 'Parfait', 'Banana split'] },
      { label: 'Lid format', options: ['Low dome lid', 'High dome lid'] },
    ], maxPrintColors: 4,
  }),
  family({
    id: 'plastic-food-cups', name: 'Plastic food cups and lids', category: 'Food Containers', division: 'plastic',
    material: 'Clear food-contact plastic', materials: plasticMaterials,
    description: 'Clear food cups for salads, sides, chilled prepared foods, and retail display.', image: familyImage('plastic-food-cups-v2.jpg'),
    badges: ['Clear display', 'Lid matching', 'Foodservice'], applications: ['Prepared foods', 'Retail', 'Deli & bakery'],
    optionGroups: [{ label: 'Cup format', options: ['Standard format - confirm with quote', 'Custom format'] }], maxPrintColors: 4,
  }),
  family({
    id: 'vegetable-trays', name: 'Vegetable trays and lids', category: 'Food Containers', division: 'plastic',
    material: 'Clear-lid plastic tray system', materials: plasticMaterials,
    description: 'Multi-compartment produce trays for retail, party, and grab-and-go programs.', image: familyImage('vegetable-trays-v2.jpg'),
    badges: ['Compartmented', 'Clear lid', 'Retail display'], applications: ['Produce', 'Retail', 'Catering'],
    optionGroups: [{ label: 'Tray format', options: ['Veggie tray and lid', 'Custom compartment format'] }],
  }),
  family({
    id: 'luau-bowls', name: 'Luau bowls and lids', category: 'Food Containers', division: 'plastic',
    material: 'Rigid food-contact plastic', materials: plasticMaterials,
    description: 'Round party and produce bowls with coordinated clear lids.', image: familyImage('luau-bowls-v2.jpg'),
    badges: ['Party format', 'Clear lid', 'Retail display'], applications: ['Produce', 'Retail', 'Catering'],
    optionGroups: [{ label: 'Bowl format', options: ['Luau bowl and lid', 'Custom bowl format'] }],
  }),
  family({
    id: 'octagon-trays', name: 'Octagon trays and lids', category: 'Food Containers', division: 'plastic',
    material: 'Rigid food-contact plastic', materials: plasticMaterials,
    description: 'Display-ready octagonal trays with coordinated lids for produce and prepared foods.', image: familyImage('octagon-trays-v2.jpg'),
    badges: ['Octagon format', 'Clear lid', 'Retail display'], applications: ['Produce', 'Retail', 'Prepared foods'],
    optionGroups: [{ label: 'Tray format', options: ['Octagon tray and lid', 'Custom tray format'] }],
  }),
  family({
    id: 'family-pack-trays', name: 'Family-pack trays and lids', category: 'Food Containers', division: 'plastic',
    material: 'Rigid food-contact plastic', materials: plasticMaterials,
    description: 'Deeper trays for family meals, proteins, and larger prepared-food portions.', image: familyImage('family-pack-trays-v2.jpg'),
    badges: ['2 or 4 inch', 'Family size', 'Lid matching'], applications: ['Prepared foods', 'Retail', 'Food processors'],
    optionGroups: [{ label: 'Tray depth', options: ['2 in tray', '4 in tray'] }],
  }),
  family({
    id: 'plastic-entree-containers', name: 'Plastic entrée containers and lids', category: 'Food Containers', division: 'plastic',
    material: 'PP bases; PET lids except square (PP)', materials: ['PP bases; PET lids except square (PP)'],
    description: 'Separate base-and-lid systems for meals, entrées, and prepared-food programs.', image: '/product-images/specifications/item-620-concept.png',
    imageNote: 'Illustrative entrée base · formats vary',
    badges: ['4 formats', 'Base and lid', 'Prepared meals'], applications: ['Prepared foods', 'Takeout', 'Retail', 'Catering'],
    optionGroups: [{ label: 'Container format', options: Object.values(entreeFormats) }],
    specDownloadsBySize: {
      [entreeFormats.small]: [
        { label: 'Base specification · Item 620', url: '/specifications/NexGenPac-620-24oz-Small-Entree-Base-Spec-Sheet.pdf' },
        { label: 'Lid specification · Item 620', url: '/specifications/NexGenPac-620-24-oz-Small-Entree-Lid-Spec-Sheet.pdf' },
      ],
      [entreeFormats.medium]: [
        { label: 'Base specification · Item 817', url: '/specifications/NexGenPac-817-32-oz-Medium-Entree-Base-Spec-Sheet.pdf' },
        { label: 'Lid specification · Item 820', url: '/specifications/NexGenPac-820-32-oz-Medium-Entree-Lid-Spec-Sheet.pdf' },
      ],
      [entreeFormats.large]: [
        { label: 'Base specification · Item 920', url: '/specifications/NexGenPac-920-64-oz-Large-Entree-Base-Spec-Sheet.pdf' },
        { label: 'Lid specification · Item 920', url: '/specifications/NexGenPac-920-64-oz-Large-Entree-Lid-Spec-Sheet.pdf' },
      ],
      [entreeFormats.square]: [
        { label: 'Base specification · Item 520', url: '/specifications/NexGenPac-520-32-oz-Square-Entree-Base-Spec-Sheet.pdf' },
        { label: 'Lid specification · Item 520', url: '/specifications/NexGenPac-520-32-oz-Square-Entree-Lid-Spec-Sheet.pdf' },
      ],
    },
  }),
  family({
    id: 'juice-bottles', name: 'Juice bottles and caps', category: 'Accessories', division: 'plastic',
    material: 'Clear food-contact plastic', materials: plasticMaterials,
    description: 'Clear bottles for juice, prepared beverages, and private-label drink programs.', image: familyImage('juice-bottles-v2.jpg'),
    badges: ['16-64 oz', 'Tamper-evident cap', 'Custom label'], applications: ['Beverage', 'Retail', 'Convenience', 'Food processors'],
    optionGroups: [
      { label: 'Bottle size', options: ['16 oz', '32 oz', '64 oz'] },
      { label: 'Closure', options: ['Tamper-evident cap'] },
    ],
  }),
]

export const paperProducts = products.filter((product) => product.division === 'paper')
export const plasticProducts = products.filter((product) => product.division === 'plastic')

export const applicationOptions = [
  'All applications',
  ...Array.from(new Set(products.flatMap((product) => product.applications))),
]

export const quoteQuantityOptions = [1, 5, 10, 25, 50, 100, 250]

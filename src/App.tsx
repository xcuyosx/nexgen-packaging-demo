import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Lock,
  Mail,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react'
import './App.css'

type LeadStage = 'New' | 'Qualified' | 'Sample Sent' | 'Quoted' | 'Won' | 'Nurture'
type LeadPriority = 'Hot' | 'Warm' | 'Cold'
type SampleStatus = 'Not Requested' | 'Requested' | 'Packed' | 'Sent' | 'Delivered'
type QuoteStatus = 'Not Started' | 'Needs Pricing' | 'Drafting' | 'Sent' | 'Approved'
type TaskType = 'Call' | 'Email' | 'Send Samples' | 'Build Quote' | 'Check In'
type ActivityType = 'note' | 'workflow' | 'system'

type ActivityEntry = {
  id: string
  type: ActivityType
  label: string
  detail: string
  date: string
}
type View = 'crm' | 'capture'
type WorkspacePage = 'customers' | 'catalog'
type ProfilePage = 'overview' | 'account' | 'products' | 'contact' | 'notes' | 'activity' | 'email' | 'misys'
type ProductRankMode = 'dollars' | 'units'
type ActiveStatus = 'Prospect' | 'Active Customer' | 'Dormant' | 'Do Not Contact'
type CatalogStatus = 'Active' | 'Draft' | 'Paused'

type CustomerProfile = {
  customerType: string
  industry: string
  salesRep: string
  paymentTerms: string
  reorderFrequency: string
  topProducts: string
  lastOrderDate: string
  nextFollowUpDate: string
  activeStatus: ActiveStatus
  primaryLocation: string
  additionalContacts: string
  accountNotes: string
}

type StockType = 'Stocked' | 'Custom' | 'Made-to-order'
type ProductRecord = {
  id: string
  sku: string
  productName: string
  category: string
  imagePath: string
  material: string
  dimensions: string
  casePack: string
  supplier: string
  supplierSku: string
  cost: number
  sellPrice: number
  margin: number
  leadTime: string
  misysItemNumber: string
  stockType: StockType
  quoteQuantity: string
  quoteStatus: QuoteStatus
  jobStage: string
  materialStatus: string
  supplierEta: string
  bottleneckReason: string
}

type ProductCatalogItem = {
  id: string
  sku: string
  productName: string
  category: string
  imagePath: string
  material: string
  dimensions: string
  casePack: string
  supplier: string
  supplierSku: string
  cost: number
  sellPrice: number
  margin: number
  leadTime: string
  stockType: StockType
  status: CatalogStatus
  notes: string
  updatedAt: string
}

type MisysProfile = {
  customerId: string
  accountingCustomerId: string
  customerType: string
  taxStatus: string
  freightTerms: string
  defaultWarehouse: string
  shipToName: string
  shippingAddress: string
  billingAddress: string
  productionContact: string
  targetSku: string
  customerPartNumber: string
  itemDescription: string
  productSpec: string
}

type Lead = {
  id: string
  company: string
  contact: string
  title: string
  email: string
  phone: string
  city: string
  showName: string
  packagingNeeds: string[]
  annualVolume: string
  timeline: string
  notes: string
  stage: LeadStage
  priority: LeadPriority
  owner: string
  nextStep: string
  sampleStatus: SampleStatus
  quoteStatus: QuoteStatus
  taskType: TaskType
  taskDue: string
  capturedAt: string
  activityLog: ActivityEntry[]
  accountProfile: CustomerProfile
  productRecords: ProductRecord[]
  misysProfile: MisysProfile
}

type Session = {
  access_token: string
  refresh_token?: string
  demo?: boolean
}

const logoUrl =
  'https://static.wixstatic.com/media/067fd2_442e8edbc68c491ea121fea22fc5f107~mv2.png/v1/fill/w_918,h_218,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/067fd2_442e8edbc68c491ea121fea22fc5f107~mv2.png'
const heroImage = '/nexgen-hero-lifestyle-20260507.png'
const storageKey = 'nexgen-tradeshow-leads'
const catalogStorageKey = 'nexgen-product-catalog'
const sessionKey = 'nexgen-supabase-session'
const supabaseUrl = 'https://fbhernygpoapgilshsdq.supabase.co'
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGVybnlncG9hcGdpbHNoc2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NTI4MzAsImV4cCI6MjA5MzUyODgzMH0.8El4zrk3UxrLa_ARTSitVBLCw5dgf-MNBAsJJNBhPZQ'

const packagingNeeds = [
  'Custom printed cups',
  'Food containers',
  'Pizza packaging',
  'Sustainable packaging',
  'Retail packaging',
  'Samples',
]

const volumeOptions = ['Under 100k units', '100k-250k units', '250k-500k units', '500k-1M units', '1M+ units']
const timelineOptions = ['ASAP', '30-60 days', 'This quarter', '6+ months', 'Researching']
const pipelineSteps = ['Intake', 'Contacted', 'Samples', 'Quote', 'Setup', 'Nurture']
const customerTypeOptions = ['Prospect', 'Foodservice', 'Distributor', 'Restaurant Group', 'Retail', 'Private Label', 'Manufacturer']
const paymentTermOptions = ['Unknown', 'Prepaid', 'COD', 'Net 15', 'Net 30', 'Net 45', 'Net 60']
const reorderFrequencyOptions = ['Unknown', '15 days', '30 days', '45 days', '60 days', 'Quarterly', 'Seasonal']
const activeStatusOptions: ActiveStatus[] = ['Prospect', 'Active Customer', 'Dormant', 'Do Not Contact']
const stockTypeOptions: StockType[] = ['Stocked', 'Custom', 'Made-to-order']
const catalogStatusOptions: CatalogStatus[] = ['Active', 'Draft', 'Paused']
const productImageOptions = [
  '/product-images/clear-cup.png',
  '/product-images/clear-lid.png',
  '/product-images/fiber-tray.png',
  '/product-images/fiber-bowl.png',
  '/product-images/kraft-bag.png',
  '/product-images/kraft-liner.png',
  '/product-images/pizza-box.png',
  '/product-images/tamper-seal.png',
  '/product-images/beverage-napkin.png',
]
const jobStageOptions = [
  'Quote Requested',
  'Quote Sent',
  'Approved',
  'Waiting on Artwork/Specs',
  'Materials Check',
  'Purchase Order Needed',
  'Materials Ordered',
  'Materials Received',
  'Scheduled for Production',
  'In Production',
  'Quality Check',
  'Packed',
  'Ready to Ship',
  'Shipped',
  'Invoiced',
  'Completed',
]

const emptyCustomerProfile: CustomerProfile = {
  customerType: 'Prospect',
  industry: '',
  salesRep: 'Bradley',
  paymentTerms: 'Unknown',
  reorderFrequency: 'Unknown',
  topProducts: '',
  lastOrderDate: '',
  nextFollowUpDate: '',
  activeStatus: 'Prospect',
  primaryLocation: '',
  additionalContacts: '',
  accountNotes: '',
}

const emptyProductRecord: ProductRecord = {
  id: '',
  sku: '',
  productName: '',
  category: '',
  imagePath: '',
  material: '',
  dimensions: '',
  casePack: '',
  supplier: '',
  supplierSku: '',
  cost: 0,
  sellPrice: 0,
  margin: 0,
  leadTime: '',
  misysItemNumber: '',
  stockType: 'Custom',
  quoteQuantity: '',
  quoteStatus: 'Not Started',
  jobStage: 'Quote Requested',
  materialStatus: 'Unknown',
  supplierEta: '',
  bottleneckReason: '',
}

const emptyCatalogItem: ProductCatalogItem = {
  id: '',
  sku: '',
  productName: '',
  category: '',
  imagePath: '/product-images/fiber-tray.png',
  material: '',
  dimensions: '',
  casePack: '',
  supplier: '',
  supplierSku: '',
  cost: 0,
  sellPrice: 0,
  margin: 0,
  leadTime: '',
  stockType: 'Custom',
  status: 'Draft',
  notes: '',
  updatedAt: '',
}

const emptyMisys: MisysProfile = {
  customerId: '',
  accountingCustomerId: '',
  customerType: 'Potential',
  taxStatus: 'Unknown',
  freightTerms: '',
  defaultWarehouse: '',
  shipToName: '',
  shippingAddress: '',
  billingAddress: '',
  productionContact: '',
  targetSku: '',
  customerPartNumber: '',
  itemDescription: '',
  productSpec: '',
}

const emptyLead: Lead = {
  id: '',
  company: '',
  contact: '',
  title: '',
  email: '',
  phone: '',
  city: '',
  showName: 'Trade Show',
  packagingNeeds: [],
  annualVolume: '',
  timeline: '',
  notes: '',
  stage: 'New',
  priority: 'Warm',
  owner: 'Bradley',
  nextStep: 'Review booth notes and send first follow-up.',
  sampleStatus: 'Not Requested',
  quoteStatus: 'Not Started',
  taskType: 'Email',
  taskDue: today(),
  capturedAt: new Date().toISOString(),
  activityLog: [],
  accountProfile: emptyCustomerProfile,
  productRecords: [],
  misysProfile: emptyMisys,
}

type DemoClientSeed = {
  company: string
  contact: string
  title: string
  city: string
  industry: string
  customerType: string
  needs: string[]
  annualVolume: string
  timeline: string
  showName: string
  notes: string
  productCount?: number
}

type DemoProductTemplate = {
  need: string
  skuPrefix: string
  productName: string
  category: string
  imagePath: string
  material: string
  dimensions: string
  casePack: string
  supplier: string
  supplierSku: string
  cost: number
  sellPrice: number
  leadTime: string
  stockType: StockType
  baseQuantity: number
  unitLabel: string
}

const demoProductTemplates: DemoProductTemplate[] = [
  { need: 'Custom printed cups', skuPrefix: 'CUP16', productName: '16 oz custom printed cup', category: 'Custom printed cups', imagePath: '/product-images/clear-cup.png', material: 'PET', dimensions: '16 oz', casePack: '1,000/case', supplier: 'Midwest Cup Supply', supplierSku: 'MWC-16PET', cost: 0.075, sellPrice: 0.13, leadTime: '21 days', stockType: 'Custom', baseQuantity: 120000, unitLabel: 'units' },
  { need: 'Custom printed cups', skuPrefix: 'CUP20', productName: '20 oz stadium cup', category: 'Custom printed cups', imagePath: '/product-images/clear-cup.png', material: 'PET', dimensions: '20 oz', casePack: '1,000/case', supplier: 'Midwest Cup Supply', supplierSku: 'MWC-20PET', cost: 0.084, sellPrice: 0.145, leadTime: '21 days', stockType: 'Custom', baseQuantity: 180000, unitLabel: 'units' },
  { need: 'Custom printed cups', skuPrefix: 'LID16', productName: 'Flat clear cup lid', category: 'Custom printed cups', imagePath: '/product-images/clear-lid.png', material: 'PET', dimensions: 'Fits 16-20 oz cup', casePack: '1,000/case', supplier: 'Midwest Cup Supply', supplierSku: 'MWC-LID16F', cost: 0.024, sellPrice: 0.041, leadTime: '14 days', stockType: 'Stocked', baseQuantity: 160000, unitLabel: 'units' },
  { need: 'Custom printed cups', skuPrefix: 'SLV12', productName: 'Custom kraft cup sleeve', category: 'Custom printed cups', imagePath: '/product-images/kraft-liner.png', material: 'Kraft paperboard', dimensions: '12-20 oz fit', casePack: '1,500/case', supplier: 'PaperWorks Midwest', supplierSku: 'PWM-SLV1220', cost: 0.038, sellPrice: 0.068, leadTime: '18 days', stockType: 'Custom', baseQuantity: 80000, unitLabel: 'sleeves' },
  { need: 'Food containers', skuPrefix: 'CONT32', productName: '32 oz food container', category: 'Food containers', imagePath: '/product-images/fiber-tray.png', material: 'PP', dimensions: '32 oz', casePack: '500/case', supplier: 'Anchor Foodservice', supplierSku: 'AFS-32PP', cost: 0.16, sellPrice: 0.255, leadTime: '14 days', stockType: 'Stocked', baseQuantity: 90000, unitLabel: 'units' },
  { need: 'Food containers', skuPrefix: 'BOWL24', productName: '24 oz fiber bowl', category: 'Food containers', imagePath: '/product-images/fiber-bowl.png', material: 'Molded fiber', dimensions: '24 oz', casePack: '300/case', supplier: 'GreenPack Direct', supplierSku: 'GPD-BOWL24', cost: 0.128, sellPrice: 0.215, leadTime: '18 days', stockType: 'Stocked', baseQuantity: 80000, unitLabel: 'units' },
  { need: 'Food containers', skuPrefix: 'TRAY3C', productName: '3-compartment fiber tray', category: 'Food containers', imagePath: '/product-images/fiber-tray.png', material: 'Molded fiber', dimensions: '9 x 9 x 2 in', casePack: '300/case', supplier: 'GreenPack Direct', supplierSku: 'GPD-TRAY3C', cost: 0.18, sellPrice: 0.295, leadTime: '18 days', stockType: 'Stocked', baseQuantity: 70000, unitLabel: 'units' },
  { need: 'Food containers', skuPrefix: 'CLAM96', productName: '9x6 hinged fiber clamshell', category: 'Food containers', imagePath: '/product-images/fiber-tray.png', material: 'Molded fiber', dimensions: '9 x 6 x 3 in', casePack: '250/case', supplier: 'GreenPack Direct', supplierSku: 'GPD-CLAM96', cost: 0.205, sellPrice: 0.335, leadTime: '20 days', stockType: 'Stocked', baseQuantity: 55000, unitLabel: 'units' },
  { need: 'Pizza packaging', skuPrefix: 'PBOX12', productName: '12 inch branded pizza box', category: 'Pizza packaging', imagePath: '/product-images/pizza-box.png', material: 'B-flute corrugate', dimensions: '12 x 12 x 1.75 in', casePack: '100/bundle', supplier: 'Great Lakes Corrugate', supplierSku: 'GLC-PB12B', cost: 0.46, sellPrice: 0.72, leadTime: '28 days', stockType: 'Made-to-order', baseQuantity: 60000, unitLabel: 'boxes' },
  { need: 'Pizza packaging', skuPrefix: 'PBOX14', productName: '14 inch branded pizza box', category: 'Pizza packaging', imagePath: '/product-images/pizza-box.png', material: 'B-flute corrugate', dimensions: '14 x 14 x 1.75 in', casePack: '100/bundle', supplier: 'Great Lakes Corrugate', supplierSku: 'GLC-PB14B', cost: 0.54, sellPrice: 0.82, leadTime: '28 days', stockType: 'Made-to-order', baseQuantity: 70000, unitLabel: 'boxes' },
  { need: 'Pizza packaging', skuPrefix: 'PBOX16', productName: '16 inch branded pizza box', category: 'Pizza packaging', imagePath: '/product-images/pizza-box.png', material: 'B-flute corrugate', dimensions: '16 x 16 x 1.75 in', casePack: '100/bundle', supplier: 'Great Lakes Corrugate', supplierSku: 'GLC-PB16B', cost: 0.68, sellPrice: 1.02, leadTime: '30 days', stockType: 'Made-to-order', baseQuantity: 45000, unitLabel: 'boxes' },
  { need: 'Pizza packaging', skuPrefix: 'LINER12', productName: 'Grease-resistant box liner', category: 'Pizza packaging', imagePath: '/product-images/kraft-liner.png', material: 'Coated kraft', dimensions: '12 x 12 in', casePack: '2,000/case', supplier: 'PaperWorks Midwest', supplierSku: 'PWM-LIN12GR', cost: 0.031, sellPrice: 0.052, leadTime: '10 days', stockType: 'Stocked', baseQuantity: 140000, unitLabel: 'liners' },
  { need: 'Sustainable packaging', skuPrefix: 'BAG12', productName: 'Printed kraft takeout bag', category: 'Sustainable packaging', imagePath: '/product-images/kraft-bag.png', material: 'Recycled kraft', dimensions: '12 x 7 x 14 in', casePack: '250/case', supplier: 'EcoCarry Supply', supplierSku: 'ECO-BAG1214', cost: 0.185, sellPrice: 0.31, leadTime: '21 days', stockType: 'Custom', baseQuantity: 50000, unitLabel: 'bags' },
  { need: 'Sustainable packaging', skuPrefix: 'TRAY96', productName: '9x6 compostable food tray', category: 'Sustainable packaging', imagePath: '/product-images/fiber-tray.png', material: 'Molded fiber', dimensions: '9 x 6 x 2 in', casePack: '400/case', supplier: 'GreenPack Direct', supplierSku: 'GPD-TRAY96', cost: 0.118, sellPrice: 0.19, leadTime: '14 days', stockType: 'Stocked', baseQuantity: 85000, unitLabel: 'units' },
  { need: 'Sustainable packaging', skuPrefix: 'BOWL32', productName: '32 oz compostable bowl', category: 'Sustainable packaging', imagePath: '/product-images/fiber-bowl.png', material: 'Molded fiber', dimensions: '32 oz', casePack: '300/case', supplier: 'GreenPack Direct', supplierSku: 'GPD-BOWL32', cost: 0.142, sellPrice: 0.235, leadTime: '18 days', stockType: 'Stocked', baseQuantity: 65000, unitLabel: 'units' },
  { need: 'Retail packaging', skuPrefix: 'SEAL3', productName: 'Branded tamper seal sticker', category: 'Retail packaging', imagePath: '/product-images/tamper-seal.png', material: 'Paper label stock', dimensions: '3 in round', casePack: '5,000/roll', supplier: 'LabelPro Chicago', supplierSku: 'LPC-SEAL3', cost: 0.018, sellPrice: 0.035, leadTime: '12 days', stockType: 'Custom', baseQuantity: 150000, unitLabel: 'stickers' },
  { need: 'Retail packaging', skuPrefix: 'LBL2', productName: 'Custom product label roll', category: 'Retail packaging', imagePath: '/product-images/tamper-seal.png', material: 'BOPP label stock', dimensions: '2 x 3 in', casePack: '5,000/roll', supplier: 'LabelPro Chicago', supplierSku: 'LPC-LBL23', cost: 0.022, sellPrice: 0.042, leadTime: '12 days', stockType: 'Custom', baseQuantity: 120000, unitLabel: 'labels' },
  { need: 'Retail packaging', skuPrefix: 'NAPBEV', productName: 'Custom beverage napkin', category: 'Retail packaging', imagePath: '/product-images/beverage-napkin.png', material: '2-ply paper', dimensions: '5 x 5 in', casePack: '4,000/case', supplier: 'PaperWorks Midwest', supplierSku: 'PWM-NAP55', cost: 0.011, sellPrice: 0.021, leadTime: '24 days', stockType: 'Custom', baseQuantity: 180000, unitLabel: 'napkins' },
  { need: 'Retail packaging', skuPrefix: 'BAGSHOP', productName: 'Retail kraft shopping bag', category: 'Retail packaging', imagePath: '/product-images/kraft-bag.png', material: 'Kraft paper', dimensions: '10 x 5 x 13 in', casePack: '250/case', supplier: 'EcoCarry Supply', supplierSku: 'ECO-SHOP1013', cost: 0.165, sellPrice: 0.285, leadTime: '18 days', stockType: 'Custom', baseQuantity: 45000, unitLabel: 'bags' },
  { need: 'Samples', skuPrefix: 'SAMPKIT', productName: 'Customer sample kit box', category: 'Samples', imagePath: '/product-images/pizza-box.png', material: 'Corrugate mailer', dimensions: '12 x 9 x 4 in', casePack: '50/case', supplier: 'NexGen Sample Room', supplierSku: 'NG-SAMPKIT', cost: 2.1, sellPrice: 0, leadTime: '3 days', stockType: 'Stocked', baseQuantity: 120, unitLabel: 'kits' },
  { need: 'Samples', skuPrefix: 'SAMPTRAY', productName: 'Mixed container sample pack', category: 'Samples', imagePath: '/product-images/fiber-tray.png', material: 'Assorted packaging', dimensions: 'Assorted', casePack: '10 kits/case', supplier: 'NexGen Sample Room', supplierSku: 'NG-SAMPTRAY', cost: 4.8, sellPrice: 0, leadTime: '3 days', stockType: 'Stocked', baseQuantity: 80, unitLabel: 'kits' },
]

const demoClientSeeds: DemoClientSeed[] = [
  { company: 'Summit Stadium Group', contact: 'Jordan Reyes', title: 'Director of Concessions', city: 'Chicago, IL', industry: 'Stadium concessions', customerType: 'Foodservice', needs: ['Custom printed cups', 'Food containers'], annualVolume: '1M+ units', timeline: '30-60 days', showName: 'National Restaurant Association Show', notes: 'Needs clear cups and compostable trays for three venues. Asked for samples and freight estimate.', productCount: 5 },
  { company: 'Bella Hearth Pizza', contact: 'Mina Patel', title: 'Founder', city: 'Naperville, IL', industry: 'Pizza restaurant', customerType: 'Restaurant Group', needs: ['Pizza packaging', 'Sustainable packaging', 'Retail packaging'], annualVolume: '100k-250k units', timeline: 'This quarter', showName: 'Pizza Expo', notes: 'Interested in branded boxes, liners, and grease resistance for three new stores.', productCount: 6 },
  { company: "Logan's Apples", contact: 'Logan Cuyos', title: 'Purchasing Lead', city: 'Grand Rapids, MI', industry: 'Produce distributor', customerType: 'Distributor', needs: ['Food containers', 'Retail packaging'], annualVolume: '250k-500k units', timeline: '30-60 days', showName: 'Great Lakes Food Expo', notes: 'Wants clamshell and label options for sliced apple snack packs.' },
  { company: "Bradley's Cookies", contact: 'Bradley Cuyos', title: 'Owner', city: 'Oak Brook, IL', industry: 'Bakery', customerType: 'Foodservice', needs: ['Retail packaging', 'Sustainable packaging'], annualVolume: '100k-250k units', timeline: 'This quarter', showName: 'Bakery Showcase', notes: 'Needs branded seals, shopping bags, and kraft takeout packaging.' },
  { company: 'Lakeside Commissary', contact: 'Amelia Grant', title: 'Operations Manager', city: 'Milwaukee, WI', industry: 'Prepared meals', customerType: 'Foodservice', needs: ['Food containers', 'Sustainable packaging'], annualVolume: '500k-1M units', timeline: 'ASAP', showName: 'National Restaurant Association Show', notes: 'Looking for microwave-safe containers and a backup molded-fiber supplier.' },
  { company: 'Cedar & Spoon Catering', contact: 'Ethan Brooks', title: 'Catering Director', city: 'Madison, WI', industry: 'Catering', customerType: 'Foodservice', needs: ['Food containers', 'Custom printed cups', 'Samples'], annualVolume: '100k-250k units', timeline: '30-60 days', showName: 'Catersource', notes: 'Asked for event-ready samples and custom cup pricing.' },
  { company: 'Riverbend Coffee Co.', contact: 'Nora Hughes', title: 'Brand Manager', city: 'St. Louis, MO', industry: 'Coffee shops', customerType: 'Restaurant Group', needs: ['Custom printed cups', 'Retail packaging'], annualVolume: '500k-1M units', timeline: 'This quarter', showName: 'Coffee Fest', notes: 'Needs cup sleeve and retail bag concepts for a brand refresh.' },
  { company: 'Torch Burger Works', contact: 'Caleb Foster', title: 'VP Operations', city: 'Austin, TX', industry: 'Fast casual restaurants', customerType: 'Restaurant Group', needs: ['Food containers', 'Sustainable packaging', 'Custom printed cups'], annualVolume: '1M+ units', timeline: 'ASAP', showName: 'Restaurant Leadership Conference', notes: 'Opening six stores and needs coordinated cups, trays, and bags.' },
  { company: 'Green Fork Market', contact: 'Priya Shah', title: 'Category Buyer', city: 'Minneapolis, MN', industry: 'Grocery prepared foods', customerType: 'Retail', needs: ['Food containers', 'Retail packaging'], annualVolume: '250k-500k units', timeline: '30-60 days', showName: 'GroceryTech Expo', notes: 'Comparing tamper seals and fiber bowls for grab-and-go meals.' },
  { company: 'North Loop Tacos', contact: 'Mateo Ramirez', title: 'Founder', city: 'Minneapolis, MN', industry: 'QSR tacos', customerType: 'Restaurant Group', needs: ['Food containers', 'Sustainable packaging'], annualVolume: '250k-500k units', timeline: 'This quarter', showName: 'National Restaurant Association Show', notes: 'Needs compostable trays and bags that hold up for delivery.' },
  { company: 'Stonebridge Hospitality', contact: 'Grace Miller', title: 'Procurement Director', city: 'Denver, CO', industry: 'Hotel foodservice', customerType: 'Foodservice', needs: ['Custom printed cups', 'Food containers', 'Retail packaging'], annualVolume: '500k-1M units', timeline: '6+ months', showName: 'Hotel F&B Forum', notes: 'Exploring a chain-wide packaging standard for outlets and banquets.' },
  { company: 'Orchard Table Foods', contact: 'Sofia Bennett', title: 'COO', city: 'Columbus, OH', industry: 'Meal prep', customerType: 'Manufacturer', needs: ['Food containers', 'Retail packaging'], annualVolume: '500k-1M units', timeline: '30-60 days', showName: 'Prepared Foods Summit', notes: 'Needs reliable tray supply and branded label rolls for refrigerated meals.' },
  { company: 'Prairie Dog Brewing', contact: 'Miles Turner', title: 'Taproom Manager', city: 'Omaha, NE', industry: 'Brewery', customerType: 'Foodservice', needs: ['Custom printed cups', 'Retail packaging'], annualVolume: '100k-250k units', timeline: 'This quarter', showName: 'Craft Brewers Conference', notes: 'Asked for clear branded cups and tamper seals for beer-to-go.' },
  { company: 'Metro Bowl Concepts', contact: 'Jasmine Price', title: 'Director of Supply Chain', city: 'Atlanta, GA', industry: 'Bowl restaurants', customerType: 'Restaurant Group', needs: ['Food containers', 'Sustainable packaging', 'Custom printed cups'], annualVolume: '1M+ units', timeline: 'ASAP', showName: 'Fast Casual Executive Summit', notes: 'Needs fiber bowl comparison and lane for rush replenishment.' },
  { company: 'Blue Line Deli', contact: 'Owen Clark', title: 'General Manager', city: 'Boston, MA', industry: 'Deli', customerType: 'Foodservice', needs: ['Food containers', 'Retail packaging'], annualVolume: '100k-250k units', timeline: '30-60 days', showName: 'New England Food Show', notes: 'Interested in clamshells and branded labels for catering trays.' },
  { company: 'Harvest Moon Schools', contact: 'Leah Morgan', title: 'Nutrition Buyer', city: 'Indianapolis, IN', industry: 'School meals', customerType: 'Foodservice', needs: ['Food containers', 'Sustainable packaging'], annualVolume: '1M+ units', timeline: 'This quarter', showName: 'School Nutrition Expo', notes: 'Needs compartment trays with steady lead times before fall programs.' },
  { company: 'Saffron Street Kitchen', contact: 'Anika Rao', title: 'Owner', city: 'Raleigh, NC', industry: 'Restaurant group', customerType: 'Restaurant Group', needs: ['Food containers', 'Retail packaging', 'Samples'], annualVolume: '100k-250k units', timeline: 'ASAP', showName: 'Restaurant Innovation Summit', notes: 'Wants sample kits for sauces, bowls, and delivery labels.' },
  { company: 'Crown Point Cinemas', contact: 'Daniel Kim', title: 'F&B Director', city: 'Cincinnati, OH', industry: 'Cinema concessions', customerType: 'Foodservice', needs: ['Custom printed cups', 'Food containers'], annualVolume: '500k-1M units', timeline: '30-60 days', showName: 'CinemaCon', notes: 'Needs branded cold cups and concession trays for summer releases.' },
  { company: 'Fieldhouse Events', contact: 'Riley Ward', title: 'Event Operations Lead', city: 'Nashville, TN', industry: 'Event venues', customerType: 'Foodservice', needs: ['Custom printed cups', 'Samples'], annualVolume: '250k-500k units', timeline: 'This quarter', showName: 'Event Venue Expo', notes: 'Needs branded cup options and sample kits for sponsor approvals.' },
  { company: 'Juniper Juice Bar', contact: 'Maya Collins', title: 'Founder', city: 'Phoenix, AZ', industry: 'Juice bar', customerType: 'Restaurant Group', needs: ['Custom printed cups', 'Retail packaging'], annualVolume: '100k-250k units', timeline: '30-60 days', showName: 'Healthy Food Expo', notes: 'Needs clear cups, lids, and labels for bottled juice.' },
  { company: 'Golden Crust Bakery', contact: 'Elena Rossi', title: 'Procurement Manager', city: 'Pittsburgh, PA', industry: 'Wholesale bakery', customerType: 'Manufacturer', needs: ['Retail packaging', 'Sustainable packaging'], annualVolume: '500k-1M units', timeline: 'This quarter', showName: 'Bakery Showcase', notes: 'Comparing branded seals and kraft bags for retail bakery packs.' },
  { company: 'Pine & Pepper Pizza', contact: 'Trevor Scott', title: 'Franchise Owner', city: 'Kansas City, MO', industry: 'Pizza restaurant', customerType: 'Restaurant Group', needs: ['Pizza packaging', 'Retail packaging'], annualVolume: '250k-500k units', timeline: 'ASAP', showName: 'Pizza Expo', notes: 'Needs new 12, 14, and 16 inch box pricing for franchise rollout.' },
  { company: 'Casa Verde Taqueria', contact: 'Isabella Flores', title: 'Operations Director', city: 'San Antonio, TX', industry: 'Fast casual restaurants', customerType: 'Restaurant Group', needs: ['Food containers', 'Sustainable packaging', 'Custom printed cups'], annualVolume: '500k-1M units', timeline: '30-60 days', showName: 'National Restaurant Association Show', notes: 'Needs molded fiber trays and custom cups for five locations.' },
  { company: 'Red Barn Markets', contact: 'Hunter Davis', title: 'Prepared Foods Buyer', city: 'Louisville, KY', industry: 'Regional grocery', customerType: 'Retail', needs: ['Food containers', 'Retail packaging'], annualVolume: '500k-1M units', timeline: '6+ months', showName: 'GroceryTech Expo', notes: 'Exploring label standardization for prepared foods.' },
  { company: 'Urban Picnic Co.', contact: 'Chloe Nguyen', title: 'COO', city: 'Seattle, WA', industry: 'Corporate catering', customerType: 'Foodservice', needs: ['Sustainable packaging', 'Food containers'], annualVolume: '250k-500k units', timeline: 'This quarter', showName: 'Catersource', notes: 'Wants compostable containers that stack cleanly for delivery routes.' },
  { company: 'FreshStack Salads', contact: 'Aaron Lewis', title: 'Supply Chain Manager', city: 'Charlotte, NC', industry: 'Salad restaurants', customerType: 'Restaurant Group', needs: ['Food containers', 'Custom printed cups'], annualVolume: '1M+ units', timeline: 'ASAP', showName: 'Fast Casual Executive Summit', notes: 'Needs bowls, lids, and drink cup pricing by location tier.' },
  { company: 'Mosaic Meal Prep', contact: 'Victoria Allen', title: 'Founder', city: 'Orlando, FL', industry: 'Meal prep', customerType: 'Manufacturer', needs: ['Food containers', 'Retail packaging'], annualVolume: '250k-500k units', timeline: '30-60 days', showName: 'Prepared Foods Summit', notes: 'Needs sealed meal trays and printed product labels.' },
  { company: 'Harbor House Seafood', contact: 'Benjamin Reed', title: 'Purchasing Manager', city: 'Portland, ME', industry: 'Seafood retail', customerType: 'Retail', needs: ['Food containers', 'Retail packaging'], annualVolume: '100k-250k units', timeline: 'This quarter', showName: 'Seafood Expo North America', notes: 'Needs leak-resistant containers and retail tamper labels.' },
  { company: 'Apex Arena Foods', contact: 'Sarah Mitchell', title: 'Concessions Buyer', city: 'Las Vegas, NV', industry: 'Arena concessions', customerType: 'Foodservice', needs: ['Custom printed cups', 'Food containers'], annualVolume: '1M+ units', timeline: '30-60 days', showName: 'VenueConnect', notes: 'Asked for cup, lid, and food tray program for concert season.' },
  { company: 'Cloud Nine Creamery', contact: 'Nathan Young', title: 'Owner', city: 'Portland, OR', industry: 'Ice cream shops', customerType: 'Restaurant Group', needs: ['Custom printed cups', 'Retail packaging'], annualVolume: '100k-250k units', timeline: 'This quarter', showName: 'Dessert Expo', notes: 'Needs clear cups and branded seal stickers for pints.' },
  { company: 'Union Street Bagels', contact: 'Ava Martinez', title: 'General Manager', city: 'New York, NY', industry: 'Bakery cafe', customerType: 'Foodservice', needs: ['Sustainable packaging', 'Retail packaging', 'Custom printed cups'], annualVolume: '250k-500k units', timeline: 'ASAP', showName: 'Coffee Fest', notes: 'Needs bags, labels, and custom coffee cups for morning rush.' },
  { company: 'Wildflower Commissary', contact: 'Lily Parker', title: 'Operations Lead', city: 'Salt Lake City, UT', industry: 'Commissary kitchen', customerType: 'Foodservice', needs: ['Food containers', 'Samples'], annualVolume: '250k-500k units', timeline: '30-60 days', showName: 'Prepared Foods Summit', notes: 'Requested mixed container samples before switching suppliers.' },
  { company: 'Cobalt Campus Dining', contact: 'Henry Cooper', title: 'Dining Services Buyer', city: 'Ann Arbor, MI', industry: 'Campus dining', customerType: 'Foodservice', needs: ['Food containers', 'Sustainable packaging', 'Custom printed cups'], annualVolume: '1M+ units', timeline: 'This quarter', showName: 'School Nutrition Expo', notes: 'Needs compostable tray and cup options for multiple dining halls.' },
  { company: 'Rosetta Ravioli Co.', contact: 'Camila Torres', title: 'Plant Manager', city: 'Cleveland, OH', industry: 'CPG food manufacturer', customerType: 'Manufacturer', needs: ['Retail packaging', 'Food containers'], annualVolume: '500k-1M units', timeline: '6+ months', showName: 'Private Label Expo', notes: 'Wants retail labels and trays that support refrigerated distribution.' },
  { company: 'Oak & Ember BBQ', contact: 'Jackson Hill', title: 'Owner', city: 'Memphis, TN', industry: 'BBQ restaurant', customerType: 'Restaurant Group', needs: ['Food containers', 'Sustainable packaging'], annualVolume: '250k-500k units', timeline: 'ASAP', showName: 'National Restaurant Association Show', notes: 'Needs heat-holding containers and branded takeout bags.' },
  { company: 'Pepperlane Pizza Group', contact: 'Zoe Adams', title: 'Supply Chain Lead', city: 'Sacramento, CA', industry: 'Pizza restaurant', customerType: 'Restaurant Group', needs: ['Pizza packaging', 'Sustainable packaging'], annualVolume: '500k-1M units', timeline: '30-60 days', showName: 'Pizza Expo', notes: 'Needs multi-size pizza box program and kraft bag add-on.' },
  { company: 'Main Street Donuts', contact: 'Samuel Wright', title: 'Founder', city: 'Des Moines, IA', industry: 'Bakery', customerType: 'Foodservice', needs: ['Retail packaging', 'Samples'], annualVolume: 'Under 100k units', timeline: 'This quarter', showName: 'Bakery Showcase', notes: 'Asked for sample kit and label pricing for retail donut packs.' },
  { company: 'Anchor Lunch Co.', contact: 'Madeline King', title: 'Purchasing Director', city: 'Baltimore, MD', industry: 'Prepared lunches', customerType: 'Foodservice', needs: ['Food containers', 'Custom printed cups'], annualVolume: '500k-1M units', timeline: '30-60 days', showName: 'Prepared Foods Summit', notes: 'Needs reliable container supply for weekly office lunch programs.' },
  { company: 'Ridgeview Resorts', contact: 'Julian Green', title: 'F&B Procurement', city: 'Aspen, CO', industry: 'Resort hospitality', customerType: 'Foodservice', needs: ['Custom printed cups', 'Retail packaging'], annualVolume: '100k-250k units', timeline: '6+ months', showName: 'Hotel F&B Forum', notes: 'Exploring branded cups and retail bags for seasonal outlets.' },
  { company: 'Market Lane Sushi', contact: 'Hannah Lee', title: 'Operations Manager', city: 'San Diego, CA', industry: 'Sushi market', customerType: 'Retail', needs: ['Food containers', 'Retail packaging'], annualVolume: '250k-500k units', timeline: 'ASAP', showName: 'Seafood Expo North America', notes: 'Needs labels and clear-lid container alternatives for cold case.' },
  { company: 'Silver Spoon Senior Meals', contact: 'Peter Nelson', title: 'Program Director', city: 'Tampa, FL', industry: 'Senior meal delivery', customerType: 'Foodservice', needs: ['Food containers', 'Sustainable packaging'], annualVolume: '1M+ units', timeline: 'This quarter', showName: 'Healthcare Foodservice Expo', notes: 'Needs compartment trays with reliable reorder windows.' },
  { company: 'Lucky Lantern Noodles', contact: 'Mei Chen', title: 'Founder', city: 'Houston, TX', industry: 'Noodle restaurant', customerType: 'Restaurant Group', needs: ['Food containers', 'Custom printed cups'], annualVolume: '250k-500k units', timeline: '30-60 days', showName: 'Fast Casual Executive Summit', notes: 'Needs bowls, lids, and cups for a two-store expansion.' },
  { company: 'Briar Patch Foods', contact: 'Claire Evans', title: 'Retail Buyer', city: 'Birmingham, AL', industry: 'Specialty grocery', customerType: 'Retail', needs: ['Retail packaging', 'Sustainable packaging'], annualVolume: '100k-250k units', timeline: 'This quarter', showName: 'GroceryTech Expo', notes: 'Needs kraft bags and label rolls for private-label snacks.' },
  { company: 'Station House Sandwiches', contact: 'Isaac Rivera', title: 'Owner', city: 'Philadelphia, PA', industry: 'Sandwich shop', customerType: 'Foodservice', needs: ['Food containers', 'Sustainable packaging', 'Retail packaging'], annualVolume: '100k-250k units', timeline: 'ASAP', showName: 'National Restaurant Association Show', notes: 'Needs clamshells, bags, and tamper seals for delivery.' },
  { company: 'Canyon Trail Outfitters Cafe', contact: 'Kara Simmons', title: 'Cafe Buyer', city: 'Flagstaff, AZ', industry: 'Retail cafe', customerType: 'Retail', needs: ['Custom printed cups', 'Retail packaging'], annualVolume: 'Under 100k units', timeline: '6+ months', showName: 'Outdoor Retailer', notes: 'Looking for cup and shopping bag ideas for store cafe.' },
  { company: 'Hearthstone Frozen Foods', contact: 'Robert Baker', title: 'Packaging Engineer', city: 'Fargo, ND', industry: 'Frozen food manufacturer', customerType: 'Manufacturer', needs: ['Retail packaging', 'Food containers'], annualVolume: '1M+ units', timeline: '30-60 days', showName: 'Private Label Expo', notes: 'Needs labels and trays that can move through frozen distribution.' },
  { company: 'Sunrise Smoothie Bar', contact: 'Natalie Perez', title: 'Franchise Coordinator', city: 'Miami, FL', industry: 'Smoothie shops', customerType: 'Restaurant Group', needs: ['Custom printed cups', 'Retail packaging'], annualVolume: '500k-1M units', timeline: 'ASAP', showName: 'Healthy Food Expo', notes: 'Needs cup, lid, and label quote by franchise tier.' },
  { company: 'Mill City Pizza Kitchen', contact: 'Gavin Moore', title: 'Owner', city: 'Rochester, MN', industry: 'Pizza restaurant', customerType: 'Restaurant Group', needs: ['Pizza packaging', 'Samples'], annualVolume: '100k-250k units', timeline: '30-60 days', showName: 'Pizza Expo', notes: 'Asked for sample box and liner kit before artwork approval.' },
  { company: 'Trailhead Meal Co.', contact: 'Olivia Stewart', title: 'Supply Chain Manager', city: 'Boise, ID', industry: 'Meal prep', customerType: 'Manufacturer', needs: ['Food containers', 'Retail packaging', 'Sustainable packaging'], annualVolume: '500k-1M units', timeline: 'This quarter', showName: 'Prepared Foods Summit', notes: 'Needs trays, labels, and sustainability options for retail meals.' },
  { company: 'Aster Hall Food Market', contact: 'Wyatt Brooks', title: 'Market Operations Director', city: 'Chicago, IL', industry: 'Food hall', customerType: 'Foodservice', needs: ['Custom printed cups', 'Food containers', 'Sustainable packaging'], annualVolume: '1M+ units', timeline: '30-60 days', showName: 'National Restaurant Association Show', notes: 'Needs a multi-vendor packaging program with shared branding.', productCount: 5 },
]

function buildDemoLeads(): Lead[] {
  return demoClientSeeds.map((client, index) => buildDemoLead(client, index))
}

function buildDemoLead(client: DemoClientSeed, index: number): Lead {
  const stageProfile = demoStageProfiles[index % demoStageProfiles.length]
  const productRecords = buildDemoProductsForClient(client, index)
  const capturedAt = demoTimestamp(-(index + 1))
  const topProductNames = productRecords
    .slice(0, 3)
    .map((product) => product.productName)
    .join(', ')
  const activeStatus: ActiveStatus = stageProfile.stage === 'Won' ? 'Active Customer' : stageProfile.stage === 'Nurture' ? 'Dormant' : 'Prospect'
  const companyCode = customerId(client.company)

  return normalizeLead({
    id: demoUuid(10000000, index + 1),
    company: client.company,
    contact: client.contact,
    title: client.title,
    email: demoEmail(client.contact, client.company),
    phone: demoPhone(index),
    city: client.city,
    showName: client.showName,
    packagingNeeds: client.needs,
    annualVolume: client.annualVolume,
    timeline: client.timeline,
    notes: client.notes,
    stage: stageProfile.stage,
    priority: stageProfile.priority,
    owner: index % 4 === 0 ? 'Logan' : 'Bradley',
    nextStep: stageProfile.nextStep,
    sampleStatus: stageProfile.sampleStatus,
    quoteStatus: stageProfile.quoteStatus,
    taskType: stageProfile.taskType,
    taskDue: addDays((index % 10) - 2),
    capturedAt,
    activityLog: [
      {
        id: demoUuid(30000000, index * 10 + 1),
        type: 'system',
        label: 'Demo customer loaded',
        detail: `${client.company} was added to the sample operating database.`,
        date: capturedAt,
      },
      {
        id: demoUuid(30000000, index * 10 + 2),
        type: 'workflow',
        label: stageProfile.activityLabel,
        detail: stageProfile.nextStep,
        date: demoTimestamp(-(index % 8)),
      },
    ],
    accountProfile: {
      ...emptyCustomerProfile,
      customerType: client.customerType,
      industry: client.industry,
      salesRep: index % 4 === 0 ? 'Logan' : 'Bradley',
      paymentTerms: paymentTermOptions[(index % (paymentTermOptions.length - 1)) + 1],
      reorderFrequency: reorderFrequencyOptions[(index % (reorderFrequencyOptions.length - 1)) + 1],
      topProducts: topProductNames,
      lastOrderDate: activeStatus === 'Active Customer' ? addDays(-((index % 45) + 15)) : '',
      nextFollowUpDate: addDays((index % 10) - 2),
      activeStatus,
      primaryLocation: client.city,
      additionalContacts: `${client.contact} (${client.title}); AP contact pending; ship-to region ${client.city}.`,
      accountNotes: `Demo profile for ${client.industry}. Top needs: ${client.needs.join(', ')}. Reorder and MISYS references are ready for testing.`,
    },
    productRecords,
    misysProfile: {
      ...emptyMisys,
      customerId: `CUS-${companyCode}`,
      accountingCustomerId: `QB-${companyCode}`,
      customerType: activeStatus === 'Active Customer' ? 'Customer' : 'Potential',
      taxStatus: index % 3 === 0 ? 'Tax Exempt Pending' : 'Taxable',
      freightTerms: index % 2 === 0 ? 'Prepaid & add' : 'Customer pickup / 3PL',
      defaultWarehouse: index % 2 === 0 ? 'NexGen Chicago' : 'NexGen Midwest',
      shipToName: client.company,
      shippingAddress: client.city,
      billingAddress: client.city,
      productionContact: client.contact,
      targetSku: productRecords[0]?.sku ?? '',
      customerPartNumber: productRecords[0]?.sku ?? '',
      itemDescription: productRecords[0]?.productName ?? client.needs.join(', '),
      productSpec: productRecords[0] ? `${productRecords[0].material}; ${productRecords[0].dimensions}; ${productRecords[0].casePack}` : '',
    },
  })
}

function buildDemoProductsForClient(client: DemoClientSeed, clientIndex: number): ProductRecord[] {
  const templates = orderedDemoTemplatesForNeeds(client.needs)
  const productCount = client.productCount ?? (clientIndex % 5 === 0 ? 4 : clientIndex % 3 === 0 ? 3 : 2)
  const volumeScale = demoVolumeScale[client.annualVolume] ?? 1

  return templates.slice(0, productCount).map((template, productIndex) => {
    const quantity = Math.round(template.baseQuantity * volumeScale * (0.85 + ((clientIndex + productIndex) % 5) * 0.12))
    const skuCompany = customerId(client.company).slice(0, 5)
    const quoteStatus = demoQuoteStatuses[(clientIndex + productIndex) % demoQuoteStatuses.length]
    const jobStage = jobStageOptions[(clientIndex * 2 + productIndex * 3) % jobStageOptions.length]
    const bottleneckReason = (clientIndex + productIndex) % 3 === 0 ? demoBottlenecks[(clientIndex + productIndex) % demoBottlenecks.length] : ''

    return normalizeProductRecord({
      ...emptyProductRecord,
      id: demoUuid(20000000, clientIndex * 10 + productIndex + 1),
      sku: `${template.skuPrefix}-${skuCompany}-${String(productIndex + 1).padStart(2, '0')}`,
      productName: template.productName,
      category: template.category,
      imagePath: template.imagePath,
      material: template.material,
      dimensions: template.dimensions,
      casePack: template.casePack,
      supplier: template.supplier,
      supplierSku: `${template.supplierSku}-${String((clientIndex % 9) + 1).padStart(2, '0')}`,
      cost: template.cost,
      sellPrice: template.sellPrice,
      margin: template.sellPrice > 0 ? Math.round(((template.sellPrice - template.cost) / template.sellPrice) * 100) : 0,
      leadTime: template.leadTime,
      misysItemNumber: `MIS-${template.skuPrefix}${skuCompany}${String(productIndex + 1).padStart(2, '0')}`.slice(0, 18),
      stockType: template.stockType,
      quoteQuantity: `${quantity.toLocaleString()} ${template.unitLabel}`,
      quoteStatus,
      jobStage,
      materialStatus: demoMaterialStatuses[(clientIndex + productIndex) % demoMaterialStatuses.length],
      supplierEta: addDays(((clientIndex + productIndex) % 28) - 4),
      bottleneckReason,
    })
  })
}

function orderedDemoTemplatesForNeeds(needs: string[]) {
  const groups = needs
    .map((need) => demoProductTemplates.filter((template) => template.need === need))
    .filter((group) => group.length > 0)
  const interleaved = groups.flatMap((_, templateIndex) => groups.flatMap((group) => group[templateIndex] ?? []))
  const backups = demoProductTemplates.filter((template) => !interleaved.some((selected) => selected.skuPrefix === template.skuPrefix))
  return [...interleaved, ...backups]
}

const demoStageProfiles: Array<{
  stage: LeadStage
  priority: LeadPriority
  sampleStatus: SampleStatus
  quoteStatus: QuoteStatus
  taskType: TaskType
  nextStep: string
  activityLabel: string
}> = [
  { stage: 'New', priority: 'Warm', sampleStatus: 'Not Requested', quoteStatus: 'Not Started', taskType: 'Email', nextStep: 'Review booth notes and send first follow-up.', activityLabel: 'Lead awaiting first touch' },
  { stage: 'Qualified', priority: 'Hot', sampleStatus: 'Requested', quoteStatus: 'Needs Pricing', taskType: 'Send Samples', nextStep: 'Pull sample options, confirm ship-to details, and send tracking.', activityLabel: 'Samples requested' },
  { stage: 'Sample Sent', priority: 'Hot', sampleStatus: 'Sent', quoteStatus: 'Needs Pricing', taskType: 'Check In', nextStep: 'Confirm sample delivery and ask for feedback on fit, material, and print needs.', activityLabel: 'Samples sent' },
  { stage: 'Quoted', priority: 'Warm', sampleStatus: 'Delivered', quoteStatus: 'Sent', taskType: 'Check In', nextStep: 'Follow up on the quote and ask what needs to change for approval.', activityLabel: 'Quote sent' },
  { stage: 'Won', priority: 'Hot', sampleStatus: 'Delivered', quoteStatus: 'Approved', taskType: 'Check In', nextStep: 'Start customer setup: billing, shipping, tax documents, artwork, and first order details.', activityLabel: 'Won and moving to setup' },
  { stage: 'Nurture', priority: 'Cold', sampleStatus: 'Not Requested', quoteStatus: 'Not Started', taskType: 'Check In', nextStep: 'Keep warm and check back when timing or supplier needs change.', activityLabel: 'Moved to nurture' },
]

const demoVolumeScale: Record<string, number> = {
  'Under 100k units': 0.55,
  '100k-250k units': 1,
  '250k-500k units': 1.8,
  '500k-1M units': 3.2,
  '1M+ units': 5.8,
}

const demoQuoteStatuses: QuoteStatus[] = ['Needs Pricing', 'Drafting', 'Sent', 'Approved']
const demoMaterialStatuses = ['Needs review', 'In stock for first wave', 'Supplier availability pending', 'Below minimum for projected first order', 'Artwork/specs needed']
const demoBottlenecks = [
  'Waiting on final artwork before production can be scheduled.',
  'Supplier is confirming material allocation for projected volume.',
  'Customer needs to approve freight and delivery window.',
  'MISYS item number is ready, but PO approval is still pending.',
  'Quality sample must be approved before first production run.',
]

function demoUuid(prefix: number, sequence: number) {
  return `${String(prefix).padStart(8, '0').slice(0, 8)}-0000-4000-8000-${String(sequence).padStart(12, '0').slice(-12)}`
}

function demoEmail(contact: string, company: string) {
  const firstName = contact.split(' ')[0]?.toLowerCase() || 'contact'
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24) || 'nexgencustomer'
  return `${firstName}@${domain}.example`
}

function demoPhone(index: number) {
  const areaCodes = ['312', '847', '414', '608', '314', '512', '612', '404', '617', '317']
  return `(${areaCodes[index % areaCodes.length]}) 555-${String(1000 + index).slice(-4)}`
}

function demoTimestamp(daysFromNow: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString()
}

const seedLeads: Lead[] = buildDemoLeads()
const seedProductCatalog: ProductCatalogItem[] = demoProductTemplates.map((template, index) =>
  normalizeProductCatalogItem({
    id: demoUuid(40000000, index + 1),
    sku: `${template.skuPrefix}-CAT-${String(index + 1).padStart(2, '0')}`,
    productName: template.productName,
    category: template.category,
    imagePath: template.imagePath,
    material: template.material,
    dimensions: template.dimensions,
    casePack: template.casePack,
    supplier: template.supplier,
    supplierSku: template.supplierSku,
    cost: template.cost,
    sellPrice: template.sellPrice,
    leadTime: template.leadTime,
    stockType: template.stockType,
    status: index % 9 === 0 ? 'Draft' : 'Active',
    notes: `Master catalog item for ${template.need.toLowerCase()}. Use this as the base record before customer-specific quote quantities, artwork, and job status.`,
    updatedAt: demoTimestamp(-index),
  }),
)

function App() {
  const params = new URLSearchParams(window.location.search)
  const initialView: View = params.get('capture') === 'true' ? 'capture' : 'crm'
  const [view, setView] = useState<View>(initialView)

  return view === 'capture' ? <CaptureApp onEmployee={() => setView('crm')} /> : <CrmApp onCapture={() => setView('capture')} />
}

function CrmApp({ onCapture }: { onCapture: () => void }) {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [syncStatus, setSyncStatus] = useState(session?.demo ? 'Demo preview' : session ? 'Connected' : 'Login required')
  const [leads, setLeads] = useState<Lead[]>(() => (readSession()?.demo ? seedLeads : loadLocalLeads()))
  const [productCatalog, setProductCatalog] = useState<ProductCatalogItem[]>(() => (readSession()?.demo ? seedProductCatalog : loadLocalProductCatalog()))
  const [workspacePage, setWorkspacePage] = useState<WorkspacePage>('customers')
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState('Event')
  const [sortDir, setSortDir] = useState<'az' | 'za'>('az')
  const [copied, setCopied] = useState('')
  const [emailDraft, setEmailDraft] = useState({ subject: '', body: '' })

  const persistSession = useCallback((nextSession: Session) => {
    setSession(nextSession)
    localStorage.setItem(sessionKey, JSON.stringify(nextSession))
  }, [])

  const refreshCurrentSession = useCallback(async (currentSession: Session) => {
    if (!currentSession.refresh_token) throw new Error('Missing refresh token.')
    const nextSession = await supabaseRefreshSession(currentSession.refresh_token)
    persistSession(nextSession)
    return nextSession
  }, [persistSession])

  const fetchLeadsWithSession = useCallback(
    async (currentSession: Session) => {
      try {
        return { remote: await fetchLeads(currentSession.access_token), activeSession: currentSession, refreshed: false }
      } catch (error) {
        if (!isAuthError(error)) throw error
        if (!currentSession.refresh_token) throw error
        const activeSession = await supabaseRefreshSession(currentSession.refresh_token)
        return { remote: await fetchLeads(activeSession.access_token), activeSession, refreshed: true }
      }
    },
    [],
  )

  const fetchCatalogWithSession = useCallback(
    async (currentSession: Session) => {
      try {
        return { remote: await fetchProductCatalog(currentSession.access_token), activeSession: currentSession, refreshed: false }
      } catch (error) {
        if (!isAuthError(error)) throw error
        if (!currentSession.refresh_token) throw error
        const activeSession = await supabaseRefreshSession(currentSession.refresh_token)
        return { remote: await fetchProductCatalog(activeSession.access_token), activeSession, refreshed: true }
      }
    },
    [],
  )

  useEffect(() => {
    if (!session) return
    if (session.demo) {
      return
    }
    let cancelled = false
    Promise.all([fetchLeadsWithSession(session), fetchCatalogWithSession(session)])
      .then(([leadResult, catalogResult]) => {
        if (cancelled) return
        if (leadResult.refreshed) persistSession(leadResult.activeSession)
        if (catalogResult.refreshed) persistSession(catalogResult.activeSession)
        setLeads(leadResult.remote)
        setProductCatalog(catalogResult.remote.length ? catalogResult.remote : seedProductCatalog)
        setSelectedId(leadResult.remote[0]?.id ?? '')
        saveLocalLeads(leadResult.remote)
        saveLocalProductCatalog(catalogResult.remote.length ? catalogResult.remote : seedProductCatalog)
        setSyncStatus('Connected')
      })
      .catch((error) => {
        if (cancelled) return
        if (isAuthError(error)) {
          localStorage.removeItem(sessionKey)
          setSession(null)
          setSyncStatus('Login required')
          return
        }
        setSyncStatus('Offline - showing local backup')
      })
    return () => {
      cancelled = true
    }
  }, [fetchCatalogWithSession, fetchLeadsWithSession, persistSession, session])

  const stats = useMemo(() => {
    return {
      total: leads.length,
      hot: leads.filter((lead) => lead.priority === 'Hot').length,
      open: leads.filter((lead) => !['Won', 'Nurture'].includes(lead.stage)).length,
      samples: leads.filter((lead) => ['Requested', 'Packed', 'Sent'].includes(lead.sampleStatus)).length,
    }
  }, [leads])

  const catalogStats = useMemo(() => {
    const suppliers = new Set(productCatalog.map((product) => product.supplier).filter(Boolean))
    const activeProducts = productCatalog.filter((product) => product.status === 'Active')
    const averageMargin = productCatalog.length ? Math.round(productCatalog.reduce((sum, product) => sum + product.margin, 0) / productCatalog.length) : 0
    return {
      total: productCatalog.length,
      active: activeProducts.length,
      suppliers: suppliers.size,
      margin: `${averageMargin}%`,
    }
  }, [productCatalog])

  const events = useMemo(() => {
    return ['Event', ...Array.from(new Set(leads.map((lead) => lead.showName).filter(Boolean))).sort()]
  }, [leads])

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...leads]
      .filter((lead) => eventFilter === 'Event' || lead.showName === eventFilter)
      .filter((lead) => {
        if (!q) return true
        return [lead.company, lead.contact, lead.email, lead.showName].join(' ').toLowerCase().includes(q)
      })
      .sort((a, b) => (sortDir === 'az' ? a.company.localeCompare(b.company) : b.company.localeCompare(a.company)))
  }, [eventFilter, leads, query, sortDir])

  const selectedLead = leads.find((lead) => lead.id === selectedId) ?? leads[0]
  const syncIsWarning = syncStatus.toLowerCase().includes('offline') || syncStatus.toLowerCase().includes('failed')
  const syncIsBusy = syncStatus.toLowerCase().includes('checking') || syncStatus.toLowerCase().includes('refreshing')
  const syncClassName = `sync-strip${syncIsWarning ? ' warning' : syncIsBusy ? ' busy' : ''}`

  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    setAuthError('')
    setSyncStatus('Checking connection...')
    try {
      const nextSession = await supabaseSignIn(authForm.email, authForm.password)
      persistSession(nextSession)
      setAuthForm({ email: '', password: '' })
      setSyncStatus('Checking connection...')
    } catch {
      setAuthError('Unable to sign in. Check the email and password for your Supabase user.')
      setSyncStatus('Login required')
    }
  }

  async function signOut() {
    const token = session?.access_token
    localStorage.removeItem(sessionKey)
    setSession(null)
    setSyncStatus('Login required')
    if (token && !session?.demo) await supabaseSignOut(token)
  }

  function startDemoPreview() {
    const demoSession = { access_token: 'demo-preview', demo: true }
    setLeads(seedLeads)
    setProductCatalog(seedProductCatalog)
    setSelectedId(seedLeads[0]?.id || '')
    setSession(demoSession)
    setSyncStatus('Demo preview - local sample data')
    localStorage.setItem(sessionKey, JSON.stringify(demoSession))
  }

  async function refreshLeads() {
    if (!session) return
    if (session.demo) {
      setLeads(seedLeads)
      setProductCatalog(seedProductCatalog)
      setSelectedId((current) => (seedLeads.some((lead) => lead.id === current) ? current : seedLeads[0]?.id ?? ''))
      setSyncStatus('Demo preview - local sample data')
      return
    }
    setSyncStatus('Refreshing...')
    try {
      const [leadResult, catalogResult] = await Promise.all([fetchLeadsWithSession(session), fetchCatalogWithSession(session)])
      if (leadResult.refreshed) persistSession(leadResult.activeSession)
      if (catalogResult.refreshed) persistSession(catalogResult.activeSession)
      setLeads(leadResult.remote)
      setProductCatalog(catalogResult.remote.length ? catalogResult.remote : seedProductCatalog)
      saveLocalLeads(leadResult.remote)
      saveLocalProductCatalog(catalogResult.remote.length ? catalogResult.remote : seedProductCatalog)
      setSelectedId((current) => (leadResult.remote.some((lead) => lead.id === current) ? current : leadResult.remote[0]?.id ?? ''))
      setSyncStatus('Connected')
    } catch {
      setSyncStatus('Offline - showing local backup')
    }
  }

  async function updateCatalogItem(id: string, patch: Partial<ProductCatalogItem>) {
    const nextCatalog = productCatalog.map((product) => (product.id === id ? normalizeProductCatalogItem({ ...product, ...patch, updatedAt: new Date().toISOString() }) : product))
    setProductCatalog(nextCatalog)
    saveLocalProductCatalog(nextCatalog)

    if (session && !session.demo) {
      const updated = nextCatalog.find((product) => product.id === id)
      if (!updated) return
      try {
        let saved: ProductCatalogItem
        try {
          saved = await patchProductCatalogItem(updated, session.access_token)
        } catch (error) {
          if (!isAuthError(error)) throw error
          const activeSession = await refreshCurrentSession(session)
          saved = await patchProductCatalogItem(updated, activeSession.access_token)
        }
        const synced = nextCatalog.map((product) => (product.id === id ? saved : product))
        setProductCatalog(synced)
        saveLocalProductCatalog(synced)
        setSyncStatus('Connected')
      } catch {
        setSyncStatus('Offline - catalog changes saved locally')
      }
    }
  }

  async function addCatalogItem() {
    const template = seedProductCatalog[productCatalog.length % seedProductCatalog.length] ?? emptyCatalogItem
    const nextProduct = normalizeProductCatalogItem({
      ...template,
      id: crypto.randomUUID(),
      sku: `NEW-${String(productCatalog.length + 1).padStart(3, '0')}`,
      productName: 'New product offering',
      status: 'Draft',
      notes: 'Edit this catalog record with supplier, cost, sell price, image, and MISYS-ready details.',
      updatedAt: new Date().toISOString(),
    })
    const nextCatalog = [nextProduct, ...productCatalog]
    setProductCatalog(nextCatalog)
    saveLocalProductCatalog(nextCatalog)

    if (session && !session.demo) {
      try {
        let saved: ProductCatalogItem
        try {
          saved = await insertProductCatalogItem(nextProduct, session.access_token)
        } catch (error) {
          if (!isAuthError(error)) throw error
          const activeSession = await refreshCurrentSession(session)
          saved = await insertProductCatalogItem(nextProduct, activeSession.access_token)
        }
        const synced = nextCatalog.map((product) => (product.id === nextProduct.id ? saved : product))
        setProductCatalog(synced)
        saveLocalProductCatalog(synced)
        setSyncStatus('Connected')
      } catch {
        setSyncStatus('Offline - new catalog item saved locally')
      }
    }
  }

  async function updateLead(id: string, patch: Partial<Lead>) {
    const nextLeads = leads.map((lead) => (lead.id === id ? normalizeLead({ ...lead, ...patch }) : lead))
    setLeads(nextLeads)
    saveLocalLeads(nextLeads)

    if (session && !session.demo) {
      const updated = nextLeads.find((lead) => lead.id === id)
      if (!updated) return
      try {
        let saved: Lead
        try {
          saved = await patchLead(updated, session.access_token)
        } catch (error) {
          if (!isAuthError(error)) throw error
          const activeSession = await refreshCurrentSession(session)
          saved = await patchLead(updated, activeSession.access_token)
        }
        const synced = nextLeads.map((lead) => (lead.id === id ? saved : lead))
        setLeads(synced)
        saveLocalLeads(synced)
        setSyncStatus('Connected')
      } catch {
        setSyncStatus('Offline - changes saved locally')
      }
    }
  }

  function updateMisys(patch: Partial<MisysProfile>) {
    if (!selectedLead) return
    updateLead(selectedLead.id, { misysProfile: { ...selectedLead.misysProfile, ...patch } })
  }

  function buildEmail(template: string) {
    if (!selectedLead) return
    setEmailDraft(makeEmailDraft(selectedLead, template))
    setCopied('')
  }

  async function copyDraft() {
    if (!emailDraft.subject && !emailDraft.body) return
    await navigator.clipboard.writeText(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`)
    setCopied('Copied')
  }

  function downloadMisysCsv() {
    downloadCsv('nexgen-misys-customer-intake.csv', buildMisysRows(leads))
  }

  if (!session) {
    return (
      <main className="auth-screen" id="top">
        <section className="auth-card">
          <img className="hero-logo" src={logoUrl} alt="NexGen Packaging" />
          <span className="auth-icon">
            <Lock size={22} />
          </span>
          <p className="eyebrow">Admin Access</p>
          <h1>Sign in to manage trade show leads.</h1>
          <p>The booth capture form remains public for QR scans. The CRM dashboard uses Supabase Auth before reading or updating lead data.</p>
          <form onSubmit={signIn}>
            <label>
              Email
              <input
                required
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                placeholder="you@nexgenpackaging.com"
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                placeholder="Supabase user password"
              />
            </label>
            {authError && <strong className="auth-error">{authError}</strong>}
            <button className="primary-action" type="submit">
              <Lock size={18} /> Sign In
            </button>
            <button className="demo-action" type="button" onClick={startDemoPreview}>
              <PackageCheck size={18} /> Preview Demo CRM
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <main className="crm-screen" id="top">
        <header className="topbar">
          <div className="topbar-copy">
            <img className="hero-logo" src={logoUrl} alt="NexGen Packaging" />
            <p className="eyebrow">Pipeline Command Center</p>
            <h1>Trade show leads, ready for the next move.</h1>
            <p>Capture booth conversations, qualify packaging needs, and move every opportunity into a clear next step.</p>
          </div>
          <div className="hero-photo" aria-hidden="true">
            <img src={heroImage} alt="" />
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={workspacePage === 'catalog' ? addCatalogItem : onCapture}>
              <Plus size={18} /> {workspacePage === 'catalog' ? 'Add Product' : 'Add Lead'}
            </button>
            <button type="button" onClick={() => setWorkspacePage((current) => (current === 'catalog' ? 'customers' : 'catalog'))}>
              <PackageCheck size={18} /> {workspacePage === 'catalog' ? 'Customers' : 'Product Catalog'}
            </button>
            <button type="button" onClick={refreshLeads}>
              <RefreshCw size={18} /> Refresh
            </button>
            <button type="button" onClick={downloadMisysCsv}>
              <Download size={18} /> MISYS
            </button>
            <button type="button" className="sign-out-inline" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="stats-grid" aria-label="CRM metrics">
          {workspacePage === 'catalog' ? (
            <>
              <StatCard icon={<PackageCheck />} label="Catalog SKUs" value={catalogStats.total} />
              <StatCard icon={<CheckCircle2 />} label="Active products" value={catalogStats.active} />
              <StatCard icon={<ClipboardList />} label="Suppliers" value={catalogStats.suppliers} />
              <StatCard icon={<CalendarDays />} label="Avg margin" value={catalogStats.margin} />
            </>
          ) : (
            <>
              <StatCard icon={<ClipboardList />} label="Total leads" value={stats.total} />
              <StatCard icon={<CheckCircle2 />} label="Hot leads" value={stats.hot} />
              <StatCard icon={<CalendarDays />} label="Open pipeline" value={stats.open} />
              <StatCard icon={<PackageCheck />} label="Sample follow-ups" value={stats.samples} />
            </>
          )}
        </section>

        <section className={syncClassName} aria-live="polite">
          <strong>Database</strong>
          <span>{syncStatus}</span>
        </section>

        {workspacePage === 'catalog' ? (
          <ProductCatalogManager catalog={productCatalog} onUpdate={updateCatalogItem} />
        ) : (
          <section className="workspace">
            <aside className="lead-list-panel">
              <div className="filters">
                <label className="search-field">
                  <Search size={17} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads" />
                </label>
                <label>
                  <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
                    {events.map((event) => (
                      <option key={event}>{event}</option>
                    ))}
                  </select>
                </label>
                <button className="sort-toggle" type="button" onClick={() => setSortDir((current) => (current === 'az' ? 'za' : 'az'))}>
                  {sortDir === 'az' ? 'A-Z' : 'Z-A'}
                </button>
              </div>
              <div className="lead-list">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <button
                      className={lead.id === selectedLead?.id ? 'lead-row active' : 'lead-row'}
                      key={lead.id}
                      type="button"
                      onClick={() => setSelectedId(lead.id)}
                    >
                      <span className={`priority-dot ${lead.priority.toLowerCase()}`} />
                      <span>
                        <strong>{lead.company}</strong>
                        <small>
                          {lead.contact} · {lead.showName}
                        </small>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">
                    <strong>No leads match this view.</strong>
                    <span>Clear search or choose another event.</span>
                  </div>
                )}
              </div>
            </aside>

            {selectedLead && (
              <article className="detail-panel">
                <div className="detail-heading">
                  <div>
                    <p className="eyebrow">{selectedLead.priority} Lead</p>
                    <h2>{selectedLead.company}</h2>
                    <span>
                      {selectedLead.contact} · {selectedLead.title || 'Contact'}
                    </span>
                  </div>
                  <div className="profile-status-card">
                    <small>Current Stage</small>
                    <strong>{statusLabel(selectedLead.stage)}</strong>
                  </div>
                </div>

                <ProfilePanel
                  lead={selectedLead}
                  onUpdate={(patch) => updateLead(selectedLead.id, patch)}
                  onEmailTemplate={buildEmail}
                  emailDraft={emailDraft}
                  onDraftChange={setEmailDraft}
                  onCopyDraft={copyDraft}
                  copied={copied}
                  onMisysChange={updateMisys}
                  onMisysDownload={downloadMisysCsv}
                />
              </article>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function ProfilePanel({
  lead,
  onUpdate,
  onEmailTemplate,
  emailDraft,
  onDraftChange,
  onCopyDraft,
  copied,
  onMisysChange,
  onMisysDownload,
}: {
  lead: Lead
  onUpdate: (patch: Partial<Lead>) => void
  onEmailTemplate: (template: string) => void
  emailDraft: { subject: string; body: string }
  onDraftChange: (draft: { subject: string; body: string }) => void
  onCopyDraft: () => void
  copied: string
  onMisysChange: (patch: Partial<MisysProfile>) => void
  onMisysDownload: () => void
}) {
  const phase = phaseForLead(lead)
  const [profilePage, setProfilePage] = useState<ProfilePage>('overview')
  const profilePages: { id: ProfilePage; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'account', label: 'Account' },
    { id: 'products', label: 'Products / SKUs' },
    { id: 'contact', label: 'Contact' },
    { id: 'notes', label: 'Notes' },
    { id: 'activity', label: 'Activity' },
    { id: 'email', label: 'Email' },
    { id: 'misys', label: 'MISYS' },
  ]

  return (
    <>
      <nav className="profile-page-tabs" aria-label="Customer profile sections">
        {profilePages.map((page) => (
          <button className={profilePage === page.id ? 'active' : ''} type="button" onClick={() => setProfilePage(page.id)} key={page.id}>
            {page.label}
          </button>
        ))}
      </nav>

      {profilePage === 'overview' && (
        <OverviewPanel
          lead={lead}
          phase={phase}
          onEmail={() => setProfilePage('email')}
          onProducts={() => setProfilePage('products')}
        />
      )}

      {profilePage === 'account' && <CustomerAccountForm lead={lead} onUpdate={onUpdate} />}
      {profilePage === 'products' && <ProductSkuSection lead={lead} onUpdate={onUpdate} />}
      {profilePage === 'contact' && <ClientDetailsForm lead={lead} onUpdate={onUpdate} />}
      {profilePage === 'notes' && <NotesNeedsSection lead={lead} onUpdate={onUpdate} />}
      {profilePage === 'activity' && <ActivityTimeline lead={lead} />}
      {profilePage === 'misys' && <MisysPanel lead={lead} onChange={onMisysChange} onDownload={onMisysDownload} />}

      {profilePage === 'email' && (
        <section className="detail-section email-builder">
          <div className="email-heading">
            <div>
              <h3>Email Templates</h3>
              <p>Generate a draft from the selected lead details, then edit before sending from your email client.</p>
            </div>
            <button type="button" onClick={onCopyDraft}>
              <FileText size={17} /> {copied || 'Copy Draft'}
            </button>
          </div>
          <div className="template-grid">
            {['First follow-up', 'Samples', 'Quote next step', 'Nurture check-in'].map((template) => (
              <button type="button" onClick={() => onEmailTemplate(template)} key={template}>
                <Mail size={17} /> {template}
              </button>
            ))}
          </div>
          <label>
            Subject
            <input value={emailDraft.subject} onChange={(event) => onDraftChange({ ...emailDraft, subject: event.target.value })} />
          </label>
          <label>
            Body
            <textarea value={emailDraft.body} onChange={(event) => onDraftChange({ ...emailDraft, body: event.target.value })} />
          </label>
        </section>
      )}
    </>
  )
}

function OverviewPanel({
  lead,
  phase,
  onEmail,
  onProducts,
}: {
  lead: Lead
  phase: string
  onEmail: () => void
  onProducts: () => void
}) {
  const activeStage = pipelineSteps.indexOf(phase)
  const [rankMode, setRankMode] = useState<ProductRankMode>('dollars')
  const quoteValue = lead.productRecords.reduce((sum, product) => sum + product.sellPrice * quantityNumber(product.quoteQuantity), 0)
  const bottlenecks = lead.productRecords.filter((product) => product.bottleneckReason.trim()).length

  return (
    <section className="customer-overview-panel" aria-label="Customer flow management">
      <section className="overview-action-panel">
        <div className="compact-stage-rail" aria-label={`Current phase ${phase}`}>
          {pipelineSteps.map((step, index) => (
            <span className={index === activeStage ? 'compact-stage active' : index < activeStage ? 'compact-stage complete' : 'compact-stage'} key={step}>
              <i />
              {step}
            </span>
          ))}
        </div>
        <div className="next-action-buttons">
          <button type="button" onClick={onEmail}>
            <Mail size={17} /> Create Follow-Up
          </button>
          <button type="button" onClick={onProducts}>
            <PackageCheck size={17} /> View Product Flow
          </button>
        </div>
      </section>

      <div className="overview-kpi-strip">
        <SummaryItem label="Phase" value={phase} />
        <SummaryItem label="Next Touch" value={lead.taskType} />
        <SummaryItem label="Due" value={formatDate(lead.taskDue)} className={dueClass(lead.taskDue)} />
        <SummaryItem label="Products" value={String(lead.productRecords.length)} />
        <SummaryItem label="Quote Value" value={formatMoney(quoteValue)} />
        <SummaryItem label="Bottlenecks" value={String(bottlenecks)} />
      </div>

      <TopProductsPanel lead={lead} mode={rankMode} onModeChange={setRankMode} compact />
    </section>
  )
}

function ProductSkuSection({ lead, onUpdate }: { lead: Lead; onUpdate: (patch: Partial<Lead>) => void }) {
  const products = lead.productRecords
  const [rankMode, setRankMode] = useState<ProductRankMode>('dollars')
  const quoteValue = products.reduce((sum, product) => sum + product.sellPrice * quantityNumber(product.quoteQuantity), 0)
  const averageMargin = products.length ? Math.round(products.reduce((sum, product) => sum + product.margin, 0) / products.length) : 0
  const activeBottlenecks = products.filter((product) => product.bottleneckReason.trim()).length

  function updateProduct(id: string, patch: Partial<ProductRecord>) {
    onUpdate({ productRecords: products.map((product) => (product.id === id ? normalizeProductRecord({ ...product, ...patch }) : product)) })
  }

  function addDemoProduct() {
    const nextProduct = demoProductForLead(lead)
    onUpdate({ productRecords: [...products, nextProduct] })
  }

  return (
    <section className="product-sku-section detail-section">
      <div className="section-heading">
        <div>
          <h3>Products / SKU Bridge</h3>
          <p>Connect customer needs to sellable SKUs, supplier costs, MISYS item numbers, quote economics, and job status.</p>
        </div>
        <button type="button" onClick={addDemoProduct}>
          <Plus size={17} /> Add Demo SKU
        </button>
      </div>

      <div className="product-metric-grid" aria-label="Product and quote summary">
        <SummaryItem label="Product Lines" value={String(products.length)} />
        <SummaryItem label="Quote Value" value={formatMoney(quoteValue)} />
        <SummaryItem label="Avg Margin" value={products.length ? `${averageMargin}%` : 'Not set'} />
        <SummaryItem label="Bottlenecks" value={String(activeBottlenecks)} />
      </div>

      <TopProductsPanel lead={lead} mode={rankMode} onModeChange={setRankMode} />

      <div className="product-flow-list">
        {products.length > 0 ? (
          products.map((product) => <ProductFlowCard product={product} onChange={(patch) => updateProduct(product.id, patch)} key={product.id} />)
        ) : (
          <div className="empty-state product-empty-state">
            <strong>No products attached yet.</strong>
            <span>Add a demo SKU to see how customer needs become quote lines and production jobs.</span>
          </div>
        )}
      </div>
    </section>
  )
}

function ProductFlowCard({ product, onChange }: { product: ProductRecord; onChange: (patch: Partial<ProductRecord>) => void }) {
  const activeStage = Math.max(0, jobStageOptions.indexOf(product.jobStage))
  const visibleStages = jobStageOptions.filter((_, index) => Math.abs(index - activeStage) <= 2)
  const quoteValue = product.sellPrice * quantityNumber(product.quoteQuantity)

  return (
    <article className="product-flow-card">
      <div className="product-card-heading">
        <div className="product-flow-image" aria-hidden="true">
          <img src={productImageForProduct(product)} alt="" />
        </div>
        <div>
          <p className="eyebrow">{product.stockType}</p>
          <h4>{product.productName}</h4>
          <span>
            {product.sku || 'SKU pending'} · MISYS {product.misysItemNumber || 'pending'}
          </span>
        </div>
        <strong>{formatMoney(quoteValue)}</strong>
      </div>

      <div className="product-detail-grid">
        <SummaryItem label="Category" value={product.category} />
        <SummaryItem label="Supplier" value={product.supplier} />
        <SummaryItem label="Cost" value={formatUnitMoney(product.cost)} />
        <SummaryItem label="Sell" value={formatUnitMoney(product.sellPrice)} />
        <SummaryItem label="Margin" value={`${product.margin}%`} />
        <SummaryItem label="Lead Time" value={product.leadTime} />
      </div>

      <div className="job-stage-strip" aria-label={`Current product stage ${product.jobStage}`}>
        {visibleStages.map((stage) => {
          const index = jobStageOptions.indexOf(stage)
          return (
            <span className={index === activeStage ? 'job-stage active' : index < activeStage ? 'job-stage complete' : 'job-stage'} key={stage}>
              {stage}
            </span>
          )
        })}
      </div>

      <form className="product-edit-grid" onSubmit={(event) => event.preventDefault()}>
        <label>
          Quote quantity
          <input value={product.quoteQuantity} onChange={(event) => onChange({ quoteQuantity: event.target.value })} />
        </label>
        <label>
          Quote status
          <select value={product.quoteStatus} onChange={(event) => onChange({ quoteStatus: event.target.value as QuoteStatus })}>
            {['Not Started', 'Needs Pricing', 'Drafting', 'Sent', 'Approved'].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Job stage
          <select value={product.jobStage} onChange={(event) => onChange({ jobStage: event.target.value })}>
            {jobStageOptions.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
        </label>
        <label>
          Stock type
          <select value={product.stockType} onChange={(event) => onChange({ stockType: event.target.value as StockType })}>
            {stockTypeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Material status
          <input value={product.materialStatus} onChange={(event) => onChange({ materialStatus: event.target.value })} />
        </label>
        <label>
          Supplier ETA
          <input type="date" value={product.supplierEta} onChange={(event) => onChange({ supplierEta: event.target.value })} />
        </label>
        <label className="wide-field">
          Bottleneck reason
          <textarea value={product.bottleneckReason} onChange={(event) => onChange({ bottleneckReason: event.target.value })} />
        </label>
      </form>
    </article>
  )
}

function TopProductsPanel({
  lead,
  mode,
  onModeChange,
  compact = false,
}: {
  lead: Lead
  mode: ProductRankMode
  onModeChange: (mode: ProductRankMode) => void
  compact?: boolean
}) {
  const topProducts = topProductsForLead(lead, mode)

  return (
    <section className={compact ? 'top-products-panel compact' : 'top-products-panel'} aria-label="Top products from SKU records">
      <div className="top-products-heading">
        <div>
          <h4>Top Products</h4>
          <p>Top 3 by {mode === 'dollars' ? 'quote value' : 'unit volume'}, pulled from Product / SKU records.</p>
        </div>
        <div className="rank-toggle" aria-label="Rank top products by">
          <button className={mode === 'dollars' ? 'active' : ''} type="button" onClick={() => onModeChange('dollars')}>
            $
          </button>
          <button className={mode === 'units' ? 'active' : ''} type="button" onClick={() => onModeChange('units')}>
            Units
          </button>
        </div>
      </div>
      <div className="top-products-list">
        {topProducts.length > 0 ? (
          topProducts.map((product, index) => (
            <article className="top-product-card" key={product.id}>
              <div className="top-product-image">
                <img src={productImageForProduct(product)} alt="" />
                <span>{index + 1}</span>
              </div>
              <div>
                <strong>{product.productName}</strong>
                <small>
                  {product.sku || 'SKU pending'} · {product.category || 'Category pending'}
                </small>
              </div>
              <div className="top-product-stats">
                <span>
                  <small>Dollars</small>
                  <b>{formatMoney(product.sellPrice * quantityNumber(product.quoteQuantity))}</b>
                </span>
                <span>
                  <small>Units</small>
                  <b>{formatUnits(quantityNumber(product.quoteQuantity))}</b>
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="top-products-empty">Add product lines on the Products / SKUs page to populate this list.</div>
        )}
      </div>
    </section>
  )
}

function ProductCatalogManager({
  catalog,
  onUpdate,
}: {
  catalog: ProductCatalogItem[]
  onUpdate: (id: string, patch: Partial<ProductCatalogItem>) => void
}) {
  const [catalogQuery, setCatalogQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const categories = useMemo(() => ['All categories', ...Array.from(new Set(catalog.map((product) => product.category).filter(Boolean))).sort()], [catalog])
  const visibleCatalog = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase()
    return [...catalog]
      .filter((product) => categoryFilter === 'All categories' || product.category === categoryFilter)
      .filter((product) => {
        if (!q) return true
        return [product.productName, product.sku, product.category, product.supplier, product.material].join(' ').toLowerCase().includes(q)
      })
      .sort((a, b) => a.productName.localeCompare(b.productName))
  }, [catalog, catalogQuery, categoryFilter])

  return (
    <section className="catalog-workspace">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">Product Database</p>
          <h2>Products We Offer</h2>
          <p>Maintain the master SKU catalog your customer quotes and jobs should pull from.</p>
        </div>
      </div>

      <div className="catalog-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Search products" />
        </label>
        <label>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="catalog-list">
        {visibleCatalog.length > 0 ? (
          visibleCatalog.map((product) => <ProductCatalogCard product={product} onChange={(patch) => onUpdate(product.id, patch)} key={product.id} />)
        ) : (
          <div className="empty-state product-empty-state">
            <strong>No catalog products match this view.</strong>
            <span>Clear the filters or add a new product offering.</span>
          </div>
        )}
      </div>
    </section>
  )
}

function ProductCatalogCard({ product, onChange }: { product: ProductCatalogItem; onChange: (patch: Partial<ProductCatalogItem>) => void }) {
  return (
    <article className="catalog-card">
      <div className="catalog-card-preview">
        <div className="catalog-product-image" aria-hidden="true">
          <img src={product.imagePath || productImageForProduct(product)} alt="" />
        </div>
        <div>
          <span className={`catalog-status ${product.status.toLowerCase()}`}>{product.status}</span>
          <h3>{product.productName || 'Untitled product'}</h3>
          <p>
            {product.sku || 'SKU pending'} · {product.category || 'Category pending'}
          </p>
        </div>
        <strong>{product.sellPrice ? formatUnitMoney(product.sellPrice) : 'No price'}</strong>
      </div>

      <div className="catalog-summary-grid">
        <SummaryItem label="Supplier" value={product.supplier} />
        <SummaryItem label="Cost" value={formatUnitMoney(product.cost)} />
        <SummaryItem label="Margin" value={`${product.margin}%`} />
        <SummaryItem label="Lead Time" value={product.leadTime} />
      </div>

      <form className="catalog-edit-grid" onSubmit={(event) => event.preventDefault()}>
        <label>
          Product name
          <input value={product.productName} onChange={(event) => onChange({ productName: event.target.value })} />
        </label>
        <label>
          SKU
          <input value={product.sku} onChange={(event) => onChange({ sku: event.target.value })} />
        </label>
        <label>
          Category
          <input value={product.category} onChange={(event) => onChange({ category: event.target.value })} />
        </label>
        <label>
          Product image
          <select value={product.imagePath} onChange={(event) => onChange({ imagePath: event.target.value })}>
            {productImageOptions.map((path) => (
              <option value={path} key={path}>
                {imageLabel(path)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Material
          <input value={product.material} onChange={(event) => onChange({ material: event.target.value })} />
        </label>
        <label>
          Dimensions
          <input value={product.dimensions} onChange={(event) => onChange({ dimensions: event.target.value })} />
        </label>
        <label>
          Case pack
          <input value={product.casePack} onChange={(event) => onChange({ casePack: event.target.value })} />
        </label>
        <label>
          Supplier
          <input value={product.supplier} onChange={(event) => onChange({ supplier: event.target.value })} />
        </label>
        <label>
          Supplier SKU
          <input value={product.supplierSku} onChange={(event) => onChange({ supplierSku: event.target.value })} />
        </label>
        <label>
          Cost
          <input type="number" step="0.001" value={product.cost} onChange={(event) => onChange({ cost: Number(event.target.value) })} />
        </label>
        <label>
          Sell price
          <input type="number" step="0.001" value={product.sellPrice} onChange={(event) => onChange({ sellPrice: Number(event.target.value) })} />
        </label>
        <label>
          Lead time
          <input value={product.leadTime} onChange={(event) => onChange({ leadTime: event.target.value })} />
        </label>
        <label>
          Stock type
          <select value={product.stockType} onChange={(event) => onChange({ stockType: event.target.value as StockType })}>
            {stockTypeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={product.status} onChange={(event) => onChange({ status: event.target.value as CatalogStatus })}>
            {catalogStatusOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="wide-field">
          Catalog notes
          <textarea value={product.notes} onChange={(event) => onChange({ notes: event.target.value })} />
        </label>
      </form>
    </article>
  )
}

function CustomerAccountForm({ lead, onUpdate }: { lead: Lead; onUpdate: (patch: Partial<Lead>) => void }) {
  const profile = lead.accountProfile

  function updateAccountProfile(patch: Partial<CustomerProfile>) {
    onUpdate({ accountProfile: { ...profile, ...patch } })
  }

  return (
    <section className="customer-account-section detail-section">
      <div className="section-heading">
        <div>
          <h3>Customer Account</h3>
          <p>Build the operating profile that will later connect quotes, jobs, products, suppliers, and MISYS references.</p>
        </div>
        <span>{profile.activeStatus}</span>
      </div>

      <div className="account-health-grid" aria-label="Customer account summary">
        <SummaryItem label="Customer Type" value={profile.customerType} />
        <SummaryItem label="Payment Terms" value={profile.paymentTerms} />
        <SummaryItem label="Reorder Cycle" value={profile.reorderFrequency} />
        <SummaryItem label="Next Follow-Up" value={formatDate(profile.nextFollowUpDate)} className={dueClass(profile.nextFollowUpDate)} />
      </div>

      <form className="customer-account-form" key={lead.id} onSubmit={(event) => event.preventDefault()}>
        <label>
          Customer type
          <select value={profile.customerType} onChange={(event) => updateAccountProfile({ customerType: event.target.value })}>
            {customerTypeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Industry
          <input value={profile.industry} onChange={(event) => updateAccountProfile({ industry: event.target.value })} placeholder="Restaurant, foodservice, distributor..." />
        </label>
        <label>
          Sales rep
          <input value={profile.salesRep} onChange={(event) => updateAccountProfile({ salesRep: event.target.value })} />
        </label>
        <label>
          Payment terms
          <select value={profile.paymentTerms} onChange={(event) => updateAccountProfile({ paymentTerms: event.target.value })}>
            {paymentTermOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Reorder frequency
          <select value={profile.reorderFrequency} onChange={(event) => updateAccountProfile({ reorderFrequency: event.target.value })}>
            {reorderFrequencyOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Account status
          <select value={profile.activeStatus} onChange={(event) => updateAccountProfile({ activeStatus: event.target.value as ActiveStatus })}>
            {activeStatusOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Last order date
          <input type="date" value={profile.lastOrderDate} onChange={(event) => updateAccountProfile({ lastOrderDate: event.target.value })} />
        </label>
        <label>
          Next follow-up
          <input type="date" value={profile.nextFollowUpDate} onChange={(event) => updateAccountProfile({ nextFollowUpDate: event.target.value })} />
        </label>
        <label>
          Primary location
          <input value={profile.primaryLocation} onChange={(event) => updateAccountProfile({ primaryLocation: event.target.value })} placeholder={lead.city || 'City, state, ship-to region'} />
        </label>
        <label className="wide-field">
          Additional contacts / locations
          <textarea value={profile.additionalContacts} onChange={(event) => updateAccountProfile({ additionalContacts: event.target.value })} placeholder="Buyers, AP contacts, warehouse contacts, alternate ship-to locations..." />
        </label>
        <label className="wide-field">
          Account notes
          <textarea value={profile.accountNotes} onChange={(event) => updateAccountProfile({ accountNotes: event.target.value })} placeholder="Credit terms, reorder habits, account risks, service preferences, relationship context..." />
        </label>
      </form>
    </section>
  )
}

function NotesNeedsSection({ lead, onUpdate }: { lead: Lead; onUpdate: (patch: Partial<Lead>) => void }) {
  const [noteDraft, setNoteDraft] = useState('')

  function toggleNeed(need: string) {
    const nextNeeds = lead.packagingNeeds.includes(need) ? lead.packagingNeeds.filter((item) => item !== need) : [...lead.packagingNeeds, need]
    onUpdate({ packagingNeeds: nextNeeds })
  }

  function saveNote() {
    const detail = noteDraft.trim()
    if (!detail) return
    const existingLog =
      lead.activityLog.length > 0 || !lead.notes.trim() ? lead.activityLog : [makeActivityEntry('Original note', lead.notes, lead.capturedAt, 'note')]
    onUpdate({
      notes: appendNote(lead.notes, detail),
      activityLog: [makeActivityEntry('Note added', detail), ...existingLog],
    })
    setNoteDraft('')
  }

  return (
    <section className="notes-needs-section detail-section">
      <div className="section-heading">
        <div>
          <h3>Notes & Needs</h3>
          <p>Select packaging interests and add timestamped notes to the customer timeline.</p>
        </div>
        <span>Timeline notes</span>
      </div>

      <div className="editable-need-grid" aria-label="Packaging interests">
        {packagingNeeds.map((need) => (
          <button className={lead.packagingNeeds.includes(need) ? 'need-chip active' : 'need-chip'} key={need} type="button" onClick={() => toggleNeed(need)}>
            <CheckCircle2 size={16} /> {need}
          </button>
        ))}
      </div>

      <div className="note-composer">
        <label>
          Add note
          <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add supplier details, product dimensions, sample requests, pricing notes, or follow-up context..." />
        </label>
        <button type="button" onClick={saveNote} disabled={!noteDraft.trim()}>
          <Plus size={17} /> Save Note
        </button>
      </div>
    </section>
  )
}

function ClientDetailsForm({ lead, onUpdate }: { lead: Lead; onUpdate: (patch: Partial<Lead>) => void }) {
  return (
    <section className="client-edit-section detail-section">
      <div className="client-edit-heading">
        <div>
          <h3>Client Details</h3>
          <p>Update contact and trade show information as the relationship develops.</p>
        </div>
        <span>Changes save automatically</span>
      </div>
      <form className="client-edit-form" key={lead.id} onSubmit={(event) => event.preventDefault()}>
        <label>
          Company
          <input defaultValue={lead.company} onBlur={(event) => onUpdate({ company: event.target.value })} />
        </label>
        <label>
          Contact
          <input defaultValue={lead.contact} onBlur={(event) => onUpdate({ contact: event.target.value })} />
        </label>
        <label>
          Title
          <input defaultValue={lead.title} onBlur={(event) => onUpdate({ title: event.target.value })} />
        </label>
        <label>
          Email
          <input type="email" defaultValue={lead.email} onBlur={(event) => onUpdate({ email: event.target.value })} />
        </label>
        <label>
          Phone
          <input defaultValue={lead.phone} onBlur={(event) => onUpdate({ phone: event.target.value })} />
        </label>
        <label>
          City / State
          <input defaultValue={lead.city} onBlur={(event) => onUpdate({ city: event.target.value })} />
        </label>
        <label>
          Event
          <input defaultValue={lead.showName} onBlur={(event) => onUpdate({ showName: event.target.value })} />
        </label>
        <label>
          Annual volume
          <select defaultValue={lead.annualVolume} onChange={(event) => onUpdate({ annualVolume: event.target.value })}>
            {volumeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Buying timeline
          <select defaultValue={lead.timeline} onChange={(event) => onUpdate({ timeline: event.target.value, taskDue: dueForLead(lead.capturedAt, event.target.value) })}>
            {timelineOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Captured
          <input readOnly value={formatDate(lead.capturedAt)} />
        </label>
      </form>
    </section>
  )
}

function MisysPanel({ lead, onChange, onDownload }: { lead: Lead; onChange: (patch: Partial<MisysProfile>) => void; onDownload: () => void }) {
  const profile = lead.misysProfile

  return (
    <section className="detail-section misys-section">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">MISYS Intake</p>
          <h3>Customer and manufacturing setup</h3>
        </div>
        <button type="button" onClick={onDownload}>
          <Download size={17} /> MISYS
        </button>
      </div>
      <div className="misys-grid" key={lead.id}>
        <label>
          Customer ID
          <input value={profile.customerId} onChange={(event) => onChange({ customerId: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })} placeholder={customerId(lead.company)} />
        </label>
        <label>
          Accounting customer ID
          <input value={profile.accountingCustomerId} onChange={(event) => onChange({ accountingCustomerId: event.target.value })} />
        </label>
        <label>
          Customer type
          <select value={profile.customerType} onChange={(event) => onChange({ customerType: event.target.value })}>
            {['Potential', 'Active', 'Distributor', 'Foodservice', 'Retail', 'Private Label'].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Tax status
          <select value={profile.taxStatus} onChange={(event) => onChange({ taxStatus: event.target.value })}>
            {['Unknown', 'Taxable', 'Exempt'].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Freight terms
          <input value={profile.freightTerms} onChange={(event) => onChange({ freightTerms: event.target.value })} />
        </label>
        <label>
          Default warehouse
          <input value={profile.defaultWarehouse} onChange={(event) => onChange({ defaultWarehouse: event.target.value })} />
        </label>
        <label>
          Ship-to name
          <input value={profile.shipToName} onChange={(event) => onChange({ shipToName: event.target.value })} />
        </label>
        <label>
          Shipping address
          <input value={profile.shippingAddress} onChange={(event) => onChange({ shippingAddress: event.target.value })} />
        </label>
        <label>
          Billing address
          <input value={profile.billingAddress} onChange={(event) => onChange({ billingAddress: event.target.value })} />
        </label>
        <label>
          Production contact
          <input value={profile.productionContact} onChange={(event) => onChange({ productionContact: event.target.value })} />
        </label>
        <label>
          Target SKU
          <input value={profile.targetSku} onChange={(event) => onChange({ targetSku: event.target.value })} />
        </label>
        <label>
          Customer part #
          <input value={profile.customerPartNumber} onChange={(event) => onChange({ customerPartNumber: event.target.value })} />
        </label>
        <label className="wide-field">
          Item description
          <input value={profile.itemDescription} onChange={(event) => onChange({ itemDescription: event.target.value })} />
        </label>
        <label className="wide-field">
          Product / manufacturing spec
          <textarea value={profile.productSpec} onChange={(event) => onChange({ productSpec: event.target.value })} />
        </label>
      </div>
    </section>
  )
}

function CaptureApp({ onEmployee }: { onEmployee: () => void }) {
  const [form, setForm] = useState<Lead>(() => ({ ...emptyLead, id: crypto.randomUUID(), showName: 'Trade Show' }))
  const [status, setStatus] = useState('')
  const [scanStatus, setScanStatus] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function toggleNeed(need: string) {
    setForm((current) => ({
      ...current,
      packagingNeeds: current.packagingNeeds.includes(need) ? current.packagingNeeds.filter((item) => item !== need) : [...current.packagingNeeds, need],
    }))
  }

  async function scanCard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setScanStatus('Reading card...')
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      const result = await worker.recognize(file)
      await worker.terminate()
      const parsed = parseBusinessCard(result.data.text)
      setForm((current) => ({
        ...current,
        company: current.company || parsed.company,
        contact: current.contact || parsed.contact,
        title: current.title || parsed.title,
        email: current.email || parsed.email,
        phone: current.phone || parsed.phone,
        city: current.city || parsed.city,
        notes: current.notes || (parsed.rawText ? `Business card scan:\n${parsed.rawText}` : current.notes),
      }))
      setScanStatus('Card scanned. Please review the details before sending.')
    } catch {
      setScanStatus('Could not read the card. You can still enter the details manually.')
    } finally {
      event.target.value = ''
    }
  }

  async function submitLead(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(false)
    setStatus('Saving lead...')
    const capturedAt = new Date().toISOString()
    const lead = normalizeLead({
      ...form,
      id: crypto.randomUUID(),
      capturedAt,
      stage: 'New',
      priority: form.timeline === 'ASAP' || form.timeline === '30-60 days' ? 'Hot' : 'Warm',
      nextStep: 'Review booth notes and send first follow-up.',
      sampleStatus: /sample/i.test(form.notes) ? 'Requested' : 'Not Requested',
      quoteStatus: /quote|pricing|price/i.test(form.notes) ? 'Needs Pricing' : 'Not Started',
      taskType: /sample/i.test(form.notes) ? 'Send Samples' : 'Email',
      taskDue: dueForLead(capturedAt, form.timeline),
      accountProfile: {
        ...form.accountProfile,
        customerType: form.accountProfile.customerType || 'Prospect',
        salesRep: form.accountProfile.salesRep || form.owner,
        topProducts: form.accountProfile.topProducts || form.packagingNeeds.join(', '),
        nextFollowUpDate: form.accountProfile.nextFollowUpDate || dueForLead(capturedAt, form.timeline),
        primaryLocation: form.accountProfile.primaryLocation || form.city,
      },
      productRecords: form.packagingNeeds.map((need) => demoProductForNeed(need, form.company)),
      misysProfile: {
        ...form.misysProfile,
        customerId: form.misysProfile.customerId || customerId(form.company),
        shipToName: form.misysProfile.shipToName || form.company,
        shippingAddress: form.misysProfile.shippingAddress || form.city,
        productionContact: form.misysProfile.productionContact || form.contact,
        itemDescription: form.misysProfile.itemDescription || form.packagingNeeds.join(', '),
      },
    })

    try {
      await insertLead(lead)
      const nextLocal = [lead, ...loadLocalLeads()]
      saveLocalLeads(nextLocal)
      setStatus('Thanks. Your information was sent to NexGen.')
      setSubmitted(true)
      setForm({ ...emptyLead, id: crypto.randomUUID(), showName: form.showName || 'Trade Show' })
    } catch {
      setStatus('Could not send from this device. Please try again or tell the NexGen team.')
    }
  }

  return (
    <main className="capture-screen" id="top">
      <button className="employee-link" type="button" onClick={onEmployee} aria-label="Employee portal">
        <Lock size={16} />
      </button>
      <header className="capture-brandbar">
        <img src={logoUrl} alt="NexGen Packaging" />
      </header>
      <section className="capture-hero">
        <div>
          <p className="eyebrow">NexGen Packaging</p>
          <h1>Tell us what you are packaging next.</h1>
          <p>Share a few details and the NexGen team will follow up with samples, specs, or a custom quote.</p>
        </div>
        <PackageCheck size={72} />
      </section>

      {submitted ? (
        <section className="capture-thank-you">
          <span>
            <CheckCircle2 size={34} />
          </span>
          <p className="eyebrow">Thank you</p>
          <h2>Your information was sent to NexGen.</h2>
          <p>Our team will review your packaging needs and follow up with samples, specs, or quote details.</p>
          <button className="primary-action" type="button" onClick={() => setSubmitted(false)}>
            <Plus size={18} /> Submit another contact
          </button>
        </section>
      ) : (
        <form className="lead-form" onSubmit={submitLead}>
          <div className="scan-card">
            <div>
              <p className="eyebrow">Smart Scan</p>
              <strong>Scan a business card to prefill contact details.</strong>
              <span>Take a clear photo, then review the fields before submitting.</span>
            </div>
            <label className="scan-button">
              <Camera size={18} /> Scan Card
              <input accept="image/*" capture="environment" type="file" onChange={scanCard} />
            </label>
            {scanStatus && <small>{scanStatus}</small>}
          </div>

          <div className="form-grid">
            <label>
              Company name
              <input required value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
            </label>
            <label>
              Contact name
              <input required value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} />
            </label>
            <label>
              Job title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label>
              Email
              <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label>
              City / State
              <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </label>
            <label>
              Trade show
              <input value={form.showName} onChange={(event) => setForm({ ...form, showName: event.target.value })} />
            </label>
            <label>
              Annual packaging volume
              <select required value={form.annualVolume} onChange={(event) => setForm({ ...form, annualVolume: event.target.value })}>
                <option value="">Select volume</option>
                {volumeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              Buying timeline
              <select required value={form.timeline} onChange={(event) => setForm({ ...form, timeline: event.target.value })}>
                <option value="">Select timeline</option>
                {timelineOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend>Packaging interest</legend>
            <div className="need-grid">
              {packagingNeeds.map((need) => (
                <button className={form.packagingNeeds.includes(need) ? 'need active' : 'need'} key={need} type="button" onClick={() => toggleNeed(need)}>
                  <CheckCircle2 size={17} /> {need}
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            Notes
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Current supplier, product dimensions, sustainability goals, sample requests..." />
          </label>
          <button className="primary-action" type="submit">
            <Send size={18} /> Send to NexGen
          </button>
          {status && <strong className="capture-status">{status}</strong>}
        </form>
      )}
    </main>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function SummaryItem({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`pipeline-summary-item ${className}`}>
      <small>{label}</small>
      <strong>{value || 'Not set'}</strong>
    </div>
  )
}

function ActivityTimeline({ lead }: { lead: Lead }) {
  const loggedItems = lead.activityLog.map((entry) => ({
    id: entry.id,
    label: entry.label,
    date: entry.date,
    detail: entry.detail,
  }))
  const legacyNote = lead.notes.trim() && lead.activityLog.length === 0 ? [{ id: 'legacy-note', label: 'Original note', date: lead.capturedAt, detail: lead.notes }] : []
  const items = [
    ...loggedItems,
    ...legacyNote,
    { label: 'Lead created', date: lead.capturedAt, detail: `Captured from ${lead.showName || 'trade show'}.` },
    { label: 'First follow-up due', date: lead.taskDue, detail: `${lead.taskType} should happen by ${formatDate(lead.taskDue)}.` },
    lead.sampleStatus !== 'Not Requested' ? { label: `Samples ${lead.sampleStatus.toLowerCase()}`, date: lead.taskDue, detail: 'Sample workflow is active for this customer.' } : null,
    lead.quoteStatus !== 'Not Started' ? { label: `Quote ${lead.quoteStatus.toLowerCase()}`, date: lead.taskDue, detail: 'Quote workflow is active for this customer.' } : null,
  ].filter(Boolean) as { id?: string; label: string; date: string; detail: string }[]

  return (
    <section className="detail-section timeline-section">
      <h3>Activity Timeline</h3>
      <div className="timeline-list">
        {items.map((item) => (
          <div className="timeline-item" key={item.id ?? `${item.label}-${item.detail}`}>
            <span />
            <div>
              <strong>{item.label}</strong>
              <small>{formatDate(item.date)}</small>
              <p>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function phaseForLead(lead: Lead) {
  if (lead.stage === 'Nurture') return 'Nurture'
  if (lead.stage === 'Won') return 'Setup'
  if (lead.stage === 'Quoted' || lead.quoteStatus !== 'Not Started') return 'Quote'
  if (lead.stage === 'Sample Sent' || lead.sampleStatus !== 'Not Requested') return 'Samples'
  if (lead.stage === 'Qualified') return 'Contacted'
  return 'Intake'
}

function statusLabel(stage: LeadStage) {
  return stage === 'New' ? 'New Lead' : stage
}

function dueForLead(capturedAt: string, timeline: string) {
  const captured = new Date(capturedAt || new Date())
  if (Number.isNaN(captured.getTime())) captured.setTime(Date.now())
  const offset: Record<string, number> = {
    ASAP: 1,
    '30-60 days': 4,
    'This quarter': 7,
    '6+ months': 30,
    Researching: 21,
  }
  captured.setDate(captured.getDate() + (offset[timeline] ?? 7))
  return captured.toISOString().slice(0, 10)
}

function dueClass(date: string) {
  const due = new Date(date)
  if (Number.isNaN(due.getTime())) return ''
  const current = new Date()
  current.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  if (due < current) return 'due-overdue'
  if (due.getTime() === current.getTime()) return 'due-today'
  return ''
}

function makeActivityEntry(label: string, detail: string, date = new Date().toISOString(), type: ActivityType = 'note'): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    detail,
    date,
  }
}

function appendNote(currentNotes: string, nextNote: string) {
  const trimmed = nextNote.trim()
  if (!trimmed) return currentNotes
  const stampedNote = `${formatDate(new Date().toISOString())}: ${trimmed}`
  return currentNotes.trim() ? `${currentNotes.trim()}\n\n${stampedNote}` : stampedNote
}

function normalizeActivityLog(value: unknown): ActivityEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const item = entry as Partial<ActivityEntry>
      return {
        id: String(item.id || crypto.randomUUID()),
        type: item.type === 'workflow' || item.type === 'system' ? item.type : 'note',
        label: String(item.label || 'Note added'),
        detail: String(item.detail || ''),
        date: String(item.date || new Date().toISOString()),
      }
    })
    .filter((entry): entry is ActivityEntry => Boolean(entry && entry.detail))
}

function normalizeCustomerProfile(value: unknown, lead: Partial<Lead> = {}): CustomerProfile {
  const profile = value && typeof value === 'object' ? (value as Partial<CustomerProfile>) : {}
  return {
    ...emptyCustomerProfile,
    ...profile,
    salesRep: String(profile.salesRep || lead.owner || emptyCustomerProfile.salesRep),
    topProducts: String(profile.topProducts || lead.packagingNeeds?.join(', ') || ''),
    nextFollowUpDate: String(profile.nextFollowUpDate || lead.taskDue || ''),
    primaryLocation: String(profile.primaryLocation || lead.city || ''),
    activeStatus: activeStatusOptions.includes(profile.activeStatus as ActiveStatus) ? (profile.activeStatus as ActiveStatus) : emptyCustomerProfile.activeStatus,
  }
}

function normalizeProductRecord(value: Partial<ProductRecord>): ProductRecord {
  const cost = Number(value.cost || 0)
  const sellPrice = Number(value.sellPrice || 0)
  const margin = Number(value.margin || (sellPrice > 0 ? Math.round(((sellPrice - cost) / sellPrice) * 100) : 0))
  return {
    ...emptyProductRecord,
    ...value,
    id: String(value.id || crypto.randomUUID()),
    cost,
    sellPrice,
    margin,
    stockType: stockTypeOptions.includes(value.stockType as StockType) ? (value.stockType as StockType) : emptyProductRecord.stockType,
    quoteStatus: ['Not Started', 'Needs Pricing', 'Drafting', 'Sent', 'Approved'].includes(value.quoteStatus || '') ? (value.quoteStatus as QuoteStatus) : emptyProductRecord.quoteStatus,
    jobStage: jobStageOptions.includes(value.jobStage || '') ? String(value.jobStage) : emptyProductRecord.jobStage,
  }
}

function normalizeProductCatalogItem(value: Partial<ProductCatalogItem>): ProductCatalogItem {
  const cost = Number(value.cost || 0)
  const sellPrice = Number(value.sellPrice || 0)
  const margin = Number(value.margin || (sellPrice > 0 ? Math.round(((sellPrice - cost) / sellPrice) * 100) : 0))
  return {
    ...emptyCatalogItem,
    ...value,
    id: String(value.id || crypto.randomUUID()),
    cost,
    sellPrice,
    margin,
    imagePath: String(value.imagePath || productImageForProduct({ category: value.category || '', productName: value.productName || '', imagePath: '' })),
    stockType: stockTypeOptions.includes(value.stockType as StockType) ? (value.stockType as StockType) : emptyCatalogItem.stockType,
    status: catalogStatusOptions.includes(value.status as CatalogStatus) ? (value.status as CatalogStatus) : emptyCatalogItem.status,
    updatedAt: String(value.updatedAt || new Date().toISOString()),
  }
}

function normalizeProductCatalog(value: unknown): ProductCatalogItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (entry && typeof entry === 'object' ? normalizeProductCatalogItem(entry as Partial<ProductCatalogItem>) : null))
    .filter((entry): entry is ProductCatalogItem => Boolean(entry))
}

function normalizeProductRecords(value: unknown): ProductRecord[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (entry && typeof entry === 'object' ? normalizeProductRecord(entry as Partial<ProductRecord>) : null))
    .filter((entry): entry is ProductRecord => Boolean(entry))
}

function normalizeLead(input: Partial<Lead>): Lead {
  const productRecords = normalizeProductRecords(input.productRecords)
  const shouldSeedProducts = productRecords.length === 0 && Boolean(input.company || input.packagingNeeds?.length)
  return {
    ...emptyLead,
    ...input,
    id: input.id || crypto.randomUUID(),
    taskDue: input.taskDue || dueForLead(input.capturedAt || new Date().toISOString(), input.timeline || ''),
    capturedAt: input.capturedAt || new Date().toISOString(),
    activityLog: normalizeActivityLog(input.activityLog),
    accountProfile: normalizeCustomerProfile(input.accountProfile, input),
    productRecords: shouldSeedProducts ? demoProductsForLead(input) : productRecords,
    misysProfile: { ...emptyMisys, ...(input.misysProfile ?? {}) },
  }
}

function readSession() {
  try {
    const raw = localStorage.getItem(sessionKey)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function loadLocalLeads() {
  try {
    const raw = localStorage.getItem(storageKey)
    return (raw ? JSON.parse(raw) : seedLeads).map(normalizeLead)
  } catch {
    return seedLeads
  }
}

function saveLocalLeads(leads: Lead[]) {
  localStorage.setItem(storageKey, JSON.stringify(leads))
}

function loadLocalProductCatalog() {
  try {
    const raw = localStorage.getItem(catalogStorageKey)
    return normalizeProductCatalog(raw ? JSON.parse(raw) : seedProductCatalog)
  } catch {
    return seedProductCatalog
  }
}

function saveLocalProductCatalog(catalog: ProductCatalogItem[]) {
  localStorage.setItem(catalogStorageKey, JSON.stringify(catalog))
}

async function supabaseRequest(path: string, options: RequestInit = {}, token?: string): Promise<unknown> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token ?? anonKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!response.ok) {
    const text = await response.text()
    const error = new Error(`Supabase request failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`) as Error & { status?: number }
    error.status = response.status
    throw error
  }
  if (response.status === 204) return undefined
  const text = await response.text()
  return text ? JSON.parse(text) : undefined
}

async function supabaseSignIn(email: string, password: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error('Unable to sign in.')
  return (await response.json()) as Session
}

async function supabaseRefreshSession(refreshToken: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!response.ok) {
    const error = new Error('Unable to refresh Supabase session.') as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return (await response.json()) as Session
}

async function supabaseSignOut(token: string) {
  await fetch(`${supabaseUrl}/auth/v1/logout`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  })
}

function isAuthError(error: unknown) {
  return error instanceof Error && ((error as Error & { status?: number }).status === 401 || error.message.includes('401'))
}

async function fetchLeads(token: string): Promise<Lead[]> {
  const rows = (await supabaseRequest('leads?select=*&order=captured_at.desc', {}, token)) as Record<string, unknown>[]
  return rows.map(fromSupabase)
}

async function fetchProductCatalog(token: string): Promise<ProductCatalogItem[]> {
  const rows = (await supabaseRequest('product_catalog?select=*&order=product_name.asc', {}, token)) as Record<string, unknown>[]
  return rows.map(fromProductCatalogSupabase)
}

async function insertLead(lead: Lead) {
  let lastError: unknown
  for (const row of supabasePayloadVariants(lead)) {
    try {
      await supabaseRequest('leads', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) })
      return
    } catch (error) {
      if (!isOptionalColumnError(error)) throw error
      lastError = error
    }
  }
  throw lastError
}

async function insertProductCatalogItem(product: ProductCatalogItem, token: string) {
  const rows = (await supabaseRequest('product_catalog', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(toProductCatalogSupabase(product)) }, token)) as Record<string, unknown>[]
  return fromProductCatalogSupabase(rows[0])
}

async function patchLead(lead: Lead, token: string) {
  let lastError: unknown
  for (const row of supabasePayloadVariants(lead)) {
    try {
      const rows = (await supabaseRequest(`leads?id=eq.${encodeURIComponent(lead.id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) }, token)) as Record<string, unknown>[]
      return fromSupabase(rows[0])
    } catch (error) {
      if (!isOptionalColumnError(error)) throw error
      lastError = error
    }
  }
  throw lastError
}

async function patchProductCatalogItem(product: ProductCatalogItem, token: string) {
  const rows = (await supabaseRequest(`product_catalog?id=eq.${encodeURIComponent(product.id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(toProductCatalogSupabase(product)) }, token)) as Record<string, unknown>[]
  return fromProductCatalogSupabase(rows[0])
}

function supabasePayloadVariants(lead: Lead) {
  return [
    toSupabase(lead, { includeMisys: true, includeActivity: true, includeAccount: true, includeProducts: true }),
    toSupabase(lead, { includeMisys: true, includeActivity: true, includeAccount: true, includeProducts: false }),
    toSupabase(lead, { includeMisys: true, includeActivity: true, includeAccount: false, includeProducts: true }),
    toSupabase(lead, { includeMisys: true, includeActivity: true, includeAccount: false, includeProducts: false }),
    toSupabase(lead, { includeMisys: true, includeActivity: false, includeAccount: true, includeProducts: true }),
    toSupabase(lead, { includeMisys: true, includeActivity: false, includeAccount: true, includeProducts: false }),
    toSupabase(lead, { includeMisys: false, includeActivity: true, includeAccount: true, includeProducts: true }),
    toSupabase(lead, { includeMisys: false, includeActivity: true, includeAccount: false, includeProducts: false }),
    toSupabase(lead, { includeMisys: false, includeActivity: false, includeAccount: false, includeProducts: false }),
  ]
}

function toProductCatalogSupabase(product: ProductCatalogItem) {
  return {
    id: product.id,
    sku: product.sku,
    product_name: product.productName,
    category: product.category,
    image_path: product.imagePath,
    material: product.material,
    dimensions: product.dimensions,
    case_pack: product.casePack,
    supplier: product.supplier,
    supplier_sku: product.supplierSku,
    cost: product.cost,
    sell_price: product.sellPrice,
    margin: product.margin,
    lead_time: product.leadTime,
    stock_type: product.stockType,
    status: product.status,
    notes: product.notes || null,
    updated_at: product.updatedAt || new Date().toISOString(),
  }
}

function fromProductCatalogSupabase(row: Record<string, unknown>): ProductCatalogItem {
  return normalizeProductCatalogItem({
    id: String(row.id ?? ''),
    sku: String(row.sku ?? ''),
    productName: String(row.product_name ?? ''),
    category: String(row.category ?? ''),
    imagePath: String(row.image_path ?? ''),
    material: String(row.material ?? ''),
    dimensions: String(row.dimensions ?? ''),
    casePack: String(row.case_pack ?? ''),
    supplier: String(row.supplier ?? ''),
    supplierSku: String(row.supplier_sku ?? ''),
    cost: Number(row.cost ?? 0),
    sellPrice: Number(row.sell_price ?? 0),
    margin: Number(row.margin ?? 0),
    leadTime: String(row.lead_time ?? ''),
    stockType: row.stock_type as StockType,
    status: row.status as CatalogStatus,
    notes: String(row.notes ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  })
}

function isOptionalColumnError(error: unknown) {
  return error instanceof Error && (error.message.includes('misys_profile') || error.message.includes('activity_log') || error.message.includes('account_profile') || error.message.includes('product_records'))
}

function toSupabase(lead: Lead, options: { includeMisys: boolean; includeActivity: boolean; includeAccount: boolean; includeProducts: boolean }) {
  const row: Record<string, unknown> = {
    id: lead.id,
    company: lead.company,
    contact: lead.contact,
    title: lead.title || null,
    email: lead.email,
    phone: lead.phone || null,
    city: lead.city || null,
    show_name: lead.showName,
    packaging_needs: lead.packagingNeeds,
    annual_volume: lead.annualVolume,
    timeline: lead.timeline,
    notes: lead.notes || null,
    stage: lead.stage,
    priority: lead.priority,
    owner: lead.owner,
    next_step: lead.nextStep,
    sample_status: lead.sampleStatus,
    quote_status: lead.quoteStatus,
    task_type: lead.taskType,
    task_due: lead.taskDue,
    captured_at: lead.capturedAt,
  }
  if (options.includeMisys) row.misys_profile = lead.misysProfile
  if (options.includeActivity) row.activity_log = lead.activityLog
  if (options.includeAccount) row.account_profile = lead.accountProfile
  if (options.includeProducts) row.product_records = lead.productRecords
  return row
}

function fromSupabase(row: Record<string, unknown>): Lead {
  return normalizeLead({
    id: String(row.id ?? ''),
    company: String(row.company ?? ''),
    contact: String(row.contact ?? ''),
    title: String(row.title ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    city: String(row.city ?? ''),
    showName: String(row.show_name ?? 'Trade Show'),
    packagingNeeds: Array.isArray(row.packaging_needs) ? row.packaging_needs.map(String) : [],
    annualVolume: String(row.annual_volume ?? ''),
    timeline: String(row.timeline ?? ''),
    notes: String(row.notes ?? ''),
    stage: (row.stage as LeadStage) ?? 'New',
    priority: (row.priority as LeadPriority) ?? 'Warm',
    owner: String(row.owner ?? 'Bradley'),
    nextStep: String(row.next_step ?? ''),
    sampleStatus: (row.sample_status as SampleStatus) ?? 'Not Requested',
    quoteStatus: (row.quote_status as QuoteStatus) ?? 'Not Started',
    taskType: (row.task_type as TaskType) ?? 'Email',
    taskDue: String(row.task_due ?? ''),
    capturedAt: String(row.captured_at ?? ''),
    activityLog: normalizeActivityLog(row.activity_log),
    accountProfile: normalizeCustomerProfile(row.account_profile, {
      owner: String(row.owner ?? 'Bradley'),
      packagingNeeds: Array.isArray(row.packaging_needs) ? row.packaging_needs.map(String) : [],
      taskDue: String(row.task_due ?? ''),
      city: String(row.city ?? ''),
    }),
    productRecords: normalizeProductRecords(row.product_records),
    misysProfile: (row.misys_profile as MisysProfile) ?? emptyMisys,
  })
}

function demoProductForLead(lead: Lead) {
  const need = lead.packagingNeeds[0] || 'Custom printed cups'
  return demoProductForNeed(need, lead.company)
}

function demoProductsForLead(input: Partial<Lead>): ProductRecord[] {
  const needs = input.packagingNeeds?.length ? input.packagingNeeds : ['Custom printed cups', 'Food containers', 'Retail packaging']
  return needs.flatMap((need) => demoProductSetForNeed(need, input.company || 'NexGen Customer')).slice(0, 6)
}

function demoProductSetForNeed(need: string, company: string): ProductRecord[] {
  const base = demoProductForNeed(need, company)
  const compactCompany = customerId(company || 'NEXGEN').slice(0, 4)
  const addOns: Record<string, Partial<ProductRecord>[]> = {
    'Custom printed cups': [
      {
        sku: `LID-${compactCompany}-16F`,
        productName: 'Flat clear cup lid',
        category: 'Custom printed cups',
        material: 'PET',
        dimensions: 'Fits 16 oz cup',
        casePack: '1,000/case',
        supplier: 'Midwest Cup Supply',
        supplierSku: 'MWC-LID16F',
        cost: 0.024,
        sellPrice: 0.041,
        leadTime: '14 days',
        stockType: 'Stocked',
        quoteQuantity: '100,000 units',
      },
      {
        sku: `SLV-${compactCompany}-CUP`,
        productName: 'Custom cup sleeve',
        category: 'Custom printed cups',
        material: 'Kraft paperboard',
        dimensions: '12-20 oz fit',
        casePack: '1,500/case',
        supplier: 'PaperWorks Midwest',
        supplierSku: 'PWM-SLV1220',
        cost: 0.038,
        sellPrice: 0.068,
        leadTime: '18 days',
        stockType: 'Custom',
        quoteQuantity: '75,000 sleeves',
      },
    ],
    'Food containers': [
      {
        sku: `BOWL-${compactCompany}-24`,
        productName: '24 oz fiber bowl',
        category: 'Food containers',
        material: 'Molded fiber',
        dimensions: '24 oz',
        casePack: '300/case',
        supplier: 'GreenPack Direct',
        supplierSku: 'GPD-BOWL24',
        cost: 0.128,
        sellPrice: 0.215,
        leadTime: '18 days',
        stockType: 'Stocked',
        quoteQuantity: '80,000 units',
      },
    ],
    'Pizza packaging': [
      {
        sku: `PBOX-${compactCompany}-12`,
        productName: '12 inch branded pizza box',
        category: 'Pizza packaging',
        material: 'B-flute corrugate',
        dimensions: '12 x 12 x 1.75 in',
        casePack: '100/bundle',
        supplier: 'Great Lakes Corrugate',
        supplierSku: 'GLC-PB12B',
        cost: 0.46,
        sellPrice: 0.72,
        leadTime: '28 days',
        stockType: 'Made-to-order',
        quoteQuantity: '80,000 boxes',
      },
      {
        sku: `LINER-${compactCompany}-12`,
        productName: 'Grease-resistant liner',
        category: 'Pizza packaging',
        material: 'Coated kraft',
        dimensions: '12 x 12 in',
        casePack: '2,000/case',
        supplier: 'PaperWorks Midwest',
        supplierSku: 'PWM-LIN12GR',
        cost: 0.031,
        sellPrice: 0.052,
        leadTime: '10 days',
        stockType: 'Stocked',
        quoteQuantity: '140,000 liners',
      },
    ],
    'Sustainable packaging': [
      {
        sku: `BAG-${compactCompany}-KRAFT`,
        productName: 'Printed kraft takeout bag',
        category: 'Sustainable packaging',
        material: 'Recycled kraft',
        dimensions: '12 x 7 x 14 in',
        casePack: '250/case',
        supplier: 'EcoCarry Supply',
        supplierSku: 'ECO-BAG1214',
        cost: 0.185,
        sellPrice: 0.31,
        leadTime: '21 days',
        stockType: 'Custom',
        quoteQuantity: '55,000 bags',
      },
    ],
    'Retail packaging': [
      {
        sku: `LBL-${compactCompany}-SEAL`,
        productName: 'Branded seal label',
        category: 'Retail packaging',
        material: 'Paper label stock',
        dimensions: '3 in round',
        casePack: '5,000/roll',
        supplier: 'LabelPro Chicago',
        supplierSku: 'LPC-SEAL3',
        cost: 0.018,
        sellPrice: 0.035,
        leadTime: '12 days',
        stockType: 'Custom',
        quoteQuantity: '150,000 labels',
      },
    ],
  }
  return [base, ...(addOns[need] ?? [])].map((product, index) =>
    normalizeProductRecord({
      ...emptyProductRecord,
      ...product,
      id: crypto.randomUUID(),
      margin: product.sellPrice && product.cost ? Math.round(((product.sellPrice - product.cost) / product.sellPrice) * 100) : 0,
      misysItemNumber: `MIS-${String(product.sku || compactCompany).replace(/[^A-Z0-9]/gi, '').slice(0, 12).toUpperCase()}`,
      quoteStatus: index === 0 ? 'Needs Pricing' : 'Drafting',
      jobStage: index === 0 ? 'Quote Requested' : 'Materials Check',
      materialStatus: index === 0 ? 'Needs review' : 'Supplier availability pending',
      supplierEta: addDays(10 + index * 4),
      bottleneckReason: index === 0 ? 'Confirm specs, supplier cost, and customer artwork before approval.' : 'Demo add-on line needs final supplier confirmation.',
    }),
  )
}

function demoProductForNeed(need: string, company: string): ProductRecord {
  const compactCompany = customerId(company || 'NEXGEN')
  const templates: Record<string, Partial<ProductRecord>> = {
    'Custom printed cups': {
      sku: `CUP-${compactCompany.slice(0, 4)}-16`,
      productName: '16 oz custom printed cup',
      category: 'Custom printed cups',
      material: 'PET',
      dimensions: '16 oz',
      casePack: '1,000/case',
      supplier: 'Midwest Cup Supply',
      supplierSku: 'MWC-16PET',
      cost: 0.075,
      sellPrice: 0.13,
      leadTime: '21 days',
      stockType: 'Custom',
    },
    'Food containers': {
      sku: `CONT-${compactCompany.slice(0, 4)}-32`,
      productName: '32 oz food container',
      category: 'Food containers',
      material: 'PP',
      dimensions: '32 oz',
      casePack: '500/case',
      supplier: 'Anchor Foodservice',
      supplierSku: 'AFS-32PP',
      cost: 0.16,
      sellPrice: 0.255,
      leadTime: '14 days',
      stockType: 'Stocked',
    },
    'Pizza packaging': {
      sku: `PBOX-${compactCompany.slice(0, 4)}-14`,
      productName: '14 inch branded pizza box',
      category: 'Pizza packaging',
      material: 'B-flute corrugate',
      dimensions: '14 x 14 x 1.75 in',
      casePack: '100/bundle',
      supplier: 'Great Lakes Corrugate',
      supplierSku: 'GLC-PB14B',
      cost: 0.54,
      sellPrice: 0.82,
      leadTime: '28 days',
      stockType: 'Made-to-order',
    },
  }
  const product = templates[need] ?? templates['Custom printed cups']
  return normalizeProductRecord({
    ...emptyProductRecord,
    ...product,
    id: crypto.randomUUID(),
    margin: product.sellPrice && product.cost ? Math.round(((product.sellPrice - product.cost) / product.sellPrice) * 100) : 0,
    misysItemNumber: `MIS-${String(product.sku || compactCompany).replace(/[^A-Z0-9]/gi, '').slice(0, 12).toUpperCase()}`,
    quoteQuantity: '100,000 units',
    quoteStatus: 'Needs Pricing',
    jobStage: 'Quote Requested',
    materialStatus: 'Needs review',
    supplierEta: addDays(14),
    bottleneckReason: 'Demo line: confirm specs, supplier cost, and customer artwork before approval.',
  })
}

function parseBusinessCard(text: string) {
  const lines = Array.from(
    new Set(
      text
        .split(/\r?\n/)
        .map((line) => line.replace(/[|•]/g, ' ').replace(/\s+/g, ' ').trim())
        .filter((line) => line.length > 1),
    ),
  )
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? ''
  const phone = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0] ?? ''
  const titleRegex = /owner|founder|president|director|manager|sales|procurement|buyer|operations|chef|ceo|coo|cfo|vp|partner/i
  const companyRegex = /llc|inc|corp|co\.|company|group|foods|restaurant|market|packaging|holdings|enterprises|solutions|industries|distribution/i
  const stateRegex = /\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\b/
  const cleanLines = lines.filter((line) => !line.includes('@') && !phone.includes(line) && !/www\.|https?:\/\//i.test(line))
  return {
    email,
    phone,
    contact:
      cleanLines.find((line) => {
        const parts = line.split(' ').filter(Boolean)
        return parts.length >= 2 && parts.length <= 4 && !titleRegex.test(line) && !companyRegex.test(line) && !/\d/.test(line)
      }) ?? '',
    title: cleanLines.find((line) => titleRegex.test(line)) ?? '',
    company: cleanLines.find((line) => companyRegex.test(line)) ?? cleanLines[0] ?? '',
    city: cleanLines.find((line) => stateRegex.test(line)) ?? '',
    rawText: lines.join('\n'),
  }
}

function makeEmailDraft(lead: Lead, template: string) {
  const firstName = lead.contact.split(' ')[0] || lead.contact
  const subjectMap: Record<string, string> = {
    'First follow-up': `Following up from ${lead.showName}`,
    Samples: `Sample options for ${lead.company}`,
    'Quote next step': `Quote next steps for ${lead.company}`,
    'Nurture check-in': `Checking in on packaging timing`,
  }
  const bodyMap: Record<string, string> = {
    'First follow-up': `Hi ${firstName},\n\nThanks for stopping by the NexGen booth. I wanted to follow up on your interest in ${lead.packagingNeeds.join(', ') || 'packaging options'} and confirm whether samples or a quote would be most helpful next.\n\nBest,\nNexGen Packaging`,
    Samples: `Hi ${firstName},\n\nI can pull together sample options for ${lead.company}. Can you confirm the best ship-to address and any size/material preferences?\n\nBest,\nNexGen Packaging`,
    'Quote next step': `Hi ${firstName},\n\nI am working through quote details for ${lead.company}. To tighten pricing, can you confirm expected volume, artwork needs, and delivery timing?\n\nBest,\nNexGen Packaging`,
    'Nurture check-in': `Hi ${firstName},\n\nJust checking in to see whether your packaging timing has changed since ${lead.showName}. Happy to revisit samples or pricing whenever helpful.\n\nBest,\nNexGen Packaging`,
  }
  return { subject: subjectMap[template] ?? '', body: bodyMap[template] ?? '' }
}

function buildMisysRows(leads: Lead[]) {
  const headers = [
    'Customer ID',
    'Company',
    'Contact',
    'Email',
    'Phone',
    'Customer Type',
    'Tax Status',
    'Freight Terms',
    'Default Warehouse',
    'Ship-to Name',
    'Shipping Address',
    'Billing Address',
    'Production Contact',
    'Target SKU',
    'Customer Part #',
    'Item Description',
    'Product Spec',
  ]
  const rows = leads.map((lead) => [
    lead.misysProfile.customerId || customerId(lead.company),
    lead.company,
    lead.contact,
    lead.email,
    lead.phone,
    lead.misysProfile.customerType,
    lead.misysProfile.taxStatus,
    lead.misysProfile.freightTerms,
    lead.misysProfile.defaultWarehouse,
    lead.misysProfile.shipToName || lead.company,
    lead.misysProfile.shippingAddress || lead.city,
    lead.misysProfile.billingAddress,
    lead.misysProfile.productionContact || lead.contact,
    lead.misysProfile.targetSku,
    lead.misysProfile.customerPartNumber,
    lead.misysProfile.itemDescription || lead.packagingNeeds.join('; '),
    lead.misysProfile.productSpec,
  ])
  return [headers, ...rows]
}

function topProductsForLead(lead: Lead, mode: ProductRankMode) {
  return [...lead.productRecords]
    .sort((a, b) => {
      const aUnits = quantityNumber(a.quoteQuantity)
      const bUnits = quantityNumber(b.quoteQuantity)
      const aValue = mode === 'dollars' ? a.sellPrice * aUnits : aUnits
      const bValue = mode === 'dollars' ? b.sellPrice * bUnits : bUnits
      return bValue - aValue
    })
    .slice(0, 3)
}

function productImageForProduct(product: { category: string; productName: string; imagePath?: string }) {
  if (product.imagePath) return product.imagePath
  const key = `${product.category} ${product.productName}`.toLowerCase()
  if (key.includes('pizza')) return '/product-images/pizza-box.png'
  if (key.includes('box')) return '/product-images/pizza-box.png'
  if (key.includes('lid')) return '/product-images/clear-lid.png'
  if (key.includes('cup') || key.includes('sleeve')) return '/product-images/clear-cup.png'
  if (key.includes('tray') || key.includes('container')) return '/product-images/fiber-tray.png'
  if (key.includes('bowl')) return '/product-images/fiber-bowl.png'
  if (key.includes('bag')) return '/product-images/kraft-bag.png'
  if (key.includes('liner')) return '/product-images/kraft-liner.png'
  if (key.includes('napkin')) return '/product-images/beverage-napkin.png'
  if (key.includes('label') || key.includes('sticker') || key.includes('seal')) return '/product-images/tamper-seal.png'
  return '/product-images/fiber-tray.png'
}

function imageLabel(path: string) {
  return path
    .split('/')
    .pop()
    ?.replace('.png', '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') ?? path
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(value: string) {
  return `"${String(value ?? '').replaceAll('"', '""').replaceAll('\n', ' ')}"`
}

function quantityNumber(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value || 0)
}

function formatUnitMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value || 0)
}

function formatUnits(value: number) {
  return `${new Intl.NumberFormat().format(Math.round(value || 0))} units`
}

function customerId(company: string) {
  return company.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export default App

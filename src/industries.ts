export type Industry = {
  id: string
  title: string
  shortDescription: string
  headline: string
  description: string
  needs: string[]
  productIds: string[]
}

export const industries: Industry[] = [
  {
    id: 'pizza-qsr',
    title: 'Pizza & QSR',
    shortDescription: 'Boxes, liners, cups, portion packaging, takeout containers, and coordinated branded programs.',
    headline: 'Packaging built around the menu—and the trip home.',
    description:
      'Bring pizza, sides, beverages, and delivery packaging into one program. NexGen can help define the right formats, coordinate print, and plan replenishment around store count and order volume.',
    needs: ['Delivery-focused structures', 'Coordinated menu packaging', 'Custom branding', 'Multi-location replenishment'],
    productIds: ['pizza-boxes', 'pizza-slice-boxes', 'pizza-box-liners', 'paper-beverage-cups', 'portion-control-cups', 'burger-sandwich-boxes'],
  },
  {
    id: 'deli-bakery-prepared-foods',
    title: 'Deli, Bakery & Prepared Foods',
    shortDescription: 'High-clarity trays, anti-fog options, hinged packs, food cups, bowls, and ready-meal formats.',
    headline: 'Package for the shelf, the service case, and the meal occasion.',
    description:
      'Prepared-food packaging has to merchandise well and fit the way food is packed, handled, displayed, and distributed. Start with the food and operating process, then narrow the container and lid program.',
    needs: ['Product visibility', 'Base-and-lid compatibility', 'Grab-and-go handling', 'Food-process fit'],
    productIds: ['vegetable-trays', 'paper-clamshells', 'plastic-deli-cups', 'plastic-dessert-cups', 'plastic-entree-containers', 'paper-food-cups'],
  },
  {
    id: 'convenience-foodservice',
    title: 'Convenience Foodservice',
    shortDescription: 'Grab-and-go cups, clamshells, portion packs, bottles, trays, and compact hot-food formats.',
    headline: 'Make grab-and-go packaging easier to choose and replenish.',
    description:
      'Convenience programs often mix beverages, prepared meals, snacks, sides, and hot-food items. NexGen can coordinate multiple formats into a practical supply program for fast-moving locations.',
    needs: ['Grab-and-go presentation', 'Mixed product programs', 'Compact footprints', 'Reliable replenishment'],
    productIds: ['plastic-beverage-cups', 'juice-bottles', 'portion-control-cups', 'paper-clamshells', 'pizza-slice-boxes', 'paper-food-trays'],
  },
  {
    id: 'takeout-delivery',
    title: 'Takeout & Delivery',
    shortDescription: 'Containers, bags, carriers, cups, cartons, and larger family-meal formats coordinated for off-premise orders.',
    headline: 'Build a packaging system for the full off-premise order.',
    description:
      'The package has to move from kitchen to customer while supporting presentation, order accuracy, and brand recognition. Assemble the primary container, beverage, sides, carryout, and accessory needs together.',
    needs: ['Order-level coordination', 'Carryout and handling', 'Brand consistency', 'Single and family meals'],
    productIds: ['paper-entree-containers', 'takeout-handle-boxes', 'family-pack-trays', 'ecotemp-takeout-bags', 'beverage-carriers', 'cutlery-kits'],
  },
  {
    id: 'food-processors',
    title: 'Food Processors',
    shortDescription: 'Trays, containers, bottles, lids, and custom programs considered alongside filling and packing operations.',
    headline: 'Start with the product, line, and distribution requirements.',
    description:
      'Processor packaging decisions depend on more than appearance. NexGen can help frame the container around filling, sealing, handling, packing, storage, and distribution before specifications are finalized.',
    needs: ['Filling and sealing fit', 'Repeatable specifications', 'Handling and packing', 'Private-label coordination'],
    productIds: ['plastic-entree-containers', 'vegetable-trays', 'meat-seafood-trays', 'juice-bottles', 'paper-food-cups', 'plastic-food-cups'],
  },
]

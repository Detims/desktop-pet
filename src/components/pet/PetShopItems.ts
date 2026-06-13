export type PetShopItem = {
    id: string
    name: string
    description: string
    price: number
    category: 'Food' | 'Drink' | 'Toy' | 'Care'
    effect: string
}

export const PET_SHOP_ITEMS: PetShopItem[] = [
  {
    id: 'apple',
    name: 'Apple',
    description: 'A simple snack for your pet.',
    price: 10,
    category: 'Food',
    effect: '+8 Hunger'
  },
  {
    id: 'water-bottle',
    name: 'Water Bottle',
    description: 'Clean water to keep your pet refreshed.',
    price: 8,
    category: 'Drink',
    effect: '+10 Thirst'
  },
  {
    id: 'ball',
    name: 'Bouncy Ball',
    description: 'A toy that improves mood.',
    price: 25,
    category: 'Toy',
    effect: '+12 Mood'
  },
  {
    id: 'blanket',
    name: 'Soft Blanket',
    description: 'Helps your pet rest.',
    price: 30,
    category: 'Care',
    effect: '+10 Energy'
  },
  {
    id: 'medicine',
    name: 'Medicine',
    description: 'Restores a little health.',
    price: 40,
    category: 'Care',
    effect: '+15 Health'
  }
]
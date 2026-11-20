export type ProductCategory =
  | 'baskets'
  | 'stationery'
  | 'snacks'
  | 'care'
  | 'tech';

export type ArtworkKind =
  | 'exam-basket'
  | 'night-owl-basket'
  | 'freshers-basket'
  | 'notebooks'
  | 'pen-set'
  | 'calculator'
  | 'coffee-pack'
  | 'noodles-snack'
  | 'electrolytes'
  | 'grooming-kit'
  | 'laundry-care'
  | 'cable-usb'
  | 'earphones'
  | 'desk-lamp';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  description: string;
  highlights: string[];
  price: number;
  mrp: number;
  unitLabel: string;
  artwork: ArtworkKind;
  imageUrl: string;
  imageFocus?: 'object-center' | 'object-left' | 'object-right';
  availability: string;
  rating: number;
  ordersCount: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface HostelOrder {
  id: string;
  docId?: string;
  createdAt: string;
  customerName: string;
  phone: string;
  hostelBlock: string;
  roomNumber: string;
  slot: string;
  paymentMethod: 'UPI' | 'Cash on Delivery';
  items: {name: string; quantity: number; price: number}[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: string;
}

export const HERO_IMAGE_URL = '/assets/products/hero-desk.jpg';

export const CATEGORIES: {id: 'all' | ProductCategory; label: string; shortLabel: string}[] = [
  {id: 'all', label: 'All Essentials', shortLabel: 'All (20)'},
  {id: 'baskets', label: '₹150–₹200 Baskets', shortLabel: 'Baskets'},
  {id: 'stationery', label: 'Books & Stationery', shortLabel: 'Stationery'},
  {id: 'snacks', label: 'Snacks & Drinks', shortLabel: 'Snacks'},
  {id: 'care', label: 'Personal Care', shortLabel: 'Care'},
  {id: 'tech', label: 'Tech Accessories', shortLabel: 'Tech'},
];

export const HOSTEL_BLOCKS = [
  'DGU MBA Hostel — Block A',
  'DGU MBA Hostel — Block B',
  'DGU Girls Hostel — Main Wing',
  'DGU PG Cluster (Within 2 km)',
];

export const DELIVERY_SLOTS = [
  '7:00 PM – 8:00 PM (Batch 1)',
  '8:00 PM – 9:00 PM (Batch 2)',
];

export const PRODUCTS: Product[] = [
  {
    id: 'basket-exam-prep',
    name: 'Exam Prep Essentials Basket',
    category: 'baskets',
    categoryLabel: 'Curated Basket',
    description: '5-subject A4 spiral notebook, 3 gel pens, highlighter & sticky tabs.',
    highlights: [
      'A4 5-subject spiral-bound register',
      '3 × waterproof 0.5mm gel pens (Black, Blue, Red)',
      'Chisel highlighter + color-coded sticky tabs',
    ],
    price: 159,
    mrp: 195,
    unitLabel: '6-item bundle',
    artwork: 'exam-basket',
    imageUrl: '/assets/products/basket-exam.jpg',
    availability: 'In Stock',
    rating: 4.9,
    ordersCount: '84 orders',
  },
  {
    id: 'basket-night-owl',
    name: 'Late-Night Study Fuel Pack',
    category: 'baskets',
    categoryLabel: 'Curated Basket',
    description: 'Instant coffee sachets, noodle cups, dark chocolate & roasted almonds.',
    highlights: [
      '4 × strong dark roast instant coffee sachets',
      '2 × quick-cook masala cup noodles',
      'Dark chocolate bar + roasted salted almonds (50g)',
    ],
    price: 175,
    mrp: 215,
    unitLabel: '8-item bundle',
    artwork: 'night-owl-basket',
    imageUrl: '/assets/products/basket-study-fuel.jpg',
    availability: 'In Stock',
    rating: 4.8,
    ordersCount: '110+ orders',
  },
  {
    id: 'basket-hostel-reset',
    name: 'Weekly Hostel Care Basket',
    category: 'baskets',
    categoryLabel: 'Curated Basket',
    description: 'Shampoo & conditioner bottles, herbal soap bar & pocket tissues.',
    highlights: [
      'Daily shampoo + nourishing conditioner (200ml each)',
      'Cold-pressed herbal bathing soap bar',
      '2 × pocket tissue packs for campus commute',
    ],
    price: 189,
    mrp: 230,
    unitLabel: '5-item bundle',
    artwork: 'freshers-basket',
    imageUrl: '/assets/products/basket-hostel-care.jpg',
    availability: 'In Stock',
    rating: 4.7,
    ordersCount: '52 orders',
  },
  {
    id: 'stat-a4-registers',
    name: 'Spiral A4 MBA Registers (Pack of 3)',
    category: 'stationery',
    categoryLabel: 'Books & Stationery',
    description: '180-page ruled notebooks for case notes, accounting & finance lectures.',
    highlights: [
      '70 GSM bright bleed-resistant paper',
      'Heavy-duty twin-wire spiral binding',
      'A4 size ideal for class handouts & case studies',
    ],
    price: 145,
    mrp: 180,
    unitLabel: 'Pack of 3',
    artwork: 'notebooks',
    imageUrl: '/assets/products/stat-notebooks.jpg',
    availability: 'In Stock',
    rating: 4.8,
    ordersCount: '65 orders',
  },
  {
    id: 'stat-highlighters',
    name: 'Chisel Highlighters & Fine Gel Pens',
    category: 'stationery',
    categoryLabel: 'Books & Stationery',
    description: '3 fluorescent chisel highlighters paired with smooth-flow black & blue pens.',
    highlights: [
      'Non-bleed chisel tip for textbooks & printouts',
      'Quick-dry smear-free ink formula',
      'Includes 3 smooth-writing ball/gel pens',
    ],
    price: 85,
    mrp: 110,
    unitLabel: '6-piece set',
    artwork: 'pen-set',
    imageUrl: '/assets/products/stat-highlighters.jpg',
    availability: 'In Stock',
    rating: 4.6,
    ordersCount: '90+ orders',
  },
  {
    id: 'stat-case-calculator',
    name: 'Casio 12-Digit Desktop Calculator',
    category: 'stationery',
    categoryLabel: 'Books & Stationery',
    description: 'Exam-permitted 12-digit dual-power calculator for finance & quantitative stats.',
    highlights: [
      'Solar + battery dual-power reliability',
      '12-digit angled high-contrast display',
      'Tactile keys with tax, % and memory recall',
    ],
    price: 199,
    mrp: 250,
    unitLabel: '1 unit',
    artwork: 'calculator',
    imageUrl: '/assets/products/stat-calculator.jpg',
    availability: 'Limited Stock',
    rating: 4.9,
    ordersCount: '41 orders',
  },
  {
    id: 'stat-sticky-notes',
    name: 'Multi-Color Sticky Notes & Index Tabs',
    category: 'stationery',
    categoryLabel: 'Books & Stationery',
    description: '400-sheet adhesive cube in 4 bright colors for textbook bookmarking.',
    highlights: [
      'Strong repositionable adhesive leaves zero residue',
      '4 color blocks for subject-wise indexing',
      '3×3 inch standard desk size',
    ],
    price: 69,
    mrp: 95,
    unitLabel: '400 sheets',
    artwork: 'notebooks',
    imageUrl: '/assets/products/stat-sticky-notes.jpg',
    availability: 'In Stock',
    rating: 4.7,
    ordersCount: '58 orders',
  },
  {
    id: 'snack-coffee',
    name: 'Dark Roast Instant Coffee Jar (100g)',
    category: 'snacks',
    categoryLabel: 'Snacks & Drinks',
    description: 'Rich freeze-dried Arabica instant coffee granules for quick hostel brews.',
    highlights: [
      'Makes ~50 strong cups of hot or iced coffee',
      'Dissolves instantly in hot kettle water or milk',
      'Airtight resealable pack',
    ],
    price: 120,
    mrp: 145,
    unitLabel: '100g pack',
    artwork: 'coffee-pack',
    imageUrl: '/assets/products/snack-coffee.jpg',
    availability: 'In Stock',
    rating: 4.8,
    ordersCount: '73 orders',
  },
  {
    id: 'snack-noodles',
    name: 'Midnight Masala Instant Noodles (Pack of 4)',
    category: 'snacks',
    categoryLabel: 'Snacks & Drinks',
    description: 'Quick-cook spicy masala noodles with dehydrated veggies — ready in 3 minutes.',
    highlights: [
      'Cooks fast in any electric hostel kettle',
      'Includes signature spice & vegetable seasoning',
      'Value 4-pack for hostel roommates',
    ],
    price: 140,
    mrp: 168,
    unitLabel: 'Pack of 4',
    artwork: 'noodles-snack',
    imageUrl: '/assets/products/snack-noodles.jpg',
    availability: 'In Stock',
    rating: 4.9,
    ordersCount: '130+ orders',
  },
  {
    id: 'snack-almonds',
    name: 'Roasted California Almonds (150g)',
    category: 'snacks',
    categoryLabel: 'Snacks & Drinks',
    description: 'Crunchy lightly salted whole almonds for brain fuel between classes.',
    highlights: [
      'High-protein study snack with zero added sugar',
      'Crisp dry-roasted whole kernels',
      'Zip-lock freshness pouch',
    ],
    price: 149,
    mrp: 185,
    unitLabel: '150g pouch',
    artwork: 'electrolytes',
    imageUrl: '/assets/products/snack-almonds.jpg',
    availability: 'In Stock',
    rating: 4.8,
    ordersCount: '64 orders',
  },
  {
    id: 'snack-chocolate',
    name: '70% Cocoa Dark Chocolate Bar (100g)',
    category: 'snacks',
    categoryLabel: 'Snacks & Drinks',
    description: 'Smooth rich 70% dark chocolate squares for late-night revision sessions.',
    highlights: [
      '70% single-origin roasted cocoa solids',
      'Low sugar, rich antioxidant profile',
      'Foil-sealed 100g sharing bar',
    ],
    price: 99,
    mrp: 130,
    unitLabel: '100g bar',
    artwork: 'coffee-pack',
    imageUrl: '/assets/products/snack-chocolate.jpg',
    availability: 'In Stock',
    rating: 4.9,
    ordersCount: '92 orders',
  },
  {
    id: 'snack-makhana',
    name: 'Roasted Masala Makhana (Fox Nuts, 80g)',
    category: 'snacks',
    categoryLabel: 'Snacks & Drinks',
    description: 'Crunchy popped lotus seeds seasoned with rock salt and black pepper.',
    highlights: [
      'Light, non-fried roasted hostel snack',
      'Seasoned with Himalayan pink salt & pepper',
      'Resealable 80g tub',
    ],
    price: 115,
    mrp: 145,
    unitLabel: '80g pack',
    artwork: 'noodles-snack',
    imageUrl: '/assets/products/snack-makhana.jpg',
    availability: 'In Stock',
    rating: 4.7,
    ordersCount: '47 orders',
  },
  {
    id: 'care-soap',
    name: 'Olive & Laurel Natural Soap (Pack of 2)',
    category: 'care',
    categoryLabel: 'Personal Care',
    description: 'Long-lasting plant-oil bathing bars gentle on skin in hard hostel water.',
    highlights: [
      'Traditional olive & bay laurel oil formulation',
      'No harsh sulfates or synthetic dyes',
      '2 × 150g dense long-lasting bars',
    ],
    price: 129,
    mrp: 160,
    unitLabel: '2 × 150g bars',
    artwork: 'grooming-kit',
    imageUrl: '/assets/products/care-soap.jpg',
    availability: 'In Stock',
    rating: 4.8,
    ordersCount: '37 orders',
  },
  {
    id: 'care-towels',
    name: 'Quick-Dry Cotton Hostel Towels (Set of 2)',
    category: 'care',
    categoryLabel: 'Personal Care',
    description: 'Absorbent combed cotton bath & hand towels that dry quickly on hostel racks.',
    highlights: [
      '100% soft combed cotton weave',
      'Fast-drying medium GSM thickness',
      'Includes 1 bath towel + 1 hand towel',
    ],
    price: 179,
    mrp: 225,
    unitLabel: 'Set of 2',
    artwork: 'laundry-care',
    imageUrl: '/assets/products/care-towels.jpg',
    availability: 'In Stock',
    rating: 4.7,
    ordersCount: '31 orders',
  },
  {
    id: 'care-toothbrush',
    name: 'Daily Oral Care Combo (Brush + Paste)',
    category: 'care',
    categoryLabel: 'Personal Care',
    description: 'Soft-bristle ergonomic toothbrush paired with 100g fresh mint toothpaste.',
    highlights: [
      'Ultra-soft tapered bristles for gentle cleaning',
      '100g fluoride mint freshness paste',
      'Includes hygienic travel brush cap',
    ],
    price: 95,
    mrp: 120,
    unitLabel: '2-piece combo',
    artwork: 'grooming-kit',
    imageUrl: '/assets/products/care-toothbrush.jpg',
    availability: 'In Stock',
    rating: 4.6,
    ordersCount: '49 orders',
  },
  {
    id: 'care-detergent',
    name: 'Liquid Laundry Wash Detergent (1L)',
    category: 'care',
    categoryLabel: 'Personal Care',
    description: 'Low-foam concentrated liquid wash suitable for bucket wash and hostel machines.',
    highlights: [
      'Protects formal MBA shirts and dark trousers',
      'Easy-pour measuring cap with zero powder residue',
      'Up to 25 washes per bottle',
    ],
    price: 145,
    mrp: 175,
    unitLabel: '1L bottle',
    artwork: 'laundry-care',
    imageUrl: '/assets/products/care-detergent.jpg',
    availability: 'In Stock',
    rating: 4.7,
    ordersCount: '44 orders',
  },
  {
    id: 'tech-usbc',
    name: 'Fast-Charge USB-C Data Cable (1.5m)',
    category: 'tech',
    categoryLabel: 'Tech Accessories',
    description: 'Reinforced aluminum-shell USB-C cable for phones, power banks & tablets.',
    highlights: [
      'Supports fast charging & 480Mbps data sync',
      'Reinforced strain-relief connectors',
      '1.5m length reaches comfortably from hostel sockets',
    ],
    price: 179,
    mrp: 249,
    unitLabel: '1.5m cable',
    artwork: 'cable-usb',
    imageUrl: '/assets/products/tech-usbc.jpg',
    availability: 'In Stock',
    rating: 4.8,
    ordersCount: '62 orders',
  },
  {
    id: 'tech-earbuds',
    name: 'Wireless Clear-Mic In-Ear Earbuds',
    category: 'tech',
    categoryLabel: 'Tech Accessories',
    description: 'Lightweight Bluetooth earbuds with ergonomic ear fins for calls & lectures.',
    highlights: [
      'Noise-isolating silicone tips + secure ear hooks',
      'Built-in mic for Zoom interviews & online classes',
      'Magnetic snap-together earbuds with 8h battery',
    ],
    price: 195,
    mrp: 299,
    unitLabel: '1 pair',
    artwork: 'earphones',
    imageUrl: '/assets/products/tech-earbuds.jpg',
    availability: 'In Stock',
    rating: 4.7,
    ordersCount: '57 orders',
  },
  {
    id: 'tech-lamp',
    name: 'Flexible Gooseneck Study Desk Lamp',
    category: 'tech',
    categoryLabel: 'Tech Accessories',
    description: 'Focused matte-black table lamp for late-night reading without disturbing roommates.',
    highlights: [
      '360° bendable neck directs light onto books only',
      'Sturdy weighted non-slip desk base',
      'Standard E27 warm LED bulb included',
    ],
    price: 185,
    mrp: 240,
    unitLabel: '1 desk lamp',
    artwork: 'desk-lamp',
    imageUrl: '/assets/products/tech-lamp.jpg',
    availability: 'In Stock',
    rating: 4.9,
    ordersCount: '54 orders',
  },
  {
    id: 'tech-extension',
    name: '6-Socket Surge-Protected Power Strip',
    category: 'tech',
    categoryLabel: 'Tech Accessories',
    description: 'Heavy-duty multi-outlet surge protector for laptops, lamps & phone chargers.',
    highlights: [
      '6 grounded outlets with master safety switch',
      'Built-in surge & overload circuit protection',
      '2m heavy-gauge cord for hostel bunk setups',
    ],
    price: 249,
    mrp: 320,
    unitLabel: '6-outlet strip',
    artwork: 'cable-usb',
    imageUrl: '/assets/products/tech-extension.jpg',
    availability: 'In Stock',
    rating: 4.9,
    ordersCount: '68 orders',
  },
];

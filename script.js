/**
 * Printelio - Custom Stationery Order Request Application
 * Integration: Google Sheets Transmission, jsPDF + html2canvas PDF Generation,
 * Dynamic Design Code Filtering, Mockup Preview, Dynamic Pricing & Cart Management.
 */

// ============================================================================
// 0. Google Sheets Web App Endpoint Configuration
// ============================================================================

const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyQ63JdM0NYWq62f1ps1yv3CH6WvjKBW4nnKtxeaLuglPb-zg171kAjerHR86Nnh5OmJQ/exec";

// ============================================================================
// 1. Data Models & Constants
// ============================================================================

// Exact A5 Notepad Design Codes
const A5_NOTEPAD_DESIGNS = [
  'Blue DP_A5',
  'Pink DP_A5',
  'Yellow DP_A5',
  'WP1_A5',
  'WP2_A5',
  'WP3_A5',
  'WP4_A5',
  'WP5_A5',
  'WP6_A5',
  'WP7_A5',
  'WP8_A5',
  'NP_NHD_A5_01',
  'NP_NHD_A5_02',
  'NP_NHD_A5_03'
];

// Product Catalog & Pricing Matrix
const PRODUCTS_DATA = {
  notepads: {
    categoryName: 'Notepads',
    hasSheets: true,
    isTba: false,
    sizes: [
      {
        id: 'np-square',
        name: 'Square Notepad (3 × 3 in) • 30 sheets',
        shortName: 'Square Notepad',
        dimensions: '3 × 3 in',
        prices: { '30': 39 },
        designs: [
          'NP_SQ_CAT01',
          'NP_SQ_CAT02',
          'NP_SQ_CAT03',
          'NP_SQ_CAT04',
          'NP_SQ_CAT05',
          'NP_SQ_CAT06',
          'NP_SQ_MEMO',
          'NP_SQ_MS_Blue',
          'NP_SQ_MS_Pink',
          'NP_SQ_MS_Purple',
          'NP_SQ_NOTES1',
          'NP_SQ_NOTES2',
          'NP_SQ01',
          'NP_SQ02',
          'NP_SQ03',
          'NP_SQ04',
          'NP_SQ05'
        ]
      },
      {
        id: 'np-a6',
        name: 'A6 Notepad (4 × 5.8 in) • 30 sheets',
        shortName: 'A6 Notepad',
        dimensions: '4 × 5.8 in',
        prices: { '30': 59 },
        designs: [
          'NP_A6_Cinnamoroll',
          'NP_A6_Flower',
          'NP_A6_HelloKitty',
          'NP_A6_Kuromi',
          'NP_A6_ToDoList',
          'NP_A6_Lemon',
          'NP_NHD_A6_01',
          'NP_NHD_A6_02',
          'NP_NHD_A6_03'
        ]
      },
      {
        id: 'np-a5',
        name: 'A5 Notepad (5.8 × 8.3 in) • 30 sheets',
        shortName: 'A5 Notepad',
        dimensions: '5.8 × 8.3 in',
        prices: { '30': 109 },
        designs: A5_NOTEPAD_DESIGNS
      }
    ]
  },
  notecards: {
    categoryName: 'Notecards',
    hasSheets: false,
    isTba: false,
    sizes: [
      {
        id: 'nc-portrait',
        name: '2 x 3.5 in (24 pcs per pack | 220 gsm | FREE PERSONALIZATION)',
        shortName: '2 x 3.5 in Notecard',
        dimensions: '2 × 3.5 in',
        prices: { '24': 89 },
        designs: [
          'NCP_BLOOM_01', 'NCP_BLOOM_02', 'NCP_BLOOM_03', 'NCP_BLOOM_04', 'NCP_BLOOM_05',
          'NCP_BLOOM_06', 'NCP_BLOOM_07', 'NCP_BLOOM_08', 'NCP_BLOOM_09', 'NCP_BLOOM_10'
        ]
      },
      {
        id: 'nc-landscape',
        name: '4 x 3 in (24 pcs per pack | 220 gsm | FREE PERSONALIZATION)',
        shortName: '4 x 3 in Notecard',
        dimensions: '4 × 3 in',
        prices: { '24': 129 },
        designs: [
          'NCL_BLOOM_01', 'NCL_BLOOM_02', 'NCL_BLOOM_03', 'NCL_BLOOM_04', 'NCL_BLOOM_05',
          'NCL_BLOOM_06', 'NCL_BLOOM_07', 'NCL_BLOOM_08', 'NCL_BLOOM_09', 'NCL_BLOOM_10'
        ]
      }
    ]
  },
  envelopes: {
    categoryName: 'Money Envelopes',
    hasSheets: false,
    isTba: true,
    sizes: [
      {
        id: 'me-standard',
        name: 'Standard Size (3.5 x 6.5 in)',
        shortName: 'Standard Money Envelope',
        dimensions: '3.5 × 6.5 in',
        prices: null,
        designs: ['ME-001', 'ME-002', 'ME-003', 'ME-004']
      }
    ]
  }
};

const CUSTOMIZATION_FEE = 0; // Personalization is now FREE on every product (kept at 0 for legacy code paths)

// ---------------------------------------------------------------------------
// Christmas promo: FREE 2×3.5 notecards. Set FREE_TAGS_PROMO_ON to false to switch it off.
// ---------------------------------------------------------------------------
const FREE_TAGS_PROMO_ON = true;
const FREE_TAG_TIERS = [   // highest tier first; based on the product total (shipping not included)
  { minTotal: 499, tags: 24 },
  { minTotal: 199, tags: 12 }
];
const PROMO_BANNER_TEXT = '🎁 FREE 2×3.5 notecards on orders ₱199+ · Available only until December 12';
const FREE_ITEM_NAME = '2×3.5 notecards';

// Money envelopes are sold per piece, minimum 5 pieces per order (premium and standard can be mixed).
const ENVELOPE_PRICES = { premium: 15, standard: 12 };
const ENVELOPE_MIN_PCS = 5;
const CHRISTMAS_COLLECTION_PRICE = 299.00; // ₱299.00 per complete Christmas Collection set

// ============================================================================
// 1b. Gallery Catalog & Category Specifications
// ============================================================================

const CATEGORY_SPECS = {
  'christmas': {
    title: 'Christmas Collection',
    specText: '🎄 Holiday Collection Set • 1 Notepad (30 sh) + 2 Notecards (48 pcs) + 5 Money Envelopes • FREE Personalization • ₱299.00 / set',
    price: CHRISTMAS_COLLECTION_PRICE,
    catalog: 'collections'
  },
  '3x3': {
    title: 'Square Notepad (3 × 3 in)',
    specText: '3 × 3 inches • 30 Sheets • FREE personalization • ₱39.00 / pad',
    price: 39.00,
    catalog: 'notepads'
  },
  'A6': {
    title: 'A6 Notepad (4 × 5.8 in)',
    specText: '4 × 5.8 inches • 30 Sheets • FREE personalization • ₱59.00 / pad',
    price: 59.00,
    catalog: 'notepads'
  },
  'A5': {
    title: 'A5 Notepad (5.8 × 8.3 in)',
    specText: '5.8 × 8.3 inches • 30 Sheets • FREE personalization • ₱109.00 / pad',
    price: 109.00,
    catalog: 'notepads'
  },
  '2x3.5': {
    title: '2 × 3.5 in Notecards (Portrait)',
    specText: '2 × 3.5 inches • 24 pcs / pack • 220 gsm • FREE PERSONALIZATION • ₱89.00 / pack',
    price: 89.00,
    catalog: 'notecards'
  },
  '4x3': {
    title: '4 × 3 in Notecards (Landscape)',
    specText: '4 × 3 inches • 24 pcs / pack • 220 gsm • FREE PERSONALIZATION • ₱129.00 / pack',
    price: 129.00,
    catalog: 'notecards'
  }
};

const DESIGN_TITLES = {
  // Christmas Collection
  'CC_00': 'Arctic',
  'CC_01': 'Poinsettia',
  'CC_02': 'Woodland',
  'CC_03': 'Pine',
  'CC_04': 'Cane',
  'CC_05': 'Peppermint',
  'CC_06': 'Mittens',
  'CC_07': 'Frosty',
  'CC_08': 'Bows',
  'CC_09': 'Dots',

  // Square Notepads (3x3)
  'NP_SQ_CAT01': 'Sunny Sitting Calico',
  'NP_SQ_CAT02': 'Dozing Dreamer',
  'NP_SQ_CAT03': 'Curious Calico',
  'NP_SQ_CAT04': 'Cozy Nap',
  'NP_SQ_CAT05': 'Paws Up Calico',
  'NP_SQ_CAT06': 'Sweet Smile',
  'NP_SQ_MEMO': 'Berry Checkerboard',
  'NP_SQ_MS_Blue': 'Blue Celestial',
  'NP_SQ_MS_Pink': 'Pink Celestial',
  'NP_SQ_MS_Purple': 'Lavender Celestial',
  'NP_SQ_NOTES1': 'Blooming Meadow',
  'NP_SQ_NOTES2': 'Pink Ribbon',
  'NP_SQ01': 'Lemon Zest',
  'NP_SQ02': 'Soft Bunny Dot',
  'NP_SQ03': 'Pixel & Heart Retro',
  'NP_SQ04': 'Cloudy Constellation',
  'NP_SQ05': 'Lavender Gingham',

  // A6 Notepads
  'NP_A6_Cinnamoroll': 'Cinnamoroll',
  'NP_A6_Flower': 'Blush Flora',
  'NP_A6_HelloKitty': 'Hello Kitty',
  'NP_A6_Kuromi': 'Kuromi',
  'NP_A6_ToDoList': 'Tulip Blossom',
  'NP_A6_Lemon': 'Lemony Fresh',
  'NP_NHD_A6_01': 'Vintage Parchment Scroll',
  'NP_NHD_A6_02': "Explorer's Parchment",
  'NP_NHD_A6_03': 'Gazette Botanical',

  // A5 Notepads
  'Blue DP_A5': 'Cloud Nine Daily',
  'Pink DP_A5': 'Sweet Rose Daily',
  'Yellow DP_A5': 'Sunshine Glow Daily',
  'WP1_A5': 'Pastel Weekly',
  'WP2_A5': 'Berry Bloom Weekly',
  'WP3_A5': 'Lavender Bloom Weekly',
  'WP4_A5': 'Peach Bloom Weekly',
  'WP5_A5': 'Garden Grid Weekly',
  'WP6_A5': 'Paws & Garden Weekly',
  'WP7_A5': 'Retro Rainbow Weekly',
  'WP8_A5': 'Lilac Monster Weekly',
  'NP_NHD_A5_01': 'Vintage Parchment Scroll',
  'NP_NHD_A5_02': "Explorer's Parchment",
  'NP_NHD_A5_03': 'Gazette Botanical',

  // Notecards 2x3.5 in (Portrait) - Bloomstead 01 to 10
  'NCP_BLOOM_01': 'Bloomstead 01',
  'NCP_BLOOM_02': 'Bloomstead 02',
  'NCP_BLOOM_03': 'Bloomstead 03',
  'NCP_BLOOM_04': 'Bloomstead 04',
  'NCP_BLOOM_05': 'Bloomstead 05',
  'NCP_BLOOM_06': 'Bloomstead 06',
  'NCP_BLOOM_07': 'Bloomstead 07',
  'NCP_BLOOM_08': 'Bloomstead 08',
  'NCP_BLOOM_09': 'Bloomstead 09',
  'NCP_BLOOM_10': 'Bloomstead 10',

  // Notecards 4x3 in (Landscape) - Bloomstead 01 to 10
  'NCL_BLOOM_01': 'Bloomstead 01',
  'NCL_BLOOM_02': 'Bloomstead 02',
  'NCL_BLOOM_03': 'Bloomstead 03',
  'NCL_BLOOM_04': 'Bloomstead 04',
  'NCL_BLOOM_05': 'Bloomstead 05',
  'NCL_BLOOM_06': 'Bloomstead 06',
  'NCL_BLOOM_07': 'Bloomstead 07',
  'NCL_BLOOM_08': 'Bloomstead 08',
  'NCL_BLOOM_09': 'Bloomstead 09',
  'NCL_BLOOM_10': 'Bloomstead 10'
};

const PRODUCT_CATALOG = [
  // 3x3 Notepads (Square 3 × 3 in, 30 sheets, ₱39.00, free personalization)
  {
    code: 'NP_SQ_CAT01',
    name: 'Sunny Sitting Calico',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Cat Series',
    motif: 'Playful Kitten with Whiskers'
  },
  {
    code: 'NP_SQ_CAT02',
    name: 'Dozing Dreamer',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Cat Series',
    motif: 'Sleepy Kitty Head'
  },
  {
    code: 'NP_SQ_CAT03',
    name: 'Curious Calico',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Cat Series',
    motif: 'Cat in Warm Cup'
  },
  {
    code: 'NP_SQ_CAT04',
    name: 'Cozy Nap',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Cat Series',
    motif: 'Calico Cat Stretching'
  },
  {
    code: 'NP_SQ_CAT05',
    name: 'Paws Up Calico',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Cat Series',
    motif: 'Curled Up Orange Tabby'
  },
  {
    code: 'NP_SQ_CAT06',
    name: 'Sweet Smile',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Cat Series',
    motif: 'Twin Kitties Silhouette'
  },
  {
    code: 'NP_SQ_MEMO',
    name: 'Berry Checkerboard',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Minimal Memo',
    motif: 'Clean Lined Memo Box'
  },
  {
    code: 'NP_SQ_MS_Blue',
    name: 'Blue Celestial',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Grid Note',
    motif: 'Soft Blue Grid Pattern'
  },
  {
    code: 'NP_SQ_MS_Pink',
    name: 'Pink Celestial',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Lined Note',
    motif: 'Blush Pink Lined Accent'
  },
  {
    code: 'NP_SQ_MS_Purple',
    name: 'Lavender Celestial',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Grid Note',
    motif: 'Soft Lavender Grid'
  },
  {
    code: 'NP_SQ_NOTES1',
    name: 'Blooming Meadow',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Botanical',
    motif: 'Hand-drawn Wildflowers'
  },
  {
    code: 'NP_SQ_NOTES2',
    name: 'Pink Ribbon',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Checklist',
    motif: 'Square Checkboxes & Lines'
  },
  {
    code: 'NP_SQ01',
    name: 'Lemon Zest',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Essential',
    motif: '5mm Engineering Grid'
  },
  {
    code: 'NP_SQ02',
    name: 'Soft Bunny Dot',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Dot Grid',
    motif: 'Subtle Dot Matrix'
  },
  {
    code: 'NP_SQ03',
    name: 'Pixel & Heart Retro',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Retro Style',
    motif: 'Vintage Serif Heading'
  },
  {
    code: 'NP_SQ04',
    name: 'Cloudy Constellation',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Lined Note',
    motif: 'Featherweight Lines'
  },
  {
    code: 'NP_SQ05',
    name: 'Lavender Gingham',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 39.00,
    tag: 'Aesthetic',
    motif: 'Rising Sun Minimal Art'
  },

  // A6 Notepads (4 × 5.8 in, 30 sheets, ₱59.00, free personalization)
  {
    code: 'NP_A6_Cinnamoroll',
    name: 'Cinnamoroll',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Character',
    motif: 'Fluffy Sky & Puppy Ears'
  },
  {
    code: 'NP_A6_Flower',
    name: 'Blush Flora',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Floral',
    motif: 'Elegantly Painted Blossom'
  },
  {
    code: 'NP_A6_HelloKitty',
    name: 'Hello Kitty',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Character',
    motif: 'Classic Red Bow & Whiskers'
  },
  {
    code: 'NP_A6_Kuromi',
    name: 'Kuromi',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Character',
    motif: 'Jester Skull & Purple Accents'
  },
  {
    code: 'NP_A6_ToDoList',
    name: 'Tulip Blossom',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'To-Do List',
    motif: 'Top 3 Tasks + Bullet Checklist'
  },
  {
    code: 'NP_A6_Lemon',
    name: 'Lemony Fresh',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Fruit Motif',
    motif: 'Watercolor Lemon Sprig'
  },
  {
    code: 'NP_NHD_A6_01',
    name: 'Vintage Parchment Scroll',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Vintage',
    motif: 'Parchment Scroll & Antique Script'
  },
  {
    code: 'NP_NHD_A6_02',
    name: "Explorer's Parchment",
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Vintage',
    motif: 'Aged Cartography & Explorer Motif'
  },
  {
    code: 'NP_NHD_A6_03',
    name: 'Gazette Botanical',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Botanical',
    motif: 'Vintage Newspaper & Botanical Flora'
  },

  // A5 Notepads (5.8 × 8.3 in, 30 sheets, ₱109.00, free personalization)
  {
    code: 'Blue DP_A5',
    name: 'Cloud Nine Daily',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Daily Planner',
    motif: 'Time Blocks & Priority Columns'
  },
  {
    code: 'Pink DP_A5',
    name: 'Sweet Rose Daily',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Daily Planner',
    motif: 'Schedule, Water Tracker & Notes'
  },
  {
    code: 'Yellow DP_A5',
    name: 'Sunshine Glow Daily',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Daily Planner',
    motif: 'Daily Goals & Affirmations'
  },
  {
    code: 'WP1_A5',
    name: 'Pastel Weekly',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Weekly Planner',
    motif: '7-Day Spread with Habit Loop'
  },
  {
    code: 'WP2_A5',
    name: 'Berry Bloom Weekly',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Weekly Planner',
    motif: 'Time Matrix Mon-Sun'
  },
  {
    code: 'WP3_A5',
    name: 'Lavender Bloom Weekly',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Weekly Planner',
    motif: 'Weekly Wins & Next Priorities'
  },
  {
    code: 'WP4_A5',
    name: 'Peach Bloom Weekly',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Weekly Planner',
    motif: 'Ultra Clean Grid Layout'
  },
  {
    code: 'WP5_A5',
    name: 'Garden Grid Weekly',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Weekly Planner',
    motif: 'Eisenhower Urgent/Important Quadrants'
  },
  {
    code: 'WP6_A5',
    name: 'Paws & Garden Weekly',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Weekly Planner',
    motif: 'Expanded Checklists for 7 Days'
  },
  {
    code: 'WP7_A5',
    name: 'Retro Rainbow Weekly',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Weekly Planner',
    motif: 'Bullet Journal Dot Columns'
  },
  {
    code: 'WP8_A5',
    name: 'Lilac Monster Weekly',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Weekly Planner',
    motif: 'Sprint Goals & Project Tracking'
  },
  {
    code: 'NP_NHD_A5_01',
    name: 'Vintage Parchment Scroll',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Vintage',
    motif: 'Parchment Scroll & Antique Script'
  },
  {
    code: 'NP_NHD_A5_02',
    name: "Explorer's Parchment",
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Vintage',
    motif: 'Aged Cartography & Explorer Motif'
  },
  {
    code: 'NP_NHD_A5_03',
    name: 'Gazette Botanical',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 109.00,
    tag: 'Botanical',
    motif: 'Vintage Newspaper & Botanical Flora'
  },

  // ==========================================================================
  // CHRISTMAS COLLECTION (1 Notepad + Notecards in 2 sizes + 5 Money Envelopes)
  // ==========================================================================
  {
    code: 'CC_00',
    name: 'Arctic',
    category: 'christmas',
    catalogType: 'collections',
    sizeName: 'Christmas Collection Set',
    dimensions: '1 A6 Notepad (30 sh) • 2 × 3.5 in Notecard Set (24 pcs) • 4 × 3 in Notecard Set (24 pcs) • 5 envelopes',
    sheets: 30,
    cardCount: 48,
    envelopeCount: 5,
    price: CHRISTMAS_COLLECTION_PRICE,
    freePersonalization: true,
    tag: 'Christmas Set',
    motif: 'Arctic Holiday Stationery Collection',
    isNewArrival: true,
    collection: 'christmas'
  },
  {
    code: 'CC_01',
    name: 'Poinsettia',
    category: 'christmas',
    catalogType: 'collections',
    sizeName: 'Christmas Collection Set',
    dimensions: '1 A6 Notepad (30 sh) • 2 × 3.5 in Notecard Set (24 pcs) • 4 × 3 in Notecard Set (24 pcs) • 5 envelopes',
    sheets: 30,
    cardCount: 48,
    envelopeCount: 5,
    price: CHRISTMAS_COLLECTION_PRICE,
    freePersonalization: true,
    tag: 'Christmas Set',
    motif: 'Poinsettia Holiday Stationery Collection',
    isNewArrival: true,
    collection: 'christmas'
  },
  {
    code: 'CC_02',
    name: 'Woodland',
    category: 'christmas',
    catalogType: 'collections',
    sizeName: 'Christmas Collection Set',
    dimensions: '1 A6 Notepad (30 sh) • 2 × 3.5 in Notecard Set (24 pcs) • 4 × 3 in Notecard Set (24 pcs) • 5 envelopes',
    sheets: 30,
    cardCount: 48,
    envelopeCount: 5,
    price: CHRISTMAS_COLLECTION_PRICE,
    freePersonalization: true,
    tag: 'Christmas Set',
    motif: 'Woodland Holiday Stationery Collection',
    isNewArrival: true,
    collection: 'christmas'
  },
  {
    code: 'CC_03',
    name: 'Pine',
    category: 'christmas',
    catalogType: 'collections',
    sizeName: 'Christmas Collection Set',
    dimensions: '1 A6 Notepad (30 sh) • 2 × 3.5 in Notecard Set (24 pcs) • 4 × 3 in Notecard Set (24 pcs) • 5 envelopes',
    sheets: 30,
    cardCount: 48,
    envelopeCount: 5,
    price: CHRISTMAS_COLLECTION_PRICE,
    freePersonalization: true,
    tag: 'Christmas Set',
    motif: 'Pine Holiday Stationery Collection',
    isNewArrival: true,
    collection: 'christmas'
  },
  {
    code: 'CC_04',
    name: 'Cane',
    category: 'christmas',
    catalogType: 'collections',
    sizeName: 'Christmas Collection Set',
    dimensions: '1 A6 Notepad (30 sh) • 2 × 3.5 in Notecard Set (24 pcs) • 4 × 3 in Notecard Set (24 pcs) • 5 envelopes',
    sheets: 30,
    cardCount: 48,
    envelopeCount: 5,
    price: CHRISTMAS_COLLECTION_PRICE,
    freePersonalization: true,
    tag: 'Christmas Set',
    motif: 'Cane Holiday Stationery Collection',
    isNewArrival: true,
    collection: 'christmas'
  },
  {
    code: 'CC_05',
    name: 'Peppermint',
    category: 'christmas',
    catalogType: 'collections',
    sizeName: 'Christmas Collection Set',
    dimensions: '1 A6 Notepad (30 sh) • 2 × 3.5 in Notecard Set (24 pcs) • 4 × 3 in Notecard Set (24 pcs) • 5 envelopes',
    sheets: 30,
    cardCount: 48,
    envelopeCount: 5,
    price: CHRISTMAS_COLLECTION_PRICE,
    freePersonalization: true,
    tag: 'Christmas Set',
    motif: 'Peppermint Holiday Stationery Collection',
    isNewArrival: true,
    collection: 'christmas'
  },
  {
    code: 'CC_06',
    name: 'Mittens',
    category: 'christmas',
    catalogType: 'collections',
    sizeName: 'Christmas Collection Set',
    dimensions: '1 A6 Notepad (30 sh) • 2 × 3.5 in Notecard Set (24 pcs) • 4 × 3 in Notecard Set (24 pcs) • 5 envelopes',
    sheets: 30,
    cardCount: 48,
    envelopeCount: 5,
    price: CHRISTMAS_COLLECTION_PRICE,
    freePersonalization: true,
    tag: 'Christmas Set',
    motif: 'Mittens Holiday Stationery Collection',
    isNewArrival: true,
    collection: 'christmas'
  },
  {
    code: 'CC_07',
    name: 'Frosty',
    category: 'christmas',
    catalogType: 'collections',
    sizeName: 'Christmas Collection Set',
    dimensions: '1 A6 Notepad (30 sh) • 2 × 3.5 in Notecard Set (24 pcs) • 4 × 3 in Notecard Set (24 pcs) • 5 envelopes',
    sheets: 30,
    cardCount: 48,
    envelopeCount: 5,
    price: CHRISTMAS_COLLECTION_PRICE,
    freePersonalization: true,
    tag: 'Christmas Set',
    motif: 'Frosty Holiday Stationery Collection',
    isNewArrival: true,
    collection: 'christmas'
  },
  {
    code: 'CC_08',
    name: 'Bows',
    category: 'christmas',
    catalogType: 'collections',
    sizeName: 'Christmas Collection Set',
    dimensions: '1 A6 Notepad (30 sh) • 2 × 3.5 in Notecard Set (24 pcs) • 4 × 3 in Notecard Set (24 pcs) • 5 envelopes',
    sheets: 30,
    cardCount: 48,
    envelopeCount: 5,
    price: CHRISTMAS_COLLECTION_PRICE,
    freePersonalization: true,
    tag: 'Christmas Set',
    motif: 'Bows Holiday Stationery Collection',
    isNewArrival: true,
    collection: 'christmas'
  },
  {
    code: 'CC_09',
    name: 'Dots',
    category: 'christmas',
    catalogType: 'collections',
    sizeName: 'Christmas Collection Set',
    dimensions: '1 A6 Notepad (30 sh) • 2 × 3.5 in Notecard Set (24 pcs) • 4 × 3 in Notecard Set (24 pcs) • 5 envelopes',
    sheets: 30,
    cardCount: 48,
    envelopeCount: 5,
    price: CHRISTMAS_COLLECTION_PRICE,
    freePersonalization: true,
    tag: 'Christmas Set',
    motif: 'Dots Holiday Stationery Collection',
    isNewArrival: true,
    collection: 'christmas'
  },

  // ==========================================================================
  // NOTECARDS: 2x3.5 inches (24 pcs per pack | 220 gsm | FREE PERSONALIZATION) - ₱89
  // ==========================================================================
  {
    code: 'NCP_BLOOM_01',
    name: 'Bloomstead 01',
    category: '2x3.5',
    catalogType: 'notecards',
    sizeName: '2×3.5 in Notecards',
    dimensions: '2 × 3.5 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 89.00,
    tag: 'Botanical',
    motif: 'Bloomstead Wildflower Garland 01',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCP_BLOOM_02',
    name: 'Bloomstead 02',
    category: '2x3.5',
    catalogType: 'notecards',
    sizeName: '2×3.5 in Notecards',
    dimensions: '2 × 3.5 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 89.00,
    tag: 'Botanical',
    motif: 'Bloomstead Wildflower Garland 02',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCP_BLOOM_03',
    name: 'Bloomstead 03',
    category: '2x3.5',
    catalogType: 'notecards',
    sizeName: '2×3.5 in Notecards',
    dimensions: '2 × 3.5 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 89.00,
    tag: 'Botanical',
    motif: 'Bloomstead Wildflower Garland 03',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCP_BLOOM_04',
    name: 'Bloomstead 04',
    category: '2x3.5',
    catalogType: 'notecards',
    sizeName: '2×3.5 in Notecards',
    dimensions: '2 × 3.5 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 89.00,
    tag: 'Botanical',
    motif: 'Bloomstead Wildflower Garland 04',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCP_BLOOM_05',
    name: 'Bloomstead 05',
    category: '2x3.5',
    catalogType: 'notecards',
    sizeName: '2×3.5 in Notecards',
    dimensions: '2 × 3.5 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 89.00,
    tag: 'Botanical',
    motif: 'Bloomstead Wildflower Garland 05',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCP_BLOOM_06',
    name: 'Bloomstead 06',
    category: '2x3.5',
    catalogType: 'notecards',
    sizeName: '2×3.5 in Notecards',
    dimensions: '2 × 3.5 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 89.00,
    tag: 'Botanical',
    motif: 'Bloomstead Wildflower Garland 06',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCP_BLOOM_07',
    name: 'Bloomstead 07',
    category: '2x3.5',
    catalogType: 'notecards',
    sizeName: '2×3.5 in Notecards',
    dimensions: '2 × 3.5 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 89.00,
    tag: 'Botanical',
    motif: 'Bloomstead Wildflower Garland 07',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCP_BLOOM_08',
    name: 'Bloomstead 08',
    category: '2x3.5',
    catalogType: 'notecards',
    sizeName: '2×3.5 in Notecards',
    dimensions: '2 × 3.5 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 89.00,
    tag: 'Botanical',
    motif: 'Bloomstead Wildflower Garland 08',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCP_BLOOM_09',
    name: 'Bloomstead 09',
    category: '2x3.5',
    catalogType: 'notecards',
    sizeName: '2×3.5 in Notecards',
    dimensions: '2 × 3.5 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 89.00,
    tag: 'Botanical',
    motif: 'Bloomstead Wildflower Garland 09',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCP_BLOOM_10',
    name: 'Bloomstead 10',
    category: '2x3.5',
    catalogType: 'notecards',
    sizeName: '2×3.5 in Notecards',
    dimensions: '2 × 3.5 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 89.00,
    tag: 'Botanical',
    motif: 'Bloomstead Wildflower Garland 10',
    isNewArrival: true,
    collection: 'bloomstead'
  },

  // ==========================================================================
  // NOTECARDS: 4x3 inches (24 pcs per pack | 220 gsm | FREE PERSONALIZATION) - ₱129
  // ==========================================================================
  {
    code: 'NCL_BLOOM_01',
    name: 'Bloomstead 01',
    category: '4x3',
    catalogType: 'notecards',
    sizeName: '4×3 in Notecards',
    dimensions: '4 × 3 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 129.00,
    tag: 'Botanical',
    motif: 'Bloomstead Botanical Landscape 01',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCL_BLOOM_02',
    name: 'Bloomstead 02',
    category: '4x3',
    catalogType: 'notecards',
    sizeName: '4×3 in Notecards',
    dimensions: '4 × 3 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 129.00,
    tag: 'Botanical',
    motif: 'Bloomstead Botanical Landscape 02',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCL_BLOOM_03',
    name: 'Bloomstead 03',
    category: '4x3',
    catalogType: 'notecards',
    sizeName: '4×3 in Notecards',
    dimensions: '4 × 3 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 129.00,
    tag: 'Botanical',
    motif: 'Bloomstead Botanical Landscape 03',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCL_BLOOM_04',
    name: 'Bloomstead 04',
    category: '4x3',
    catalogType: 'notecards',
    sizeName: '4×3 in Notecards',
    dimensions: '4 × 3 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 129.00,
    tag: 'Botanical',
    motif: 'Bloomstead Botanical Landscape 04',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCL_BLOOM_05',
    name: 'Bloomstead 05',
    category: '4x3',
    catalogType: 'notecards',
    sizeName: '4×3 in Notecards',
    dimensions: '4 × 3 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 129.00,
    tag: 'Botanical',
    motif: 'Bloomstead Botanical Landscape 05',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCL_BLOOM_06',
    name: 'Bloomstead 06',
    category: '4x3',
    catalogType: 'notecards',
    sizeName: '4×3 in Notecards',
    dimensions: '4 × 3 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 129.00,
    tag: 'Botanical',
    motif: 'Bloomstead Botanical Landscape 06',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCL_BLOOM_07',
    name: 'Bloomstead 07',
    category: '4x3',
    catalogType: 'notecards',
    sizeName: '4×3 in Notecards',
    dimensions: '4 × 3 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 129.00,
    tag: 'Botanical',
    motif: 'Bloomstead Botanical Landscape 07',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCL_BLOOM_08',
    name: 'Bloomstead 08',
    category: '4x3',
    catalogType: 'notecards',
    sizeName: '4×3 in Notecards',
    dimensions: '4 × 3 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 129.00,
    tag: 'Botanical',
    motif: 'Bloomstead Botanical Landscape 08',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCL_BLOOM_09',
    name: 'Bloomstead 09',
    category: '4x3',
    catalogType: 'notecards',
    sizeName: '4×3 in Notecards',
    dimensions: '4 × 3 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 129.00,
    tag: 'Botanical',
    motif: 'Bloomstead Botanical Landscape 09',
    isNewArrival: true,
    collection: 'bloomstead'
  },
  {
    code: 'NCL_BLOOM_10',
    name: 'Bloomstead 10',
    category: '4x3',
    catalogType: 'notecards',
    sizeName: '4×3 in Notecards',
    dimensions: '4 × 3 in',
    sheets: 24,
    cardCount: 24,
    gsm: 220,
    freePersonalization: true,
    price: 129.00,
    tag: 'Botanical',
    motif: 'Bloomstead Botanical Landscape 10',
    isNewArrival: true,
    collection: 'bloomstead'
  }
];

// ============================================================================
// 2. Application State
// ============================================================================

const appState = {
  currentCatalog: 'collections',
  activeGalleryTab: 'christmas', // 'christmas' (default), '3x3', 'A6', 'A5', '2x3.5', '4x3'
  currentCategory: 'notepads',
  selectedSizeId: 'np-square',
  selectedSheetCount: '30',
  selectedDesignCode: '',
  isCustomized: false,
  customText: '',
  quantity: 1,
  cart: [],
  customer: {
    fullName: '',
    contactNumber: '',
    socialHandle: '',
    courier: '',
    address: '',
    payment: '',
    orderType: '',
    isCustomMade: false,
    customDimensions: '',
    customSheetCount: 30,
    customInstructions: ''
  }
};

// ============================================================================
// 3. DOM Elements Cache
// ============================================================================

const DOM = {
  // Gallery Section & Category Tabs Navigation
  gallerySection: document.getElementById('gallerySection'),
  gallerySectionTitle: document.getElementById('gallerySectionTitle'),
  gallerySectionSubtitle: document.getElementById('gallerySectionSubtitle'),
  catalogModeSwitcher: document.getElementById('catalogModeSwitcher'),
  btnCatalogCollections: document.getElementById('btnCatalogCollections'),
  btnCatalogNotepads: document.getElementById('btnCatalogNotepads'),
  btnCatalogNotecards: document.getElementById('btnCatalogNotecards'),
  btnCatalogEnvelopes: document.getElementById('btnCatalogEnvelopes'),
  btnMobileCatalogEnvelopes: document.getElementById('btnMobileCatalogEnvelopes'),
  btnCatalogHardbound: document.getElementById('btnCatalogHardbound'),
  btnMobileCatalogHardbound: document.getElementById('btnMobileCatalogHardbound'),
  categoryTabsContainer: document.getElementById('categoryTabsContainer'),
  categoryTabs: document.querySelectorAll('#categoryTabs .tab-btn'),
  tabChristmas: document.getElementById('tabChristmas'),
  tab3x3: document.getElementById('tab3x3'),
  tabA6: document.getElementById('tabA6'),
  tabA5: document.getElementById('tabA5'),
  tab2x35: document.getElementById('tab2x35'),
  tab4x3: document.getElementById('tab4x3'),
  categorySpecPill: document.getElementById('categorySpecPill'),
  categorySpecIcon: document.getElementById('categorySpecIcon'),
  categorySpecText: document.getElementById('categorySpecText'),
  productGalleryGrid: document.getElementById('productGalleryGrid'),

  // Custom CTA Banner & Section
  customOrderCtaBanner: document.getElementById('customOrderCtaBanner'),
  btnOpenCustomOrder: document.getElementById('btnOpenCustomOrder'),
  btnCloseCustomSection: document.getElementById('btnCloseCustomSection'),
  btnBackToCatalog: document.getElementById('btnBackToCatalog'),
  customOrderingSection: document.getElementById('customOrderingSection'),
  customTermsBanner: document.getElementById('customTermsBanner'),
  customSectionTitle: document.getElementById('customSectionTitle'),
  selectCustomCategory: document.getElementById('selectCustomCategory'),
  labelCustomSize: document.getElementById('labelCustomSize'),
  labelCustomCount: document.getElementById('labelCustomCount'),
  customTermsList: document.getElementById('customTermsList'),

  // Header Actions
  btnHeaderCustom: document.getElementById('btnHeaderCustom'),
  btnHeaderCart: document.getElementById('btnHeaderCart'),
  headerCartCount: document.getElementById('headerCartCount'),

  // Mobile Navigation Drawer Controls
  btnMobileMenuToggle: document.getElementById('btnMobileMenuToggle'),
  btnMobileNavClose: document.getElementById('btnMobileNavClose'),
  mobileNavDrawer: document.getElementById('mobileNavDrawer'),
  mobileNavBackdrop: document.getElementById('mobileNavBackdrop'),
  btnMobileCatalogCollections: document.getElementById('btnMobileCatalogCollections'),
  btnMobileCatalogNotepads: document.getElementById('btnMobileCatalogNotepads'),
  btnMobileCatalogNotecards: document.getElementById('btnMobileCatalogNotecards'),
  btnMobileCustomOrder: document.getElementById('btnMobileCustomOrder'),

  // Product Selection Card & Groups (Legacy / fallback references)
  productSelectionCard: document.getElementById('productSelectionCard'),
  sizeOptionsContainer: document.getElementById('sizeOptionsContainer'),
  designSelectionBox: document.getElementById('designSelectionBox'),
  itemActionBar: document.getElementById('itemActionBar'),
  tabNotepads: document.getElementById('tabNotepads'),
  tabNotecards: document.getElementById('tabNotecards'),
  tabEnvelopes: document.getElementById('tabEnvelopes'),
  categoryBadge: document.getElementById('categoryBadge'),
  sizeCardsGrid: document.getElementById('sizeCardsGrid'),
  sheetCountGroup: document.getElementById('sheetCountGroup'),
  radioSheet30: document.getElementById('radioSheet30'),
  radioSheet50: document.getElementById('radioSheet50'),
  selectDesignCode: document.getElementById('selectDesignCode'),
  designDescriptionText: document.getElementById('designDescriptionText'),
  designPreviewCaption: document.getElementById('designPreviewCaption'),
  designMockupImg: document.getElementById('designMockupImg'),
  customizationContainer: document.getElementById('customizationContainer'),
  checkCustomization: document.getElementById('checkCustomization'),
  customInputsCollapse: document.getElementById('customInputsCollapse'),
  inputCustomText: document.getElementById('inputCustomText'),
  currentUnitPrice: document.getElementById('currentUnitPrice'),
  currentPriceBreakdown: document.getElementById('currentPriceBreakdown'),
  inputQuantity: document.getElementById('inputQuantity'),
  btnQtyMinus: document.getElementById('btnQtyMinus'),
  btnQtyPlus: document.getElementById('btnQtyPlus'),
  btnAddToCart: document.getElementById('btnAddToCart'),
  standardOrderingSection: document.getElementById('standardOrderingSection'),
  productCardTitle: document.getElementById('productCardTitle'),
  productCardSubtitle: document.getElementById('productCardSubtitle'),

  // Custom Made Form Controls & 1:1 Live Preview (Preserved)
  selectCustomNotepadSize: document.getElementById('selectCustomNotepadSize'),
  inputCustomSheetCount: document.getElementById('inputCustomSheetCount'),
  textareaCustomInstructions: document.getElementById('textareaCustomInstructions'),
  customSizeRateHint: document.getElementById('customSizeRateHint'),
  customSheetCountHint: document.getElementById('customSheetCountHint'),
  customMockupPreviewWrapper: document.getElementById('customMockupPreviewWrapper'),
  customPreviewSizeBadge: document.getElementById('customPreviewSizeBadge'),
  customPreviewSheetsBadge: document.getElementById('customPreviewSheetsBadge'),
  customPreviewInstructionsText: document.getElementById('customPreviewInstructionsText'),
  customPreviewPriceTag: document.getElementById('customPreviewPriceTag'),
  customUnitPriceDisplay: document.getElementById('customUnitPriceDisplay'),
  customPriceBreakdownDisplay: document.getElementById('customPriceBreakdownDisplay'),
  inputCustomQuantity: document.getElementById('inputCustomQuantity'),
  btnCustomQtyMinus: document.getElementById('btnCustomQtyMinus'),
  btnCustomQtyPlus: document.getElementById('btnCustomQtyPlus'),
  btnAddCustomToCart: document.getElementById('btnAddCustomToCart'),

  // Checkout Section & Customer Form
  checkoutSection: document.getElementById('checkoutSection'),
  customerDetailsCard: document.getElementById('customerDetailsCard'),
  customerForm: document.getElementById('customerForm'),
  inputFullName: document.getElementById('inputFullName'),
  inputContactNumber: document.getElementById('inputContactNumber'),
  inputSocialHandle: document.getElementById('inputSocialHandle'),
  selectCourier: document.getElementById('selectCourier'),
  inputAddress: document.getElementById('inputAddress'),
  selectPayment: document.getElementById('selectPayment'),
  selectOrderType: document.getElementById('selectOrderType'),
  customMadeContainer: document.getElementById('customMadeContainer'),
  inputCustomDimensions: document.getElementById('inputCustomDimensions'),
  
  // Cart & Order Summary
  emptyCartState: document.getElementById('emptyCartState'),
  cartItemsList: document.getElementById('cartItemsList'),
  cartCountBadge: document.getElementById('cartCountBadge'),
  summarySubtotalAmount: document.getElementById('summarySubtotalAmount'),
  summaryCourierDisplay: document.getElementById('summaryCourierDisplay'),
  summaryPaymentDisplay: document.getElementById('summaryPaymentDisplay'),
  summaryOrderTypeDisplay: document.getElementById('summaryOrderTypeDisplay'),
  summaryGrandTotal: document.getElementById('summaryGrandTotal'),
  btnSubmitOrder: document.getElementById('btnSubmitOrder'),
  
  // Modal & Slip Elements
  jobOrderModal: document.getElementById('jobOrderModal'),
  printableJobOrderSlip: document.getElementById('printableJobOrderSlip'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnDownloadPdf: document.getElementById('btnDownloadPdf') || document.getElementById('btnDownloadImage'),
  btnDoneOrder: document.getElementById('btnDoneOrder'),
  joReferenceNumber: document.getElementById('joReferenceNumber'),
  joDateGenerated: document.getElementById('joDateGenerated'),
  joCustomerName: document.getElementById('joCustomerName'),
  joCustomerContact: document.getElementById('joCustomerContact'),
  joCustomerSocial: document.getElementById('joCustomerSocial'),
  joCourier: document.getElementById('joCourier'),
  joCustomerAddress: document.getElementById('joCustomerAddress'),
  joPayment: document.getElementById('joPayment'),
  joOrderType: document.getElementById('joOrderType'),
  joCustomMadeDetailsRow: document.getElementById('joCustomMadeDetailsRow'),
  joCustomMadeDetails: document.getElementById('joCustomMadeDetails'),
  joTableBody: document.getElementById('joTableBody'),
  joModalGrandTotal: document.getElementById('joModalGrandTotal'),
  paymentInstructionsText: document.getElementById('paymentInstructionsText'),
  toastContainer: document.getElementById('toastContainer'),

  // Image Preview Lightbox Modal Elements
  imageLightboxModal: document.getElementById('imageLightboxModal'),
  imageLightboxBackdrop: document.getElementById('imageLightboxBackdrop'),
  btnCloseImageLightbox: document.getElementById('btnCloseImageLightbox'),
  imageLightboxContainer: document.getElementById('imageLightboxContainer'),
  imageLightboxContent: document.getElementById('imageLightboxContent'),
  lightboxPreviewImage: document.getElementById('lightboxPreviewImage'),
  lightboxCaption: document.getElementById('lightboxCaption'),
  lightboxCode: document.getElementById('lightboxCode'),
  lightboxTitle: document.getElementById('lightboxTitle')
};

// ============================================================================
// 3b. Product Gallery Grid, SVG Mockups & Tab Filtering
// ============================================================================

function getProductMockupSvg(code, name, category, tag) {
  // Check for Notecards
  if (category === '2x3.5' || code.startsWith('NCP_')) {
    const notecardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
  <defs>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#faf8f5"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#1b1822" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="320" height="320" fill="#f4f0ec"/>
  <g filter="url(#cardShadow)">
    <rect x="70" y="24" width="180" height="272" rx="6" fill="url(#cardGrad)" stroke="#e4dbce" stroke-width="1.5"/>
    <rect x="76" y="30" width="168" height="260" rx="4" fill="none" stroke="#d5c7b3" stroke-width="1" stroke-dasharray="3,3"/>
    
    <!-- Top Header -->
    <text x="160" y="52" font-family="Raleway, -apple-system, sans-serif" font-size="8" font-weight="800" fill="#9b8579" text-anchor="middle" letter-spacing="1.5">PRINTELIO • NOTECARD</text>
    
    <!-- Floral Motif & Code -->
    <circle cx="160" cy="106" r="30" fill="#7bc794" fill-opacity="0.18"/>
    <text x="160" y="118" font-size="32" text-anchor="middle">🌸</text>
    
    <text x="160" y="158" font-family="Playfair Display, Georgia, serif" font-size="15" font-weight="700" fill="#1b1822" text-anchor="middle">${name}</text>
    <text x="160" y="176" font-family="Raleway, -apple-system, sans-serif" font-size="10" font-weight="800" fill="#756f86" text-anchor="middle" letter-spacing="1">${code}</text>

    <!-- Botanical Lines -->
    <line x1="96" y1="196" x2="224" y2="196" stroke="#d5c7b3" stroke-width="1"/>
    <line x1="110" y1="210" x2="210" y2="210" stroke="#e8dfd2" stroke-width="1"/>
    <line x1="124" y1="224" x2="196" y2="224" stroke="#e8dfd2" stroke-width="1"/>

    <!-- Bottom Specs -->
    <rect x="86" y="252" width="148" height="20" rx="10" fill="#ede5d8"/>
    <text x="160" y="266" font-family="Raleway, -apple-system, sans-serif" font-size="8" font-weight="800" fill="#585268" text-anchor="middle">2×3.5 in • 24 pcs • 220 gsm</text>
  </g>
</svg>`.trim();
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(notecardSvg).replace(/'/g, '%27');
  }

  if (category === '4x3' || code.startsWith('NCL_')) {
    const notecardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
  <defs>
    <linearGradient id="cardGradL" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#faf8f5"/>
    </linearGradient>
    <filter id="cardShadowL" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#1b1822" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="320" height="320" fill="#f4f0ec"/>
  <g filter="url(#cardShadowL)">
    <rect x="25" y="52" width="270" height="216" rx="6" fill="url(#cardGradL)" stroke="#e4dbce" stroke-width="1.5"/>
    <rect x="31" y="58" width="258" height="204" rx="4" fill="none" stroke="#d5c7b3" stroke-width="1" stroke-dasharray="3,3"/>
    
    <!-- Top Header -->
    <text x="160" y="78" font-family="Raleway, -apple-system, sans-serif" font-size="8.5" font-weight="800" fill="#9b8579" text-anchor="middle" letter-spacing="1.5">PRINTELIO • NOTECARD (LANDSCAPE)</text>
    
    <!-- Floral Motif & Code -->
    <circle cx="80" cy="148" r="28" fill="#7bc794" fill-opacity="0.18"/>
    <text x="80" y="160" font-size="30" text-anchor="middle">🌸</text>
    
    <text x="126" y="140" font-family="Playfair Display, Georgia, serif" font-size="16" font-weight="700" fill="#1b1822">${name}</text>
    <text x="126" y="160" font-family="Raleway, -apple-system, sans-serif" font-size="10" font-weight="800" fill="#756f86" letter-spacing="1">${code}</text>
    <text x="126" y="178" font-family="Raleway, -apple-system, sans-serif" font-size="9" font-weight="700" fill="#2d6a4f">✨ FREE PERSONALIZATION INCLUDED</text>

    <!-- Bottom Specs -->
    <rect x="45" y="222" width="230" height="22" rx="11" fill="#ede5d8"/>
    <text x="160" y="237" font-family="Raleway, -apple-system, sans-serif" font-size="9" font-weight="800" fill="#585268" text-anchor="middle">4×3 in • 24 pcs / pack • 220 gsm Cardstock</text>
  </g>
</svg>`.trim();
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(notecardSvg).replace(/'/g, '%27');
  }

  // Check for Christmas Collections
  if (category === 'christmas' || code.startsWith('CC_')) {
    const christmasSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
  <defs>
    <linearGradient id="xmasGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fff8f8"/>
    </linearGradient>
    <filter id="xmasShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#1b1822" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="320" height="320" fill="#fcf4f4"/>
  
  <g filter="url(#xmasShadow)">
    <rect x="28" y="26" width="264" height="268" rx="10" fill="url(#xmasGrad)" stroke="#eed5d5" stroke-width="1.5"/>
    <rect x="28" y="26" width="264" height="28" rx="6" fill="#1b1822"/>
    
    <!-- Top Header -->
    <text x="160" y="45" font-family="Raleway, -apple-system, sans-serif" font-size="9.5" font-weight="800" fill="#ffde59" text-anchor="middle" letter-spacing="1.5">
      PRINTELIO • CHRISTMAS COLLECTION
    </text>
    
    <!-- Holiday Badge & Motif -->
    <circle cx="68" cy="88" r="22" fill="#c9184a" fill-opacity="0.15"/>
    <text x="68" y="96" font-size="22" text-anchor="middle">🎄</text>
    
    <text x="100" y="80" font-family="Raleway, -apple-system, sans-serif" font-size="8.5" font-weight="800" fill="#c9184a" letter-spacing="1">
      HOLIDAY COLLECTION SET
    </text>
    <text x="100" y="98" font-family="Playfair Display, Georgia, serif" font-size="16" font-weight="700" fill="#1b1822">
      ${name}
    </text>
    <text x="100" y="113" font-family="Raleway, -apple-system, sans-serif" font-size="10" font-weight="800" fill="#756f86" letter-spacing="1">
      ${code}
    </text>

    <!-- Collection Contents Checklist -->
    <rect x="42" y="126" width="236" height="96" rx="8" fill="#ffffff" stroke="#f0e2e2" stroke-width="1"/>
    <text x="54" y="146" font-family="Raleway, -apple-system, sans-serif" font-size="8.5" font-weight="700" fill="#2d6a4f">✓ 1 Notepad (30 sheets)</text>
    <text x="54" y="166" font-family="Raleway, -apple-system, sans-serif" font-size="8.5" font-weight="700" fill="#2d6a4f">✓ Notecards in 2 sizes (24 pcs each)</text>
    <text x="54" y="186" font-family="Raleway, -apple-system, sans-serif" font-size="8.5" font-weight="700" fill="#2d6a4f">✓ 5 Money Envelopes</text>
    <text x="54" y="206" font-family="Raleway, -apple-system, sans-serif" font-size="8.5" font-weight="800" fill="#b241ce">✨ FREE Personalization Included</text>

    <!-- Bottom Specs Pill -->
    <rect x="42" y="234" width="236" height="26" rx="6" fill="#f8f4f9" stroke="#e8d8ee" stroke-width="1"/>
    <text x="160" y="251" font-family="Raleway, -apple-system, sans-serif" font-size="9.5" font-weight="800" fill="#721c8a" text-anchor="middle">
      Complete Christmas Stationery Set
    </text>
  </g>
</svg>`.trim();
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(christmasSvg).replace(/'/g, '%27');
  }

  let headerColor = '#cb6ce6';
  let accentBadge = '#ffde59';
  let iconEmoji = '📝';

  if (tag.includes('Teacher') || code.includes('_TD')) {
    iconEmoji = '🍎';
    headerColor = '#e76f51';
  } else if (tag.includes('Christmas') || code.startsWith('CC_')) {
    iconEmoji = '🎄';
    headerColor = '#c9184a';
  } else if (tag.includes('Cat')) {
    iconEmoji = '🐱';
    headerColor = '#f5b597';
  } else if (tag.includes('Character')) {
    iconEmoji = '🎀';
    headerColor = '#ea98b7';
  } else if (tag.includes('Floral') || tag.includes('Botanical')) {
    iconEmoji = '🌸';
    headerColor = '#7bc794';
  } else if (tag.includes('Vintage')) {
    iconEmoji = '📜';
    headerColor = '#d4a373';
  } else if (tag.includes('Fruit')) {
    iconEmoji = '🍋';
    headerColor = '#fcd05b';
  } else if (tag.includes('Planner') || tag.includes('Checklist')) {
    iconEmoji = '📅';
    headerColor = '#80a3dc';
  } else if (tag.includes('Grid') || tag.includes('Essential')) {
    iconEmoji = '📐';
    headerColor = '#9a8bc4';
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f6f5fb"/>
    </linearGradient>
    <filter id="padShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#1b1822" flood-opacity="0.10"/>
    </filter>
  </defs>
  <rect width="320" height="320" fill="#f3effa"/>
  
  <g filter="url(#padShadow)">
    <rect x="36" y="24" width="248" height="272" rx="8" fill="url(#bgGrad)" stroke="#ded9ec" stroke-width="1.5"/>
    
    <!-- Glued Binding Spine -->
    <rect x="36" y="24" width="248" height="26" rx="4" fill="#241e2f"/>
    <line x1="36" y1="50" x2="284" y2="50" stroke="#120e1a" stroke-width="2"/>
    
    <!-- Paper Sheet Brand Header -->
    <text x="160" y="41" font-family="Raleway, -apple-system, sans-serif" font-size="10" font-weight="800" fill="${accentBadge}" text-anchor="middle" letter-spacing="1.5">
      PRINTELIO • ${category.toUpperCase()}
    </text>

    <!-- Motif Icon & Category Tag -->
    <circle cx="64" cy="76" r="16" fill="${headerColor}" fill-opacity="0.25"/>
    <text x="64" y="82" font-size="16" text-anchor="middle">${iconEmoji}</text>

    <text x="90" y="74" font-family="Raleway, -apple-system, sans-serif" font-size="9" font-weight="700" fill="#756f86" letter-spacing="1">
      ${tag.toUpperCase()}
    </text>
    <text x="90" y="89" font-family="Raleway, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#1b1822">
      ${code}
    </text>

    <!-- Stationery Ruling / Grid Pattern -->
    <line x1="56" y1="114" x2="264" y2="114" stroke="#e6e2f0" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="56" y1="138" x2="264" y2="138" stroke="#ece8f5" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="56" y1="162" x2="264" y2="162" stroke="#ece8f5" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="56" y1="186" x2="264" y2="186" stroke="#ece8f5" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="56" y1="210" x2="264" y2="210" stroke="#ece8f5" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="56" y1="234" x2="264" y2="234" stroke="#ece8f5" stroke-width="1.2" stroke-linecap="round"/>
    
    <!-- Checklist boxes -->
    <rect x="56" y="130" width="10" height="10" rx="2" fill="none" stroke="#cdc5e2" stroke-width="1.2"/>
    <rect x="56" y="154" width="10" height="10" rx="2" fill="none" stroke="#cdc5e2" stroke-width="1.2"/>
    <rect x="56" y="178" width="10" height="10" rx="2" fill="none" stroke="#cdc5e2" stroke-width="1.2"/>
    <rect x="56" y="202" width="10" height="10" rx="2" fill="none" stroke="#cdc5e2" stroke-width="1.2"/>

    <!-- Bottom Page Footer Bar -->
    <rect x="48" y="260" width="224" height="24" rx="5" fill="#f4f1fa"/>
    <text x="60" y="276" font-family="Raleway, -apple-system, sans-serif" font-size="10" font-weight="700" fill="#585268">30 Sheets • 1-Side Print</text>
    <text x="260" y="276" font-family="Raleway, -apple-system, sans-serif" font-size="11" font-weight="800" fill="#1b1822" text-anchor="end">Printelio</text>
  </g>
</svg>`.trim();

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg).replace(/'/g, '%27');
}

function isProductNewArrival(product) {
  if (!product) return false;
  if (product.isNewArrival) return true;
  if (product.collection === 'christmas' || product.collection === 'teachers-day' || product.collection === 'bloomstead') return true;
  if (product.code && (product.code.startsWith('CC_') || product.code.includes('_TD') || product.code.includes('BLOOM'))) return true;
  return false;
}


// Wedding envelope catalog: independent manual sliders and order configurations.
const WEDDING_ENVELOPE_GROUPS = [
  { id: 'monogram', title: 'Wedding 1 Designs', codes: ['WME_00','WME_01','WME_02','WME_03','WME_04'] },
  { id: 'wedding', title: 'Wedding 2 Designs', codes: ['WME_05','WME_06','WME_07','WME_08'] },
  { id: 'christmas', title: 'Christmas Designs', codes: ['CME_00','CME_01','CME_02','CME_03','CME_04','CME_05','CME_06','CME_07','CME_08','CME_09'] }
];
const WEDDING_ENVELOPE_TITLES = {
  WME_00:'Timeless', WME_01:'Modern', WME_02:'Devotion', WME_03:'Tranquility', WME_04:'Elegance',
  WME_05:'Bliss', WME_06:'Serenity', WME_07:'Celebration', WME_08:'Romance',
  CME_00:DESIGN_TITLES.CC_00, CME_01:DESIGN_TITLES.CC_01,
  CME_02:DESIGN_TITLES.CC_02, CME_03:DESIGN_TITLES.CC_03,
  CME_04:DESIGN_TITLES.CC_04, CME_05:DESIGN_TITLES.CC_05,
  CME_06:DESIGN_TITLES.CC_06, CME_07:DESIGN_TITLES.CC_07,
  CME_08:DESIGN_TITLES.CC_08, CME_09:DESIGN_TITLES.CC_09
};

// After an item is added, clear the name box so the same design can be added again for someone else.
const ADD_ANOTHER_LABEL = '+ Add another with a different name';
function readyForAnotherName(button, nameInput) {
  if (nameInput) {
    nameInput.value = '';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (button) button.textContent = ADD_ANOTHER_LABEL;
}

// Live character counter for slider name boxes (".wme-counted" input + ".wme-char-count" in the same form).
document.addEventListener('input', (e) => {
  const el = e.target;
  if (!el || !el.classList || !el.classList.contains('wme-counted')) return;
  const form = el.closest('.wme-form');
  const counter = form ? form.querySelector('.wme-char-count') : null;
  if (!counter) return;
  counter.textContent = `${el.value.length}/${el.maxLength}`;
  counter.classList.toggle('at-limit', el.value.length >= el.maxLength);
});

function renderWeddingEnvelopeGallery() {
  if (!DOM.productGalleryGrid) return;
  DOM.productGalleryGrid.innerHTML = '';
  DOM.productGalleryGrid.classList.add('wme-gallery');
  WEDDING_ENVELOPE_GROUPS.forEach(group => {
    const card = document.createElement('article');
    card.className = 'product-card wme-card';
    card.innerHTML = `
      <div class="wme-heading"><h3>${group.title}</h3><span>${group.codes.length} designs</span></div>
      <div class="wme-preview">
        <button type="button" class="wme-arrow wme-prev" aria-label="Previous design">‹</button>
        <button type="button" class="wme-image-button" aria-label="Enlarge selected design"><img class="wme-image" src="images/${group.codes[0]}.webp" alt="${WEDDING_ENVELOPE_TITLES[group.codes[0]]}" loading="lazy"></button>
        <button type="button" class="wme-arrow wme-next" aria-label="Next design">›</button>
      </div>
      <div class="wme-selected" aria-live="polite"></div>
      <div class="wme-thumbnails" aria-label="Choose envelope design"></div>
      <div class="wme-form">
        <div class="wme-section-label">Paper</div>
        <div class="wme-paper-options">
          <label><input type="radio" name="paper_${group.id}" value="premium" checked> Premium 108 gsm · ₱${ENVELOPE_PRICES.premium}</label>
          <label><input type="radio" name="paper_${group.id}" value="standard"> Standard 80 gsm · ₱${ENVELOPE_PRICES.standard}</label>
        </div>
        ${group.id === 'monogram' ? '<label class="wme-field">Monogram (2 letters, free) <input class="wme-monogram" maxlength="2" placeholder="e.g. JM" autocomplete="off" required></label>' : ''}
        <label class="wme-field">${group.id === 'christmas' ? 'Names (free, 1 or 2 names)' : 'Names (free)'} <input class="wme-names" maxlength="100" placeholder="${group.id === 'christmas' ? 'e.g. Julia or Julia & Marco' : 'e.g. Julia & Marco'}" autocomplete="off" required></label>
        ${group.id === 'christmas' ? '' : '<label class="wme-field">Wedding date <input class="wme-date" maxlength="80" placeholder="e.g. December 12, 2026" autocomplete="off" required></label>'}
        <p class="wme-error" role="alert" hidden></p>
      </div>
      <div class="product-card-footer">
        <div class="product-card-footer-top"><div><div class="product-price wme-price">₱${ENVELOPE_PRICES.premium.toFixed(2)}</div><small>per envelope</small></div>
          <div class="card-qty-stepper"><button type="button" class="card-qty-btn wme-minus" aria-label="Decrease pieces">−</button><input class="card-qty-input wme-qty" type="number" min="1" max="200" value="${ENVELOPE_MIN_PCS}" aria-label="Number of envelopes"><button type="button" class="card-qty-btn wme-plus" aria-label="Increase pieces">+</button></div>
        </div><button type="button" class="btn-card-add wme-add">+ Add to Cart</button>
      </div>`;
    let index = 0;
    const image = card.querySelector('.wme-image');
    const title = card.querySelector('.wme-selected');
    const thumbs = card.querySelector('.wme-thumbnails');
    const price = card.querySelector('.wme-price');
    const qty = card.querySelector('.wme-qty');
    const error = card.querySelector('.wme-error');
    const selectedPaper = () => card.querySelector(`input[name="paper_${group.id}"]:checked`).value;
    const unitPrice = () => ENVELOPE_PRICES[selectedPaper()];
    function selectDesign(next, revealThumbnail = false) {
      index = (next + group.codes.length) % group.codes.length;
      const addButton = card.querySelector('.wme-add'); if (addButton) addButton.textContent = '+ Add to Cart';
      const code = group.codes[index];
      image.src = `images/${code}.webp`;
      image.alt = WEDDING_ENVELOPE_TITLES[code];
      title.textContent = `${WEDDING_ENVELOPE_TITLES[code]} (${code}) · ${index + 1} of ${group.codes.length}`;
      [...thumbs.children].forEach((button, i) => {
        button.classList.toggle('active', i === index);
        button.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
      // Keep the active thumbnail visible without scrolling the entire page.
      if (revealThumbnail && thumbs.children[index]) {
        const active = thumbs.children[index];
        const left = active.getBoundingClientRect().left - thumbs.getBoundingClientRect().left + thumbs.scrollLeft;
        const right = left + active.offsetWidth;
        if (left < thumbs.scrollLeft) thumbs.scrollLeft = left;
        else if (right > thumbs.scrollLeft + thumbs.clientWidth)
          thumbs.scrollLeft = right - thumbs.clientWidth;
      }
    }
    group.codes.forEach((code,i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'wme-thumb';
      button.title = `${WEDDING_ENVELOPE_TITLES[code]} (${code})`;
      button.setAttribute('aria-label', `Select ${WEDDING_ENVELOPE_TITLES[code]}`);
      const thumb = document.createElement('img'); thumb.src = `images/${code}.webp`; thumb.alt = '';
      thumb.loading = 'lazy'; button.appendChild(thumb);
      button.addEventListener('click', () => selectDesign(i, true));
      thumbs.appendChild(button);
    });
    card.querySelector('.wme-prev').addEventListener('click', () => selectDesign(index - 1, true));
    card.querySelector('.wme-next').addEventListener('click', () => selectDesign(index + 1, true));
    card.querySelector('.wme-image-button').addEventListener('click', () => {
      const code = group.codes[index];
      openImageLightbox(`images/${code}.webp`, WEDDING_ENVELOPE_TITLES[code], code);
    });
    card.querySelectorAll('.wme-paper-options input').forEach(radio => radio.addEventListener('change', () => { price.textContent = `₱${unitPrice().toFixed(2)}`; }));
    const clampQty = () => { qty.value = String(Math.min(200, Math.max(1, parseInt(qty.value,10) || 1))); return Number(qty.value); };
    card.querySelector('.wme-minus').addEventListener('click', () => { qty.value = Math.max(1,clampQty()-1); });
    card.querySelector('.wme-plus').addEventListener('click', () => { qty.value = Math.min(200,clampQty()+1); });
    qty.addEventListener('change',clampQty);
    const addBtn = card.querySelector('.wme-add');
    addBtn.addEventListener('click', () => {
      const monogramInput = card.querySelector('.wme-monogram');
      const monogram = monogramInput ? monogramInput.value.trim().toUpperCase() : '';
      const names = card.querySelector('.wme-names').value.trim();
      const dateInput = card.querySelector('.wme-date');
      const date = dateInput ? dateInput.value.trim() : '';
      let invalid = null;
      if (monogramInput && !/^[A-Z]{2}$/.test(monogram)) invalid = monogramInput;
      else if (!names) invalid = card.querySelector('.wme-names');
      else if (dateInput && !date) invalid = dateInput;
      if (invalid) {
        error.hidden = false;
        error.textContent = invalid === monogramInput ? 'Please enter exactly two letters for the monogram.' : 'Please complete all personalization fields.';
        invalid.focus(); return;
      }
      error.hidden = true;
      const code = group.codes[index], paper = selectedPaper(), count = clampQty();
      const customText = [monogram ? `Monogram: ${monogram}` : '', `Names: ${names}`, dateInput ? `Wedding date: ${date}` : ''].filter(Boolean).join(' | ');
      const existing = appState.cart.find(item => item.categoryKey === 'envelopes' && item.designCode === code && item.paperQuality === paper && item.customText === customText);
      if (existing) { existing.quantity += count; existing.subtotal = existing.quantity * existing.unitPrice; }
      else appState.cart.push({
        id: 'wme_' + Date.now() + '_' + Math.random().toString(36).slice(2,7), isCustomMade:false,
        categoryKey:'envelopes', categoryName:'Money Envelopes', sizeId:group.id === 'christmas' ? 'christmas-envelopes' : 'wedding-envelopes',
        sizeName:`Money Envelope · ${paper === 'premium' ? 'Premium 108' : 'Standard 80'} GSM`,
        shortName:WEDDING_ENVELOPE_TITLES[code], productTitle:WEDDING_ENVELOPE_TITLES[code],
        dimensions:'Sold per piece', hasSheets:false, sheetCount:null, cardCount:null,
        freePersonalization:true, designCode:code, imagePath:`images/${code}.webp`,
        isCustomized:true, customText, nameLabel:[monogram, names, date].filter(Boolean).join(' · '), monogram, preferredNames:names, weddingDate:date,
        paperQuality:paper, isTba:false, unitPrice:unitPrice(), quantity:count, subtotal:unitPrice()*count
      });
      renderCart(); showCheckoutSection(false);
      showToast(`Added ${count} pc(s) of ${WEDDING_ENVELOPE_TITLES[code]} (${code}) for "${names}" to order.`);
      readyForAnotherName(addBtn, card.querySelector('.wme-names'));
    });
    selectDesign(0);
    DOM.productGalleryGrid.appendChild(card);
  });
}

// Hardbound Notepads: two independent design sliders using existing envelope card styling.
const HARDBOUND_GROUPS = [
  {title:'Pastel Reverie', codes:['HBNF_01','HBNF_02','HBNF_03','HBNF_04','HBNF_05','HBNF_06','HBNF_07','HBNF_08']},
  {title:'Modern Frontier', codes:['HBNM_01','HBNM_02','HBNM_03','HBNM_04','HBNM_05','HBNM_06']}
];
const HARDBOUND_TITLES = {
  HBNF_01:'Pink Petals', HBNF_02:'Pastel Bloom', HBNF_03:'Blue Serenity', HBNF_04:'Peach Blossom',
  HBNF_05:'Lavender Mist', HBNF_06:'Golden Sage', HBNF_07:'Vibrant Waves', HBNF_08:'Retro Pop',
  HBNM_01:'Wild Wolf', HBNM_02:'Ocean Depths', HBNM_03:'Forest Edge',
  HBNM_04:'Copper Ridge', HBNM_05:'Emerald Horizon', HBNM_06:'Royal Eclipse'
};
function renderHardboundGallery() {
  if (!DOM.productGalleryGrid) return;
  DOM.productGalleryGrid.innerHTML = '';
  DOM.productGalleryGrid.classList.add('wme-gallery');
  HARDBOUND_GROUPS.forEach((group, groupIndex) => {
    const card = document.createElement('article');
    card.className = 'product-card wme-card';
    card.innerHTML = `
      <div class="wme-heading"><h3>${group.title}</h3><span>${group.codes.length} designs</span></div>
      <div class="wme-preview">
        <button type="button" class="wme-arrow wme-prev" aria-label="Previous design">‹</button>
        <button type="button" class="wme-image-button" aria-label="Enlarge selected design"><img class="wme-image" src="images/${group.codes[0]}.webp" alt="${HARDBOUND_TITLES[group.codes[0]]}" loading="lazy"></button>
        <button type="button" class="wme-arrow wme-next" aria-label="Next design">›</button>
      </div>
      <div class="wme-selected" aria-live="polite"></div>
      <div class="wme-thumbnails" aria-label="Choose hardbound notepad design"></div>
      <div class="wme-form">
        <div class="wme-section-label">Size</div>
        <div class="wme-paper-options">
          <label><input type="radio" name="hardbound_size_${groupIndex}" value="A6" checked> A6 · ₱159</label>
          <label><input type="radio" name="hardbound_size_${groupIndex}" value="A5"> A5 · ₱259</label>
        </div>
        <label class="wme-field">Name on cover (free) <input class="hardbound-name" maxlength="100" placeholder="Enter name or text for cover" autocomplete="off" required></label>
        <p class="wme-error" role="alert" hidden></p>
      </div>
      <div class="product-card-footer">
        <div class="product-card-footer-top"><div><div class="product-price wme-price">₱159.00</div><small>per notepad</small></div>
          <div class="card-qty-stepper"><button type="button" class="card-qty-btn wme-minus" aria-label="Decrease quantity">−</button><input class="card-qty-input wme-qty" type="number" min="1" max="99" value="1" aria-label="Quantity"><button type="button" class="card-qty-btn wme-plus" aria-label="Increase quantity">+</button></div>
        </div><button type="button" class="btn-card-add wme-add">+ Add to Cart</button>
      </div>`;
    let index = 0;
    const image = card.querySelector('.wme-image');
    const selected = card.querySelector('.wme-selected');
    const thumbs = card.querySelector('.wme-thumbnails');
    const price = card.querySelector('.wme-price');
    const qty = card.querySelector('.wme-qty');
    const error = card.querySelector('.wme-error');
    const selectedSize = () => card.querySelector(`input[name="hardbound_size_${groupIndex}"]:checked`).value;
    const unitPrice = () => (selectedSize() === 'A6' ? 159 : 259);
    const updatePrice = () => { price.textContent = `₱${unitPrice().toFixed(2)}`; };
    function selectDesign(next, revealThumbnail = false) {
      index = (next + group.codes.length) % group.codes.length;
      const addButton = card.querySelector('.wme-add'); if (addButton) addButton.textContent = '+ Add to Cart';
      const code = group.codes[index];
      image.src = `images/${code}.webp`;
      image.alt = HARDBOUND_TITLES[code];
      selected.textContent = `${HARDBOUND_TITLES[code]} (${code}) · ${index + 1} of ${group.codes.length}`;
      [...thumbs.children].forEach((button, i) => {
        button.classList.toggle('active', i === index);
        button.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
      // Keep the active thumbnail visible without scrolling the entire page.
      if (revealThumbnail && thumbs.children[index]) {
        const active = thumbs.children[index];
        const left = active.getBoundingClientRect().left - thumbs.getBoundingClientRect().left + thumbs.scrollLeft;
        const right = left + active.offsetWidth;
        if (left < thumbs.scrollLeft) thumbs.scrollLeft = left;
        else if (right > thumbs.scrollLeft + thumbs.clientWidth)
          thumbs.scrollLeft = right - thumbs.clientWidth;
      }
    }
    group.codes.forEach((code,i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'wme-thumb';
      button.title = `${HARDBOUND_TITLES[code]} (${code})`;
      button.setAttribute('aria-label', `Select ${HARDBOUND_TITLES[code]}`);
      const thumb = document.createElement('img'); thumb.src = `images/${code}.webp`; thumb.alt = ''; thumb.loading = 'lazy';
      button.appendChild(thumb); button.addEventListener('click', () => selectDesign(i, true)); thumbs.appendChild(button);
    });
    card.querySelector('.wme-prev').addEventListener('click', () => selectDesign(index - 1, true));
    card.querySelector('.wme-next').addEventListener('click', () => selectDesign(index + 1, true));
    card.querySelector('.wme-image-button').addEventListener('click', () => {
      const code = group.codes[index]; openImageLightbox(`images/${code}.webp`, HARDBOUND_TITLES[code], code);
    });
    card.querySelectorAll('.wme-paper-options input').forEach(radio => radio.addEventListener('change', updatePrice));
    const clampQty = () => { qty.value = String(Math.min(99, Math.max(1, parseInt(qty.value,10) || 1))); return Number(qty.value); };
    card.querySelector('.wme-minus').addEventListener('click', () => { qty.value = Math.max(1, clampQty()-1); });
    card.querySelector('.wme-plus').addEventListener('click', () => { qty.value = Math.min(99, clampQty()+1); });
    qty.addEventListener('change', clampQty);
    const addBtn = card.querySelector('.wme-add');
    addBtn.addEventListener('click', () => {
      const input = card.querySelector('.hardbound-name');
      const names = input.value.trim();
      if (!names) { error.hidden = false; error.textContent = 'Please enter your preferred personalization text.'; input.focus(); return; }
      error.hidden = true;
      const code = group.codes[index], size = selectedSize(), count = clampQty();
      const customText = `Cover personalization: ${names}`;
      const existing = appState.cart.find(item => item.categoryKey === 'hardbound' && item.designCode === code && item.sizeId === `hardbound-${size.toLowerCase()}` && item.customText === customText);
      if (existing) { existing.quantity += count; existing.subtotal = existing.quantity * existing.unitPrice; }
      else appState.cart.push({
        id: 'hbn_' + Date.now() + '_' + Math.random().toString(36).slice(2,7), isCustomMade:false,
        categoryKey:'hardbound', categoryName:'Hardbound Notepads', sizeId:`hardbound-${size.toLowerCase()}`,
        sizeName:`${size} Hardbound Notepad`, shortName:HARDBOUND_TITLES[code], productTitle:HARDBOUND_TITLES[code],
        dimensions:size === 'A6' ? 'A6' : 'A5', hasSheets:true, sheetCount:70, cardCount:null,
        freePersonalization:true, designCode:code, imagePath:`images/${code}.webp`,
        isCustomized:true, customText, nameLabel:names, preferredNames:names, isTba:false,
        unitPrice:unitPrice(), quantity:count, subtotal:unitPrice()*count
      });
      renderCart(); showCheckoutSection(false);
      showToast(`Added ${count} ${size} hardbound notepad(s) of ${HARDBOUND_TITLES[code]} (${code}) for "${names}" to order.`);
      readyForAnotherName(addBtn, input);
    });
    selectDesign(0); DOM.productGalleryGrid.appendChild(card);
  });
}

// Notecard group sliders. Existing Bloomstead codes, prices and personalization are preserved.
const NOTECARD_SLIDER_TITLES = {
  NCP_CM_01: 'Snowy',
  NCP_CM_02: 'Rudolph',
  NCP_CM_03: 'Santa',
  NCP_CM_04: 'Jolly',
  NCP_CM_05: 'Evergreen',
  NCP_CM_06: 'Tartan',
  NCP_CM_07: 'Presents',
  NCP_CM_08: 'Twinkle',
  NCP_CM_09: 'Cheer',
  NCP_CM_10: 'Golden',
  NCP_CM_11: 'Noel',
  NCP_CM_12: 'Whimsy',
  NCP_CM_13: 'Cuddles',
  NCP_CM_14: 'Frosty',
  NCP_CM_15: 'Gingerbread',
  NCP_CM_16: 'Yuletide',
  NCP_CM_17: 'Spruce',
  ...Object.fromEntries(Array.from({length:10}, (_,i) => [`NCP_CC_${String(i).padStart(2,'0')}`, DESIGN_TITLES[`CC_${String(i).padStart(2,'0')}`]])),
  ...Object.fromEntries(Array.from({length:10}, (_,i) => [`NCH_CC_${String(i).padStart(2,'0')}`, DESIGN_TITLES[`CC_${String(i).padStart(2,'0')}`]]))
};
const NOTECARD_SLIDER_GROUPS = [
  {title:'Bloomstead', category:'2x3.5', codes:Array.from({length:10},(_,i)=>`NCP_BLOOM_${String(i+1).padStart(2,'0')}`)},
  {title:'Minimalist Christmas Designs', category:'2x3.5', codes:Array.from({length:17},(_,i)=>`NCP_CM_${String(i+1).padStart(2,'0')}`)},
  {title:'Christmas Designs', category:'2x3.5', codes:Array.from({length:10},(_,i)=>`NCP_CC_${String(i).padStart(2,'0')}`)},
  {title:'Bloomstead', category:'4x3', codes:Array.from({length:10},(_,i)=>`NCL_BLOOM_${String(i+1).padStart(2,'0')}`)},
  {title:'Christmas Designs', category:'4x3', codes:Array.from({length:10},(_,i)=>`NCH_CC_${String(i).padStart(2,'0')}`)}
];
function renderNotecardSliderGallery(categoryKey) {
  if (!DOM.productGalleryGrid) return;
  const groups = NOTECARD_SLIDER_GROUPS.filter(group => group.category === categoryKey);
  DOM.productGalleryGrid.innerHTML = '';
  DOM.productGalleryGrid.classList.add('wme-gallery');
  const pricePerPack = categoryKey === '2x3.5' ? 89 : 129;
  const sizeName = categoryKey === '2x3.5' ? '2 × 3.5 in Notecards (Portrait)' : '4 × 3 in Notecards (Landscape)';
  const maxChars = categoryKey === '2x3.5' ? 10 : 15;
  groups.forEach((group, groupIndex) => {
    const card = document.createElement('article');
    card.className = 'product-card wme-card';
    const getTitle = code => NOTECARD_SLIDER_TITLES[code] || DESIGN_TITLES[code] || code;
    card.innerHTML = `
      <div class="wme-heading"><h3>${group.title}</h3><span>${group.codes.length} designs</span></div>
      <div class="wme-preview">
        <button type="button" class="wme-arrow wme-prev" aria-label="Previous design">‹</button>
        <button type="button" class="wme-image-button" aria-label="Enlarge selected design"><img class="wme-image" src="images/${group.codes[0]}.webp" alt="${getTitle(group.codes[0])}" loading="lazy"></button>
        <button type="button" class="wme-arrow wme-next" aria-label="Next design">›</button>
      </div>
      <div class="wme-selected" aria-live="polite"></div>
      <div class="wme-thumbnails" aria-label="Choose notecard design"></div>
      <div class="wme-form">
        <label class="wme-field">Name to print (free) <input class="notecard-slider-name wme-counted" maxlength="${maxChars}" placeholder="${categoryKey === '2x3.5' ? 'e.g. Maria C.' : 'e.g. Maria Clara'}" autocomplete="off" required></label>
        <div class="wme-char-count" aria-live="polite">0/${maxChars}</div>
        <p class="wme-error" role="alert" hidden></p>
      </div>
      <div class="product-card-footer">
        <div class="product-card-footer-top"><div><div class="product-price wme-price">₱${pricePerPack.toFixed(2)}</div><small>per pack of 24</small></div>
          <div class="card-qty-stepper"><button type="button" class="card-qty-btn wme-minus" aria-label="Decrease packs">−</button><input class="card-qty-input wme-qty" type="number" min="1" max="99" value="1" aria-label="Number of packs"><button type="button" class="card-qty-btn wme-plus" aria-label="Increase packs">+</button></div>
        </div><button type="button" class="btn-card-add wme-add">+ Add to Cart</button>
      </div>`;
    let index = 0;
    const image = card.querySelector('.wme-image');
    const selected = card.querySelector('.wme-selected');
    const thumbs = card.querySelector('.wme-thumbnails');
    const qty = card.querySelector('.wme-qty');
    const error = card.querySelector('.wme-error');
    function selectDesign(next, revealThumbnail = false) {
      index = (next + group.codes.length) % group.codes.length;
      const addButton = card.querySelector('.wme-add'); if (addButton) addButton.textContent = '+ Add to Cart';
      const code = group.codes[index];
      image.src = `images/${code}.webp`;
      image.alt = getTitle(code);
      selected.textContent = `${getTitle(code)} (${code}) · ${index + 1} of ${group.codes.length}`;
      [...thumbs.children].forEach((button, i) => {
        button.classList.toggle('active', i === index);
        button.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
      // Keep the active thumbnail visible without scrolling the entire page.
      if (revealThumbnail && thumbs.children[index]) {
        const active = thumbs.children[index];
        const left = active.getBoundingClientRect().left - thumbs.getBoundingClientRect().left + thumbs.scrollLeft;
        const right = left + active.offsetWidth;
        if (left < thumbs.scrollLeft) thumbs.scrollLeft = left;
        else if (right > thumbs.scrollLeft + thumbs.clientWidth)
          thumbs.scrollLeft = right - thumbs.clientWidth;
      }
    }
    group.codes.forEach((code,i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'wme-thumb';
      button.title = `${getTitle(code)} (${code})`;
      button.setAttribute('aria-label', `Select ${getTitle(code)}`);
      const thumb = document.createElement('img'); thumb.src = `images/${code}.webp`; thumb.alt = ''; thumb.loading = 'lazy';
      button.appendChild(thumb); button.addEventListener('click', () => selectDesign(i, true)); thumbs.appendChild(button);
    });
    card.querySelector('.wme-prev').addEventListener('click', () => selectDesign(index - 1, true));
    card.querySelector('.wme-next').addEventListener('click', () => selectDesign(index + 1, true));
    card.querySelector('.wme-image-button').addEventListener('click', () => {
      const code = group.codes[index]; openImageLightbox(`images/${code}.webp`, getTitle(code), code);
    });
    const clampQty = () => { qty.value = String(Math.min(99, Math.max(1, parseInt(qty.value,10) || 1))); return Number(qty.value); };
    card.querySelector('.wme-minus').addEventListener('click', () => { qty.value = Math.max(1,clampQty()-1); });
    card.querySelector('.wme-plus').addEventListener('click', () => { qty.value = Math.min(99,clampQty()+1); });
    qty.addEventListener('change', clampQty);
    const addBtn = card.querySelector('.wme-add');
    addBtn.addEventListener('click', () => {
      const input = card.querySelector('.notecard-slider-name');
      const text = input.value.trim();
      if (!text) { error.hidden = false; error.textContent = 'Please enter your preferred personalization text.'; input.focus(); return; }
      error.hidden = true;
      const code = group.codes[index];
      const product = {
        code, name:getTitle(code), category:categoryKey, catalogType:'notecards',
        sizeName, dimensions:categoryKey === '2x3.5' ? '2 × 3.5 in' : '4 × 3 in',
        cardCount:24, price:pricePerPack, freePersonalization:true
      };
      addGalleryProductToCart(product, clampQty(), true, text);
      readyForAnotherName(addBtn, input);
    });
    selectDesign(0);
    DOM.productGalleryGrid.appendChild(card);
  });
}

// Notepads: slider cards per size, grouped by series. Designs come from PRODUCT_CATALOG,
// so newly added notepad designs appear automatically in the matching group.
const NOTEPAD_NAME_LIMITS = { '3x3': 10, 'A6': 15, 'A5': 20 };
const NOTEPAD_PRICES = { '3x3': 39, 'A6': 59, 'A5': 109 };
function getNotepadSliderGroups(categoryKey) {
  const items = PRODUCT_CATALOG.filter(p => p.category === categoryKey);
  const split = (title1, test, title2) => {
    const a = items.filter(test), b = items.filter(p => !test(p));
    return [{ title: title1, items: a }, { title: title2, items: b }].filter(g => g.items.length > 0);
  };
  if (categoryKey === '3x3') return split('Cat Series', p => p.tag === 'Cat Series', 'Everyday Notes');
  if (categoryKey === 'A5') return split('Planners', p => /Planner/i.test(p.tag || ''), 'Vintage & Botanical');
  return [{ title: 'A6 Notepads', items }].filter(g => g.items.length > 0);
}

function renderNotepadSliderGallery(categoryKey) {
  if (!DOM.productGalleryGrid) return;
  DOM.productGalleryGrid.innerHTML = '';
  DOM.productGalleryGrid.classList.add('wme-gallery');
  const maxChars = NOTEPAD_NAME_LIMITS[categoryKey] || 15;
  const placeholder = categoryKey === '3x3' ? 'e.g. Maria C.' : (categoryKey === 'A6' ? 'e.g. Maria Clara' : 'e.g. Maria Clara S.');
  const groups = getNotepadSliderGroups(categoryKey);
  if (groups.length === 0) {
    DOM.productGalleryGrid.innerHTML = '<div class="gallery-empty-state"><div class="gallery-empty-title">No designs available</div><div class="gallery-empty-desc">Designs for this size will be available soon.</div></div>';
    return;
  }
  groups.forEach(group => {
    const products = group.items;
    const imgSrc = p => `images/${encodeURIComponent(p.code)}.webp`;
    const titleOf = p => DESIGN_TITLES[p.code] || p.name;
    const unitPrice = products[0].price || NOTEPAD_PRICES[categoryKey];
    const card = document.createElement('article');
    card.className = 'product-card wme-card';
    card.innerHTML = `
      <div class="wme-heading"><h3>${group.title}</h3><span>${products.length} design${products.length === 1 ? '' : 's'}</span></div>
      <div class="wme-preview">
        <button type="button" class="wme-arrow wme-prev" aria-label="Previous design">‹</button>
        <button type="button" class="wme-image-button" aria-label="Enlarge selected design"><img class="wme-image" src="${imgSrc(products[0])}" alt="${escapeHtml(titleOf(products[0]))}" loading="lazy"></button>
        <button type="button" class="wme-arrow wme-next" aria-label="Next design">›</button>
      </div>
      <div class="wme-selected" aria-live="polite"></div>
      <div class="wme-thumbnails" aria-label="Choose notepad design"></div>
      <div class="wme-form">
        <label class="wme-field">Name to print (free, optional) <input class="notepad-slider-name wme-counted" maxlength="${maxChars}" placeholder="${placeholder}" autocomplete="off"></label>
        <div class="wme-char-count" aria-live="polite">0/${maxChars}</div>
      </div>
      <div class="product-card-footer">
        <div class="product-card-footer-top"><div><div class="product-price wme-price">₱${unitPrice.toFixed(2)}</div><small>per notepad</small></div>
          <div class="card-qty-stepper"><button type="button" class="card-qty-btn wme-minus" aria-label="Decrease quantity">−</button><input class="card-qty-input wme-qty" type="number" min="1" max="99" value="1" aria-label="Quantity"><button type="button" class="card-qty-btn wme-plus" aria-label="Increase quantity">+</button></div>
        </div><button type="button" class="btn-card-add wme-add">+ Add to Cart</button>
      </div>`;
    let index = 0;
    const image = card.querySelector('.wme-image');
    const selected = card.querySelector('.wme-selected');
    const thumbs = card.querySelector('.wme-thumbnails');
    const qty = card.querySelector('.wme-qty');
    const addBtn = card.querySelector('.wme-add');
    const nameInput = card.querySelector('.notepad-slider-name');
    const setFallback = (img, p) => {
      img.onerror = () => { img.onerror = null; img.src = getProductMockupSvg(p.code, p.name, p.category, p.tag); };
    };
    function selectDesign(next, revealThumbnail = false) {
      index = (next + products.length) % products.length;
      const p = products[index];
      addBtn.textContent = '+ Add to Cart';
      setFallback(image, p);
      image.src = imgSrc(p);
      image.alt = titleOf(p);
      selected.textContent = `${titleOf(p)} (${p.code}) · ${index + 1} of ${products.length}`;
      [...thumbs.children].forEach((button, i) => {
        button.classList.toggle('active', i === index);
        button.setAttribute('aria-pressed', i === index ? 'true' : 'false');
      });
      if (revealThumbnail && thumbs.children[index]) {
        const active = thumbs.children[index];
        const left = active.getBoundingClientRect().left - thumbs.getBoundingClientRect().left + thumbs.scrollLeft;
        const right = left + active.offsetWidth;
        if (left < thumbs.scrollLeft) thumbs.scrollLeft = left;
        else if (right > thumbs.scrollLeft + thumbs.clientWidth) thumbs.scrollLeft = right - thumbs.clientWidth;
      }
    }
    products.forEach((p, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'wme-thumb';
      button.title = `${titleOf(p)} (${p.code})`;
      button.setAttribute('aria-label', `Select ${titleOf(p)}`);
      const thumb = document.createElement('img'); thumb.alt = ''; thumb.loading = 'lazy';
      setFallback(thumb, p); thumb.src = imgSrc(p);
      button.appendChild(thumb); button.addEventListener('click', () => selectDesign(i, true)); thumbs.appendChild(button);
    });
    card.querySelector('.wme-prev').addEventListener('click', () => selectDesign(index - 1, true));
    card.querySelector('.wme-next').addEventListener('click', () => selectDesign(index + 1, true));
    card.querySelector('.wme-image-button').addEventListener('click', () => {
      const p = products[index]; openImageLightbox(image.src, titleOf(p), p.code);
    });
    const clampQty = () => { qty.value = String(Math.min(99, Math.max(1, parseInt(qty.value, 10) || 1))); return Number(qty.value); };
    card.querySelector('.wme-minus').addEventListener('click', () => { qty.value = Math.max(1, clampQty() - 1); });
    card.querySelector('.wme-plus').addEventListener('click', () => { qty.value = Math.min(99, clampQty() + 1); });
    qty.addEventListener('change', clampQty);
    addBtn.addEventListener('click', () => {
      const text = nameInput.value.trim().slice(0, maxChars);
      addGalleryProductToCart(products[index], clampQty(), text.length > 0, text);
      readyForAnotherName(addBtn, nameInput);
    });
    selectDesign(0);
    DOM.productGalleryGrid.appendChild(card);
  });
}

function renderProductGallery(categoryKey) {
  if (categoryKey === 'wedding-envelopes') { renderWeddingEnvelopeGallery(); return; }
  if (categoryKey === '3x3' || categoryKey === 'A6' || categoryKey === 'A5') { renderNotepadSliderGallery(categoryKey); return; }
  if (categoryKey === 'hardbound') { renderHardboundGallery(); return; }
  if (categoryKey === '2x3.5' || categoryKey === '4x3') { renderNotecardSliderGallery(categoryKey); return; }
  if (!DOM.productGalleryGrid) return;
  DOM.productGalleryGrid.innerHTML = '';
  DOM.productGalleryGrid.classList.remove('wme-gallery');

  let items = PRODUCT_CATALOG.filter(p => p.category === categoryKey);

  // Automatic ordering and grouping:
  // 1. Automatically display newly uploaded designs at the top/upper section by default
  // 2. Group designs with similar themes/series together sequentially based on their design codes
  items.sort((a, b) => {
    const aNew = isProductNewArrival(a) ? 1 : 0;
    const bNew = isProductNewArrival(b) ? 1 : 0;
    if (bNew !== aNew) return bNew - aNew; // New arrivals prioritized at the top

    // When both are new, group by series and sequential numbers
    if (aNew && bNew) {
      return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
    }

    // For other designs, maintain their catalog grouping
    return PRODUCT_CATALOG.indexOf(a) - PRODUCT_CATALOG.indexOf(b);
  });

  if (items.length === 0) {
    DOM.productGalleryGrid.innerHTML = `
      <div class="gallery-empty-state">
        <div class="gallery-empty-title">No designs available</div>
        <div class="gallery-empty-desc">Designs for this category will be available soon.</div>
      </div>
    `;
    return;
  }

  items.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const safeCode = product.code.replace(/[^a-zA-Z0-9_-]/g, '_');
    card.id = `card_${safeCode}`;

    const fallbackSvg = getProductMockupSvg(product.code, product.name, product.category, product.tag);
    const isNotecards = (product.catalogType === 'notecards' || Boolean(product.cardCount && !product.envelopeCount));
    const isCollection = false; // Christmas Collections removed
    const hasFreePersonalization = true; // personalization is FREE on every product
    const is2x35 = (product.category === '2x3.5' || product.code.startsWith('NCP_'));
    const notecardMaxChars = product.maxChars || (isNotecards ? (is2x35 ? 10 : 15) : 30);
    const notecardPlaceholder = isCollection ? 'e.g. The Santos Family / Maria Clara' : (is2x35 ? 'e.g. Maria C.' : 'e.g. Maria Clara');
    const nameHint = isNotecards ? '' : '<span class="card-custom-hint-text">Optional · leave blank for no name</span>';

    const customizationSectionHtml = isCollection ? `
      <!-- Always-visible Text Customization for Christmas Collections (MANDATORY FREE Personalization) -->
      <div class="card-customization-box card-customization-box-always-visible card-customization-box-collection" id="custBox_${safeCode}">
        <div class="card-notecard-custom-header">
          <label class="card-custom-input-label" for="inputCustText_${safeCode}">
            CUSTOM NAME / TEXT TO PRINT <span class="required-star">*</span>
          </label>
          <span class="card-custom-price-pill" style="background:#e8f5e9; color:#1b5e20; border:1px solid #c8e6c9;">✨ FREE personalization</span>
        </div>
        <div class="card-custom-input-wrap card-custom-input-wrap-visible" id="wrapCustInput_${safeCode}">
          <input 
            type="text" 
            class="card-custom-input" 
            id="inputCustText_${safeCode}" 
            placeholder="e.g. The Santos Family / Maria Clara" 
            maxlength="30"
            autocomplete="off"
            required
            aria-required="true"
          />
          <div class="card-custom-helper-row">
            <span class="card-custom-hint-text">Personalization required for Christmas sets</span>
            <span class="card-custom-char-counter" id="charCount_${safeCode}">0/30</span>
          </div>
          <div class="card-custom-error-msg" id="errCustText_${safeCode}" style="display: none;">
            Personalization is required for this Christmas Collection set. Please enter the custom name or text to print.
          </div>
        </div>
      </div>
    ` : (hasFreePersonalization ? `
      <!-- Always-visible Text Customization for Notecards (FREE Personalization) -->
      <div class="card-customization-box card-customization-box-always-visible" id="custBox_${safeCode}">
        <div class="card-notecard-custom-header">
          <label class="card-custom-input-label" for="inputCustText_${safeCode}">
            CUSTOM NAME / TEXT TO PRINT
          </label>
          <span class="card-custom-price-pill" style="background:#e8f5e9; color:#1b5e20; border:1px solid #c8e6c9;">✨ FREE personalization</span>
        </div>
        <div class="card-custom-input-wrap card-custom-input-wrap-visible" id="wrapCustInput_${safeCode}">
          <input 
            type="text" 
            class="card-custom-input" 
            id="inputCustText_${safeCode}" 
            placeholder="${notecardPlaceholder}" 
            maxlength="${notecardMaxChars}"
            autocomplete="off"
          />
          <div class="card-custom-helper-row">
            ${nameHint}
            <span class="card-custom-char-counter" id="charCount_${safeCode}">0/${notecardMaxChars}</span>
          </div>
        </div>
      </div>
    ` : `
      <!-- Interactive Text Customization for Notepads (Conditional Visibility + ₱10.00 surcharge) -->
      <div class="card-customization-box" id="custBox_${safeCode}">
        <label class="card-customization-toggle" for="checkCust_${safeCode}">
          <input 
            type="checkbox" 
            class="card-custom-checkbox" 
            id="checkCust_${safeCode}" 
            name="checkCust_${safeCode}"
          />
          <span class="card-custom-toggle-content">
            <span class="card-custom-label-text">Add Text Customization (e.g., Name)</span>
            <span class="card-custom-price-pill">+ ₱10.00 / item</span>
          </span>
        </label>
        
        <div class="card-custom-input-wrap" id="wrapCustInput_${safeCode}" style="display: none;">
          <label class="card-custom-input-label" for="inputCustText_${safeCode}">
            CUSTOM NAME / TEXT TO PRINT <span class="required-star">*</span>
          </label>
          <input 
            type="text" 
            class="card-custom-input" 
            id="inputCustText_${safeCode}" 
            placeholder="e.g. Maria Clara / M. Santos" 
            maxlength="50"
            autocomplete="off"
          />
          <div class="card-custom-error-msg" id="errCustText_${safeCode}" style="display: none;">
            Please enter the custom name or text to print.
          </div>
        </div>
      </div>
    `);

    const cardBodyHtml = isCollection ? `
      <div class="product-card-body product-card-body-collection">
        <h4 class="product-title">${product.name}</h4>
      </div>
    ` : `
      <div class="product-card-body">
        <h4 class="product-title">${product.name}</h4>
      </div>
    `;

    card.innerHTML = `
      <div class="product-card-image-wrap" title="Click to view enlarged design">
        <span class="product-card-badge">${product.code}</span>
        <span class="product-card-motif-tag">${product.tag}</span>
        <img 
          src="images/${encodeURIComponent(product.code)}.webp" 
          alt="${product.name}" 
          class="product-card-img" 
          loading="lazy"
          decoding="async"
        />
        <div class="product-card-zoom-btn" aria-hidden="true" title="Zoom in">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>
      </div>
      ${cardBodyHtml}

      ${customizationSectionHtml}

      <div class="product-card-footer">
        <div class="product-card-footer-top">
          <div class="product-price" id="price_${safeCode}">₱${product.price.toFixed(2)}</div>
          <div class="card-qty-stepper" id="stepper_${safeCode}">
            <button type="button" class="card-qty-btn btn-card-qty-minus" id="btnMinus_${safeCode}" aria-label="Decrease quantity">−</button>
            <input type="number" class="card-qty-input" id="inputQty_${safeCode}" value="1" min="1" max="99" aria-label="Item quantity">
            <button type="button" class="card-qty-btn btn-card-qty-plus" id="btnPlus_${safeCode}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="btn-card-add" id="btnAdd_${safeCode}" title="Add to Order">
          + Add to Cart
        </button>
      </div>
    `;

    // Safely attach image fallback handler via addEventListener to avoid HTML attribute quoting issues
    const cardImg = card.querySelector('.product-card-img');
    if (cardImg) {
      cardImg.addEventListener('error', function onImgError() {
        this.removeEventListener('error', onImgError);
        this.src = fallbackSvg;
      });
    }

    // Attach click event to product thumbnail to open Image Preview Lightbox (Modal)
    const imgWrap = card.querySelector('.product-card-image-wrap');
    if (imgWrap) {
      imgWrap.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentSrc = (cardImg && cardImg.src) ? cardImg.src : `images/${encodeURIComponent(product.code)}.webp`;
        openImageLightbox(currentSrc, product.name, product.code);
      });
    }

    const custBox = card.querySelector('.card-customization-box');
    const checkCust = card.querySelector('.card-custom-checkbox');
    const wrapCustInput = card.querySelector('.card-custom-input-wrap');
    const inputCustText = card.querySelector('.card-custom-input');
    const errCustText = card.querySelector('.card-custom-error-msg');
    const priceEl = card.querySelector('.product-price');
    const qtyInput = card.querySelector('.card-qty-input');
    const btnMinus = card.querySelector('.btn-card-qty-minus');
    const btnPlus = card.querySelector('.btn-card-qty-plus');
    const addBtn = card.querySelector('.btn-card-add');

    function updateCardPriceDisplay() {
      const isCustomized = Boolean(checkCust && checkCust.checked);
      const custFee = (isCustomized && !product.freePersonalization) ? 10 : 0;
      const currentUnitPrice = product.price + custFee;
      if (priceEl) {
        priceEl.textContent = `₱${currentUnitPrice.toFixed(2)}`;
      }
    }

    // Conditional visibility: Toggle input field, clear input when unchecked, update card price
    if (checkCust && wrapCustInput) {
      checkCust.addEventListener('change', () => {
        if (checkCust.checked) {
          wrapCustInput.style.display = 'flex';
          if (custBox) custBox.classList.add('active');
          if (inputCustText) {
            inputCustText.focus();
          }
        } else {
          wrapCustInput.style.display = 'none';
          if (custBox) custBox.classList.remove('active');
          if (inputCustText) {
            inputCustText.value = '';
            inputCustText.classList.remove('has-error');
          }
          if (errCustText) {
            errCustText.style.display = 'none';
          }
        }
        updateCardPriceDisplay();
      });
    }

    const charCountEl = card.querySelector(`#charCount_${safeCode}`);

    if (inputCustText) {
      inputCustText.addEventListener('input', () => {
        const val = inputCustText.value;
        if (val.trim().length > 0) {
          inputCustText.classList.remove('has-error');
          if (errCustText) errCustText.style.display = 'none';
        }
        if (charCountEl && hasFreePersonalization) {
          charCountEl.textContent = `${val.length}/${notecardMaxChars}`;
          if (val.length >= notecardMaxChars) {
            charCountEl.classList.add('at-limit');
          } else {
            charCountEl.classList.remove('at-limit');
          }
        }
      });
    }

    if (btnMinus && qtyInput) {
      btnMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        let val = parseInt(qtyInput.value, 10) || 1;
        if (val > 1) {
          qtyInput.value = val - 1;
        }
      });
    }

    if (btnPlus && qtyInput) {
      btnPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        let val = parseInt(qtyInput.value, 10) || 1;
        if (val < 99) {
          qtyInput.value = val + 1;
        }
      });
    }

    if (qtyInput) {
      qtyInput.addEventListener('change', () => {
        let val = parseInt(qtyInput.value, 10);
        if (isNaN(val) || val < 1) {
          qtyInput.value = 1;
        } else if (val > 99) {
          qtyInput.value = 99;
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let isCustomized = false;
        let customText = '';

        if (isCollection) {
          // Christmas Collection: Personalization is REQUIRED and FREE!
          customText = inputCustText ? inputCustText.value.trim() : '';
          if (!customText) {
            if (inputCustText) {
              inputCustText.classList.add('has-error');
              inputCustText.focus();
            }
            if (errCustText) {
              errCustText.textContent = 'Personalization is required for this Christmas Collection set. Please enter the custom name or text to print.';
              errCustText.style.display = 'block';
            }
            showToast('Personalization is required for this Christmas Collection set.');
            return;
          }
          isCustomized = true;
        } else if (hasFreePersonalization) {
          // Free Personalization (Notecards): Text customization input is always visible
          // If text is entered, capture as FREE personalization
          // If left blank, treat as standard order without customization
          customText = inputCustText ? inputCustText.value.trim() : '';
          isCustomized = customText.length > 0;
        } else {
          // Notepads: Checkbox toggle determines customization (+₱10 fee)
          isCustomized = Boolean(checkCust && checkCust.checked);
          customText = inputCustText ? inputCustText.value.trim() : '';

          // Validation: If customization is checked on Notepads, custom text is mandatory
          if (isCustomized && !customText) {
            if (inputCustText) {
              inputCustText.classList.add('has-error');
              inputCustText.focus();
            }
            if (errCustText) {
              errCustText.textContent = 'Please enter the custom name or text to print.';
              errCustText.style.display = 'block';
            }
            showToast('Please enter the custom name or text to print.');
            return;
          }
        }

        if (inputCustText) inputCustText.classList.remove('has-error');
        if (errCustText) errCustText.style.display = 'none';

        const quantity = parseInt(qtyInput ? qtyInput.value : '1', 10) || 1;
        addGalleryProductToCart(product, quantity, isCustomized, customText);
        readyForAnotherName(addBtn, inputCustText);
      });
    }

    DOM.productGalleryGrid.appendChild(card);
  });
}

function toggleMobileMenu(open) {
  const isCurrentlyOpen = DOM.mobileNavDrawer?.classList.contains('open');
  const shouldOpen = (typeof open === 'boolean') ? open : !isCurrentlyOpen;

  if (DOM.mobileNavDrawer) {
    DOM.mobileNavDrawer.classList.toggle('open', shouldOpen);
    DOM.mobileNavDrawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  }
  if (DOM.mobileNavBackdrop) {
    DOM.mobileNavBackdrop.classList.toggle('open', shouldOpen);
    DOM.mobileNavBackdrop.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  }
  if (DOM.btnMobileMenuToggle) {
    DOM.btnMobileMenuToggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  }
  document.body.style.overflow = shouldOpen ? 'hidden' : '';
}

const CATALOG_COPY = {
  hardbound: {
    title: 'Hardbound Notepads',
    subtitle: 'Personalized hardbound notepads, 70 sheets. A6 ₱159 · A5 ₱259'
  },
  notepads: {
    title: 'Notepads',
    subtitle: 'Personalized tear-off notepads, 30 sheets. Square ₱39 · A6 ₱59 · A5 ₱109'
  },
  notecards: {
    title: 'Notecards',
    subtitle: 'Personalized cards, 24 pcs per pack. Great as gift tags. 2×3.5 in ₱89 · 4×3 in ₱129'
  },
  envelopes: {
    title: 'Money Envelopes',
    subtitle: `Personalized money envelopes, sold per piece. Premium ₱${ENVELOPE_PRICES.premium} · Standard ₱${ENVELOPE_PRICES.standard}. Minimum ${ENVELOPE_MIN_PCS} pcs per order, mix any design.`
  }
};

// Highlight the active catalog in both the desktop nav and the mobile drawer.
function setActiveCatalogNav(catalogType) {
  document.querySelectorAll('[data-catalog]').forEach(btn => {
    const isActive = btn.dataset.catalog === catalogType;
    btn.classList.toggle('active', isActive);
    if (btn.classList.contains('site-nav-link')) btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function setGalleryHeading(catalogType) {
  const copy = CATALOG_COPY[catalogType];
  if (!copy) return;
  if (DOM.gallerySectionTitle) DOM.gallerySectionTitle.textContent = copy.title;
  if (DOM.gallerySectionSubtitle) { DOM.gallerySectionSubtitle.textContent = copy.subtitle; DOM.gallerySectionSubtitle.style.display = ''; }
}

function switchMainCatalog(catalogType) {
  if (!CATALOG_COPY[catalogType]) catalogType = 'hardbound';
  appState.currentCatalog = catalogType; // 'hardbound' | 'notepads' | 'notecards' | 'envelopes'
  setActiveCatalogNav(catalogType);
  setGalleryHeading(catalogType);

  const showTabs = (catalogType === 'notepads' || catalogType === 'notecards');
  if (DOM.categoryTabsContainer) DOM.categoryTabsContainer.style.display = showTabs ? 'flex' : 'none';
  if (DOM.categorySpecPill) DOM.categorySpecPill.style.display = 'none'; // prices are in the heading
  if (DOM.tabChristmas) DOM.tabChristmas.style.display = 'none';
  const notepadTab = catalogType === 'notepads' ? 'inline-flex' : 'none';
  const notecardTab = catalogType === 'notecards' ? 'inline-flex' : 'none';
  if (DOM.tab3x3) DOM.tab3x3.style.display = notepadTab;
  if (DOM.tabA6) DOM.tabA6.style.display = notepadTab;
  if (DOM.tabA5) DOM.tabA5.style.display = notepadTab;
  if (DOM.tab2x35) DOM.tab2x35.style.display = notecardTab;
  if (DOM.tab4x3) DOM.tab4x3.style.display = notecardTab;

  if (catalogType === 'hardbound') {
    appState.activeGalleryTab = 'hardbound';
    renderProductGallery('hardbound');
  } else if (catalogType === 'envelopes') {
    appState.activeGalleryTab = 'wedding-envelopes';
    renderProductGallery('wedding-envelopes');
  } else if (catalogType === 'notepads') {
    switchGalleryCategory('3x3');
  } else {
    switchGalleryCategory('2x3.5');
  }
}

function switchGalleryCategory(categoryKey) {
  appState.activeGalleryTab = categoryKey;
  const isNotecard = (categoryKey === '2x3.5' || categoryKey === '4x3');
  const catalogType = isNotecard ? 'notecards' : 'notepads';
  appState.currentCatalog = catalogType;
  setActiveCatalogNav(catalogType);
  setGalleryHeading(catalogType);
  if (DOM.categorySpecPill) DOM.categorySpecPill.style.display = 'none';

  if (DOM.categoryTabs) {
    DOM.categoryTabs.forEach(tab => {
      const isCurrent = (tab.dataset.category === categoryKey);
      tab.classList.toggle('active', isCurrent);
      tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });
  }

  const spec = CATEGORY_SPECS[categoryKey];
  if (DOM.categorySpecText && spec) {
    DOM.categorySpecText.textContent = spec.specText;
  }

  renderProductGallery(categoryKey);
}

function addGalleryProductToCart(product, quantity = 1, isCustomized = false, customText = '') {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const trimmedText = isCustomized ? customText.trim() : '';
  const unitPrice = product.price; // personalization is free
  const displayTitle = DESIGN_TITLES[product.code] || product.name;
  const isNotecards = (product.catalogType === 'notecards' || Boolean(product.cardCount && !product.envelopeCount));
  const isCollection = (product.catalogType === 'collections' || product.category === 'christmas');

  const existingIndex = appState.cart.findIndex(
    item => !item.isCustomMade && 
            item.designCode === product.code && 
            item.sizeId === product.category &&
            Boolean(item.isCustomized) === Boolean(isCustomized) &&
            (item.customText || '') === trimmedText
  );

  if (existingIndex > -1) {
    appState.cart[existingIndex].quantity += qty;
    appState.cart[existingIndex].subtotal = appState.cart[existingIndex].quantity * appState.cart[existingIndex].unitPrice;
    appState.cart[existingIndex].productTitle = displayTitle;
    appState.cart[existingIndex].shortName = displayTitle;
  } else {
    const cartItem = {
      id: 'gallery_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      isCustomMade: false,
      categoryKey: isCollection ? 'collections' : (isNotecards ? 'notecards' : 'notepads'),
      categoryName: isCollection ? 'Christmas Collection' : (isNotecards ? 'Notecards' : 'Notepads'),
      sizeId: product.category,
      sizeName: product.sizeName,
      shortName: displayTitle,
      productTitle: displayTitle,
      dimensions: product.dimensions,
      hasSheets: !isNotecards && !isCollection,
      sheetCount: product.sheets || product.cardCount || 30,
      cardCount: product.cardCount || null,
      freePersonalization: true,
      designCode: product.code,
      imagePath: 'images/' + encodeURIComponent(product.code) + '.webp',
      isCustomized: isCustomized,
      customText: trimmedText,
      nameLabel: trimmedText,
      isTba: false,
      unitPrice: unitPrice,
      quantity: qty,
      subtotal: unitPrice * qty
    };
    appState.cart.push(cartItem);
  }

  renderCart();
  showCheckoutSection(false);
  const customNote = isCustomized ? ` for "${trimmedText}"` : '';
  showToast(`Added ${qty}× ${displayTitle} (${product.code})${customNote} to order.`);
}

function showCheckoutSection(scrollIntoView = false) {
  if (DOM.checkoutSection) {
    DOM.checkoutSection.style.display = 'block';
    if (scrollIntoView) {
      DOM.checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// --------------------------------------------------------------------------
// View-Switching Logic (Notepad Catalog vs. Custom Made Specification Form)
// --------------------------------------------------------------------------

function switchToCustomView() {
  // 1. Completely hide the Notepad Catalog view and CTA banner
  if (DOM.gallerySection) {
    DOM.gallerySection.style.display = 'none';
  }
  if (DOM.customOrderCtaBanner) {
    DOM.customOrderCtaBanner.style.display = 'none';
  }

  // 2. Display the Custom Made configuration form
  if (DOM.customOrderingSection) {
    DOM.customOrderingSection.style.display = 'block';
  }

  // 3. Ensure custom quantity starts at MOQ (3 pads)
  if (DOM.inputCustomQuantity && (!DOM.inputCustomQuantity.value || parseInt(DOM.inputCustomQuantity.value, 10) < 3)) {
    DOM.inputCustomQuantity.value = '3';
  }

  updateCustomPriceAndPreview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchToCatalogView() {
  // 1. Hide the Custom Made configuration form
  if (DOM.customOrderingSection) {
    DOM.customOrderingSection.style.display = 'none';
  }

  // 2. Restore the Notepad Catalog view (keep bottom CTA banner hidden)
  if (DOM.gallerySection) {
    DOM.gallerySection.style.display = 'block';
  }
  if (DOM.customOrderCtaBanner) {
    DOM.customOrderCtaBanner.style.display = 'none';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const openCustomOrderSection = switchToCustomView;
const closeCustomOrderSection = switchToCatalogView;

// ============================================================================
// 4. Dynamic Design Code Dropdown Population & Image Preview
// ============================================================================

function getDesignCodesForCurrentSelection() {
  const categoryData = PRODUCTS_DATA[appState.currentCategory];
  if (!categoryData) return [];

  const sizeObj = categoryData.sizes.find(s => s.id === appState.selectedSizeId);
  if (sizeObj && sizeObj.designs) {
    return sizeObj.designs;
  }

  if (appState.currentCategory === 'notepads' && appState.selectedSizeId === 'np-a5') {
    return A5_NOTEPAD_DESIGNS;
  }

  return [];
}

function populateDesignDropdown() {
  const designCodes = getDesignCodesForCurrentSelection();
  
  DOM.selectDesignCode.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Select Design Code --';
  DOM.selectDesignCode.appendChild(defaultOption);

  designCodes.forEach(code => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = code;
    DOM.selectDesignCode.appendChild(opt);
  });

  if (designCodes.includes(appState.selectedDesignCode)) {
    DOM.selectDesignCode.value = appState.selectedDesignCode;
  } else {
    appState.selectedDesignCode = '';
    DOM.selectDesignCode.value = '';
  }

  updatePreviewImage();
}

function updatePreviewImage() {
  const selectedCode = appState.selectedDesignCode;

  if (!DOM.designMockupImg) return;

  DOM.designMockupImg.loading = 'lazy';
  DOM.designMockupImg.decoding = 'async';

  if (!selectedCode) {
    DOM.designMockupImg.src = '';
    DOM.designMockupImg.alt = 'Select a design code to view preview';
    if (DOM.designDescriptionText) {
      DOM.designDescriptionText.textContent = 'Please select a design code to load the preview image.';
    }
    if (DOM.designPreviewCaption) {
      DOM.designPreviewCaption.textContent = 'Select a design code to preview';
    }
    return;
  }

  if (DOM.designDescriptionText) {
    DOM.designDescriptionText.textContent = `Previewing design code: ${selectedCode}`;
  }
  if (DOM.designPreviewCaption) {
    DOM.designPreviewCaption.textContent = `Design: ${selectedCode}`;
  }

  DOM.designMockupImg.alt = `Design Preview: ${selectedCode}`;

  DOM.designMockupImg.onerror = function() {
    this.onerror = null;
    this.alt = 'Image not found';
    if (DOM.designDescriptionText) {
      DOM.designDescriptionText.textContent = `Preview image for "${selectedCode}" could not be loaded.`;
    }
    if (DOM.designPreviewCaption) {
      DOM.designPreviewCaption.textContent = `Image not found for "${selectedCode}"`;
    }
  };

  DOM.designMockupImg.src = 'images/' + encodeURIComponent(selectedCode) + '.webp';
}

// ============================================================================
// 5. Category & Size Selection
// ============================================================================

function switchCategory(categoryKey) {
  if (!PRODUCTS_DATA[categoryKey]) return;
  
  appState.currentCategory = categoryKey;
  const categoryData = PRODUCTS_DATA[categoryKey];
  
  DOM.categoryTabs.forEach(tab => {
    const isCurrent = tab.dataset.category === categoryKey;
    tab.classList.toggle('active', isCurrent);
    tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  });

  if (DOM.categoryBadge) {
    DOM.categoryBadge.textContent = categoryData.categoryName;
  }

  if (DOM.sheetCountGroup) {
    DOM.sheetCountGroup.style.display = 'none';
  }

  renderSizeOptions();
  populateDesignDropdown();
  updatePricePreview();
}

function renderSizeOptions() {
  const categoryData = PRODUCTS_DATA[appState.currentCategory];
  DOM.sizeCardsGrid.innerHTML = '';

  if (!categoryData.sizes.some(s => s.id === appState.selectedSizeId)) {
    appState.selectedSizeId = categoryData.sizes[0].id;
  }

  DOM.sizeCardsGrid.className = `cards-grid ${categoryData.sizes.length === 3 ? 'three-col' : categoryData.sizes.length === 2 ? 'two-col' : ''}`;

  categoryData.sizes.forEach(size => {
    const isChecked = size.id === appState.selectedSizeId;
    
    const cardHtml = `
      <label class="radio-card-label" for="size-${size.id}">
        <input type="radio" name="sizeOption" id="size-${size.id}" value="${size.id}" class="radio-card-input" ${isChecked ? 'checked' : ''}>
        <div class="radio-card-content">
          <div class="spec-name">${size.name}</div>
        </div>
      </label>
    `;

    DOM.sizeCardsGrid.insertAdjacentHTML('beforeend', cardHtml);
  });

  DOM.sizeCardsGrid.querySelectorAll('input[name="sizeOption"]').forEach(input => {
    input.addEventListener('change', (e) => {
      appState.selectedSizeId = e.target.value;
      populateDesignDropdown();
      updatePricePreview();
    });
  });
}

// ============================================================================
// 6. Dynamic Price Calculation Engine
// ============================================================================

const CUSTOM_NOTEPAD_CONFIG = {
  square: {
    id: 'square',
    name: 'Square Notepad (3 × 3 Inches)',
    dimensions: '3 × 3 in',
    basePrice: 29,
    baseSheets: 30,
    perSheetRate: 1.50
  },
  a6: {
    id: 'a6',
    name: 'A6 Notepad (4 × 5.8 Inches)',
    dimensions: '4 × 5.8 in',
    basePrice: 49,
    baseSheets: 30,
    perSheetRate: 2.00
  },
  a5: {
    id: 'a5',
    name: 'A5 Notepad (5.8 × 8.3 Inches)',
    dimensions: '5.8 × 8.3 in',
    basePrice: 99,
    baseSheets: 30,
    perSheetRate: 4.00
  }
};

const CUSTOM_NOTECARD_CONFIG = {
  'nc-2x35': {
    id: 'nc-2x35',
    name: '2×3.5 in Notecards (220 gsm)',
    dimensions: '2 × 3.5 in',
    basePrice: 89,
    baseCount: 24,
    perCardRate: 5.00,
    unitName: 'cards'
  },
  'nc-4x3': {
    id: 'nc-4x3',
    name: '4×3 in Notecards (220 gsm)',
    dimensions: '4 × 3 in',
    basePrice: 129,
    baseCount: 24,
    perCardRate: 7.00,
    unitName: 'cards'
  }
};

function calculateCustomNotepadPrice(sizeKey, sheetCount) {
  const config = CUSTOM_NOTEPAD_CONFIG[sizeKey] || CUSTOM_NOTEPAD_CONFIG.square;
  const count = parseInt(sheetCount, 10);
  const validCount = (!isNaN(count) && count >= 30) ? count : 30;
  const extraSheets = Math.max(0, validCount - 30);
  const extraCost = extraSheets * config.perSheetRate;
  const totalPrice = config.basePrice + extraCost;

  let breakdown = `Base: ₱${config.basePrice.toFixed(2)} (30 sheets)`;
  if (extraSheets > 0) {
    breakdown += ` + ${extraSheets} extra sheets (₱${config.perSheetRate.toFixed(2)}/sh = ₱${extraCost.toFixed(2)})`;
  }

  return {
    config,
    sheetCount: validCount,
    extraSheets,
    basePrice: config.basePrice,
    perSheetRate: config.perSheetRate,
    extraCost,
    totalPrice,
    breakdownText: breakdown
  };
}

function calculateCustomNotecardPrice(sizeKey, cardCount) {
  const config = (sizeKey === 'nc-4x3' || sizeKey === '4x3') ? CUSTOM_NOTECARD_CONFIG['nc-4x3'] : CUSTOM_NOTECARD_CONFIG['nc-2x35'];
  const count = parseInt(cardCount, 10);
  const validCount = (!isNaN(count) && count >= config.baseCount) ? count : config.baseCount;
  const extraCards = Math.max(0, validCount - config.baseCount);
  const extraCost = extraCards * config.perCardRate;
  const totalPrice = config.basePrice + extraCost;

  let breakdown = `Base: ₱${config.basePrice.toFixed(2)} (${config.baseCount} pcs)`;
  if (extraCards > 0) {
    breakdown += ` + ${extraCards} extra cards (₱${config.perCardRate.toFixed(2)}/card = ₱${extraCost.toFixed(2)})`;
  }

  return {
    config,
    cardCount: validCount,
    extraCards,
    basePrice: config.basePrice,
    perCardRate: config.perCardRate,
    extraCost,
    totalPrice,
    breakdownText: breakdown
  };
}

function handleCustomCategoryChange() {
  const category = DOM.selectCustomCategory ? DOM.selectCustomCategory.value : 'notepads';
  const sizeSelect = DOM.selectCustomNotepadSize;
  const countInput = DOM.inputCustomSheetCount;

  if (category === 'notecards') {
    if (DOM.customSectionTitle) DOM.customSectionTitle.textContent = 'Custom Order Specification';
    if (DOM.labelCustomSize) DOM.labelCustomSize.innerHTML = 'NOTECARD SIZE FORMAT <span class="required-star">*</span>';
    if (DOM.labelCustomCount) DOM.labelCustomCount.innerHTML = 'CARD COUNT (MIN. 24 PCS) <span class="required-star">*</span>';

    if (sizeSelect) {
      sizeSelect.innerHTML = `
        <option value="nc-2x35" selected>2×3.5 Inches (24 pcs per pack | 220 gsm) — ₱89.00</option>
        <option value="nc-4x3">4×3 Inches (24 pcs per pack | 220 gsm) — ₱129.00</option>
      `;
    }

    if (countInput) {
      countInput.min = '24';
      countInput.value = '24';
      countInput.placeholder = 'Minimum 24 cards';
    }

    if (DOM.customTermsList) {
      DOM.customTermsList.innerHTML = `
        <li><strong>Minimum Order Quantity (MOQ):</strong> 3 packs per size per design.</li>
        <li><strong>Lead Time:</strong> 2-3 business days production upon payment confirmation.</li>
        <li><strong>Custom Layout Fee:</strong> ₱100.00 / revision (quoted separately for complex branding or custom illustrations).</li>
        <li><strong>Premium Cardstock:</strong> 220 gsm heavy textured stationery cardstock with free personalization.</li>
        <li><strong>Free Customization:</strong> Names, monograms, initials, or occasion text printed on every card at no surcharge.</li>
        <li><strong>Strict Payment Terms:</strong> 100% full payment is required before customized printing commences.</li>
      `;
    }
  } else {
    if (DOM.customSectionTitle) DOM.customSectionTitle.textContent = 'Custom Order Specification';
    if (DOM.labelCustomSize) DOM.labelCustomSize.innerHTML = 'NOTEPAD SIZE FORMAT <span class="required-star">*</span>';
    if (DOM.labelCustomCount) DOM.labelCustomCount.innerHTML = 'PREFERRED SHEET COUNT <span class="required-star">*</span>';

    if (sizeSelect) {
      sizeSelect.innerHTML = `
        <option value="square" selected>Square Notepad (3 × 3 Inches) — Base: ₱29 (30 sheets)</option>
        <option value="a6">A6 Notepad (4 × 5.8 Inches) — Base: ₱49 (30 sheets)</option>
        <option value="a5">A5 Notepad (5.8 × 8.3 Inches) — Base: ₱99 (30 sheets)</option>
      `;
    }

    if (countInput) {
      countInput.min = '30';
      countInput.value = '30';
      countInput.placeholder = 'Minimum 30 sheets';
    }

    if (DOM.customTermsList) {
      DOM.customTermsList.innerHTML = `
        <li><strong>Minimum Order Quantity (MOQ):</strong> 3 pads per size per design.</li>
        <li><strong>Lead Time:</strong> 2-3 business days production upon payment confirmation.</li>
        <li><strong>Custom Layout Fee:</strong> ₱100.00 / revision (quoted separately for complex branding or custom illustrations).</li>
        <li><strong>Strict Payment Terms:</strong> 100% full payment is required before customized printing commences.</li>
      `;
    }
  }

  updateCustomPriceAndPreview();
}

function updateCustomPriceAndPreview() {
  if (!DOM.selectCustomNotepadSize) return;

  const category = DOM.selectCustomCategory ? DOM.selectCustomCategory.value : 'notepads';
  const sizeKey = DOM.selectCustomNotepadSize.value || (category === 'notecards' ? 'nc-2x35' : 'square');
  const rawCount = DOM.inputCustomSheetCount ? DOM.inputCustomSheetCount.value : (category === 'notecards' ? '24' : '30');
  const instructions = DOM.textareaCustomInstructions ? DOM.textareaCustomInstructions.value.trim() : '';

  if (category === 'notecards') {
    const priceCalc = calculateCustomNotecardPrice(sizeKey, rawCount);

    // Update Dynamic Pricing Preview
    if (DOM.customUnitPriceDisplay) {
      DOM.customUnitPriceDisplay.textContent = `₱${priceCalc.totalPrice.toFixed(2)}`;
    }
    if (DOM.customPriceBreakdownDisplay) {
      DOM.customPriceBreakdownDisplay.textContent = priceCalc.breakdownText;
    }
    if (DOM.customSizeRateHint) {
      DOM.customSizeRateHint.textContent = `Extra cards: +₱${priceCalc.perCardRate.toFixed(2)} per card beyond ${priceCalc.config.baseCount} cards`;
    }
    if (DOM.customSheetCountHint) {
      if (priceCalc.extraCards > 0) {
        DOM.customSheetCountHint.textContent = `${priceCalc.config.baseCount} base + ${priceCalc.extraCards} extra cards (+₱${priceCalc.extraCost.toFixed(2)})`;
      } else {
        DOM.customSheetCountHint.textContent = `Base pack includes ${priceCalc.config.baseCount} cards (220 gsm)`;
      }
    }

    // Update 1:1 Live Preview Canvas
    if (DOM.customPreviewSizeBadge) {
      DOM.customPreviewSizeBadge.textContent = priceCalc.config.name;
    }
    if (DOM.customPreviewSheetsBadge) {
      DOM.customPreviewSheetsBadge.textContent = `${priceCalc.cardCount} Cards (220 gsm)${priceCalc.extraCards > 0 ? ` (+${priceCalc.extraCards})` : ''}`;
    }
    if (DOM.customPreviewInstructionsText) {
      if (instructions) {
        DOM.customPreviewInstructionsText.textContent = `"${instructions}"`;
        DOM.customPreviewInstructionsText.style.fontStyle = 'normal';
        DOM.customPreviewInstructionsText.style.color = 'var(--brand-black)';
      } else {
        DOM.customPreviewInstructionsText.textContent = 'Enter your notecard design motif, name/monogram personalization, font styles, or reference details...';
        DOM.customPreviewInstructionsText.style.fontStyle = 'italic';
        DOM.customPreviewInstructionsText.style.color = '#888888';
      }
    }
    if (DOM.customPreviewPriceTag) {
      DOM.customPreviewPriceTag.textContent = `₱${priceCalc.totalPrice.toFixed(2)} / pack`;
    }
  } else {
    const priceCalc = calculateCustomNotepadPrice(sizeKey, rawCount);

    // Update Dynamic Pricing Preview
    if (DOM.customUnitPriceDisplay) {
      DOM.customUnitPriceDisplay.textContent = `₱${priceCalc.totalPrice.toFixed(2)}`;
    }
    if (DOM.customPriceBreakdownDisplay) {
      DOM.customPriceBreakdownDisplay.textContent = priceCalc.breakdownText;
    }
    if (DOM.customSizeRateHint) {
      DOM.customSizeRateHint.textContent = `Extra sheets: +₱${priceCalc.perSheetRate.toFixed(2)} per sheet beyond 30 sheets`;
    }
    if (DOM.customSheetCountHint) {
      if (priceCalc.extraSheets > 0) {
        DOM.customSheetCountHint.textContent = `30 base + ${priceCalc.extraSheets} extra sheets (+₱${priceCalc.extraCost.toFixed(2)})`;
      } else {
        DOM.customSheetCountHint.textContent = `Base includes 30 sheets`;
      }
    }

    // Update 1:1 Live Preview Canvas
    if (DOM.customPreviewSizeBadge) {
      DOM.customPreviewSizeBadge.textContent = priceCalc.config.name;
    }
    if (DOM.customPreviewSheetsBadge) {
      DOM.customPreviewSheetsBadge.textContent = `${priceCalc.sheetCount} Sheets${priceCalc.extraSheets > 0 ? ` (+${priceCalc.extraSheets})` : ''}`;
    }
    if (DOM.customPreviewInstructionsText) {
      if (instructions) {
        DOM.customPreviewInstructionsText.textContent = `"${instructions}"`;
        DOM.customPreviewInstructionsText.style.fontStyle = 'normal';
        DOM.customPreviewInstructionsText.style.color = 'var(--brand-black)';
      } else {
        DOM.customPreviewInstructionsText.textContent = 'Enter your design motif, color preferences, font styles, text, or reference details...';
        DOM.customPreviewInstructionsText.style.fontStyle = 'italic';
        DOM.customPreviewInstructionsText.style.color = '#888888';
      }
    }
    if (DOM.customPreviewPriceTag) {
      DOM.customPreviewPriceTag.textContent = `₱${priceCalc.totalPrice.toFixed(2)} / pc`;
    }
  }
}

function calculateCurrentItemPrice() {
  const categoryData = PRODUCTS_DATA[appState.currentCategory];
  
  if (categoryData.isTba) {
    return {
      isTba: true,
      unitPrice: 0,
      breakdownText: 'Price: To Be Announced (Custom Quotation)',
      displayPrice: 'TBA'
    };
  }

  const sizeObj = categoryData.sizes.find(s => s.id === appState.selectedSizeId);
  if (!sizeObj || !sizeObj.prices) {
    return {
      isTba: false,
      isPendingSelection: true,
      unitPrice: 0,
      breakdownText: 'Please select a size format',
      displayPrice: 'Select Size'
    };
  }

  const sheetCount = '30';
  appState.selectedSheetCount = '30';
  const basePrice = sizeObj.prices['30'];

  if (basePrice === undefined) {
    return {
      isTba: false,
      isPendingSelection: true,
      unitPrice: 0,
      breakdownText: 'Please select a size format',
      displayPrice: 'Select Size'
    };
  }
  
  const customFee = appState.isCustomized ? CUSTOMIZATION_FEE : 0;
  const finalUnitPrice = basePrice + customFee;

  let breakdown = `Base: ₱${basePrice.toFixed(2)} (${sheetCount} sheets)`;
  if (appState.isCustomized) {
    breakdown += ` + Personalization: ₱${CUSTOMIZATION_FEE.toFixed(2)}`;
  }

  return {
    isTba: false,
    isPendingSelection: false,
    basePrice: basePrice,
    customFee: customFee,
    unitPrice: finalUnitPrice,
    breakdownText: breakdown,
    displayPrice: `₱${finalUnitPrice.toFixed(2)}`
  };
}

function updatePricePreview() {
  const priceInfo = calculateCurrentItemPrice();
  
  if (priceInfo.isTba) {
    DOM.currentUnitPrice.textContent = 'TBA';
    DOM.currentUnitPrice.className = 'price-preview-value tba';
    DOM.currentPriceBreakdown.textContent = priceInfo.breakdownText;
  } else if (priceInfo.isPendingSelection) {
    DOM.currentUnitPrice.textContent = priceInfo.displayPrice;
    DOM.currentUnitPrice.className = 'price-preview-value awaiting';
    DOM.currentPriceBreakdown.textContent = priceInfo.breakdownText;
  } else {
    DOM.currentUnitPrice.textContent = priceInfo.displayPrice;
    DOM.currentUnitPrice.className = 'price-preview-value';
    DOM.currentPriceBreakdown.textContent = priceInfo.breakdownText;
  }
}

// ============================================================================
// 7. Order Item Cart Management
// ============================================================================

function addCustomItemToCart() {
  const category = DOM.selectCustomCategory ? DOM.selectCustomCategory.value : 'notepads';
  const sizeKey = DOM.selectCustomNotepadSize ? DOM.selectCustomNotepadSize.value : (category === 'notecards' ? 'nc-2x35' : 'square');
  const countInput = DOM.inputCustomSheetCount ? parseInt(DOM.inputCustomSheetCount.value, 10) : (category === 'notecards' ? 24 : 30);
  const instructions = DOM.textareaCustomInstructions ? DOM.textareaCustomInstructions.value.trim() : '';
  let qty = DOM.inputCustomQuantity ? parseInt(DOM.inputCustomQuantity.value, 10) : 3;

  if (category === 'notecards') {
    const minCards = 24;
    if (isNaN(countInput) || countInput < minCards) {
      showToast(`Preferred card count must be at least ${minCards} cards.`);
      if (DOM.inputCustomSheetCount) {
        DOM.inputCustomSheetCount.focus();
        const parent = document.getElementById('groupCustomSheetCount');
        if (parent) parent.classList.add('has-error');
      }
      return;
    }
  } else {
    if (isNaN(countInput) || countInput < 30) {
      showToast('Preferred sheet count must be at least 30 sheets.');
      if (DOM.inputCustomSheetCount) {
        DOM.inputCustomSheetCount.focus();
        const parent = document.getElementById('groupCustomSheetCount');
        if (parent) parent.classList.add('has-error');
      }
      return;
    }
  }

  if (!instructions) {
    showToast('Please provide design/layout instructions before adding to order.');
    if (DOM.textareaCustomInstructions) {
      DOM.textareaCustomInstructions.focus();
      const parent = document.getElementById('groupCustomInstructions');
      if (parent) parent.classList.add('has-error');
    }
    return;
  }

  // Minimum Order Quantity (MOQ): 3 packs per size per design
  if (isNaN(qty) || qty < 3) {
    qty = 3;
    if (DOM.inputCustomQuantity) {
      DOM.inputCustomQuantity.value = '3';
    }
  }

  if (category === 'notecards') {
    const priceCalc = calculateCustomNotecardPrice(sizeKey, countInput);

    const customCartItem = {
      id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      isCustomMade: true,
      categoryKey: 'notecards',
      categoryName: 'Custom Notecard',
      sizeId: sizeKey,
      sizeName: priceCalc.config.name,
      shortName: `Custom ${priceCalc.config.name.split('(')[0].trim()}`,
      dimensions: priceCalc.config.dimensions,
      hasSheets: false,
      sheetCount: priceCalc.cardCount,
      cardCount: priceCalc.cardCount,
      extraCards: priceCalc.extraCards,
      rate: priceCalc.perCardRate,
      instructions: instructions,
      designCode: 'CUSTOM_NOTECARD',
      isCustomized: true,
      freePersonalization: true,
      customText: instructions,
      isTba: false,
      unitPrice: priceCalc.totalPrice,
      quantity: qty,
      subtotal: priceCalc.totalPrice * qty
    };

    appState.cart.push(customCartItem);
    renderCart();
    showCheckoutSection(false);
    showToast(`Added ${qty}× ${customCartItem.sizeName} (${priceCalc.cardCount} cards) to order.`);
  } else {
    const priceCalc = calculateCustomNotepadPrice(sizeKey, countInput);

    const customCartItem = {
      id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      isCustomMade: true,
      categoryKey: 'notepads',
      categoryName: 'Custom Notepad',
      sizeId: sizeKey,
      sizeName: priceCalc.config.name,
      shortName: `Custom ${priceCalc.config.name.split('(')[0].trim()}`,
      dimensions: priceCalc.config.dimensions,
      hasSheets: true,
      sheetCount: priceCalc.sheetCount,
      extraSheets: priceCalc.extraSheets,
      rate: priceCalc.perSheetRate,
      instructions: instructions,
      designCode: 'CUSTOM_LAYOUT',
      isCustomized: false,
      customText: instructions,
      isTba: false,
      unitPrice: priceCalc.totalPrice,
      quantity: qty,
      subtotal: priceCalc.totalPrice * qty
    };

    appState.cart.push(customCartItem);
    renderCart();
    showCheckoutSection(false);
    showToast(`Added ${qty}× ${customCartItem.sizeName} (${priceCalc.sheetCount} sheets) to order.`);
  }

  if (DOM.inputCustomQuantity) {
    DOM.inputCustomQuantity.value = '3';
  }
}

function addItemToCart() {
  if (!appState.selectedDesignCode) {
    showToast('Please select a Design Code before adding to order.');
    if (DOM.selectDesignCode) DOM.selectDesignCode.focus();
    return;
  }

  const categoryData = PRODUCTS_DATA[appState.currentCategory];
  const sizeObj = categoryData.sizes.find(s => s.id === appState.selectedSizeId) || categoryData.sizes[0];
  const priceInfo = calculateCurrentItemPrice();
  const qty = parseInt(DOM.inputQuantity.value, 10) || 1;

  if (qty <= 0) {
    showToast('Please enter a valid quantity of 1 or more.');
    return;
  }

  if (appState.isCustomized && !DOM.inputCustomText.value.trim()) {
    showToast('Please enter the custom name/text to be printed.');
    DOM.inputCustomText.focus();
    return;
  }

  const displayTitle = DESIGN_TITLES[appState.selectedDesignCode] || sizeObj.shortName || sizeObj.name;

  const cartItem = {
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    categoryKey: appState.currentCategory,
    categoryName: categoryData.categoryName,
    sizeId: sizeObj.id,
    sizeName: sizeObj.name,
    shortName: displayTitle,
    productTitle: displayTitle,
    dimensions: sizeObj.dimensions,
    hasSheets: categoryData.hasSheets,
    sheetCount: categoryData.hasSheets ? appState.selectedSheetCount : null,
    designCode: appState.selectedDesignCode,
    imagePath: 'images/' + encodeURIComponent(appState.selectedDesignCode) + '.webp',
    isCustomized: appState.isCustomized,
    customText: appState.isCustomized ? DOM.inputCustomText.value.trim() : '',
    isTba: priceInfo.isTba,
    unitPrice: priceInfo.unitPrice,
    quantity: qty,
    subtotal: priceInfo.isTba ? 0 : (priceInfo.unitPrice * qty)
  };

  appState.cart.push(cartItem);
  renderCart();
  showCheckoutSection(false);
  showToast(`Added ${qty}× ${cartItem.shortName} (${cartItem.designCode}) to order.`);

  DOM.inputQuantity.value = '1';
}

function removeCartItem(itemId) {
  appState.cart = appState.cart.filter(item => item.id !== itemId);
  renderCart();
  showToast('Item removed from order.');
}

// ----------------------------------------------------------------------------
// Order totals, free-tag promo and envelope minimum
// ----------------------------------------------------------------------------
function peso(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeOrderTotals() {
  const productTotal = appState.cart.reduce((sum, item) => sum + (item.isTba ? 0 : (item.subtotal || 0)), 0);
  const envelopePcs = appState.cart
    .filter(item => item.categoryKey === 'envelopes')
    .reduce((sum, item) => sum + (item.quantity || 0), 0);
  const envelopeShort = (envelopePcs > 0 && envelopePcs < ENVELOPE_MIN_PCS) ? (ENVELOPE_MIN_PCS - envelopePcs) : 0;

  let freeTags = 0;
  let nextTier = null;
  if (FREE_TAGS_PROMO_ON) {
    const tier = FREE_TAG_TIERS.find(t => productTotal >= t.minTotal);
    freeTags = tier ? tier.tags : 0;
    const higher = FREE_TAG_TIERS
      .filter(t => t.minTotal > productTotal)
      .sort((a, b) => a.minTotal - b.minTotal)[0];
    if (higher) nextTier = { gap: higher.minTotal - productTotal, tags: higher.tags };
  }
  return { productTotal, envelopePcs, envelopeShort, freeTags, nextTier };
}

// Lines with the same design, size and paper are shown together, with one row per name.
function groupCartItems() {
  const groups = [];
  const byKey = {};
  appState.cart.forEach(item => {
    const key = [item.categoryKey, item.designCode, item.sizeId, item.paperQuality || '', item.unitPrice].join('|');
    if (!byKey[key]) {
      byKey[key] = { key, first: item, items: [], quantity: 0, subtotal: 0 };
      groups.push(byKey[key]);
    }
    byKey[key].items.push(item);
    byKey[key].quantity += item.quantity || 0;
    byKey[key].subtotal += item.isTba ? 0 : (item.subtotal || 0);
  });
  return groups;
}

function cartItemNameLabel(item) {
  const label = (item.nameLabel || (item.isCustomized ? item.customText : '') || '').trim();
  return label;
}

function cartGroupSpec(item) {
  if (item.categoryKey === 'envelopes') return `Sold per piece • ${peso(item.unitPrice)} / pc`;
  if (item.categoryKey === 'hardbound') return `${item.dimensions} • 70 sheets • Free cover personalization`;
  if (item.hasSheets) return `${item.dimensions} • ${item.sheetCount} sheets • Free personalization`;
  if (item.cardCount || item.categoryKey === 'notecards') return `${item.dimensions || ''} • ${item.cardCount || 24} pcs (220 gsm) • Free personalization`;
  return item.dimensions || '';
}

function renderPromoAndChecks(totals) {
  const hint = document.getElementById('promoHint');
  if (hint) {
    let text = '';
    if (FREE_TAGS_PROMO_ON && appState.cart.length > 0) {
      if (totals.freeTags > 0 && totals.nextTier) {
        text = `🎁 You get <strong>${totals.freeTags} FREE ${FREE_ITEM_NAME}</strong>. Add ${peso(totals.nextTier.gap)} more to get ${totals.nextTier.tags}.`;
      } else if (totals.freeTags > 0) {
        text = `🎁 You get <strong>${totals.freeTags} FREE ${FREE_ITEM_NAME}</strong> with this order!`;
      } else if (totals.nextTier) {
        text = `🎁 Add <strong>${peso(totals.nextTier.gap)} more</strong> to get ${totals.nextTier.tags} FREE ${FREE_ITEM_NAME}.`;
      }
    }
    hint.innerHTML = text;
    hint.style.display = text ? 'block' : 'none';
  }

  const warn = document.getElementById('envelopeMinWarning');
  if (warn) {
    if (totals.envelopeShort > 0) {
      warn.innerHTML = `✉️ Money envelopes have a minimum of <strong>${ENVELOPE_MIN_PCS} pcs per order</strong>. You have ${totals.envelopePcs}. Please add ${totals.envelopeShort} more (any design or paper).`;
      warn.style.display = 'block';
    } else {
      warn.innerHTML = '';
      warn.style.display = 'none';
    }
  }
}

function renderCart() {
  const totalUnits = appState.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const groups = groupCartItems();
  const totals = computeOrderTotals();

  if (DOM.headerCartCount) DOM.headerCartCount.textContent = totalUnits;
  if (DOM.cartCountBadge) {
    DOM.cartCountBadge.textContent = `${groups.length} Item${groups.length === 1 ? '' : 's'}${totalUnits > 0 ? ` (${totalUnits} pcs)` : ''}`;
  }

  renderPromoAndChecks(totals);

  if (appState.cart.length === 0) {
    if (DOM.emptyCartState) DOM.emptyCartState.style.display = 'block';
    if (DOM.cartItemsList) {
      DOM.cartItemsList.style.display = 'none';
      DOM.cartItemsList.innerHTML = '';
    }
    if (DOM.summarySubtotalAmount) DOM.summarySubtotalAmount.textContent = peso(0);
    if (DOM.summaryGrandTotal) DOM.summaryGrandTotal.textContent = peso(0);
    return;
  }

  if (DOM.emptyCartState) DOM.emptyCartState.style.display = 'none';
  if (DOM.cartItemsList) {
    DOM.cartItemsList.style.display = 'flex';
    DOM.cartItemsList.innerHTML = '';
  }
  if (DOM.checkoutSection) DOM.checkoutSection.style.display = 'block';

  groups.forEach(group => {
    const item = group.first;
    const card = document.createElement('div');
    card.className = 'cart-item-card cart-group-card';

    const fallbackSvg = getProductMockupSvg(item.designCode, item.shortName || item.designCode, item.sizeId, 'Floral');
    const displayTitle = item.productTitle || DESIGN_TITLES[item.designCode] || item.shortName || '';

    const nameRows = group.items.map(line => {
      const label = cartItemNameLabel(line);
      const labelHtml = label
        ? `<span class="cart-name-label">✨ ${escapeHtml(label)}</span>`
        : `<span class="cart-name-label cart-name-none">No name</span>`;
      return `
        <li class="cart-name-row">
          ${labelHtml}
          <span class="cart-name-qty">${line.quantity} × ${peso(line.unitPrice)}</span>
          <span class="cart-name-sub">${peso(line.subtotal)}</span>
          <button type="button" class="cart-name-remove" onclick="window.removeCartItem('${line.id}')" title="Remove this name" aria-label="Remove ${escapeHtml(label || 'this line')}">✕</button>
        </li>`;
    }).join('');

    card.innerHTML = `
      <div class="cart-item-main">
        <div class="cart-item-thumb-wrapper">
          <img src="images/${encodeURIComponent(item.designCode)}.webp" alt="${escapeHtml(item.designCode)}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${fallbackSvg}';">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${escapeHtml(item.sizeName)}</div>
          <div class="cart-item-design-badge">Design: <strong>${escapeHtml(item.designCode)}</strong>${displayTitle ? ` — ${escapeHtml(displayTitle)}` : ''}</div>
          <div class="cart-item-spec-line">${escapeHtml(cartGroupSpec(item))}</div>
        </div>
      </div>
      <ul class="cart-name-list" aria-label="Names for this design">${nameRows}</ul>
      <div class="cart-item-footer">
        <div class="cart-item-qty-price">${group.quantity} pc${group.quantity === 1 ? '' : 's'}${group.items.length > 1 ? ` · ${group.items.length} names` : ''}</div>
        <span class="cart-item-subtotal">${peso(group.subtotal)}</span>
      </div>
    `;
    DOM.cartItemsList.appendChild(card);
  });

  if (totals.freeTags > 0) {
    const tagCard = document.createElement('div');
    tagCard.className = 'cart-item-card cart-free-tags-card';
    tagCard.innerHTML = `
      <div class="cart-free-tags-main">
        <span class="cart-free-tags-icon" aria-hidden="true">🎁</span>
        <div>
          <div class="cart-item-title">FREE ${FREE_ITEM_NAME} · ${totals.freeTags} pcs</div>
          <div class="cart-item-spec-line">Christmas promo. We'll message you for the names.</div>
        </div>
      </div>
      <span class="cart-item-subtotal">${peso(0)}</span>
    `;
    DOM.cartItemsList.appendChild(tagCard);
  }

  if (DOM.summarySubtotalAmount) DOM.summarySubtotalAmount.textContent = peso(totals.productTotal);
  if (DOM.summaryGrandTotal) DOM.summaryGrandTotal.textContent = peso(totals.productTotal);
}

window.removeCartItem = removeCartItem;

// ============================================================================
// 8. Customer Form Validation & Sync
// ============================================================================

function syncCustomerSummaryDisplay() {
  const courierVal = DOM.selectCourier.value;
  DOM.summaryCourierDisplay.textContent = courierVal ? courierVal : 'Not Selected';

  const paymentVal = DOM.selectPayment.value;
  DOM.summaryPaymentDisplay.textContent = paymentVal ? paymentVal : 'Not Selected';

  if (DOM.summaryOrderTypeDisplay && DOM.selectOrderType) {
    const val = DOM.selectOrderType.value;
    if (!val || val === 'Select Order Type') {
      DOM.summaryOrderTypeDisplay.textContent = 'Not Selected';
    } else if (val.includes('Custom Made')) {
      DOM.summaryOrderTypeDisplay.textContent = 'Custom Made';
    } else {
      DOM.summaryOrderTypeDisplay.textContent = 'Regular Purchase';
    }
  }
}

function updateOrderTypeVisibility() {
  if (!DOM.selectOrderType) return;

  const val = DOM.selectOrderType.value;
  const isCustom = val.includes('Custom Made');
  const isRegular = val.includes('Regular Purchase');
  const isUnselected = !val || val === 'Select Order Type';

  if (isUnselected) {
    // Hide ALL product specification fields, custom fields, quantity selectors, and preview sections.
    // Only customer information / order details above this field should remain visible.
    if (DOM.productSelectionCard) DOM.productSelectionCard.style.display = 'none';
    if (DOM.standardOrderingSection) DOM.standardOrderingSection.style.display = 'none';
    if (DOM.customOrderingSection) DOM.customOrderingSection.style.display = 'none';
  } else if (isRegular) {
    // Reveal standard order form (Notepad Size, Design Code dropdown, 1:1 Square Design Preview, Quantity, Courier, Payment Method).
    // Hide all custom-made input fields and the custom terms banner.
    if (DOM.productSelectionCard) DOM.productSelectionCard.style.display = 'block';
    if (DOM.standardOrderingSection) DOM.standardOrderingSection.style.display = 'block';
    if (DOM.customOrderingSection) DOM.customOrderingSection.style.display = 'none';

    if (DOM.productCardTitle) DOM.productCardTitle.textContent = 'Product & Design Selection';
    if (DOM.productCardSubtitle) DOM.productCardSubtitle.textContent = 'Choose stationery category, size format, motif, and personalization';
  } else if (isCustom) {
    // Reveal custom ordering form (Custom Notepad Size, Preferred Sheets, Instructions, 1:1 Square Preview, Dynamic Price, Quantity, Add to Cart).
    // Hide all standard-only form sections.
    if (DOM.productSelectionCard) DOM.productSelectionCard.style.display = 'block';
    if (DOM.standardOrderingSection) DOM.standardOrderingSection.style.display = 'none';
    if (DOM.customOrderingSection) DOM.customOrderingSection.style.display = 'block';

    if (DOM.productCardTitle) DOM.productCardTitle.textContent = 'Custom Made Notepad Specification';
    if (DOM.productCardSubtitle) DOM.productCardSubtitle.textContent = 'Configure custom size, sheets, layout instructions, and preview';

    if (DOM.inputCustomQuantity && (!DOM.inputCustomQuantity.value || parseInt(DOM.inputCustomQuantity.value, 10) < 3)) {
      DOM.inputCustomQuantity.value = '3';
    }

    updateCustomPriceAndPreview();
  }

  syncCustomerSummaryDisplay();
}

function validateCustomerForm() {
  let isValid = true;

  const fields = [
    { el: DOM.inputFullName, group: 'groupFullName', validator: val => val.trim().length > 1 },
    { el: DOM.inputContactNumber, group: 'groupContactNumber', validator: val => val.trim().length >= 7 },
    { el: DOM.inputSocialHandle, group: 'groupSocialHandle', validator: val => val.trim().length > 1 },
    { el: DOM.selectCourier, group: 'groupCourier', validator: val => Boolean(val) },
    { el: DOM.inputAddress, group: 'groupAddress', validator: val => val.trim().length > 5 },
    { el: DOM.selectPayment, group: 'groupPayment', validator: val => Boolean(val) },
    { el: DOM.selectOrderType, group: 'groupOrderType', validator: val => Boolean(val) && val !== 'Select Order Type' }
  ];

  fields.forEach(field => {
    if (!field.el) return;
    const parentGroup = document.getElementById(field.group);
    if (!parentGroup) return;
    const passed = field.validator(field.el.value);
    
    if (!passed) {
      isValid = false;
      parentGroup.classList.add('has-error');
    } else {
      parentGroup.classList.remove('has-error');
    }
  });

  return isValid;
}

function attachValidationClearListeners() {
  const inputs = [
    { el: DOM.inputFullName, group: 'groupFullName' },
    { el: DOM.inputContactNumber, group: 'groupContactNumber' },
    { el: DOM.inputSocialHandle, group: 'groupSocialHandle' },
    { el: DOM.selectCourier, group: 'groupCourier' },
    { el: DOM.inputAddress, group: 'groupAddress' },
    { el: DOM.selectPayment, group: 'groupPayment' },
    { el: DOM.selectOrderType, group: 'groupOrderType' },
    { el: DOM.inputCustomSheetCount, group: 'groupCustomSheetCount' },
    { el: DOM.textareaCustomInstructions, group: 'groupCustomInstructions' }
  ];

  inputs.forEach(item => {
    if (!item.el) return;
    const handler = () => {
      const parent = document.getElementById(item.group);
      if (parent) parent.classList.remove('has-error');
      syncCustomerSummaryDisplay();
    };
    item.el.addEventListener('input', handler);
    item.el.addEventListener('change', handler);
  });
}

// ============================================================================
// 9. Job Order Slip Generation, PDF Output & Google Sheets Submission
// ============================================================================

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateReferenceNumber() {
  const currentYear = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PRNT-${currentYear}-${randomNum}`;
}

function orderGroupNamesText(group) {
  const named = group.items.filter(line => cartItemNameLabel(line));
  if (named.length === 0) return '';
  return group.items.map(line => {
    const label = cartItemNameLabel(line) || 'No name';
    return `${label} ×${line.quantity}`;
  }).join(', ');
}

// Builds the simplified order summary that is shown in the modal and saved as an image.
function buildJobOrderSlip(refNo) {
  const totals = computeOrderTotals();
  const groups = groupCartItems();
  const dateText = new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const c = appState.customer;

  const itemRows = groups.map(group => {
    const item = group.first;
    const title = item.productTitle || DESIGN_TITLES[item.designCode] || item.shortName || '';
    const names = group.items.map(line => {
      const label = cartItemNameLabel(line);
      return label ? `${escapeHtml(label)} <span class="os-muted">×${line.quantity}</span>` : `<span class="os-muted">No name ×${line.quantity}</span>`;
    }).join('<br>');
    return `
      <tr>
        <td><strong>${escapeHtml(item.sizeName)}</strong><br><span class="os-muted">${escapeHtml(item.designCode)}${title ? ` · ${escapeHtml(title)}` : ''}</span></td>
        <td>${names}</td>
        <td class="os-num">${group.quantity}</td>
        <td class="os-num">${peso(group.subtotal)}</td>
      </tr>`;
  }).join('');

  const freeRow = totals.freeTags > 0 ? `
      <tr class="os-free-row">
        <td><strong>🎁 FREE ${FREE_ITEM_NAME}</strong><br><span class="os-muted">Christmas promo</span></td>
        <td><span class="os-muted">We'll message you for the names</span></td>
        <td class="os-num">${totals.freeTags}</td>
        <td class="os-num">${peso(0)}</td>
      </tr>` : '';

  const slip = DOM.printableJobOrderSlip || document.getElementById('printableJobOrderSlip');
  slip.innerHTML = `
    <div class="os-sheet" id="orderSummarySheet">
      <div class="os-head">
        <div class="os-brand brand-name-word">Printelio</div>
        <div class="os-ref">
          <div class="os-ref-label">Order Summary</div>
          <div class="os-ref-num" id="joReferenceNumber">${escapeHtml(refNo)}</div>
          <div class="os-muted">${escapeHtml(dateText)}</div>
        </div>
      </div>

      <div class="os-customer">
        <div><span>Name</span><strong>${escapeHtml(c.fullName)}</strong></div>
        <div><span>Contact</span><strong>${escapeHtml(c.contactNumber)}</strong></div>
        <div><span>Facebook / IG</span><strong>${escapeHtml(c.socialHandle)}</strong></div>
        <div><span>Courier</span><strong>${escapeHtml(c.courier)}</strong></div>
        <div><span>Payment</span><strong>${escapeHtml(c.payment)}</strong></div>
        <div class="os-wide"><span>Address</span><strong>${escapeHtml(c.address)}</strong></div>
      </div>

      <table class="os-items">
        <thead><tr><th>Item</th><th>Names</th><th class="os-num">Qty</th><th class="os-num">Amount</th></tr></thead>
        <tbody>${itemRows}${freeRow}</tbody>
      </table>

      <div class="os-total"><span>Total</span><strong>${peso(totals.productTotal)}</strong></div>
      <p class="os-ship">Shipping fee not yet included.</p>
      <p class="os-pay">Payment details will be sent privately to your Facebook/IG or contact number. Please include <strong>${escapeHtml(refNo)}</strong> when you send your proof of payment. We start printing once payment is confirmed.</p>
    </div>`;

  return totals.productTotal;
}

// Saves the order summary as a PNG image (replaces the old PDF download).
async function downloadOrderSummaryImage() {
  const btn = document.getElementById('btnDownloadImage');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = '⏳ Saving image...'; btn.disabled = true; }
  let holder = null;
  try {
    const sheet = document.getElementById('orderSummarySheet');
    if (!sheet) throw new Error('Order summary not found');
    if (typeof window.html2canvas === 'undefined') throw new Error('html2canvas is not loaded');
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* ignore */ } }

    // Render a fixed-width copy off-screen so phones and desktops produce the same image.
    holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:600px;background:#ffffff;z-index:-1;';
    const clone = sheet.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('os-export');
    holder.appendChild(clone);
    document.body.appendChild(holder);
    await new Promise(r => setTimeout(r, 100));

    const canvas = await window.html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false, width: 600, windowWidth: 1024 });
    const refNo = (sheet.querySelector('.os-ref-num')?.textContent || 'Order').trim();
    const fileName = `Printelio_Order_${refNo}.png`;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Image could not be created');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast('Order summary saved as an image.');
  } catch (err) {
    console.error('Error saving image:', err);
    showToast('Could not save the image automatically. Please take a screenshot of your order summary.');
  } finally {
    if (holder && holder.parentNode) holder.parentNode.removeChild(holder);
    if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
  }
}

// Plain-text lines for the Google Sheet "orderItems" column (names and free tags included).
function buildSheetOrderItemsText(totals) {
  const lines = groupCartItems().map((group, idx) => {
    const item = group.first;
    const title = item.productTitle || DESIGN_TITLES[item.designCode] || '';
    const names = orderGroupNamesText(group);
    return `${idx + 1}. ${item.sizeName} - Design: ${item.designCode}${title ? ` ("${title}")` : ''}${names ? ` | Names: ${names}` : ''} | Qty: ${group.quantity} | ${peso(group.subtotal)}`;
  });
  if (totals.freeTags > 0) {
    lines.push(`${lines.length + 1}. FREE ${FREE_ITEM_NAME} (promo, ask buyer for names) | Qty: ${totals.freeTags} | ${peso(0)}`);
  }
  return lines.join('\n');
}

async function submitJobOrder() {
  if (appState.cart.length === 0) {
    showToast('Your order is empty. Please add items before submitting.');
    if (DOM.productGalleryGrid) DOM.productGalleryGrid.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const totals = computeOrderTotals();
  if (totals.envelopeShort > 0) {
    renderPromoAndChecks(totals);
    showToast(`Money envelopes need at least ${ENVELOPE_MIN_PCS} pcs per order. Please add ${totals.envelopeShort} more.`);
    const warn = document.getElementById('envelopeMinWarning');
    if (warn) warn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const isFormValid = validateCustomerForm();
  if (!isFormValid) {
    showToast('Please complete all required customer details.');
    DOM.customerDetailsCard.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  appState.customer = {
    fullName: DOM.inputFullName.value.trim(),
    contactNumber: DOM.inputContactNumber.value.trim(),
    socialHandle: DOM.inputSocialHandle.value.trim(),
    courier: DOM.selectCourier.value,
    address: DOM.inputAddress.value.trim(),
    payment: DOM.selectPayment.value,
    orderType: 'Regular Purchase',
    isCustomMade: false
  };

  const refNo = generateReferenceNumber();
  const grandTotal = buildJobOrderSlip(refNo);
  DOM.jobOrderModal.classList.add('active');

  const originalSubmitText = DOM.btnSubmitOrder ? DOM.btnSubmitOrder.innerHTML : '';
  if (DOM.btnSubmitOrder) {
    DOM.btnSubmitOrder.disabled = true;
    DOM.btnSubmitOrder.innerHTML = '<span>⏳ Submitting Order...</span>';
  }

  try {
    const uniqueDesignCodes = [...new Set(appState.cart.map(item => {
      const title = item.productTitle || DESIGN_TITLES[item.designCode];
      return title ? `${item.designCode} (${title})` : item.designCode;
    }))].join(', ');

    const sheetPayload = {
      fullName: appState.customer.fullName,
      contactNumber: appState.customer.contactNumber,
      socialHandle: appState.customer.socialHandle,
      courier: appState.customer.courier,
      address: appState.customer.address,
      paymentMethod: appState.customer.payment,
      orderType: `Regular Purchase | Ref: ${refNo}`,
      customSpecifications: totals.freeTags > 0 ? `FREE ${FREE_ITEM_NAME}: ${totals.freeTags}` : '',
      designMotif: uniqueDesignCodes,
      orderItems: `Ref: ${refNo}\n` + buildSheetOrderItemsText(totals),
      totalPrice: peso(grandTotal)
    };

    await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sheetPayload)
    });

    showToast('Order submitted! Please save your order summary image.');
  } catch (sheetError) {
    console.error('Google Sheets submission error:', sheetError);
    showToast(`Order ${refNo} created. Please save or screenshot your order summary.`);
  } finally {
    if (DOM.btnSubmitOrder) {
      DOM.btnSubmitOrder.disabled = false;
      DOM.btnSubmitOrder.innerHTML = originalSubmitText || 'Submit Order';
    }
  }
}

function closeModal() {
  DOM.jobOrderModal.classList.remove('active');
}

// ============================================================================
// 9b. Image Preview Lightbox (Modal)
// ============================================================================

function openImageLightbox(imageSrc, title, code) {
  if (!DOM.imageLightboxModal || !DOM.lightboxPreviewImage) return;

  DOM.lightboxPreviewImage.loading = 'lazy';
  DOM.lightboxPreviewImage.decoding = 'async';
  DOM.lightboxPreviewImage.src = imageSrc;
  DOM.lightboxPreviewImage.alt = title ? `${title} Preview` : 'Enlarged Product Preview';

  if (DOM.lightboxCode) {
    if (code) {
      DOM.lightboxCode.textContent = code;
      DOM.lightboxCode.style.display = 'inline-block';
    } else {
      DOM.lightboxCode.style.display = 'none';
    }
  }

  if (DOM.lightboxTitle) {
    DOM.lightboxTitle.textContent = title || '';
  }

  DOM.imageLightboxModal.style.display = 'flex';
  void DOM.imageLightboxModal.offsetWidth; // Force layout recalculation for smooth CSS animation
  DOM.imageLightboxModal.classList.add('active');
  DOM.imageLightboxModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeImageLightbox() {
  if (!DOM.imageLightboxModal) return;

  DOM.imageLightboxModal.classList.remove('active');
  DOM.imageLightboxModal.setAttribute('aria-hidden', 'true');

  setTimeout(() => {
    if (DOM.imageLightboxModal && !DOM.imageLightboxModal.classList.contains('active')) {
      DOM.imageLightboxModal.style.display = 'none';
      if (DOM.lightboxPreviewImage) {
        DOM.lightboxPreviewImage.src = '';
      }
    }
  }, 250);

  // Restore scroll behavior only if jobOrderModal is also closed
  if (!DOM.jobOrderModal || !DOM.jobOrderModal.classList.contains('active')) {
    document.body.style.overflow = '';
  }
}

function startNewOrder() {
  closeModal();
  appState.cart = [];
  renderCart();
  if (DOM.customerForm) DOM.customerForm.reset();
  if (DOM.checkoutSection) DOM.checkoutSection.style.display = 'none';
  switchToCatalogView();
  switchMainCatalog(appState.currentCatalog || 'hardbound');
  syncCustomerSummaryDisplay();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('Ready for a new order.');
}

// ============================================================================
// 10. Toast Notifications
// ============================================================================

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// 11. Event Listeners & Bootstrapping
// ============================================================================

function initEventListeners() {
  // Main Catalog Switcher (Collections vs Notepads vs Notecards)
  if (DOM.btnCatalogCollections) {
    DOM.btnCatalogCollections.addEventListener('click', () => switchMainCatalog('collections'));
  }
  if (DOM.btnCatalogNotepads) {
    DOM.btnCatalogNotepads.addEventListener('click', () => switchMainCatalog('notepads'));
  }
  if (DOM.btnCatalogNotecards) {
    DOM.btnCatalogNotecards.addEventListener('click', () => switchMainCatalog('notecards'));
  }
  if (DOM.btnCatalogEnvelopes) DOM.btnCatalogEnvelopes.addEventListener('click', () => switchMainCatalog('envelopes'));
  if (DOM.btnCatalogHardbound) DOM.btnCatalogHardbound.addEventListener('click', () => switchMainCatalog('hardbound'));

  // Mobile Navigation Drawer Toggle and Links
  if (DOM.btnMobileMenuToggle) {
    DOM.btnMobileMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });
  }
  if (DOM.btnMobileNavClose) {
    DOM.btnMobileNavClose.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu(false);
    });
  }
  if (DOM.mobileNavBackdrop) {
    DOM.mobileNavBackdrop.addEventListener('click', () => {
      toggleMobileMenu(false);
    });
  }
  if (DOM.btnMobileCatalogCollections) {
    DOM.btnMobileCatalogCollections.addEventListener('click', () => {
      switchMainCatalog('collections');
      toggleMobileMenu(false);
    });
  }
  if (DOM.btnMobileCatalogNotepads) {
    DOM.btnMobileCatalogNotepads.addEventListener('click', () => {
      switchMainCatalog('notepads');
      toggleMobileMenu(false);
    });
  }
  if (DOM.btnMobileCatalogNotecards) {
    DOM.btnMobileCatalogNotecards.addEventListener('click', () => {
      switchMainCatalog('notecards');
      toggleMobileMenu(false);
    });
  }
  if (DOM.btnMobileCatalogEnvelopes) DOM.btnMobileCatalogEnvelopes.addEventListener('click', () => { switchMainCatalog('envelopes'); toggleMobileMenu(false); });
  if (DOM.btnMobileCatalogHardbound) DOM.btnMobileCatalogHardbound.addEventListener('click', () => { switchMainCatalog('hardbound'); toggleMobileMenu(false); });
  if (DOM.btnMobileCustomOrder) {
    DOM.btnMobileCustomOrder.addEventListener('click', () => {
      switchToCustomView();
      toggleMobileMenu(false);
    });
  }

  // Gallery Category Tabs (Christmas for Collections | 3x3, A6, A5 for Notepads | 2x3.5, 4x3 for Notecards)
  if (DOM.tabChristmas) {
    DOM.tabChristmas.addEventListener('click', () => switchGalleryCategory('christmas'));
  }
  if (DOM.tab3x3) {
    DOM.tab3x3.addEventListener('click', () => switchGalleryCategory('3x3'));
  }
  if (DOM.tabA6) {
    DOM.tabA6.addEventListener('click', () => switchGalleryCategory('A6'));
  }
  if (DOM.tabA5) {
    DOM.tabA5.addEventListener('click', () => switchGalleryCategory('A5'));
  }
  if (DOM.tab2x35) {
    DOM.tab2x35.addEventListener('click', () => switchGalleryCategory('2x3.5'));
  }
  if (DOM.tab4x3) {
    DOM.tab4x3.addEventListener('click', () => switchGalleryCategory('4x3'));
  }

  // Header Actions
  if (DOM.btnHeaderCustom) {
    DOM.btnHeaderCustom.addEventListener('click', () => {
      switchToCustomView();
    });
  }
  if (DOM.btnHeaderCart) {
    DOM.btnHeaderCart.addEventListener('click', () => {
      showCheckoutSection(true);
    });
  }

  // Custom CTA Banner & Navigation Controls
  if (DOM.btnOpenCustomOrder) {
    DOM.btnOpenCustomOrder.addEventListener('click', () => {
      switchToCustomView();
    });
  }
  if (DOM.btnBackToCatalog) {
    DOM.btnBackToCatalog.addEventListener('click', () => {
      switchToCatalogView();
    });
  }
  if (DOM.btnCloseCustomSection) {
    DOM.btnCloseCustomSection.addEventListener('click', () => {
      switchToCatalogView();
    });
  }

  // Legacy Tabs & Controls (Safely guarded)
  if (DOM.tabNotepads) DOM.tabNotepads.addEventListener('click', () => switchCategory('notepads'));
  if (DOM.tabNotecards) DOM.tabNotecards.addEventListener('click', () => switchCategory('notecards'));
  if (DOM.tabEnvelopes) DOM.tabEnvelopes.addEventListener('click', () => switchCategory('envelopes'));

  if (DOM.radioSheet30) {
    DOM.radioSheet30.addEventListener('change', () => {
      appState.selectedSheetCount = '30';
      updatePricePreview();
    });
  }

  if (DOM.selectDesignCode) {
    DOM.selectDesignCode.addEventListener('change', (e) => {
      appState.selectedDesignCode = e.target.value;
      updatePreviewImage();
    });
  }

  if (DOM.checkCustomization) {
    DOM.checkCustomization.addEventListener('change', (e) => {
      appState.isCustomized = e.target.checked;
      DOM.customizationContainer.classList.toggle('active', appState.isCustomized);
      DOM.customInputsCollapse.classList.toggle('show', appState.isCustomized);
      updatePricePreview();
    });
  }

  if (DOM.btnQtyMinus) {
    DOM.btnQtyMinus.addEventListener('click', () => {
      let current = parseInt(DOM.inputQuantity.value, 10) || 1;
      if (current > 1) {
        DOM.inputQuantity.value = current - 1;
      }
    });
  }

  if (DOM.btnQtyPlus) {
    DOM.btnQtyPlus.addEventListener('click', () => {
      let current = parseInt(DOM.inputQuantity.value, 10) || 1;
      DOM.inputQuantity.value = current + 1;
    });
  }

  if (DOM.btnAddToCart) {
    DOM.btnAddToCart.addEventListener('click', addItemToCart);
  }
  if (DOM.btnSubmitOrder) {
    DOM.btnSubmitOrder.addEventListener('click', submitJobOrder);
  }

  // Custom Made Form Event Listeners (Preserved & Expanded)
  if (DOM.selectCustomCategory) {
    DOM.selectCustomCategory.addEventListener('change', handleCustomCategoryChange);
  }
  if (DOM.selectCustomNotepadSize) {
    DOM.selectCustomNotepadSize.addEventListener('change', updateCustomPriceAndPreview);
  }
  if (DOM.inputCustomSheetCount) {
    DOM.inputCustomSheetCount.addEventListener('input', updateCustomPriceAndPreview);
    DOM.inputCustomSheetCount.addEventListener('change', updateCustomPriceAndPreview);
  }
  if (DOM.textareaCustomInstructions) {
    DOM.textareaCustomInstructions.addEventListener('input', updateCustomPriceAndPreview);
  }
  if (DOM.btnCustomQtyMinus) {
    DOM.btnCustomQtyMinus.addEventListener('click', () => {
      let current = parseInt(DOM.inputCustomQuantity.value, 10) || 3;
      if (current > 3) {
        DOM.inputCustomQuantity.value = current - 1;
      } else {
        DOM.inputCustomQuantity.value = 3;
      }
    });
  }
  if (DOM.btnCustomQtyPlus) {
    DOM.btnCustomQtyPlus.addEventListener('click', () => {
      let current = parseInt(DOM.inputCustomQuantity.value, 10) || 3;
      if (current < 3) current = 3;
      DOM.inputCustomQuantity.value = current + 1;
    });
  }
  if (DOM.inputCustomQuantity) {
    DOM.inputCustomQuantity.addEventListener('change', () => {
      let current = parseInt(DOM.inputCustomQuantity.value, 10);
      if (isNaN(current) || current < 3) {
        DOM.inputCustomQuantity.value = 3;
      }
    });
  }
  if (DOM.btnAddCustomToCart) {
    DOM.btnAddCustomToCart.addEventListener('click', addCustomItemToCart);
  }

  if (DOM.selectOrderType) {
    DOM.selectOrderType.addEventListener('change', () => {
      updateOrderTypeVisibility();
    });
  }

  if (DOM.btnCloseModal) {
    DOM.btnCloseModal.addEventListener('click', closeModal);
  }
  if (DOM.btnDoneOrder) {
    DOM.btnDoneOrder.addEventListener('click', startNewOrder);
  }
  
  const downloadBtn = document.getElementById('btnDownloadImage');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadOrderSummaryImage);
  }

  if (DOM.jobOrderModal) {
    DOM.jobOrderModal.addEventListener('click', (e) => {
      if (e.target === DOM.jobOrderModal) {
        closeModal();
      }
    });
  }

  // Image Preview Lightbox Event Listeners
  // Trigger 1: Clicking the Close button (×)
  if (DOM.btnCloseImageLightbox) {
    DOM.btnCloseImageLightbox.addEventListener('click', (e) => {
      e.stopPropagation();
      closeImageLightbox();
    });
  }

  // Trigger 2: Clicking anywhere on the dark backdrop overlay (outside the image content)
  if (DOM.imageLightboxBackdrop) {
    DOM.imageLightboxBackdrop.addEventListener('click', () => {
      closeImageLightbox();
    });
  }

  if (DOM.imageLightboxModal) {
    DOM.imageLightboxModal.addEventListener('click', (e) => {
      if (e.target.closest('#btnCloseImageLightbox') || !e.target.closest('#imageLightboxContent')) {
        closeImageLightbox();
      }
    });
  }

  // Trigger 3: Pressing the 'Escape' key on the keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (DOM.imageLightboxModal && DOM.imageLightboxModal.classList.contains('active')) {
        closeImageLightbox();
      } else if (DOM.jobOrderModal && DOM.jobOrderModal.classList.contains('active')) {
        closeModal();
      }
    }
  });

  attachValidationClearListeners();
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Landing page: Hardbound Notepads
  switchMainCatalog('hardbound');

  // 2. Promo banner (FREE notecards)
  const promoBanner = document.getElementById('promoBanner');
  if (promoBanner) {
    promoBanner.textContent = PROMO_BANNER_TEXT;
    promoBanner.style.display = FREE_TAGS_PROMO_ON ? '' : 'none';
  }

  // 3. Render cart (updates badge count and sets up initial view)
  renderCart();

  // 4. Attach event listeners
  initEventListeners();
});

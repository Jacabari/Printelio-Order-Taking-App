/**
 * Printelio - Custom Stationery Order Request Application
 * Integration: Google Sheets Transmission, order summary image (drawn directly on a canvas),
 * Dynamic Design Code Filtering, Mockup Preview, Dynamic Pricing & Cart Management.
 */

// ============================================================================
// 0. Google Sheets Web App Endpoint Configuration
// ============================================================================

// Product photo version: change this number whenever you replace a photo that keeps the same file name,
// so returning visitors download the new picture instead of an old cached one.
const IMG_VERSION = '20261114-3';

const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyQ63JdM0NYWq62f1ps1yv3CH6WvjKBW4nnKtxeaLuglPb-zg171kAjerHR86Nnh5OmJQ/exec";

// ============================================================================
// 1. Data Models & Constants
// ============================================================================

// ---------------------------------------------------------------------------
// Christmas promo (free items based on the product total, shipping not included).
// - Set FREE_PROMO_ON to false to switch it off right away.
// - It also switches itself off automatically after PROMO_END_DATE (Philippine time).
// - Tiers: highest first. Each tier lists everything the customer gets (not added on top of lower tiers).
// ---------------------------------------------------------------------------
const FREE_PROMO_ON = true;
const PROMO_END_DATE = new Date('2026-12-12T23:59:59+08:00'); // Dec 12, 2026, 11:59:59 PM Philippine time
const PROMO_TIERS = [
  { minTotal: 999, items: [
    { qty: 12, unit: 'pcs', name: '2×3.5 notecards' },
    { qty: 8,  unit: 'pcs', name: '4×3 notecards' },
    { qty: 1,  unit: '',    name: 'A6 notepad' }
  ] },
  { minTotal: 299, items: [
    { qty: 12, unit: 'pcs', name: '2×3.5 notecards' }
  ] }
];
const PROMO_BANNER_TEXT = '🎁 FREE 12 pcs 2×3.5 notecards on orders ₱299+ · ₱999+ also gets 8 pcs 4×3 notecards + 1 A6 notepad · Until December 12';

function isPromoActive() {
  return FREE_PROMO_ON && Date.now() <= PROMO_END_DATE.getTime();
}
function promoItemsText(items) {
  return items.map(it => `${it.qty}${it.unit ? ' ' + it.unit : ''} ${it.name}`).join(' + ');
}

// Money envelopes are sold per piece, minimum 5 pieces per order (premium and standard can be mixed).
// Money envelopes are sold per piece, no minimum order.
// Volume price: 5 or more pieces of the SAME paper (any designs/names combined) get the lower price per piece.
const ENVELOPE_PRICES = { premium: 20, standard: 15 };          // regular price per piece
const ENVELOPE_BULK_PRICES = { premium: 16, standard: 12 };     // price per piece at 5+ pcs
const ENVELOPE_BULK_MIN = 5;
const ENVELOPE_MIN_PCS = 1; // no minimum order
const ENVELOPE_PAPER_LABEL = { premium: 'Premium', standard: 'Standard' };

function envelopePcsByPaper() {
  const pcs = { premium: 0, standard: 0 };
  appState.cart.forEach(item => { if (item.categoryKey === 'envelopes') pcs[item.paperQuality] = (pcs[item.paperQuality] || 0) + (item.quantity || 0); });
  return pcs;
}
// Recomputes envelope prices in the cart (called on every cart change, so adding/removing updates the discount).
function applyEnvelopePricing() {
  const pcs = envelopePcsByPaper();
  appState.cart.forEach(item => {
    if (item.categoryKey !== 'envelopes') return;
    const bulk = pcs[item.paperQuality] >= ENVELOPE_BULK_MIN;
    item.unitPrice = bulk ? ENVELOPE_BULK_PRICES[item.paperQuality] : ENVELOPE_PRICES[item.paperQuality];
    item.bulkPrice = bulk;
    item.subtotal = item.unitPrice * item.quantity;
  });
}

// ============================================================================
// 1b. Gallery Catalog & Category Specifications
// ============================================================================

const CATEGORY_SPECS = {
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
  // Christmas designs (shared by the Christmas notecards and Christmas money envelopes)
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
  'NP_A6_FLR_1': 'Wildflower Border',
  'NP_A6_FLR_2': 'Midnight Blooms',
  'NP_A6_FLR_3': 'Dusty Blue Leaves',
  'NP_A6_PET_4': 'Ginger Kitty',
  'NP_A6_PET_5': 'Meow Kitty Pile',
  'NP_A6_PET_6': 'Lilac Puppies',
  'NP_A6_PET_7': 'Corgi Donut',
  'NP_A6_PET_8': 'Boho Puppy',
  'NP_A6_PET_9': 'Hamster Hideout',
  'NP_A6_PET_10': 'Pink Gingham Kitty',
  'NP_A6_PET_11': 'Calico Banner',
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

  {
    code: 'NP_A6_FLR_1',
    name: 'Wildflower Border',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Floral',
    motif: 'Colorful Wildflower Frame'
  },
  {
    code: 'NP_A6_FLR_2',
    name: 'Midnight Blooms',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Floral',
    motif: 'Navy Floral Header'
  },
  {
    code: 'NP_A6_FLR_3',
    name: 'Dusty Blue Leaves',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Floral',
    motif: 'Dusty Blue Leaf Trim'
  },
  {
    code: 'NP_A6_PET_4',
    name: 'Ginger Kitty',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Pets',
    motif: 'Orange Tabby Kitten'
  },
  {
    code: 'NP_A6_PET_5',
    name: 'Meow Kitty Pile',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Pets',
    motif: 'Stacked Kittens & Meow Lettering'
  },
  {
    code: 'NP_A6_PET_6',
    name: 'Lilac Puppies',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Pets',
    motif: 'Two Puppies on Lavender & Pink'
  },
  {
    code: 'NP_A6_PET_7',
    name: 'Corgi Donut',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Pets',
    motif: 'Corgi in a Pink Donut'
  },
  {
    code: 'NP_A6_PET_8',
    name: 'Boho Puppy',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Pets',
    motif: 'Earthy Boho Abstract Puppy'
  },
  {
    code: 'NP_A6_PET_9',
    name: 'Hamster Hideout',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Pets',
    motif: 'Peeking Hamster'
  },
  {
    code: 'NP_A6_PET_10',
    name: 'Pink Gingham Kitty',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Pets',
    motif: 'Pink Gingham & White Kitty'
  },
  {
    code: 'NP_A6_PET_11',
    name: 'Calico Banner',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 59.00,
    tag: 'Pets',
    motif: 'Calico Cat & Yellow Notes Banner'
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
  currentCatalog: 'hardbound', // 'hardbound' | 'notepads' | 'notecards' | 'envelopes'
  activeGalleryTab: 'hardbound', // 'hardbound' | '3x3' | 'A6' | 'A5' | '2x3.5' | '4x3' | 'wedding-envelopes'
  cart: [],
  customer: {},
  lastOrder: null,
  orderImage: null,
  pendingOrder: null, // same order being retried after a failed send (keeps its reference number)
  submitting: false
};

// ============================================================================
// 3. DOM Elements Cache
// ============================================================================

const DOM = {
  btnCatalogEnvelopes: document.getElementById('btnCatalogEnvelopes'),
  btnCatalogHardbound: document.getElementById('btnCatalogHardbound'),
  btnCatalogNotecards: document.getElementById('btnCatalogNotecards'),
  btnCatalogNotepads: document.getElementById('btnCatalogNotepads'),
  btnCloseImageLightbox: document.getElementById('btnCloseImageLightbox'),
  btnDoneOrder: document.getElementById('btnDoneOrder'),
  btnHeaderCart: document.getElementById('btnHeaderCart'),
  btnMobileCatalogEnvelopes: document.getElementById('btnMobileCatalogEnvelopes'),
  btnMobileCatalogHardbound: document.getElementById('btnMobileCatalogHardbound'),
  btnMobileCatalogNotecards: document.getElementById('btnMobileCatalogNotecards'),
  btnMobileCatalogNotepads: document.getElementById('btnMobileCatalogNotepads'),
  btnMobileMenuToggle: document.getElementById('btnMobileMenuToggle'),
  btnMobileNavClose: document.getElementById('btnMobileNavClose'),
  btnSubmitOrder: document.getElementById('btnSubmitOrder'),
  cartCountBadge: document.getElementById('cartCountBadge'),
  cartItemsList: document.getElementById('cartItemsList'),
  categorySpecPill: document.getElementById('categorySpecPill'),
  categorySpecText: document.getElementById('categorySpecText'),
  categoryTabs: document.querySelectorAll('#categoryTabs .tab-btn'),
  categoryTabsContainer: document.getElementById('categoryTabsContainer'),
  customerForm: document.getElementById('customerForm'),
  emptyCartState: document.getElementById('emptyCartState'),
  gallerySectionSubtitle: document.getElementById('gallerySectionSubtitle'),
  gallerySectionTitle: document.getElementById('gallerySectionTitle'),
  headerCartCount: document.getElementById('headerCartCount'),
  imageLightboxBackdrop: document.getElementById('imageLightboxBackdrop'),
  imageLightboxModal: document.getElementById('imageLightboxModal'),
  inputAddress: document.getElementById('inputAddress'),
  inputContactNumber: document.getElementById('inputContactNumber'),
  inputFullName: document.getElementById('inputFullName'),
  inputSocialHandle: document.getElementById('inputSocialHandle'),
  jobOrderModal: document.getElementById('jobOrderModal'),
  lightboxCode: document.getElementById('lightboxCode'),
  lightboxPreviewImage: document.getElementById('lightboxPreviewImage'),
  lightboxTitle: document.getElementById('lightboxTitle'),
  mobileNavBackdrop: document.getElementById('mobileNavBackdrop'),
  mobileNavDrawer: document.getElementById('mobileNavDrawer'),
  productGalleryGrid: document.getElementById('productGalleryGrid'),
  selectCourier: document.getElementById('selectCourier'),
  selectPayment: document.getElementById('selectPayment'),
  summaryGrandTotal: document.getElementById('summaryGrandTotal'),
  tab2x35: document.getElementById('tab2x35'),
  tab3x3: document.getElementById('tab3x3'),
  tab4x3: document.getElementById('tab4x3'),
  tabA5: document.getElementById('tabA5'),
  tabA6: document.getElementById('tabA6'),
  toastContainer: document.getElementById('toastContainer')
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

  let headerColor = '#cb6ce6';
  let accentBadge = '#ffde59';
  let iconEmoji = '📝';

  if (tag.includes('Teacher') || code.includes('_TD')) {
    iconEmoji = '🍎';
    headerColor = '#e76f51';
  } else if (tag.includes('Christmas')) {
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
// Name length limits (characters) for the text printed on each product.
const HARDBOUND_NAME_LIMITS = { A6: 15, A5: 20 };
const NOTEPAD_NAME_LIMITS = { '3x3': 10, 'A6': 10, 'A5': 10 };
const NOTECARD_NAME_LIMITS = { '2x3.5': 15, '4x3': 20 };
const ENVELOPE_NAME_LIMIT = 20;

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
  counter.classList.toggle('over-limit', el.value.length > el.maxLength);
});

let envelopeCardUpdaters = []; // refresh each envelope card's price when the cart changes
function refreshEnvelopeCardPrices() { envelopeCardUpdaters.forEach(fn => fn()); }
function renderWeddingEnvelopeGallery() {
  if (!DOM.productGalleryGrid) return;
  envelopeCardUpdaters = [];
  DOM.productGalleryGrid.innerHTML = '';
  DOM.productGalleryGrid.classList.add('wme-gallery');
  WEDDING_ENVELOPE_GROUPS.forEach(group => {
    const card = document.createElement('article');
    card.className = 'product-card wme-card';
    card.innerHTML = `
      <div class="wme-heading"><h3>${group.title}</h3><span>${group.codes.length} designs</span></div>
      <div class="wme-preview">
        <button type="button" class="wme-arrow wme-prev" aria-label="Previous design">‹</button>
        <button type="button" class="wme-image-button" aria-label="Enlarge selected design"><img class="wme-image" src="images/${group.codes[0]}.webp?v=${IMG_VERSION}" alt="${WEDDING_ENVELOPE_TITLES[group.codes[0]]}" loading="lazy"></button>
        <button type="button" class="wme-arrow wme-next" aria-label="Next design">›</button>
      </div>
      <div class="wme-selected" aria-live="polite"></div>
      <div class="wme-thumbnails" aria-label="Choose envelope design"></div>
      <div class="wme-form">
        <div class="wme-section-label">Paper</div>
        <div class="wme-paper-options">
          <label><input type="radio" name="paper_${group.id}" value="premium" checked> Premium 108 gsm · ₱${ENVELOPE_PRICES.premium} (₱${ENVELOPE_BULK_PRICES.premium} for 5+)</label>
          <label><input type="radio" name="paper_${group.id}" value="standard"> Standard 80 gsm · ₱${ENVELOPE_PRICES.standard} (₱${ENVELOPE_BULK_PRICES.standard} for 5+)</label>
        </div>
        ${group.id === 'monogram' ? '<label class="wme-field">Monogram (2 letters, free) <input class="wme-monogram" maxlength="2" placeholder="e.g. JM" autocomplete="off" required></label>' : ''}
        <label class="wme-field">${group.id === 'christmas' ? 'Names (free, 1 or 2 names)' : 'Names (free)'} <input class="wme-names wme-counted" maxlength="${ENVELOPE_NAME_LIMIT}" placeholder="${group.id === 'christmas' ? 'e.g. Julia or Julia & Marco' : 'e.g. Julia & Marco'}" autocomplete="off" required></label>
        <div class="wme-char-count" aria-live="polite">0/${ENVELOPE_NAME_LIMIT}</div>
        ${group.id === 'christmas' ? '' : '<label class="wme-field">Wedding date <input class="wme-date" maxlength="80" placeholder="e.g. December 12, 2026" autocomplete="off" required></label>'}
        <p class="wme-error" role="alert" hidden></p>
      </div>
      <div class="product-card-footer">
        <div class="product-card-footer-top"><div><div class="product-price wme-price">₱${ENVELOPE_PRICES.premium.toFixed(2)}</div><small class="wme-price-note">per piece · ₱${ENVELOPE_BULK_PRICES.premium} each for 5+</small></div>
          <div class="card-qty-stepper"><button type="button" class="card-qty-btn wme-minus" aria-label="Decrease pieces">−</button><input class="card-qty-input wme-qty" type="number" min="1" max="200" value="1" aria-label="Number of envelopes"><button type="button" class="card-qty-btn wme-plus" aria-label="Increase pieces">+</button></div>
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
      image.src = `images/${code}.webp?v=${IMG_VERSION}`;
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
      const thumb = document.createElement('img'); thumb.src = `images/${code}.webp?v=${IMG_VERSION}`; thumb.alt = '';
      thumb.loading = 'lazy'; button.appendChild(thumb);
      button.addEventListener('click', () => selectDesign(i, true));
      thumbs.appendChild(button);
    });
    card.querySelector('.wme-prev').addEventListener('click', () => selectDesign(index - 1, true));
    card.querySelector('.wme-next').addEventListener('click', () => selectDesign(index + 1, true));
    card.querySelector('.wme-image-button').addEventListener('click', () => {
      const code = group.codes[index];
      openImageLightbox(`images/${code}.webp?v=${IMG_VERSION}`, WEDDING_ENVELOPE_TITLES[code], code);
    });
    const priceNote = card.querySelector('.wme-price-note');
    // Card price: regular price, or the 5+ price when this quantity (plus what's already in the cart for this paper) reaches 5.
    const updateEnvelopePrice = () => {
      const paper = selectedPaper();
      const total = (parseInt(qty.value, 10) || 1) + (envelopePcsByPaper()[paper] || 0);
      const bulk = total >= ENVELOPE_BULK_MIN;
      price.textContent = `₱${(bulk ? ENVELOPE_BULK_PRICES[paper] : ENVELOPE_PRICES[paper]).toFixed(2)}`;
      priceNote.textContent = bulk ? `per piece · 5+ price` : `per piece · ₱${ENVELOPE_BULK_PRICES[paper]} each for 5+`;
    };
    envelopeCardUpdaters.push(() => { if (card.isConnected) updateEnvelopePrice(); });
    card.querySelectorAll('.wme-paper-options input').forEach(radio => radio.addEventListener('change', updateEnvelopePrice));
    const clampQty = () => { qty.value = String(Math.min(200, Math.max(1, parseInt(qty.value,10) || 1))); return Number(qty.value); };
    card.querySelector('.wme-minus').addEventListener('click', () => { qty.value = Math.max(1,clampQty()-1); updateEnvelopePrice(); });
    card.querySelector('.wme-plus').addEventListener('click', () => { qty.value = Math.min(200,clampQty()+1); updateEnvelopePrice(); });
    qty.addEventListener('change', () => { clampQty(); updateEnvelopePrice(); });
    qty.addEventListener('input', updateEnvelopePrice);
    const addBtn = card.querySelector('.wme-add');
    addBtn.addEventListener('click', () => {
      const monogramInput = card.querySelector('.wme-monogram');
      const monogram = monogramInput ? monogramInput.value.trim().toUpperCase() : '';
      const names = card.querySelector('.wme-names').value.trim();
      const dateInput = card.querySelector('.wme-date');
      const date = dateInput ? dateInput.value.trim() : '';
      let invalid = null;
      if (monogramInput && !/^[A-Z]{2}$/.test(monogram)) invalid = monogramInput;
      else if (!names || names.length > ENVELOPE_NAME_LIMIT) invalid = card.querySelector('.wme-names');
      else if (dateInput && !date) invalid = dateInput;
      if (invalid) {
        error.hidden = false;
        error.textContent = invalid === monogramInput ? 'Please enter exactly two letters for the monogram.'
          : (invalid.classList.contains('wme-names') && names.length > ENVELOPE_NAME_LIMIT ? `Names can be up to ${ENVELOPE_NAME_LIMIT} characters only.` : 'Please complete all personalization fields.');
        invalid.focus(); return;
      }
      error.hidden = true;
      const code = group.codes[index], paper = selectedPaper(), count = clampQty();
      const customText = [monogram ? `Monogram: ${monogram}` : '', `Names: ${names}`, dateInput ? `Wedding date: ${date}` : ''].filter(Boolean).join(' | ');
      const existing = appState.cart.find(item => item.categoryKey === 'envelopes' && item.designCode === code && item.paperQuality === paper && item.customText === customText);
      if (existing) { existing.quantity += count; }
      else appState.cart.push({
        id: 'wme_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
        categoryKey:'envelopes', categoryName:'Money Envelopes', sizeId:group.id === 'christmas' ? 'christmas-envelopes' : 'wedding-envelopes',
        sizeName:`Money Envelope · ${paper === 'premium' ? 'Premium 108' : 'Standard 80'} GSM`,
        shortName:WEDDING_ENVELOPE_TITLES[code], productTitle:WEDDING_ENVELOPE_TITLES[code],
        dimensions:'Sold per piece', hasSheets:false, sheetCount:null, cardCount:null,
        freePersonalization:true, designCode:code, imagePath:`images/${code}.webp?v=${IMG_VERSION}`,
        isCustomized:true, customText, nameLabel:[monogram, names, date].filter(Boolean).join(' · '), monogram, preferredNames:names, weddingDate:date,
        paperQuality:paper, isTba:false, unitPrice:unitPrice(), quantity:count, subtotal:unitPrice()*count
      });
      renderCart(); showCheckoutSection(false);
      const paperPcs = envelopePcsByPaper()[paper];
      const tip = paperPcs < ENVELOPE_BULK_MIN
        ? ` Tip: get ${ENVELOPE_BULK_MIN - paperPcs} more ${ENVELOPE_PAPER_LABEL[paper]} to pay only ₱${ENVELOPE_BULK_PRICES[paper]} each.`
        : ` 5+ price applied: ₱${ENVELOPE_BULK_PRICES[paper]} each.`;
      showToast(`Added ${count} pc(s) of ${WEDDING_ENVELOPE_TITLES[code]} (${code}) for "${names}" to order.${tip}`);
      readyForAnotherName(addBtn, card.querySelector('.wme-names'));
      updateEnvelopePrice();
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
        <button type="button" class="wme-image-button" aria-label="Enlarge selected design"><img class="wme-image" src="images/${group.codes[0]}.webp?v=${IMG_VERSION}" alt="${HARDBOUND_TITLES[group.codes[0]]}" loading="lazy"></button>
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
        <label class="wme-field">Name on cover (free) <input class="hardbound-name wme-counted" maxlength="${HARDBOUND_NAME_LIMITS.A6}" placeholder="e.g. Maria Clara" autocomplete="off" required></label>
        <div class="wme-char-count" aria-live="polite">0/${HARDBOUND_NAME_LIMITS.A6}</div>
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
      image.src = `images/${code}.webp?v=${IMG_VERSION}`;
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
      const thumb = document.createElement('img'); thumb.src = `images/${code}.webp?v=${IMG_VERSION}`; thumb.alt = ''; thumb.loading = 'lazy';
      button.appendChild(thumb); button.addEventListener('click', () => selectDesign(i, true)); thumbs.appendChild(button);
    });
    card.querySelector('.wme-prev').addEventListener('click', () => selectDesign(index - 1, true));
    card.querySelector('.wme-next').addEventListener('click', () => selectDesign(index + 1, true));
    card.querySelector('.wme-image-button').addEventListener('click', () => {
      const code = group.codes[index]; openImageLightbox(`images/${code}.webp?v=${IMG_VERSION}`, HARDBOUND_TITLES[code], code);
    });
    const nameBox = card.querySelector('.hardbound-name');
    const updateNameLimit = () => {
      nameBox.maxLength = HARDBOUND_NAME_LIMITS[selectedSize()];
      nameBox.dispatchEvent(new Event('input', { bubbles: true })); // refresh the 0/15 counter
    };
    card.querySelectorAll('.wme-paper-options input').forEach(radio => radio.addEventListener('change', () => { updatePrice(); updateNameLimit(); }));
    const clampQty = () => { qty.value = String(Math.min(99, Math.max(1, parseInt(qty.value,10) || 1))); return Number(qty.value); };
    card.querySelector('.wme-minus').addEventListener('click', () => { qty.value = Math.max(1, clampQty()-1); });
    card.querySelector('.wme-plus').addEventListener('click', () => { qty.value = Math.min(99, clampQty()+1); });
    qty.addEventListener('change', clampQty);
    const addBtn = card.querySelector('.wme-add');
    addBtn.addEventListener('click', () => {
      const input = card.querySelector('.hardbound-name');
      const names = input.value.trim();
      if (!names) { error.hidden = false; error.textContent = 'Please enter your preferred personalization text.'; input.focus(); return; }
      const nameLimit = HARDBOUND_NAME_LIMITS[selectedSize()];
      if (names.length > nameLimit) { error.hidden = false; error.textContent = `The ${selectedSize()} cover fits up to ${nameLimit} characters. Please shorten the name.`; input.focus(); return; }
      error.hidden = true;
      const code = group.codes[index], size = selectedSize(), count = clampQty();
      const customText = `Cover personalization: ${names}`;
      const existing = appState.cart.find(item => item.categoryKey === 'hardbound' && item.designCode === code && item.sizeId === `hardbound-${size.toLowerCase()}` && item.customText === customText);
      if (existing) { existing.quantity += count; existing.subtotal = existing.quantity * existing.unitPrice; }
      else appState.cart.push({
        id: 'hbn_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
        categoryKey:'hardbound', categoryName:'Hardbound Notepads', sizeId:`hardbound-${size.toLowerCase()}`,
        sizeName:`${size} Hardbound Notepad`, shortName:HARDBOUND_TITLES[code], productTitle:HARDBOUND_TITLES[code],
        dimensions:size === 'A6' ? 'A6' : 'A5', hasSheets:true, sheetCount:70, cardCount:null,
        freePersonalization:true, designCode:code, imagePath:`images/${code}.webp?v=${IMG_VERSION}`,
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
  const sizeName = categoryKey === '2x3.5' ? '2 × 3.5 in Notecards' : '4 × 3 in Notecards';
  const maxChars = NOTECARD_NAME_LIMITS[categoryKey] || 15;
  groups.forEach((group, groupIndex) => {
    const card = document.createElement('article');
    card.className = 'product-card wme-card';
    const getTitle = code => NOTECARD_SLIDER_TITLES[code] || DESIGN_TITLES[code] || code;
    card.innerHTML = `
      <div class="wme-heading"><h3>${group.title}</h3><span>${group.codes.length} designs</span></div>
      <div class="wme-preview">
        <button type="button" class="wme-arrow wme-prev" aria-label="Previous design">‹</button>
        <button type="button" class="wme-image-button" aria-label="Enlarge selected design"><img class="wme-image" src="images/${group.codes[0]}.webp?v=${IMG_VERSION}" alt="${getTitle(group.codes[0])}" loading="lazy"></button>
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
      image.src = `images/${code}.webp?v=${IMG_VERSION}`;
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
      const thumb = document.createElement('img'); thumb.src = `images/${code}.webp?v=${IMG_VERSION}`; thumb.alt = ''; thumb.loading = 'lazy';
      button.appendChild(thumb); button.addEventListener('click', () => selectDesign(i, true)); thumbs.appendChild(button);
    });
    card.querySelector('.wme-prev').addEventListener('click', () => selectDesign(index - 1, true));
    card.querySelector('.wme-next').addEventListener('click', () => selectDesign(index + 1, true));
    card.querySelector('.wme-image-button').addEventListener('click', () => {
      const code = group.codes[index]; openImageLightbox(`images/${code}.webp?v=${IMG_VERSION}`, getTitle(code), code);
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
const NOTEPAD_PRICES = { '3x3': 39, 'A6': 59, 'A5': 109 };
function getNotepadSliderGroups(categoryKey) {
  const items = PRODUCT_CATALOG.filter(p => p.category === categoryKey);
  const split = (title1, test, title2) => {
    const a = items.filter(test), b = items.filter(p => !test(p));
    return [{ title: title1, items: a }, { title: title2, items: b }].filter(g => g.items.length > 0);
  };
  if (categoryKey === '3x3') return split('Cat Series', p => p.tag === 'Cat Series', 'Everyday Notes');
  if (categoryKey === 'A5') return split('Planners', p => /Planner/i.test(p.tag || ''), 'Vintage & Botanical');
  if (categoryKey === 'A6') {
    const byCode = new Map(items.map(p => [p.code, p]));
    const groups = [
      { title: 'Characters', codes: ['NP_A6_Cinnamoroll', 'NP_A6_HelloKitty', 'NP_A6_Kuromi'] },
      { title: 'Kitty Corner', codes: ['NP_A6_PET_4', 'NP_A6_PET_5', 'NP_A6_PET_10', 'NP_A6_PET_11'] },
      { title: 'Pups & Pals', codes: ['NP_A6_PET_6', 'NP_A6_PET_7', 'NP_A6_PET_8', 'NP_A6_PET_9'] },
      { title: 'Florals & Fresh', codes: ['NP_A6_FLR_1', 'NP_A6_FLR_2', 'NP_A6_FLR_3', 'NP_A6_Flower', 'NP_A6_ToDoList', 'NP_A6_Lemon'] },
      { title: 'Vintage', codes: ['NP_NHD_A6_01', 'NP_NHD_A6_02', 'NP_NHD_A6_03'] }
    ];
    return groups.map(g => ({ title: g.title, items: g.codes.map(c => byCode.get(c)).filter(Boolean) })).filter(g => g.items.length > 0);
  }
  return [{ title: 'A6 Notepads', items }].filter(g => g.items.length > 0);
}

function renderNotepadSliderGallery(categoryKey) {
  if (!DOM.productGalleryGrid) return;
  DOM.productGalleryGrid.innerHTML = '';
  DOM.productGalleryGrid.classList.add('wme-gallery');
  const maxChars = NOTEPAD_NAME_LIMITS[categoryKey] || 10;
  const placeholder = 'e.g. Maria';
  const groups = getNotepadSliderGroups(categoryKey);
  if (groups.length === 0) {
    DOM.productGalleryGrid.innerHTML = '<div class="gallery-empty-state"><div class="gallery-empty-title">No designs available</div><div class="gallery-empty-desc">Designs for this size will be available soon.</div></div>';
    return;
  }
  groups.forEach(group => {
    const products = group.items;
    const imgSrc = p => `images/${encodeURIComponent(p.code)}.webp?v=${IMG_VERSION}`;
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
    const notecardMaxChars = product.maxChars || (isNotecards ? (is2x35 ? NOTECARD_NAME_LIMITS['2x3.5'] : NOTECARD_NAME_LIMITS['4x3']) : 30);
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
          src="images/${encodeURIComponent(product.code)}.webp?v=${IMG_VERSION}" 
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
        const currentSrc = (cardImg && cardImg.src) ? cardImg.src : `images/${encodeURIComponent(product.code)}.webp?v=${IMG_VERSION}`;
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
    subtitle: `Personalized money envelopes, sold per piece. Premium ₱${ENVELOPE_PRICES.premium} (₱${ENVELOPE_BULK_PRICES.premium} each for 5+) · Standard ₱${ENVELOPE_PRICES.standard} (₱${ENVELOPE_BULK_PRICES.standard} each for 5+).`
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

  const existingIndex = appState.cart.findIndex(
    item =>
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
      categoryKey: isNotecards ? 'notecards' : 'notepads',
      categoryName: isNotecards ? 'Notecards' : 'Notepads',
      sizeId: product.category,
      sizeName: product.sizeName,
      shortName: displayTitle,
      productTitle: displayTitle,
      dimensions: product.dimensions,
      hasSheets: !isNotecards,
      sheetCount: product.sheets || product.cardCount || 30,
      cardCount: product.cardCount || null,
      freePersonalization: true,
      designCode: product.code,
      imagePath: 'images/' + encodeURIComponent(product.code) + '.webp?v=' + IMG_VERSION,
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


// --------------------------------------------------------------------------
// View-Switching Logic (Notepad Catalog vs. Custom Made Specification Form)
// --------------------------------------------------------------------------




// ============================================================================
// 4. Dynamic Design Code Dropdown Population & Image Preview
// ============================================================================




// ============================================================================
// 5. Category & Size Selection
// ============================================================================



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







// ============================================================================
// 7. Order Item Cart Management
// ============================================================================



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

  // Promo: which free items this order gets, and how far it is from the next tier.
  let freeItems = [];
  let nextTier = null;
  if (isPromoActive()) {
    const tier = PROMO_TIERS.find(t => productTotal >= t.minTotal);
    freeItems = tier ? tier.items : [];
    const higher = PROMO_TIERS
      .filter(t => t.minTotal > productTotal)
      .sort((a, b) => a.minTotal - b.minTotal)[0];
    if (higher) nextTier = { gap: higher.minTotal - productTotal, minTotal: higher.minTotal, items: higher.items };
  }
  const freeText = freeItems.length ? promoItemsText(freeItems) : '';
  return { productTotal, envelopePcs, envelopeShort, freeItems, freeText, hasFreeItems: freeItems.length > 0, nextTier };
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
  if (item.categoryKey === 'envelopes') return `Per piece • ${peso(item.unitPrice)} / pc${item.bulkPrice ? ' (5+ price)' : ''}`;
  if (item.categoryKey === 'hardbound') return `${item.dimensions} • 70 sheets • Free cover personalization`;
  if (item.hasSheets) return `${item.dimensions} • ${item.sheetCount} sheets • Free personalization`;
  if (item.cardCount || item.categoryKey === 'notecards') return `${item.dimensions || ''} • ${item.cardCount || 24} pcs (220 gsm) • Free personalization`;
  return item.dimensions || '';
}

function renderPromoAndChecks(totals) {
  const hint = document.getElementById('promoHint');
  if (hint) {
    let text = '';
    if (isPromoActive() && appState.cart.length > 0) {
      if (totals.hasFreeItems && totals.nextTier) {
        text = `🎁 You get <strong>FREE ${totals.freeText}</strong>! Add <strong>${peso(totals.nextTier.gap)} more</strong> to get the ₱${totals.nextTier.minTotal} bundle: ${promoItemsText(totals.nextTier.items)}.`;
      } else if (totals.hasFreeItems) {
        text = `🎁 You get <strong>FREE ${totals.freeText}</strong> with this order!`;
      } else if (totals.nextTier) {
        text = `🎁 Add <strong>${peso(totals.nextTier.gap)} more</strong> to get FREE ${promoItemsText(totals.nextTier.items)}.`;
      }
    }
    hint.innerHTML = text;
    hint.style.display = text ? 'block' : 'none';
  }

  const warn = document.getElementById('envelopeMinWarning');
  if (warn) {
    const pcs = envelopePcsByPaper();
    const tips = Object.keys(pcs).filter(paper => pcs[paper] > 0 && pcs[paper] < ENVELOPE_BULK_MIN).map(paper =>
      `✉️ Add <strong>${ENVELOPE_BULK_MIN - pcs[paper]} more ${ENVELOPE_PAPER_LABEL[paper]}</strong> envelope${ENVELOPE_BULK_MIN - pcs[paper] === 1 ? '' : 's'} (any design) to pay only <strong>₱${ENVELOPE_BULK_PRICES[paper]} each</strong> instead of ₱${ENVELOPE_PRICES[paper]}.`);
    if (tips.length) {
      warn.innerHTML = tips.join('<br>');
      warn.style.display = 'block';
    } else {
      warn.innerHTML = '';
      warn.style.display = 'none';
    }
  }
}

function renderCart() {
  applyEnvelopePricing();
  refreshEnvelopeCardPrices();
  const totalUnits = appState.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const groups = groupCartItems();
  const totals = computeOrderTotals();

  if (DOM.headerCartCount) DOM.headerCartCount.textContent = totalUnits;
  if (DOM.cartCountBadge) {
    DOM.cartCountBadge.textContent = `${groups.length} Item${groups.length === 1 ? '' : 's'}${totalUnits > 0 ? ` (${totalUnits} pcs)` : ''}`;
  }
  const mobileCount = document.getElementById('mobileCartCount');
  if (mobileCount) mobileCount.textContent = `${totalUnits} item${totalUnits === 1 ? '' : 's'}`;
  const mobileTotal = document.getElementById('mobileCartTotal');
  if (mobileTotal) mobileTotal.textContent = peso(totals.productTotal);
  const checkoutBtn = document.getElementById('btnCheckout');
  if (checkoutBtn) checkoutBtn.disabled = appState.cart.length === 0;
  const mobileCheckoutBtn = document.getElementById('btnMobileCheckout');
  if (mobileCheckoutBtn) mobileCheckoutBtn.disabled = appState.cart.length === 0;
  document.body.classList.toggle('has-cart-items', appState.cart.length > 0);

  renderPromoAndChecks(totals);

  if (appState.cart.length === 0) {
    if (DOM.emptyCartState) DOM.emptyCartState.style.display = 'block';
    if (DOM.cartItemsList) {
      DOM.cartItemsList.style.display = 'none';
      DOM.cartItemsList.innerHTML = '';
    }
    if (DOM.summaryGrandTotal) DOM.summaryGrandTotal.textContent = peso(0);
    return;
  }

  if (DOM.emptyCartState) DOM.emptyCartState.style.display = 'none';
  if (DOM.cartItemsList) {
    DOM.cartItemsList.style.display = 'flex';
    DOM.cartItemsList.innerHTML = '';
  }
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
          <img src="images/${encodeURIComponent(item.designCode)}.webp?v=${IMG_VERSION}" alt="${escapeHtml(item.designCode)}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${fallbackSvg}';">
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

  if (totals.hasFreeItems) {
    const tagCard = document.createElement('div');
    tagCard.className = 'cart-item-card cart-free-tags-card';
    tagCard.innerHTML = `
      <div class="cart-free-tags-main">
        <span class="cart-free-tags-icon" aria-hidden="true">🎁</span>
        <div>
          <div class="cart-item-title">FREE: ${escapeHtml(totals.freeText)}</div>
          <div class="cart-item-spec-line">Christmas promo. We'll message you for the names and designs.</div>
        </div>
      </div>
      <span class="cart-item-subtotal">${peso(0)}</span>
    `;
    DOM.cartItemsList.appendChild(tagCard);
  }

  if (DOM.summaryGrandTotal) DOM.summaryGrandTotal.textContent = peso(totals.productTotal);
}

window.removeCartItem = removeCartItem;

// ============================================================================
// 8. Customer Form Validation & Sync
// ============================================================================



function validateCustomerForm() {
  let isValid = true;

  const fields = [
    { el: DOM.inputFullName, group: 'groupFullName', validator: val => val.trim().length > 1 },
    { el: DOM.inputContactNumber, group: 'groupContactNumber', validator: val => val.trim().length >= 7 },
    { el: DOM.inputSocialHandle, group: 'groupSocialHandle', validator: val => val.trim().length > 1 },
    { el: DOM.selectCourier, group: 'groupCourier', validator: val => Boolean(val) },
    { el: DOM.inputAddress, group: 'groupAddress', validator: val => val.trim().length > 5 },
    { el: DOM.selectPayment, group: 'groupPayment', validator: val => Boolean(val) }
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
    { el: DOM.selectPayment, group: 'groupPayment' }
  ];

  inputs.forEach(item => {
    if (!item.el) return;
    const handler = () => {
      const parent = document.getElementById(item.group);
      if (parent) parent.classList.remove('has-error');
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

// Order reference, e.g. PRNT-261109-7KQ3 (date in Philippine time + 4 random letters/numbers).
function generateReferenceNumber() {
  const parts = {};
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: '2-digit', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date()).forEach(p => { parts[p.type] = p.value; });
  } catch (e) { /* very old browser: fall back to the device date below */ }
  const now = new Date();
  const yy = parts.year || String(now.getFullYear()).slice(-2);
  const mm = parts.month || String(now.getMonth() + 1).padStart(2, '0');
  const dd = parts.day || String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I/L, so customers can't misread it
  let code = '';
  const rand = (window.crypto && window.crypto.getRandomValues) ? window.crypto.getRandomValues(new Uint32Array(4)) : null;
  for (let i = 0; i < 4; i++) code += chars[(rand ? rand[i] : Math.floor(Math.random() * 1e9)) % chars.length];
  return `PRNT-${yy}${mm}${dd}-${code}`;
}

function orderGroupNamesText(group) {
  const named = group.items.filter(line => cartItemNameLabel(line));
  if (named.length === 0) return '';
  return group.items.map(line => {
    const label = cartItemNameLabel(line) || 'No name';
    return `${label} ×${line.quantity}`;
  }).join(', ');
}

// Plain-text lines for the Google Sheet "orderItems" column (names and free promo items included).
function buildSheetOrderItemsText(totals) {
  const lines = groupCartItems().map((group, idx) => {
    const item = group.first;
    const title = item.productTitle || DESIGN_TITLES[item.designCode] || '';
    const names = orderGroupNamesText(group);
    return `${idx + 1}. ${item.sizeName} - Design: ${item.designCode}${title ? ` ("${title}")` : ''}${names ? ` | Names: ${names}` : ''} | Qty: ${group.quantity} | ${peso(group.subtotal)}`;
  });
  totals.freeItems.forEach(it => {
    lines.push(`${lines.length + 1}. FREE ${it.name} (Christmas promo, ask buyer for names/designs) | Qty: ${it.qty} | ${peso(0)}`);
  });
  return lines.join('\n');
}

// ----------------------------------------------------------------------------
// Cart panel (phones), checkout pop-up and page scroll lock
// ----------------------------------------------------------------------------
const PHONE_LAYOUT_QUERY = '(max-width: 1023px)';
function isPhoneLayout() { return window.matchMedia && window.matchMedia(PHONE_LAYOUT_QUERY).matches; }

function updateBodyScrollLock() {
  const open = ['checkoutModal', 'jobOrderModal', 'imageLightboxModal'].some(id => {
    const el = document.getElementById(id); return el && el.classList.contains('active');
  }) || (isPhoneLayout() && document.body.classList.contains('cart-open'));
  document.body.style.overflow = open ? 'hidden' : '';
}

function openCartPanel() {
  if (!isPhoneLayout()) {
    const panel = document.getElementById('cartPanel');
    if (panel) { panel.classList.remove('cart-pulse'); void panel.offsetWidth; panel.classList.add('cart-pulse'); }
    return;
  }
  document.body.classList.add('cart-open');
  updateBodyScrollLock();
}
function closeCartPanel() {
  document.body.classList.remove('cart-open');
  updateBodyScrollLock();
}

// Kept for older code paths: adding to cart no longer jumps the page.
function showCheckoutSection(openPanel = false) {
  if (openPanel) openCartPanel();
}

function openCheckoutModal() {
  if (appState.cart.length === 0) {
    showToast('Your cart is empty. Please add items first.');
    return;
  }
  const totals = computeOrderTotals();
  if (totals.envelopeShort > 0) {
    renderPromoAndChecks(totals);
    openCartPanel();
    showToast(`Money envelopes need at least ${ENVELOPE_MIN_PCS} pcs per order. Please add ${totals.envelopeShort} more.`);
    return;
  }
  const totalEl = document.getElementById('checkoutModalTotal');
  if (totalEl) totalEl.textContent = peso(totals.productTotal);
  const promoEl = document.getElementById('checkoutModalPromo');
  if (promoEl) {
    promoEl.textContent = totals.hasFreeItems ? `🎁 FREE ${totals.freeText} included` : '';
    promoEl.style.display = totals.hasFreeItems ? '' : 'none';
  }
  const err = document.getElementById('checkoutSubmitError');
  if (err) err.hidden = true;
  if (DOM.btnSubmitOrder && !appState.submitting) DOM.btnSubmitOrder.innerHTML = 'Submit Order';
  closeCartPanel();
  document.getElementById('checkoutModal').classList.add('active');
  updateBodyScrollLock();
  setTimeout(() => {
    const form = document.getElementById('customerForm');
    const alreadyTyping = form && form.contains(document.activeElement);
    if (DOM.inputFullName && !isPhoneLayout() && !alreadyTyping) DOM.inputFullName.focus();
  }, 150);
}
function closeCheckoutModal() {
  if (appState.submitting) return;
  document.getElementById('checkoutModal').classList.remove('active');
  updateBodyScrollLock();
}

// ----------------------------------------------------------------------------
// Order submitted pop-up (text only) + order image
// ----------------------------------------------------------------------------
function buildJobOrderSlip(order) {
  const c = order.customer;
  const row = (label, value) => `<div class="cs-row"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`;
  const slip = document.getElementById('printableJobOrderSlip');
  slip.innerHTML = `
    <div class="cs-ref">
      <span>Order reference</span>
      <strong id="joReferenceNumber">${escapeHtml(order.refNo)}</strong>
      <small>${escapeHtml(order.dateText)}</small>
    </div>
    <div class="cs-list">
      ${row('Name', c.fullName)}
      ${row('Contact', c.contactNumber)}
      ${row('Facebook / IG', c.socialHandle)}
      ${row('Courier', c.courier)}
      ${row('Payment', c.payment)}
      ${row('Address', c.address)}
      ${row('Items', order.itemsText)}
      ${order.freeText ? row('Free promo items', order.freeText) : ''}
    </div>
    <div class="cs-total"><span>Total</span><strong>${peso(order.total)}</strong></div>
    <p class="cs-note">Shipping fee is not yet included. Payment details will be sent to you privately. Please include <strong>${escapeHtml(order.refNo)}</strong> when you send your proof of payment.</p>`;
  return order.total;
}

// Black Printelio logo for the saved order image (embedded so the image never depends on a download).
const ORDER_IMAGE_LOGO = 'data:image/png;base64,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';
let orderImageLogoPromise = null;
function loadOrderImageLogo() {
  if (!orderImageLogoPromise) {
    orderImageLogoPromise = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = ORDER_IMAGE_LOGO;
    });
  }
  return orderImageLogoPromise;
}

// Draws the order summary (black and white, with the full item breakdown) straight onto a canvas.
// Same image on computers, tablets and phones. Height grows with the number of items.
function drawOrderSummaryCanvas(order, logoImg) {
  const W = 1080, PAD = 64, S = 'Montserrat, "Helvetica Neue", Arial, sans-serif';
  const BLACK = '#000000', GREY = '#555555', LINE = '#d4d4d4';
  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');

  const wrap = (ctx, text, font, maxWidth) => {
    ctx.font = font;
    const words = String(text || '').split(/\s+/).filter(Boolean); const lines = []; let line = '';
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  };

  // Runs twice: once to measure the height, once to draw.
  const render = (ctx, draw) => {
    const text = (str, x, y, font, color, align) => {
      if (!draw) return;
      ctx.font = font; ctx.fillStyle = color || BLACK; ctx.textAlign = align || 'left'; ctx.fillText(str, x, y);
    };
    const rule = (y, h, color) => { if (draw) { ctx.fillStyle = color || LINE; ctx.fillRect(PAD, y, W - PAD * 2, h || 2); } };
    ctx.textBaseline = 'top';
    let y = 56;

    // Logo + title
    if (logoImg) {
      const h = 66, w = Math.round(logoImg.width * h / logoImg.height);
      if (draw) ctx.drawImage(logoImg, PAD, y, w, h);
    } else {
      text('Printelio', PAD, y + 4, 'italic 700 60px Georgia, serif', BLACK);
    }
    text('ORDER SUMMARY', W - PAD, y + 22, `800 26px ${S}`, BLACK, 'right');
    y += 100; rule(y, 4, BLACK); y += 30;

    // Reference
    text('ORDER REFERENCE', PAD, y, `700 22px ${S}`, GREY);
    text(order.dateText, W - PAD, y, `600 22px ${S}`, GREY, 'right');
    y += 34;
    text(order.refNo, PAD, y, `800 50px ${S}`, BLACK);
    y += 76; rule(y); y += 22;

    // Customer details
    const labelW = 250, valueX = PAD + labelW, valueW = W - PAD - valueX;
    const c = order.customer;
    [['Name', c.fullName], ['Contact', c.contactNumber], ['Facebook / IG', c.socialHandle],
     ['Courier', c.courier], ['Payment', c.payment], ['Address', c.address]].forEach(([label, value]) => {
      const lines = wrap(ctx, value, `600 28px ${S}`, valueW);
      text(label.toUpperCase(), PAD, y + 4, `700 21px ${S}`, GREY);
      lines.forEach((ln, j) => text(ln, valueX, y + j * 38, `600 28px ${S}`, BLACK));
      y += lines.length * 38 + 14;
    });
    y += 10; rule(y, 4, BLACK); y += 26;

    // Item breakdown
    const qtyX = W - PAD - 210, amtX = W - PAD, itemW = qtyX - PAD - 50;
    text('ITEM', PAD, y, `800 22px ${S}`, BLACK);
    text('QTY', qtyX, y, `800 22px ${S}`, BLACK, 'right');
    text('AMOUNT', amtX, y, `800 22px ${S}`, BLACK, 'right');
    y += 38; rule(y); y += 18;
    const allLines = order.lines.concat(order.freeItems.map(it => ({
      title: `FREE ${it.name}`, design: 'Christmas promo · we will message you for names/designs', names: '', qty: it.qty, amount: 0
    })));
    allLines.forEach((line, i) => {
      const titleLines = wrap(ctx, `${i + 1}. ${line.title}`, `700 27px ${S}`, itemW);
      text(String(line.qty), qtyX, y, `700 27px ${S}`, BLACK, 'right');
      text(peso(line.amount), amtX, y, `700 27px ${S}`, BLACK, 'right');
      titleLines.forEach((ln, j) => text(ln, PAD, y + j * 36, `700 27px ${S}`, BLACK));
      y += titleLines.length * 36;
      wrap(ctx, line.design, `500 23px ${S}`, itemW).forEach(ln => { text(ln, PAD + 34, y + 2, `500 23px ${S}`, GREY); y += 32; });
      if (line.names) {
        wrap(ctx, `Names: ${line.names}`, `600 23px ${S}`, itemW).forEach(ln => { text(ln, PAD + 34, y + 2, `600 23px ${S}`, BLACK); y += 32; });
      }
      y += 14; rule(y); y += 18;
    });

    // Total
    y += 4;
    text(`TOTAL · ${order.itemsText}`, PAD, y + 14, `800 26px ${S}`, BLACK);
    text(peso(order.total), amtX, y, `800 50px ${S}`, BLACK, 'right');
    y += 76; rule(y, 4, BLACK); y += 28;

    // Notes
    [[`Shipping fee is not yet included.`, `700 25px ${S}`],
     [`Send this image to Printelio (FB or IG) or to your contact person.`, `700 25px ${S}`],
     [`Payment details will be sent privately. Please include ${order.refNo} when you send your proof of payment.`, `500 23px ${S}`]]
      .forEach(([note, font]) => {
        wrap(ctx, note, font, W - PAD * 2).forEach(ln => { text(ln, PAD, y, font, BLACK); y += 34; });
        y += 10;
      });
    return y + 40;
  };

  const height = Math.ceil(render(mctx, false));
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, height);
  render(ctx, true);
  return canvas;
}

// Prepares the image as soon as the pop-up opens, so tapping "Save as Image" responds instantly.
async function prepareOrderImage(order) {
  appState.orderImage = null;
  try {
    if (document.fonts && document.fonts.load) {
      await Promise.race([
        Promise.all([document.fonts.load('500 23px Montserrat'), document.fonts.load('600 28px Montserrat'), document.fonts.load('700 27px Montserrat'), document.fonts.load('800 50px Montserrat')]),
        new Promise(r => setTimeout(r, 1500)) // never wait more than 1.5s for fonts
      ]);
    }
  } catch (e) { /* fonts are optional */ }
  const logoImg = await loadOrderImageLogo();
  const canvas = drawOrderSummaryCanvas(order, logoImg);
  const dataUrl = canvas.toDataURL('image/png');
  let file = null;
  try {
    const blob = await new Promise(resolve => { if (canvas.toBlob) canvas.toBlob(resolve, 'image/png'); else resolve(null); });
    if (blob && typeof File === 'function') file = new File([blob], `Printelio_Order_${order.refNo}.png`, { type: 'image/png' });
  } catch (e) { file = null; }
  appState.orderImage = { refNo: order.refNo, dataUrl, file };
  return appState.orderImage;
}

function showOrderImageFallback() {
  const box = document.getElementById('confirmImageFallback');
  const img = document.getElementById('confirmImagePreview');
  if (!box || !img || !appState.orderImage) return;
  img.src = appState.orderImage.dataUrl;
  box.hidden = false;
  setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

// Save as Image:
// - iPhone / Android browsers: opens the phone's Share sheet ("Save Image").
// - Facebook / Messenger / Instagram browsers (can't download): shows the image to press-and-hold.
// - Computers: downloads the PNG file.
// It never stays stuck on "loading": after 8 seconds it gives up and asks for a screenshot.
async function downloadOrderSummaryImage() {
  const btn = document.getElementById('btnDownloadImage');
  const order = appState.lastOrder;
  if (!order) return;
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inAppBrowser = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|MessengerForiOS|Line\//i.test(ua);

  let img = appState.orderImage;
  if (!img || img.refNo !== order.refNo) {
    const original = btn ? btn.innerHTML : '';
    if (btn) { btn.innerHTML = '⏳ Preparing image...'; btn.disabled = true; }
    try {
      img = await Promise.race([prepareOrderImage(order), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))]);
    } catch (e) {
      img = null;
    } finally {
      if (btn) { btn.innerHTML = original; btn.disabled = false; }
    }
    if (!img) { showToast('Could not create the image. Please take a screenshot of this order summary instead.'); return; }
    if (isMobile) { showOrderImageFallback(); return; } // the tap was used up while preparing; show press-and-hold
  }

  if (isMobile && !inAppBrowser && img.file && navigator.canShare && navigator.share) {
    let canShareFile = false;
    try { canShareFile = navigator.canShare({ files: [img.file] }); } catch (e) { canShareFile = false; }
    if (canShareFile) {
      try {
        await navigator.share({ files: [img.file], title: `Printelio order ${order.refNo}` });
      } catch (err) {
        if (!err || err.name !== 'AbortError') showOrderImageFallback(); // share failed: press-and-hold instead
      }
      return;
    }
  }
  if (isMobile) { showOrderImageFallback(); return; }

  // Computer: normal download
  const link = document.createElement('a');
  link.href = img.dataUrl;
  link.download = `Printelio_Order_${order.refNo}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Order summary saved as an image.');
}

async function submitJobOrder() {
  if (appState.submitting) return; // blocks double taps / double orders
  if (appState.cart.length === 0) {
    showToast('Your cart is empty. Please add items before submitting.');
    closeCheckoutModal();
    return;
  }
  const totals = computeOrderTotals();
  if (totals.envelopeShort > 0) {
    closeCheckoutModal();
    openCheckoutModal(); // shows the envelope warning
    return;
  }
  if (!validateCustomerForm()) {
    showToast('Please complete all required customer details.');
    const firstError = document.querySelector('#customerForm .has-error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  appState.customer = {
    fullName: DOM.inputFullName.value.trim(),
    contactNumber: DOM.inputContactNumber.value.trim(),
    socialHandle: DOM.inputSocialHandle.value.trim(),
    courier: DOM.selectCourier.value,
    address: DOM.inputAddress.value.trim(),
    payment: DOM.selectPayment.value,
    orderType: 'Regular Purchase'
  };

  // Reuse the same reference number when the customer taps "Try again" with the SAME order,
  // so the server can tell it's a retry and never saves the order twice.
  const orderSignature = JSON.stringify([appState.customer, appState.cart.map(i => [i.designCode, i.sizeId, i.quantity, i.unitPrice, i.nameLabel || i.customText || ''])]);
  if (!appState.pendingOrder || appState.pendingOrder.signature !== orderSignature) {
    appState.pendingOrder = { signature: orderSignature, refNo: generateReferenceNumber() };
  }
  const refNo = appState.pendingOrder.refNo;
  const groups = groupCartItems();
  const pcs = appState.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const order = {
    refNo,
    dateText: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    customer: { ...appState.customer },
    itemsText: `${groups.length} item${groups.length === 1 ? '' : 's'} (${pcs} pc${pcs === 1 ? '' : 's'})`,
    freeText: totals.freeText,
    freeItems: totals.freeItems.slice(),
    lines: groups.map(group => {
      const item = group.first;
      const title = item.productTitle || DESIGN_TITLES[item.designCode] || '';
      return {
        title: item.sizeName,
        design: `${item.designCode}${title ? ' · ' + title : ''}`,
        names: orderGroupNamesText(group),
        qty: group.quantity,
        amount: group.subtotal
      };
    }),
    total: totals.productTotal
  };

  const uniqueDesignCodes = [...new Set(appState.cart.map(item => {
    const title = item.productTitle || DESIGN_TITLES[item.designCode];
    return title ? `${item.designCode} (${title})` : item.designCode;
  }))].join(', ');

  const sheetPayload = {
    referenceNo: refNo,
    fullName: appState.customer.fullName,
    contactNumber: appState.customer.contactNumber,
    socialHandle: appState.customer.socialHandle,
    courier: appState.customer.courier,
    address: appState.customer.address,
    paymentMethod: appState.customer.payment,
    orderType: `Regular Purchase | Ref: ${refNo}`,
    freePromoItems: totals.freeText,
    customSpecifications: totals.freeText ? `FREE: ${totals.freeText}` : '',
    designMotif: uniqueDesignCodes,
    orderItems: `Ref: ${refNo}\n` + buildSheetOrderItemsText(totals),
    totalPrice: peso(totals.productTotal)
  };

  appState.submitting = true;
  const submitBtn = DOM.btnSubmitOrder;
  const originalSubmitText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<span>⏳ Submitting order...</span>'; }
  const closeBtn = document.getElementById('btnCloseCheckout');
  if (closeBtn) closeBtn.disabled = true;
  const errorBox = document.getElementById('checkoutSubmitError');
  if (errorBox) errorBox.hidden = true;

  // Send the order and READ the reply, so we only say "submitted" when it was really saved.
  let saved = false;
  let failReason = '';
  let timer = null;
  try {
    const controller = window.AbortController ? new AbortController() : null;
    timer = controller ? setTimeout(() => controller.abort(), 25000) : null;
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // plain text avoids a CORS pre-check
      body: JSON.stringify(sheetPayload),
      signal: controller ? controller.signal : undefined
    });
    const result = await response.json();
    if (result && result.result === 'success') {
      saved = true;
    } else {
      failReason = 'server';
      console.error('Order was not saved:', result);
    }
  } catch (sheetError) {
    failReason = (sheetError && sheetError.name === 'AbortError') ? 'timeout' : 'network';
    console.error('Order submission error:', sheetError);
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!saved) {
    // Keep the cart and the form exactly as they are so the customer can simply try again.
    appState.submitting = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Try again'; }
    if (closeBtn) closeBtn.disabled = false;
    if (errorBox) {
      errorBox.textContent = failReason === 'server'
        ? "Sorry, we couldn't save your order. Please tap Try again. If it keeps happening, message us on Facebook or Instagram."
        : "We couldn't send your order. Please check your internet connection, then tap Try again. Your details are still here.";
      errorBox.hidden = false;
    }
    return;
  }

  // Order is saved: clear the cart so it can't be submitted twice, then show the confirmation.
  appState.pendingOrder = null;
  appState.lastOrder = order;
  appState.cart = [];
  renderCart();
  appState.submitting = false;
  if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalSubmitText || 'Submit Order'; }
  if (closeBtn) closeBtn.disabled = false;
  document.getElementById('checkoutModal').classList.remove('active');

  clearTimeout(toastTimer);
  if (DOM.toastContainer) DOM.toastContainer.innerHTML = '';
  buildJobOrderSlip(order);
  const fallback = document.getElementById('confirmImageFallback');
  if (fallback) fallback.hidden = true;
  DOM.jobOrderModal.classList.add('active');
  const dialog = document.getElementById('jobOrderDialog');
  if (dialog) dialog.scrollTop = 0;
  updateBodyScrollLock();
  prepareOrderImage(order).catch(err => console.error('Order image error:', err));
}

function closeModal() {
  DOM.jobOrderModal.classList.remove('active');
  updateBodyScrollLock();
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

  // Restore page scrolling only if no other pop-up is still open
  updateBodyScrollLock();
}

// "Back to Printelio": clears everything and returns to the landing page (Hardbound Notepads).
function startNewOrder() {
  closeModal();
  appState.cart = [];
  appState.lastOrder = null;
  appState.orderImage = null;
  renderCart();
  if (DOM.customerForm) DOM.customerForm.reset();
  document.querySelectorAll('#customerForm .has-error').forEach(el => el.classList.remove('has-error'));
  closeCartPanel();
  switchMainCatalog('hardbound');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// 10. Toast Notifications
// ============================================================================

// Pop-up message in the center of the screen. It never blocks taps and fades out on its own.
// Messages that start with "Added" show the big green ✓ "Added to cart" style.
let toastTimer = null;
function showToast(message) {
  if (!DOM.toastContainer) return;
  const isAdded = /^Added /.test(message);
  DOM.toastContainer.innerHTML = '';
  const toast = document.createElement('div');
  toast.className = 'toast' + (isAdded ? ' toast-added' : '');
  if (isAdded) {
    const detail = message.replace(/ to order\.$/, '').replace(/^Added /, '');
    toast.innerHTML = `<div class="toast-check" aria-hidden="true">✓</div><div class="toast-title">Added to cart</div><div class="toast-detail"></div>`;
    toast.querySelector('.toast-detail').textContent = detail;
  } else {
    toast.textContent = message;
  }
  DOM.toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, isAdded ? 2000 : 3200);
}

// ============================================================================
// 11. Event Listeners & Bootstrapping
// ============================================================================

function initEventListeners() {
  // Main catalog switcher (desktop nav + phone drawer)
  const catalogButtons = [
    [DOM.btnCatalogHardbound, 'hardbound'], [DOM.btnCatalogNotepads, 'notepads'],
    [DOM.btnCatalogNotecards, 'notecards'], [DOM.btnCatalogEnvelopes, 'envelopes']
  ];
  catalogButtons.forEach(([btn, catalog]) => { if (btn) btn.addEventListener('click', () => switchMainCatalog(catalog)); });

  // Phone navigation drawer
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
  if (DOM.mobileNavBackdrop) DOM.mobileNavBackdrop.addEventListener('click', () => toggleMobileMenu(false));
  const mobileCatalogButtons = [
    [DOM.btnMobileCatalogHardbound, 'hardbound'], [DOM.btnMobileCatalogNotepads, 'notepads'],
    [DOM.btnMobileCatalogNotecards, 'notecards'], [DOM.btnMobileCatalogEnvelopes, 'envelopes']
  ];
  mobileCatalogButtons.forEach(([btn, catalog]) => {
    if (btn) btn.addEventListener('click', () => { switchMainCatalog(catalog); toggleMobileMenu(false); });
  });

  // Size tabs (Notepads: Square, A6, A5 | Notecards: 2x3.5, 4x3)
  [[DOM.tab3x3, '3x3'], [DOM.tabA6, 'A6'], [DOM.tabA5, 'A5'], [DOM.tab2x35, '2x3.5'], [DOM.tab4x3, '4x3']]
    .forEach(([tab, key]) => { if (tab) tab.addEventListener('click', () => switchGalleryCategory(key)); });

  if (DOM.btnHeaderCart) DOM.btnHeaderCart.addEventListener('click', openCartPanel);

  // Cart panel, phone cart bar and checkout pop-up
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
  on('btnCloseCartPanel', closeCartPanel);
  on('cartBackdrop', closeCartPanel);
  on('btnMobileCartOpen', openCartPanel);
  on('btnCheckout', openCheckoutModal);
  on('btnMobileCheckout', openCheckoutModal);
  on('btnCloseCheckout', closeCheckoutModal);
  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) checkoutModal.addEventListener('click', (e) => { if (e.target === checkoutModal) closeCheckoutModal(); });
  window.addEventListener('resize', () => { if (!isPhoneLayout()) closeCartPanel(); });

  if (DOM.btnSubmitOrder) {
    DOM.btnSubmitOrder.addEventListener('click', submitJobOrder);
  }

  if (DOM.btnDoneOrder) {
    DOM.btnDoneOrder.addEventListener('click', startNewOrder);
  }
  
  const downloadBtn = document.getElementById('btnDownloadImage');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadOrderSummaryImage);
  }

  // The "Order submitted" pop-up only closes with "Back to Printelio" so the reference number isn't lost by accident.

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
      } else if (document.getElementById('checkoutModal').classList.contains('active')) {
        closeCheckoutModal();
      } else if (document.body.classList.contains('cart-open')) {
        closeCartPanel();
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
    promoBanner.style.display = isPromoActive() ? '' : 'none';
  }

  // 3. Render cart (updates badge count and sets up initial view)
  renderCart();

  // 4. Attach event listeners
  initEventListeners();
});

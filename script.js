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
  'WP8_A5'
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
        prices: { '30': 29 },
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
        prices: { '30': 49 },
        designs: [
          'NP_A6_Cinnamoroll',
          'NP_A6_Flower',
          'NP_A6_HelloKitty',
          'NP_A6_Kuromi',
          'NP_A6_ToDoList',
          'NP_A6_Lemon'
        ]
      },
      {
        id: 'np-a5',
        name: 'A5 Notepad (5.8 × 8.3 in) • 30 sheets',
        shortName: 'A5 Notepad',
        dimensions: '5.8 × 8.3 in',
        prices: { '30': 99 },
        designs: A5_NOTEPAD_DESIGNS
      }
    ]
  },
  notecards: {
    categoryName: 'Notecards',
    hasSheets: false,
    isTba: true,
    sizes: [
      {
        id: 'nc-portrait',
        name: '2 x 3.5 in (Portrait)',
        shortName: 'Portrait Notecard',
        dimensions: '2 × 3.5 in',
        prices: null,
        designs: ['NC-001', 'NC-002', 'NC-003', 'NC-004']
      },
      {
        id: 'nc-landscape',
        name: '3.5 x 2 in (Landscape)',
        shortName: 'Landscape Notecard',
        dimensions: '3.5 × 2 in',
        prices: null,
        designs: ['NC-005', 'NC-006', 'NC-007', 'NC-008']
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

const CUSTOMIZATION_FEE = 10; // ₱10.00 per item

// ============================================================================
// 1b. Gallery Catalog & Category Specifications
// ============================================================================

const CATEGORY_SPECS = {
  '3x3': {
    title: 'Square Notepad (3 × 3 in)',
    specText: 'Square Notepad (3 × 3 in) • 30 Sheets • ₱29.00 / pad',
    price: 29.00
  },
  'A6': {
    title: 'A6 Notepad (4 × 5.8 in)',
    specText: 'A6 Notepad (4 × 5.8 in) • 30 Sheets • ₱49.00 / pad',
    price: 49.00
  },
  'A5': {
    title: 'A5 Notepad (5.8 × 8.3 in)',
    specText: 'A5 Notepad (5.8 × 8.3 in) • 30 Sheets • ₱99.00 / pad',
    price: 99.00
  }
};

const PRODUCT_CATALOG = [
  // 3x3 Notepads (Square 3 × 3 in, 30 sheets, ₱29.00)
  {
    code: 'NP_SQ_CAT01',
    name: 'Playful Kitty · Cat 01',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Cat Series',
    motif: 'Playful Kitten with Whiskers'
  },
  {
    code: 'NP_SQ_CAT02',
    name: 'Sweet Whiskers · Cat 02',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Cat Series',
    motif: 'Sleepy Kitty Head'
  },
  {
    code: 'NP_SQ_CAT03',
    name: 'Paws & Cocoa · Cat 03',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Cat Series',
    motif: 'Cat in Warm Cup'
  },
  {
    code: 'NP_SQ_CAT04',
    name: 'Curious Calico · Cat 04',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Cat Series',
    motif: 'Calico Cat Stretching'
  },
  {
    code: 'NP_SQ_CAT05',
    name: 'Sleeping Tabby · Cat 05',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Cat Series',
    motif: 'Curled Up Orange Tabby'
  },
  {
    code: 'NP_SQ_CAT06',
    name: 'Kitty Friends · Cat 06',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Cat Series',
    motif: 'Twin Kitties Silhouette'
  },
  {
    code: 'NP_SQ_MEMO',
    name: 'Daily Memo Square',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Minimal Memo',
    motif: 'Clean Lined Memo Box'
  },
  {
    code: 'NP_SQ_MS_Blue',
    name: 'Pastel Grid · Sky Blue',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Grid Note',
    motif: 'Soft Blue Grid Pattern'
  },
  {
    code: 'NP_SQ_MS_Pink',
    name: 'Blush Lines · Pastel Pink',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Lined Note',
    motif: 'Blush Pink Lined Accent'
  },
  {
    code: 'NP_SQ_MS_Purple',
    name: 'Lavender Grid · Purple',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Grid Note',
    motif: 'Soft Lavender Grid'
  },
  {
    code: 'NP_SQ_NOTES1',
    name: 'Floral Header Notes',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Botanical',
    motif: 'Hand-drawn Wildflowers'
  },
  {
    code: 'NP_SQ_NOTES2',
    name: 'Daily Checklist Notes',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Checklist',
    motif: 'Square Checkboxes & Lines'
  },
  {
    code: 'NP_SQ01',
    name: 'Classic Grid Memo',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Essential',
    motif: '5mm Engineering Grid'
  },
  {
    code: 'NP_SQ02',
    name: 'Dot Grid Daily',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Dot Grid',
    motif: 'Subtle Dot Matrix'
  },
  {
    code: 'NP_SQ03',
    name: 'Retro Aesthetic Note',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Retro Style',
    motif: 'Vintage Serif Heading'
  },
  {
    code: 'NP_SQ04',
    name: 'Clean Lined Memo',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Lined Note',
    motif: 'Featherweight Lines'
  },
  {
    code: 'NP_SQ05',
    name: 'Warm Sun Memo',
    category: '3x3',
    sizeName: 'Square Notepad (3 × 3 in)',
    dimensions: '3 × 3 in',
    sheets: 30,
    price: 29.00,
    tag: 'Aesthetic',
    motif: 'Rising Sun Minimal Art'
  },

  // A6 Notepads (4 × 5.8 in, 30 sheets, ₱49.00)
  {
    code: 'NP_A6_Cinnamoroll',
    name: 'Cloud Bunny · Cinnamoroll',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 49.00,
    tag: 'Character',
    motif: 'Fluffy Sky & Puppy Ears'
  },
  {
    code: 'NP_A6_Flower',
    name: 'Botanical Bloom · Flower',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 49.00,
    tag: 'Floral',
    motif: 'Elegantly Painted Blossom'
  },
  {
    code: 'NP_A6_HelloKitty',
    name: 'Sweet Bow · Hello Kitty',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 49.00,
    tag: 'Character',
    motif: 'Classic Red Bow & Whiskers'
  },
  {
    code: 'NP_A6_Kuromi',
    name: 'Gothic Star · Kuromi',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 49.00,
    tag: 'Character',
    motif: 'Jester Skull & Purple Accents'
  },
  {
    code: 'NP_A6_ToDoList',
    name: 'Task Priorities Checklist',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 49.00,
    tag: 'To-Do List',
    motif: 'Top 3 Tasks + Bullet Checklist'
  },
  {
    code: 'NP_A6_Lemon',
    name: 'Citrus Fresh · Lemon Pad',
    category: 'A6',
    sizeName: 'A6 Notepad (4 × 5.8 in)',
    dimensions: '4 × 5.8 in',
    sheets: 30,
    price: 49.00,
    tag: 'Fruit Motif',
    motif: 'Watercolor Lemon Sprig'
  },

  // A5 Notepads (5.8 × 8.3 in, 30 sheets, ₱99.00)
  {
    code: 'Blue DP_A5',
    name: 'Ocean Mist · Daily Planner',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Daily Planner',
    motif: 'Time Blocks & Priority Columns'
  },
  {
    code: 'Pink DP_A5',
    name: 'Rose Petal · Daily Planner',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Daily Planner',
    motif: 'Schedule, Water Tracker & Notes'
  },
  {
    code: 'Yellow DP_A5',
    name: 'Sunshine Glow · Daily Planner',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Daily Planner',
    motif: 'Daily Goals & Affirmations'
  },
  {
    code: 'WP1_A5',
    name: 'Goal & Habit · Weekly Planner 01',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Weekly Planner',
    motif: '7-Day Spread with Habit Loop'
  },
  {
    code: 'WP2_A5',
    name: 'Hourly Schedule · Weekly Planner 02',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Weekly Planner',
    motif: 'Time Matrix Mon-Sun'
  },
  {
    code: 'WP3_A5',
    name: 'Track & Reflect · Weekly Planner 03',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Weekly Planner',
    motif: 'Weekly Wins & Next Priorities'
  },
  {
    code: 'WP4_A5',
    name: 'Minimalist Focus · Weekly Planner 04',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Weekly Planner',
    motif: 'Ultra Clean Grid Layout'
  },
  {
    code: 'WP5_A5',
    name: 'Priority Matrix · Weekly Planner 05',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Weekly Planner',
    motif: 'Eisenhower Urgent/Important Quadrants'
  },
  {
    code: 'WP6_A5',
    name: 'Clean Checklist · Weekly Planner 06',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Weekly Planner',
    motif: 'Expanded Checklists for 7 Days'
  },
  {
    code: 'WP7_A5',
    name: 'Grid Journal · Weekly Planner 07',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Weekly Planner',
    motif: 'Bullet Journal Dot Columns'
  },
  {
    code: 'WP8_A5',
    name: 'Productivity Week · Weekly Planner 08',
    category: 'A5',
    sizeName: 'A5 Notepad (5.8 × 8.3 in)',
    dimensions: '5.8 × 8.3 in',
    sheets: 30,
    price: 99.00,
    tag: 'Weekly Planner',
    motif: 'Sprint Goals & Project Tracking'
  }
];

// ============================================================================
// 2. Application State
// ============================================================================

const appState = {
  activeGalleryTab: '3x3', // '3x3' (default), 'A6', 'A5'
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
  categoryTabsContainer: document.getElementById('categoryTabsContainer'),
  categoryTabs: document.querySelectorAll('#categoryTabs .tab-btn'),
  tab3x3: document.getElementById('tab3x3'),
  tabA6: document.getElementById('tabA6'),
  tabA5: document.getElementById('tabA5'),
  categorySpecPill: document.getElementById('categorySpecPill'),
  categorySpecText: document.getElementById('categorySpecText'),
  productGalleryGrid: document.getElementById('productGalleryGrid'),

  // Custom CTA Banner & Section
  customOrderCtaBanner: document.getElementById('customOrderCtaBanner'),
  btnOpenCustomOrder: document.getElementById('btnOpenCustomOrder'),
  btnCloseCustomSection: document.getElementById('btnCloseCustomSection'),
  btnBackToCatalog: document.getElementById('btnBackToCatalog'),
  customOrderingSection: document.getElementById('customOrderingSection'),
  customTermsBanner: document.getElementById('customTermsBanner'),

  // Header Actions
  btnHeaderCustom: document.getElementById('btnHeaderCustom'),
  btnHeaderCart: document.getElementById('btnHeaderCart'),
  headerCartCount: document.getElementById('headerCartCount'),

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
  toastContainer: document.getElementById('toastContainer')
};

// ============================================================================
// 3b. Product Gallery Grid, SVG Mockups & Tab Filtering
// ============================================================================

function getProductMockupSvg(code, name, category, tag) {
  let headerColor = '#cb6ce6';
  let accentBadge = '#ffde59';
  let iconEmoji = '📝';

  if (tag.includes('Cat')) {
    iconEmoji = '🐱';
    headerColor = '#f5b597';
  } else if (tag.includes('Character')) {
    iconEmoji = '🎀';
    headerColor = '#ea98b7';
  } else if (tag.includes('Floral')) {
    iconEmoji = '🌸';
    headerColor = '#7bc794';
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

function renderProductGallery(categoryKey) {
  if (!DOM.productGalleryGrid) return;
  DOM.productGalleryGrid.innerHTML = '';

  const items = PRODUCT_CATALOG.filter(p => p.category === categoryKey);

  items.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const safeCode = product.code.replace(/[^a-zA-Z0-9_-]/g, '_');
    card.id = `card_${safeCode}`;

    const fallbackSvg = getProductMockupSvg(product.code, product.name, product.category, product.tag);

    card.innerHTML = `
      <div class="product-card-image-wrap">
        <span class="product-card-badge">${product.code}</span>
        <span class="product-card-motif-tag">${product.tag}</span>
        <img 
          src="images/${encodeURIComponent(product.code)}.png" 
          alt="${product.name}" 
          class="product-card-img" 
          loading="lazy"
        />
      </div>
      <div class="product-card-body">
        <div class="product-spec">${product.sizeName} • ${product.sheets} sheets</div>
        <h4 class="product-title">${product.name}</h4>
      </div>

      <!-- Interactive Text Customization (Conditional Visibility + ₱10.00 surcharge) -->
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
      const currentUnitPrice = product.price + (isCustomized ? 10 : 0);
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

    if (inputCustText) {
      inputCustText.addEventListener('input', () => {
        if (inputCustText.value.trim().length > 0) {
          inputCustText.classList.remove('has-error');
          if (errCustText) errCustText.style.display = 'none';
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
        const isCustomized = Boolean(checkCust && checkCust.checked);
        const customText = inputCustText ? inputCustText.value.trim() : '';

        // Validation: If customization is checked, custom text is mandatory
        if (isCustomized && !customText) {
          if (inputCustText) {
            inputCustText.classList.add('has-error');
            inputCustText.focus();
          }
          if (errCustText) {
            errCustText.style.display = 'block';
          }
          showToast('Please enter the custom name or text to print.');
          return;
        }

        if (inputCustText) inputCustText.classList.remove('has-error');
        if (errCustText) errCustText.style.display = 'none';

        const quantity = parseInt(qtyInput ? qtyInput.value : '1', 10) || 1;
        addGalleryProductToCart(product, quantity, isCustomized, customText);
      });
    }

    DOM.productGalleryGrid.appendChild(card);
  });
}

function switchGalleryCategory(categoryKey) {
  appState.activeGalleryTab = categoryKey;

  // Update tabs active state
  if (DOM.categoryTabs) {
    DOM.categoryTabs.forEach(tab => {
      const isCurrent = (tab.dataset.category === categoryKey);
      tab.classList.toggle('active', isCurrent);
      tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });
  }

  // Update spec badge info
  const spec = CATEGORY_SPECS[categoryKey];
  if (DOM.categorySpecText && spec) {
    DOM.categorySpecText.textContent = spec.specText;
  }

  // Re-render cards
  renderProductGallery(categoryKey);
}

function addGalleryProductToCart(product, quantity = 1, isCustomized = false, customText = '') {
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const trimmedText = isCustomized ? customText.trim() : '';
  const unitPrice = product.price + (isCustomized ? 10 : 0);

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
  } else {
    const cartItem = {
      id: 'gallery_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      isCustomMade: false,
      categoryKey: 'notepads',
      categoryName: 'Notepads',
      sizeId: product.category,
      sizeName: product.sizeName,
      shortName: product.name,
      dimensions: product.dimensions,
      hasSheets: true,
      sheetCount: product.sheets,
      designCode: product.code,
      imagePath: 'images/' + encodeURIComponent(product.code) + '.png',
      isCustomized: isCustomized,
      customText: trimmedText,
      isTba: false,
      unitPrice: unitPrice,
      quantity: qty,
      subtotal: unitPrice * qty
    };
    appState.cart.push(cartItem);
  }

  renderCart();
  showCheckoutSection(false);
  const customNote = isCustomized ? ` with custom text "${trimmedText}"` : '';
  showToast(`Added ${qty}× ${product.name} (${product.code})${customNote} to order.`);
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

  // 2. Restore the Notepad Catalog view and CTA banner
  if (DOM.gallerySection) {
    DOM.gallerySection.style.display = 'block';
  }
  if (DOM.customOrderCtaBanner) {
    DOM.customOrderCtaBanner.style.display = 'block';
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

  DOM.designMockupImg.src = 'images/' + encodeURIComponent(selectedCode) + '.png';
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

function updateCustomPriceAndPreview() {
  if (!DOM.selectCustomNotepadSize) return;

  const sizeKey = DOM.selectCustomNotepadSize.value || 'square';
  const rawSheetCount = DOM.inputCustomSheetCount ? DOM.inputCustomSheetCount.value : '30';
  const instructions = DOM.textareaCustomInstructions ? DOM.textareaCustomInstructions.value.trim() : '';

  const priceCalc = calculateCustomNotepadPrice(sizeKey, rawSheetCount);

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
  const sizeKey = DOM.selectCustomNotepadSize ? DOM.selectCustomNotepadSize.value : 'square';
  const sheetCountInput = DOM.inputCustomSheetCount ? parseInt(DOM.inputCustomSheetCount.value, 10) : 30;
  const instructions = DOM.textareaCustomInstructions ? DOM.textareaCustomInstructions.value.trim() : '';
  let qty = DOM.inputCustomQuantity ? parseInt(DOM.inputCustomQuantity.value, 10) : 3;

  if (isNaN(sheetCountInput) || sheetCountInput < 30) {
    showToast('Preferred sheet count must be at least 30 sheets.');
    if (DOM.inputCustomSheetCount) {
      DOM.inputCustomSheetCount.focus();
      const parent = document.getElementById('groupCustomSheetCount');
      if (parent) parent.classList.add('has-error');
    }
    return;
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

  // Minimum Order Quantity (MOQ): 3 pads per size per design
  if (isNaN(qty) || qty < 3) {
    qty = 3;
    if (DOM.inputCustomQuantity) {
      DOM.inputCustomQuantity.value = '3';
    }
  }

  const priceCalc = calculateCustomNotepadPrice(sizeKey, sheetCountInput);

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

  const cartItem = {
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    categoryKey: appState.currentCategory,
    categoryName: categoryData.categoryName,
    sizeId: sizeObj.id,
    sizeName: sizeObj.name,
    shortName: sizeObj.shortName || sizeObj.name,
    dimensions: sizeObj.dimensions,
    hasSheets: categoryData.hasSheets,
    sheetCount: categoryData.hasSheets ? appState.selectedSheetCount : null,
    designCode: appState.selectedDesignCode,
    imagePath: 'images/' + encodeURIComponent(appState.selectedDesignCode) + '.png',
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

function renderCart() {
  const totalItems = appState.cart.length;
  const totalUnits = appState.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (DOM.headerCartCount) {
    DOM.headerCartCount.textContent = totalUnits;
  }

  if (DOM.cartCountBadge) {
    DOM.cartCountBadge.textContent = `${totalItems} Item${totalItems === 1 ? '' : 's'}${totalUnits > 0 ? ` (${totalUnits} pcs)` : ''}`;
  }

  if (totalItems === 0) {
    if (DOM.emptyCartState) DOM.emptyCartState.style.display = 'block';
    if (DOM.cartItemsList) {
      DOM.cartItemsList.style.display = 'none';
      DOM.cartItemsList.innerHTML = '';
    }
    if (DOM.summarySubtotalAmount) DOM.summarySubtotalAmount.textContent = '₱0.00';
    if (DOM.summaryGrandTotal) DOM.summaryGrandTotal.textContent = '₱0.00';
    return;
  }

  if (DOM.emptyCartState) DOM.emptyCartState.style.display = 'none';
  if (DOM.cartItemsList) {
    DOM.cartItemsList.style.display = 'flex';
    DOM.cartItemsList.innerHTML = '';
  }

  // Reveal checkout section when cart has items
  if (DOM.checkoutSection) {
    DOM.checkoutSection.style.display = 'block';
  }

  let numericTotal = 0;

  appState.cart.forEach(item => {
    if (!item.isTba) {
      numericTotal += item.subtotal;
    }

    const itemCard = document.createElement('div');
    itemCard.className = 'cart-item-card';
    itemCard.id = `cart-item-${item.id}`;

    let specDetails = `${item.dimensions}`;
    if (item.hasSheets) {
      specDetails += ` • ${item.sheetCount} sheets`;
      if (item.extraSheets && item.extraSheets > 0) {
        specDetails += ` (+${item.extraSheets} extra @ ₱${item.rate.toFixed(2)}/sh)`;
      }
    }

    let customDetailsBadge = '';
    if (item.isCustomMade) {
      customDetailsBadge = `
        <div class="cart-item-custom-badge" style="background: rgba(203, 108, 230, 0.12); color: var(--brand-purple-dark); border: 1px solid rgba(203, 108, 230, 0.3);">
          <span>📝 Request: "${item.instructions}"</span>
        </div>
      `;
    } else if (item.isCustomized) {
      customDetailsBadge = `
        <div class="cart-item-custom-badge">
          <span>✨ Custom: "${item.customText}"</span>
        </div>
      `;
    }

    const subtotalText = item.isTba ? '<span class="cart-item-subtotal tba">TBA</span>' : `<span class="cart-item-subtotal">₱${item.subtotal.toFixed(2)}</span>`;
    const unitPriceText = item.isTba ? 'TBA' : `₱${item.unitPrice.toFixed(2)}`;

    let thumbHtml = '';
    if (item.isCustomMade) {
      thumbHtml = `<div class="cart-item-custom-thumb" style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:1.75rem; background:rgba(203,108,230,0.15); border-radius:8px;">🎨</div>`;
    } else {
      thumbHtml = `<img src="images/${encodeURIComponent(item.designCode)}.png" alt="${item.designCode}" onerror="this.onerror=null; this.style.display='none';">`;
    }

    const designBadgeHtml = item.isCustomMade
      ? `<div class="cart-item-design-badge" style="background: var(--brand-black); color: var(--brand-yellow);">Design: Custom Layout Draft</div>`
      : `<div class="cart-item-design-badge">Design: ${item.designCode}</div>`;

    itemCard.innerHTML = `
      <div class="cart-item-main">
        <div class="cart-item-thumb-wrapper">
          ${thumbHtml}
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.sizeName}</div>
          <div class="cart-item-spec-line">${specDetails}</div>
          ${designBadgeHtml}
          ${customDetailsBadge}
        </div>
      </div>
      <div class="cart-item-footer">
        <div class="cart-item-qty-price">
          ${item.quantity} × ${unitPriceText}
        </div>
        <div style="display: flex; align-items: center; gap: 14px;">
          ${subtotalText}
          <button type="button" class="cart-item-remove-btn" onclick="window.removeCartItem('${item.id}')" title="Remove item">
            ✕ Remove
          </button>
        </div>
      </div>
    `;

    DOM.cartItemsList.appendChild(itemCard);
  });

  if (DOM.summarySubtotalAmount) {
    DOM.summarySubtotalAmount.textContent = `₱${numericTotal.toFixed(2)}`;
  }
  if (DOM.summaryGrandTotal) {
    DOM.summaryGrandTotal.textContent = `₱${numericTotal.toFixed(2)}`;
  }
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

function buildJobOrderSlip(refNo) {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  DOM.joReferenceNumber.textContent = refNo;
  DOM.joDateGenerated.textContent = `Generated on ${new Date().toLocaleDateString('en-US', options)}`;
  
  DOM.joCustomerName.textContent = appState.customer.fullName;
  DOM.joCustomerContact.textContent = appState.customer.contactNumber;
  DOM.joCustomerSocial.textContent = appState.customer.socialHandle;
  DOM.joCourier.textContent = appState.customer.courier;
  DOM.joCustomerAddress.textContent = appState.customer.address;
  DOM.joPayment.textContent = appState.customer.payment;
  if (DOM.joOrderType && appState.customer.orderType) {
    DOM.joOrderType.textContent = appState.customer.orderType;
  }
  if (DOM.joCustomMadeDetailsRow && DOM.joCustomMadeDetails) {
    if (appState.customer.isCustomMade) {
      DOM.joCustomMadeDetailsRow.style.display = 'block';
      const customItems = appState.cart.filter(i => i.isCustomMade);
      if (customItems.length > 0) {
        DOM.joCustomMadeDetails.innerHTML = customItems.map((ci, idx) => `
          <div style="margin-bottom: 6px;">
            <strong>Custom Notepad #${idx + 1}:</strong> ${escapeHtml(ci.sizeName)} (${ci.sheetCount} sheets${ci.extraSheets > 0 ? `, +${ci.extraSheets} extra @ ₱${ci.rate.toFixed(2)}/sh` : ''})<br>
            <strong>Instructions:</strong> ${escapeHtml(ci.instructions)}
          </div>
        `).join('');
      } else {
        DOM.joCustomMadeDetails.innerHTML = `
          <strong>Order Type:</strong> Custom Made Notepad Order
        `;
      }
    } else {
      DOM.joCustomMadeDetailsRow.style.display = 'none';
    }
  }

  DOM.joTableBody.innerHTML = '';
  let grandTotalNumeric = 0;

  appState.cart.forEach(item => {
    grandTotalNumeric += item.subtotal;

    let personalizationText = '<span style="color:#6b7280; font-style:italic;">Standard (None)</span>';
    if (item.isCustomMade) {
      personalizationText = `<span style="color:#111827; font-weight:600;">Custom Layout: "${escapeHtml(item.instructions)}"</span>`;
    } else if (item.isCustomized) {
      personalizationText = `<span style="color:#721c8a; font-weight:700;">"${escapeHtml(item.customText)}"</span> <span style="display:inline-block; font-size:0.7rem; background:#ffde59; color:#111827; padding:1px 6px; border-radius:4px; font-weight:800; margin-left:4px;">+₱10</span>`;
    }

    const priceCell = item.isTba ? '<span style="color:#b241ce; font-weight:700;">TBA</span>' : `₱${item.unitPrice.toFixed(2)}`;
    const subtotalCell = item.isTba ? '<span style="color:#b241ce; font-weight:700;">TBA</span>' : `₱${item.subtotal.toFixed(2)}`;

    const designCellHtml = item.isCustomMade
      ? `<span class="jo-design-badge jo-design-badge-custom">CUSTOM</span>`
      : `<span class="jo-design-badge">${escapeHtml(item.designCode)}</span>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong style="color:#111827; font-weight:700;">${escapeHtml(item.categoryName)} - ${escapeHtml(item.sizeName)}</strong><br>
        <span style="font-size:0.775rem; color:#64748b;">${escapeHtml(item.dimensions)} ${item.hasSheets ? '• ' + item.sheetCount + ' sheets' + (item.extraSheets > 0 ? ` (+${item.extraSheets} extra)` : '') : ''}</span>
      </td>
      <td>
        ${designCellHtml}
      </td>
      <td>${personalizationText}</td>
      <td style="text-align: center; font-weight: 700; color:#111827;">${item.quantity}</td>
      <td style="text-align: right; color:#334155; font-weight:600;">${priceCell}</td>
      <td style="text-align: right; font-weight: 800; color:#111827;">${subtotalCell}</td>
    `;
    DOM.joTableBody.appendChild(row);
  });

  DOM.joModalGrandTotal.textContent = `₱${grandTotalNumeric.toFixed(2)}`;

  DOM.paymentInstructionsText.innerHTML = `
    <p>1. <strong>Payment Privacy:</strong> Official payment details and QR code will be shared separately and privately via your social handle (<strong>${escapeHtml(appState.customer.socialHandle)}</strong>) or contact number (<strong>${escapeHtml(appState.customer.contactNumber)}</strong>).</p>
    <p>2. Please reference Job Order No. <strong>${escapeHtml(refNo)}</strong> when sending proof of payment.</p>
    <p>3. Production starts upon payment confirmation. Standard lead time is 3–5 business days before courier dispatch (${escapeHtml(appState.customer.courier)}).</p>
  `;

  return grandTotalNumeric;
}

async function downloadJobOrderAsPdf() {
  const downloadBtn = DOM.btnDownloadPdf || document.getElementById('btnDownloadPdf') || document.getElementById('btnDownloadImage');
  const originalBtnText = downloadBtn ? downloadBtn.innerHTML : '';
  
  if (downloadBtn) {
    downloadBtn.innerHTML = '<span>⏳ Generating PDF...</span>';
    downloadBtn.disabled = true;
  }

  let offscreenContainer = null;

  try {
    const slipElement = DOM.printableJobOrderSlip || document.getElementById('printableJobOrderSlip');
    if (!slipElement) {
      throw new Error('Slip element not found');
    }

    if (typeof window.html2canvas === 'undefined') {
      throw new Error('html2canvas library is not loaded');
    }

    const jsPdfLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPdfLib) {
      throw new Error('jsPDF library is not loaded');
    }

    // Ensure all custom web fonts ('Raleway', 'Playfair Display') are fully parsed and ready before render
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (fontErr) {
        console.warn('Font loading check:', fontErr);
      }
    }

    // Create an offscreen wrapper with fixed desktop A4 dimensions (780px) positioned in document flow
    offscreenContainer = document.createElement('div');
    offscreenContainer.id = 'pdf-render-container';
    offscreenContainer.style.position = 'fixed';
    offscreenContainer.style.left = '0';
    offscreenContainer.style.top = '0';
    offscreenContainer.style.width = '780px';
    offscreenContainer.style.minWidth = '780px';
    offscreenContainer.style.maxWidth = '780px';
    offscreenContainer.style.zIndex = '-9999';
    offscreenContainer.style.background = '#ffffff';
    offscreenContainer.style.opacity = '1';
    offscreenContainer.style.pointerEvents = 'none';
    offscreenContainer.style.overflow = 'visible';

    // Clone the slip element and enforce desktop styling
    const clone = slipElement.cloneNode(true);
    clone.classList.add('pdf-render-mode');
    clone.style.width = '780px';
    clone.style.minWidth = '780px';
    clone.style.maxWidth = '780px';
    clone.style.padding = '28px';
    clone.style.boxSizing = 'border-box';
    clone.style.background = '#ffffff';
    clone.style.color = '#111827';
    clone.style.fontFamily = "'Raleway', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    clone.style.lineHeight = '1.5';
    clone.style.display = 'block';

    // 1. Force typography: enforce 'Raleway' universally, and 'Playfair Display' for the brand name
    clone.querySelectorAll('*').forEach(el => {
      if (el.classList.contains('brand-name-word') || el.closest('.brand-name-word')) {
        el.style.fontFamily = "'Playfair Display', Georgia, serif";
        el.style.fontStyle = 'italic';
        el.style.fontWeight = '800';
        el.style.color = '#111827';
        el.style.webkitTextFillColor = '#111827';
        el.style.fontSize = '1.75rem';
      } else {
        el.style.fontFamily = "'Raleway', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      }
    });

    // 2. Header Pills: Yellow (Job Order No.), Purple (Date), Cyan (Status)
    const headerBox = clone.querySelector('.job-order-header-box');
    if (headerBox) {
      headerBox.style.display = 'flex';
      headerBox.style.justifyContent = 'space-between';
      headerBox.style.alignItems = 'flex-start';
      headerBox.style.paddingBottom = '18px';
      headerBox.style.borderBottom = '2px solid #e2e8f0';
      headerBox.style.marginBottom = '20px';
    }

    const refEl = clone.querySelector('.jo-ref-num');
    if (refEl) {
      refEl.style.background = '#ffde59';
      refEl.style.color = '#111827';
      refEl.style.border = '1px solid #e5c545';
      refEl.style.padding = '5px 14px';
      refEl.style.borderRadius = '6px';
      refEl.style.fontWeight = '800';
      refEl.style.fontSize = '1.2rem';
      refEl.style.display = 'inline-block';
      refEl.style.letterSpacing = '0.05em';
    }

    const badgesWrap = clone.querySelector('.jo-meta-badges-wrap');
    if (badgesWrap) {
      badgesWrap.style.display = 'flex';
      badgesWrap.style.alignItems = 'center';
      badgesWrap.style.gap = '8px';
      badgesWrap.style.marginTop = '8px';
    }

    const dateEl = clone.querySelector('#joDateGenerated') || clone.querySelector('.jo-date-badge');
    if (dateEl) {
      dateEl.style.background = '#f5e6fb';
      dateEl.style.color = '#721c8a';
      dateEl.style.border = '1px solid #d8b4fe';
      dateEl.style.padding = '4px 12px';
      dateEl.style.borderRadius = '9999px';
      dateEl.style.fontWeight = '700';
      dateEl.style.fontSize = '0.75rem';
      dateEl.style.display = 'inline-block';
    }

    const statusEl = clone.querySelector('#joStatusBadge') || clone.querySelector('.jo-status-badge');
    if (statusEl) {
      statusEl.style.background = '#e0fbfb';
      statusEl.style.color = '#007c7c';
      statusEl.style.border = '1px solid #5eead4';
      statusEl.style.padding = '4px 12px';
      statusEl.style.borderRadius = '9999px';
      statusEl.style.fontWeight = '700';
      statusEl.style.fontSize = '0.75rem';
      statusEl.style.display = 'inline-block';
    }

    // 3. Customer Info Card: rounded container, light gray/purple background, uppercase headers
    const custGrid = clone.querySelector('.customer-info-grid');
    if (custGrid) {
      custGrid.style.background = '#f8f6fc';
      custGrid.style.border = '1.5px solid #ece7f6';
      custGrid.style.borderRadius = '12px';
      custGrid.style.padding = '18px 20px';
      custGrid.style.display = 'grid';
      custGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
      custGrid.style.gap = '14px 16px';
      custGrid.style.marginBottom = '20px';
    }

    clone.querySelectorAll('.info-item-label').forEach(lbl => {
      lbl.style.fontSize = '0.72rem';
      lbl.style.textTransform = 'uppercase';
      lbl.style.letterSpacing = '0.06em';
      lbl.style.color = '#6b7280';
      lbl.style.fontWeight = '800';
      lbl.style.marginBottom = '3px';
    });

    clone.querySelectorAll('.info-item-value').forEach(val => {
      val.style.fontSize = '0.925rem';
      val.style.fontWeight = '700';
      val.style.color = '#111827';
      val.style.wordBreak = 'break-word';
    });

    clone.querySelectorAll('.info-item[style*="grid-column"]').forEach(item => {
      item.style.gridColumn = '1 / -1';
    });

    // 4. Product Table: dark navy/black header row (#1A202C), white bold text, badges, row borders
    const tableWrap = clone.querySelector('.jo-table-wrapper');
    if (tableWrap) {
      tableWrap.style.overflow = 'visible';
      tableWrap.style.width = '100%';
      tableWrap.style.border = '1.5px solid #e2e8f0';
      tableWrap.style.borderRadius = '10px';
      tableWrap.style.marginBottom = '16px';
      tableWrap.style.background = '#ffffff';
    }

    const table = clone.querySelector('.jo-table');
    if (table) {
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
    }

    clone.querySelectorAll('.jo-table th').forEach(th => {
      th.style.background = '#1A202C';
      th.style.color = '#ffffff';
      th.style.padding = '12px 14px';
      th.style.fontWeight = '800';
      th.style.fontSize = '0.78rem';
      th.style.textTransform = 'uppercase';
      th.style.letterSpacing = '0.05em';
      th.style.border = 'none';
    });

    clone.querySelectorAll('.jo-table tbody td').forEach(td => {
      td.style.padding = '12px 14px';
      td.style.borderBottom = '1px solid #e2e8f0';
      td.style.fontSize = '0.85rem';
      td.style.color = '#1e293b';
      td.style.verticalAlign = 'middle';
    });

    clone.querySelectorAll('.jo-design-badge').forEach(badge => {
      if (badge.classList.contains('jo-design-badge-custom') || badge.textContent.includes('CUSTOM')) {
        badge.style.background = '#721c8a';
        badge.style.color = '#ffffff';
      } else {
        badge.style.background = '#000000';
        badge.style.color = '#ffde59';
      }
      badge.style.padding = '3px 10px';
      badge.style.borderRadius = '6px';
      badge.style.fontWeight = '800';
      badge.style.fontSize = '0.75rem';
      badge.style.letterSpacing = '0.04em';
      badge.style.display = 'inline-block';
    });

    clone.querySelectorAll('.jo-table tfoot td').forEach(td => {
      td.style.padding = '14px 16px';
      td.style.background = '#f8fafc';
      td.style.borderTop = '2px solid #e2e8f0';
      td.style.fontWeight = '800';
    });

    const totalVal = clone.querySelector('#joModalGrandTotal');
    if (totalVal) {
      totalVal.style.fontWeight = '800';
      totalVal.style.fontSize = '1.25rem';
      totalVal.style.color = '#111827';
    }

    // 5. Notice Cards: shipping banner (light yellow) & payment notice (solid black with yellow header)
    const shipBanner = clone.querySelector('.shipping-disclaimer-banner');
    if (shipBanner) {
      shipBanner.style.background = '#fffbeb';
      shipBanner.style.color = '#92400e';
      shipBanner.style.border = '1.5px solid #fde68a';
      shipBanner.style.borderRadius = '8px';
      shipBanner.style.padding = '12px 16px';
      shipBanner.style.fontWeight = '700';
      shipBanner.style.fontSize = '0.85rem';
      shipBanner.style.marginBottom = '16px';
    }

    const payBox = clone.querySelector('.payment-guidelines-box');
    if (payBox) {
      payBox.style.background = '#111827';
      payBox.style.color = '#ffffff';
      payBox.style.border = '1px solid #374151';
      payBox.style.borderRadius = '12px';
      payBox.style.padding = '20px';
    }

    const payTitle = clone.querySelector('.payment-guidelines-title');
    if (payTitle) {
      payTitle.style.color = '#ffde59';
      payTitle.style.fontWeight = '800';
      payTitle.style.fontSize = '0.95rem';
      payTitle.style.textTransform = 'uppercase';
      payTitle.style.letterSpacing = '0.05em';
      payTitle.style.marginBottom = '10px';
    }

    const payList = clone.querySelector('.payment-details-list');
    if (payList) {
      payList.style.color = 'rgba(255, 255, 255, 0.9)';
      payList.style.fontSize = '0.85rem';
      payList.style.lineHeight = '1.65';
    }

    clone.querySelectorAll('.payment-details-list strong').forEach(st => {
      st.style.color = '#ffffff';
      st.style.fontWeight = '700';
    });

    offscreenContainer.appendChild(clone);
    document.body.appendChild(offscreenContainer);

    // Brief paint pause so browser finishes layout and typography paint
    await new Promise(resolve => setTimeout(resolve, 150));

    // Capture offscreen desktop layout using html2canvas
    const canvas = await window.html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 780,
      windowWidth: 1024,
      scrollX: 0,
      scrollY: 0
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const refNo = (DOM.joReferenceNumber ? DOM.joReferenceNumber.textContent.trim() : '') || 'JobOrder';
    const fileName = `Printelio_Job_Order_${refNo}.pdf`;

    const pdf = new jsPdfLib({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Fit canvas aspect ratio to A4 page width with 8mm margins
    const margin = 8;
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    if (contentHeight <= (pdfHeight - margin * 2)) {
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
    } else {
      let heightLeft = contentHeight;
      let position = margin;
      
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - contentHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }
    }

    // Save and prompt download for both Desktop and Mobile devices
    pdf.save(fileName);
    showToast('Job Order PDF generated successfully!');

  } catch (err) {
    console.error('Error generating PDF:', err);
    showToast('Could not save PDF automatically. Please screenshot your order slip.');
  } finally {
    if (offscreenContainer && document.body.contains(offscreenContainer)) {
      document.body.removeChild(offscreenContainer);
    }
    if (downloadBtn) {
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.disabled = false;
    }
  }
}

async function submitJobOrder() {
  if (appState.cart.length === 0) {
    showToast('Your order is empty. Please add items before submitting.');
    if (DOM.productGalleryGrid) DOM.productGalleryGrid.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Ensure no customized items in cart have empty custom text
  const emptyCustomizedCartItem = appState.cart.find(
    item => item.isCustomized && (!item.customText || !item.customText.trim())
  );
  if (emptyCustomizedCartItem) {
    showToast('A customized item is missing custom text. Please check your order details.');
    if (DOM.checkoutSection) DOM.checkoutSection.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Also verify if any active product card has customization checked but empty text
  const checkedEmptyInput = document.querySelector('.card-customization-box.active .card-custom-input');
  if (checkedEmptyInput && !checkedEmptyInput.value.trim()) {
    checkedEmptyInput.classList.add('has-error');
    const parentBox = checkedEmptyInput.closest('.card-customization-box');
    if (parentBox) {
      const errMsg = parentBox.querySelector('.card-custom-error-msg');
      if (errMsg) errMsg.style.display = 'block';
      parentBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    checkedEmptyInput.focus();
    showToast('Please enter the custom name or text to print, or uncheck the customization option.');
    return;
  }

  const isFormValid = validateCustomerForm();
  if (!isFormValid) {
    showToast('Please complete all required customer details.');
    DOM.customerDetailsCard.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Update State from Form
  const isCustomMade = DOM.selectOrderType ? DOM.selectOrderType.value.includes('Custom Made') : false;
  appState.customer = {
    fullName: DOM.inputFullName.value.trim(),
    contactNumber: DOM.inputContactNumber.value.trim(),
    socialHandle: DOM.inputSocialHandle.value.trim(),
    courier: DOM.selectCourier.value,
    address: DOM.inputAddress.value.trim(),
    payment: DOM.selectPayment.value,
    orderType: DOM.selectOrderType ? DOM.selectOrderType.value : 'Regular Purchase (Standard design, size & sheets)',
    isCustomMade: isCustomMade,
    customDimensions: (isCustomMade && DOM.inputCustomDimensions) ? DOM.inputCustomDimensions.value.trim() : '',
    customSheetCount: (isCustomMade && DOM.inputCustomSheetCount) ? DOM.inputCustomSheetCount.value : '',
    customInstructions: (isCustomMade && DOM.textareaCustomInstructions) ? DOM.textareaCustomInstructions.value.trim() : ''
  };

  const refNo = generateReferenceNumber();
  const grandTotal = buildJobOrderSlip(refNo);

  // Show the modal slip to user immediately
  DOM.jobOrderModal.classList.add('active');

  const originalSubmitText = DOM.btnSubmitOrder ? DOM.btnSubmitOrder.innerHTML : '';
  if (DOM.btnSubmitOrder) {
    DOM.btnSubmitOrder.disabled = true;
    DOM.btnSubmitOrder.innerHTML = '<span>⏳ Submitting Order...</span>';
  }

  try {
    // 1. Format plain-text itemized summary for sheet
    const itemizedSummaryText = appState.cart.map((item, idx) => {
      if (item.isCustomMade) {
        return `${idx + 1}. [Custom Made] ${item.sizeName} (${item.sheetCount} sheets${item.extraSheets > 0 ? `, +${item.extraSheets} extra @ ₱${item.rate.toFixed(2)}/sh` : ''}) - Instructions: "${item.instructions}" | Qty: ${item.quantity} | ₱${item.subtotal.toFixed(2)}`;
      }
      const customStr = item.isCustomized ? ` [Custom: "${item.customText}"]` : '';
      const sheetStr = item.hasSheets ? ` (${item.sheetCount} sheets)` : '';
      const priceStr = item.isTba ? 'TBA' : `₱${item.subtotal.toFixed(2)}`;
      return `${idx + 1}. ${item.sizeName} - Design: ${item.designCode}${sheetStr}${customStr} | Qty: ${item.quantity} | ${priceStr}`;
    }).join('\n');

    // 2. Extract selected design codes
    const uniqueDesignCodes = [...new Set(appState.cart.map(item => item.designCode))].join(', ');

    // 3. Prepare Google Sheets Payload
    const customItems = appState.cart.filter(i => i.isCustomMade);
    const customDetailsSummary = appState.customer.isCustomMade
      ? (customItems.length > 0
          ? customItems.map(i => `[Custom Item] Size: ${i.sizeName} | Sheets: ${i.sheetCount} (+${i.extraSheets || 0} extra) | Instructions: ${i.instructions}`).join('; ')
          : `[Custom Made] Size: ${DOM.selectCustomNotepadSize ? DOM.selectCustomNotepadSize.options[DOM.selectCustomNotepadSize.selectedIndex].text : ''} | Sheets: ${DOM.inputCustomSheetCount ? DOM.inputCustomSheetCount.value : 30} | Instructions: ${DOM.textareaCustomInstructions ? DOM.textareaCustomInstructions.value.trim() : ''}`
        )
      : 'Regular Purchase';

    const sheetPayload = {
      fullName: appState.customer.fullName,
      contactNumber: appState.customer.contactNumber,
      socialHandle: appState.customer.socialHandle,
      courier: appState.customer.courier,
      address: appState.customer.address,
      paymentMethod: appState.customer.payment,
      orderType: appState.customer.orderType,
      customSpecifications: customDetailsSummary,
      designMotif: uniqueDesignCodes,
      orderItems: itemizedSummaryText,
      totalPrice: `₱${grandTotal.toFixed(2)}`
    };

    // 4. Send directly to Google Sheets Web App
    await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sheetPayload)
    });

    showToast(`Order submitted successfully! Your order has been recorded.`);

  } catch (sheetError) {
    console.error('Google Sheets submission error:', sheetError);
    showToast(`Job Order ${refNo} generated! Please download or screenshot your slip.`);
  } finally {
    if (DOM.btnSubmitOrder) {
      DOM.btnSubmitOrder.disabled = false;
      DOM.btnSubmitOrder.innerHTML = originalSubmitText || 'Submit Job Order';
    }
  }
}

function closeModal() {
  DOM.jobOrderModal.classList.remove('active');
}

function startNewOrder() {
  closeModal();
  appState.cart = [];
  renderCart();
  if (DOM.customerForm) DOM.customerForm.reset();
  if (DOM.checkoutSection) DOM.checkoutSection.style.display = 'none';
  switchToCatalogView();
  syncCustomerSummaryDisplay();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('Ready for a new custom stationery order.');
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
  // Gallery Category Tabs (3x3, A6, A5)
  if (DOM.tab3x3) {
    DOM.tab3x3.addEventListener('click', () => switchGalleryCategory('3x3'));
  }
  if (DOM.tabA6) {
    DOM.tabA6.addEventListener('click', () => switchGalleryCategory('A6'));
  }
  if (DOM.tabA5) {
    DOM.tabA5.addEventListener('click', () => switchGalleryCategory('A5'));
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

  // Custom Made Form Event Listeners (Preserved)
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
  
  const downloadBtn = DOM.btnDownloadPdf || document.getElementById('btnDownloadPdf') || document.getElementById('btnDownloadImage');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadJobOrderAsPdf);
  }

  if (DOM.jobOrderModal) {
    DOM.jobOrderModal.addEventListener('click', (e) => {
      if (e.target === DOM.jobOrderModal) {
        closeModal();
      }
    });
  }

  attachValidationClearListeners();
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize gallery view with default 3x3 category tab
  switchGalleryCategory('3x3');

  // 2. Initialize custom pricing formulas and preview
  updateCustomPriceAndPreview();

  // 3. Render cart (updates badge count and sets up initial view)
  renderCart();

  // 4. Attach event listeners
  initEventListeners();
});

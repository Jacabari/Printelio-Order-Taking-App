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
// 2. Application State
// ============================================================================

const appState = {
  currentCategory: 'notepads',
  selectedSizeId: 'np-a5', // Default to A5 Notepad
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
  // Product Selection Card & Groups
  productSelectionCard: document.getElementById('productSelectionCard'),
  categoryTabsContainer: document.getElementById('categoryTabs'),
  sizeOptionsContainer: document.getElementById('sizeOptionsContainer'),
  designSelectionBox: document.getElementById('designSelectionBox'),
  itemActionBar: document.getElementById('itemActionBar'),

  // Category tabs
  tabNotepads: document.getElementById('tabNotepads'),
  tabNotecards: document.getElementById('tabNotecards'),
  tabEnvelopes: document.getElementById('tabEnvelopes'),
  categoryTabs: document.querySelectorAll('.tab-btn'),
  categoryBadge: document.getElementById('categoryBadge'),
  
  // Size & Product Controls
  sizeCardsGrid: document.getElementById('sizeCardsGrid'),
  sheetCountGroup: document.getElementById('sheetCountGroup'),
  radioSheet30: document.getElementById('radioSheet30'),
  radioSheet50: document.getElementById('radioSheet50'),
  
  // Design & Mockup Preview Elements
  selectDesignCode: document.getElementById('selectDesignCode'),
  designDescriptionText: document.getElementById('designDescriptionText'),
  designPreviewCaption: document.getElementById('designPreviewCaption'),
  designMockupImg: document.getElementById('designMockupImg'),
  
  // Customization
  customizationContainer: document.getElementById('customizationContainer'),
  checkCustomization: document.getElementById('checkCustomization'),
  customInputsCollapse: document.getElementById('customInputsCollapse'),
  inputCustomText: document.getElementById('inputCustomText'),
  
  // Pricing & Quantity Stepper
  currentUnitPrice: document.getElementById('currentUnitPrice'),
  currentPriceBreakdown: document.getElementById('currentPriceBreakdown'),
  inputQuantity: document.getElementById('inputQuantity'),
  btnQtyMinus: document.getElementById('btnQtyMinus'),
  btnQtyPlus: document.getElementById('btnQtyPlus'),
  btnAddToCart: document.getElementById('btnAddToCart'),
  
  // Standard & Custom Section Wrappers
  standardOrderingSection: document.getElementById('standardOrderingSection'),
  customOrderingSection: document.getElementById('customOrderingSection'),
  productCardTitle: document.getElementById('productCardTitle'),
  productCardSubtitle: document.getElementById('productCardSubtitle'),

  // Custom Made Form Controls & 1:1 Preview
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

  // Customer Form
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
  inputCustomSheetCount: document.getElementById('inputCustomSheetCount'),
  textareaCustomInstructions: document.getElementById('textareaCustomInstructions'),
  
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
  showToast(`Added ${qty}× ${customCartItem.sizeName} (${priceCalc.sheetCount} sheets) to order.`);

  if (DOM.inputCustomQuantity) {
    DOM.inputCustomQuantity.value = '3';
  }
}

function addItemToCart() {
  if (!appState.selectedDesignCode) {
    showToast('Please select a Design Code before adding to order.');
    DOM.selectDesignCode.focus();
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
  DOM.cartCountBadge.textContent = `${totalItems} Item${totalItems === 1 ? '' : 's'}`;

  if (totalItems === 0) {
    DOM.emptyCartState.style.display = 'block';
    DOM.cartItemsList.style.display = 'none';
    DOM.cartItemsList.innerHTML = '';
    if (DOM.summarySubtotalAmount) DOM.summarySubtotalAmount.textContent = '₱0.00';
    if (DOM.summaryGrandTotal) DOM.summaryGrandTotal.textContent = '₱0.00';
    return;
  }

  DOM.emptyCartState.style.display = 'none';
  DOM.cartItemsList.style.display = 'flex';
  DOM.cartItemsList.innerHTML = '';

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
            <strong>Custom Notepad #${idx + 1}:</strong> ${ci.sizeName} (${ci.sheetCount} sheets${ci.extraSheets > 0 ? `, +${ci.extraSheets} extra @ ₱${ci.rate.toFixed(2)}/sh` : ''})<br>
            <strong>Instructions:</strong> ${ci.instructions}
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

    let personalizationText = 'Standard (None)';
    if (item.isCustomMade) {
      personalizationText = `Custom Layout: "${item.instructions}"`;
    } else if (item.isCustomized) {
      personalizationText = `"${item.customText}"`;
    }

    const priceCell = item.isTba ? '<span style="color:#b241ce; font-weight:700;">TBA</span>' : `₱${item.unitPrice.toFixed(2)}`;
    const subtotalCell = item.isTba ? '<span style="color:#b241ce; font-weight:700;">TBA</span>' : `₱${item.subtotal.toFixed(2)}`;

    const designCellHtml = item.isCustomMade
      ? `<span style="background:var(--brand-purple-dark, #721c8a); color:#ffffff; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.75rem;">CUSTOM</span>`
      : `<span style="background:#000000; color:#ffde59; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.75rem;">${item.designCode}</span>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong>${item.categoryName} - ${item.sizeName}</strong><br>
        <span style="font-size:0.775rem; color:#666;">${item.dimensions} ${item.hasSheets ? '• ' + item.sheetCount + ' sheets' + (item.extraSheets > 0 ? ` (+${item.extraSheets} extra)` : '') : ''}</span>
      </td>
      <td>
        ${designCellHtml}
      </td>
      <td>${personalizationText}</td>
      <td style="text-align: center; font-weight: 700;">${item.quantity}</td>
      <td style="text-align: right;">${priceCell}</td>
      <td style="text-align: right; font-weight: 700;">${subtotalCell}</td>
    `;
    DOM.joTableBody.appendChild(row);
  });

  DOM.joModalGrandTotal.textContent = `₱${grandTotalNumeric.toFixed(2)}`;

  DOM.paymentInstructionsText.innerHTML = `
    <p>1. <strong>Payment Privacy:</strong> Official payment details and QR code will be shared separately and privately via your social handle (<strong>${appState.customer.socialHandle}</strong>) or contact number (<strong>${appState.customer.contactNumber}</strong>).</p>
    <p>2. Please reference Job Order No. <strong>${refNo}</strong> when sending proof of payment.</p>
    <p>3. Production starts upon payment confirmation. Standard lead time is 3–5 business days before courier dispatch (${appState.customer.courier}).</p>
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

    // Create an offscreen wrapper with fixed desktop A4 dimensions to bypass mobile viewport constraints
    offscreenContainer = document.createElement('div');
    offscreenContainer.id = 'pdf-render-container';
    offscreenContainer.style.position = 'fixed';
    offscreenContainer.style.left = '-9999px';
    offscreenContainer.style.top = '0';
    offscreenContainer.style.width = '780px';
    offscreenContainer.style.minWidth = '780px';
    offscreenContainer.style.maxWidth = '780px';
    offscreenContainer.style.zIndex = '-9999';
    offscreenContainer.style.background = '#ffffff';
    offscreenContainer.style.opacity = '1';
    offscreenContainer.style.pointerEvents = 'none';

    // Clone the slip element and enforce desktop styling
    const clone = slipElement.cloneNode(true);
    clone.classList.add('pdf-render-mode');
    clone.style.width = '780px';
    clone.style.minWidth = '780px';
    clone.style.maxWidth = '780px';
    clone.style.padding = '28px';
    clone.style.boxSizing = 'border-box';
    clone.style.background = '#ffffff';
    
    offscreenContainer.appendChild(clone);
    document.body.appendChild(offscreenContainer);

    // Capture offscreen desktop layout using html2canvas
    const canvas = await window.html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 780,
      windowWidth: 1024
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
    DOM.btnAddToCart.scrollIntoView({ behavior: 'smooth' });
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
  DOM.customerForm.reset();
  updateOrderTypeVisibility();
  syncCustomerSummaryDisplay();
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
  DOM.tabNotepads.addEventListener('click', () => switchCategory('notepads'));
  DOM.tabNotecards.addEventListener('click', () => switchCategory('notecards'));
  DOM.tabEnvelopes.addEventListener('click', () => switchCategory('envelopes'));

  if (DOM.radioSheet30) {
    DOM.radioSheet30.addEventListener('change', () => {
      appState.selectedSheetCount = '30';
      updatePricePreview();
    });
  }

  DOM.selectDesignCode.addEventListener('change', (e) => {
    appState.selectedDesignCode = e.target.value;
    updatePreviewImage();
  });

  DOM.checkCustomization.addEventListener('change', (e) => {
    appState.isCustomized = e.target.checked;
    DOM.customizationContainer.classList.toggle('active', appState.isCustomized);
    DOM.customInputsCollapse.classList.toggle('show', appState.isCustomized);
    updatePricePreview();
  });

  DOM.btnQtyMinus.addEventListener('click', () => {
    let current = parseInt(DOM.inputQuantity.value, 10) || 1;
    if (current > 1) {
      DOM.inputQuantity.value = current - 1;
    }
  });

  DOM.btnQtyPlus.addEventListener('click', () => {
    let current = parseInt(DOM.inputQuantity.value, 10) || 1;
    DOM.inputQuantity.value = current + 1;
  });

  DOM.btnAddToCart.addEventListener('click', addItemToCart);
  DOM.btnSubmitOrder.addEventListener('click', submitJobOrder);

  // Custom Made Form Event Listeners
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

  DOM.btnCloseModal.addEventListener('click', closeModal);
  DOM.btnDoneOrder.addEventListener('click', startNewOrder);
  
  const downloadBtn = DOM.btnDownloadPdf || document.getElementById('btnDownloadPdf') || document.getElementById('btnDownloadImage');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadJobOrderAsPdf);
  }

  DOM.jobOrderModal.addEventListener('click', (e) => {
    if (e.target === DOM.jobOrderModal) {
      closeModal();
    }
  });

  attachValidationClearListeners();
}

document.addEventListener('DOMContentLoaded', () => {
  switchCategory('notepads');
  renderCart();
  initEventListeners();
  updateOrderTypeVisibility();
});

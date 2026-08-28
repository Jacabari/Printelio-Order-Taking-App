/**
 * Printelio - Custom Stationery Order Request Application
 * Front-end Logic, Dynamic Design Code Filtering, Mockup Preview,
 * Dynamic Pricing Logic, Single-Field Text Customization & Job Order Generation.
 */

// ============================================================================
// 1. Data Models & Pricing Constants
// ============================================================================

const PRODUCTS_DATA = {
  notepads: {
    categoryName: 'Notepads',
    hasSheets: true,
    isTba: false,
    sizes: [
      {
        id: 'np-square',
        name: 'Square Notepad (3 x 3 in)',
        shortName: 'Square Notepad',
        dimensions: '3 × 3 in',
        prices: { '30': 29, '50': 39 }
      },
      {
        id: 'np-a6',
        name: 'A6 Notepad (4 x 5.8 in)',
        shortName: 'A6 Notepad',
        dimensions: '4 × 5.8 in',
        prices: { '30': 49, '50': 69 }
      },
      {
        id: 'np-a5',
        name: 'A5 Notepad (5.8 x 8.3 in)',
        shortName: 'A5 Notepad',
        dimensions: '5.8 × 8.3 in',
        prices: { '30': 79, '50': 99 }
      }
    ],
    designs: [
      { code: 'NP-001', name: 'Botanical Monogram', desc: 'Minimalist luxury border with delicate botanical wreath.' },
      { code: 'NP-002', name: 'Modern Dot Grid', desc: 'Crisp layout with classic serif title and subtle margins.' },
      { code: 'NP-003', name: 'Pastel Wave Accent', desc: 'Soft pastel wave contour with gold typography.' },
      { code: 'NP-004', name: 'Classic Roman Double Border', desc: 'Timeless double line frame with vintage Roman monogram.' },
      { code: 'NP-005', name: 'Executive Memo', desc: 'Refined checklist structure with generous writing space.' },
      { code: 'NP-006', name: 'Earthy Arch Minimalist', desc: 'Warm neutral arch silhouette with hand-drawn leaf stem.' }
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
        prices: null
      },
      {
        id: 'nc-landscape',
        name: '3.5 x 2 in (Landscape)',
        shortName: 'Landscape Notecard',
        dimensions: '3.5 × 2 in',
        prices: null
      }
    ],
    designs: [
      { code: 'NC-001', name: 'Gold Foil Serif Crest', desc: 'Regal monogram crest with luxury metallic gold finish.' },
      { code: 'NC-002', name: 'Floral Frame Watercolor', desc: 'Romantic botanical border on textured heavy cardstock.' },
      { code: 'NC-003', name: 'Monochrome Line Art', desc: 'High-contrast editorial silhouette with crisp lettering.' },
      { code: 'NC-004', name: 'Modern Typography Luxe', desc: 'Contemporary serif lettering with ample white space.' }
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
        prices: null
      }
    ],
    designs: [
      { code: 'ME-001', name: 'Golden Geometric Lattice', desc: 'Opulent interlocking geometric pattern with seal flap.' },
      { code: 'ME-002', name: 'Festive Blossom Foil', desc: 'Rich celebratory gold foil floral motif with calligraphy.' },
      { code: 'ME-003', name: 'Opulent Botanical Wreath', desc: 'Deep black and gold organic botanical wreath engraving.' },
      { code: 'ME-004', name: 'Modern Family Crest', desc: 'Minimalist envelope with custom surname imprint.' }
    ]
  }
};

const CUSTOMIZATION_FEE = 10; // ₱10 per unit

// ============================================================================
// 2. Application State
// ============================================================================

const appState = {
  currentCategory: 'notepads',
  selectedSizeId: 'np-square',
  selectedSheetCount: '30',
  selectedDesignCode: 'NP-001',
  isCustomized: false,
  customText: '',
  quantity: 1,
  cart: [],
  customer: {
    fullName: '',
    contactNumber: '',
    email: '',
    socialHandle: '',
    address: '',
    targetDate: '',
    courier: '',
    payment: ''
  }
};

// Global fallback handler for missing mockup image
window.handleImageError = function(imgElement) {
  const fallback = document.getElementById('mockupCanvasFallback');
  if (fallback) {
    imgElement.style.display = 'none';
    fallback.style.display = 'flex';
  }
};

// ============================================================================
// 3. DOM Elements Cache
// ============================================================================

const DOM = {
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
  
  // Design & Mockup
  selectDesignCode: document.getElementById('selectDesignCode'),
  designDescriptionText: document.getElementById('designDescriptionText'),
  mockupPreviewImg: document.getElementById('mockupPreviewImg'),
  mockupCanvasFallback: document.getElementById('mockupCanvasFallback'),
  canvasBadgeCode: document.getElementById('canvasBadgeCode'),
  canvasMetaTitle: document.getElementById('canvasMetaTitle'),
  
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
  
  // Customer Form
  customerForm: document.getElementById('customerForm'),
  inputFullName: document.getElementById('inputFullName'),
  inputContactNumber: document.getElementById('inputContactNumber'),
  inputEmail: document.getElementById('inputEmail'),
  inputSocialHandle: document.getElementById('inputSocialHandle'),
  inputAddress: document.getElementById('inputAddress'),
  inputTargetDate: document.getElementById('inputTargetDate'),
  selectCourier: document.getElementById('selectCourier'),
  selectPayment: document.getElementById('selectPayment'),
  
  // Cart & Order Summary
  emptyCartState: document.getElementById('emptyCartState'),
  cartItemsList: document.getElementById('cartItemsList'),
  cartCountBadge: document.getElementById('cartCountBadge'),
  summarySubtotalAmount: document.getElementById('summarySubtotalAmount'),
  summaryTbaCount: document.getElementById('summaryTbaCount'),
  summaryCourierDisplay: document.getElementById('summaryCourierDisplay'),
  summaryPaymentDisplay: document.getElementById('summaryPaymentDisplay'),
  summaryGrandTotal: document.getElementById('summaryGrandTotal'),
  tbaNoticeBanner: document.getElementById('tbaNoticeBanner'),
  btnSubmitOrder: document.getElementById('btnSubmitOrder'),
  
  // Modal & Slip
  jobOrderModal: document.getElementById('jobOrderModal'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnPrintSlip: document.getElementById('btnPrintSlip'),
  btnDoneOrder: document.getElementById('btnDoneOrder'),
  joReferenceNumber: document.getElementById('joReferenceNumber'),
  joDateGenerated: document.getElementById('joDateGenerated'),
  joCustomerName: document.getElementById('joCustomerName'),
  joCustomerContact: document.getElementById('joCustomerContact'),
  joCustomerEmail: document.getElementById('joCustomerEmail'),
  joCustomerSocial: document.getElementById('joCustomerSocial'),
  joCustomerAddress: document.getElementById('joCustomerAddress'),
  joTargetDate: document.getElementById('joTargetDate'),
  joCourier: document.getElementById('joCourier'),
  joPayment: document.getElementById('joPayment'),
  joTableBody: document.getElementById('joTableBody'),
  joModalGrandTotal: document.getElementById('joModalGrandTotal'),
  paymentInstructionsText: document.getElementById('paymentInstructionsText'),
  toastContainer: document.getElementById('toastContainer')
};

// ============================================================================
// 4. Mockup SVG Generator (Creates real-time stationery artwork)
// ============================================================================

function generateMockupSvgDataUrl(designCode, designName, category) {
  const isNotepad = category === 'notepads';
  const isEnvelope = category === 'envelopes';
  
  let accentColor = '#cb6ce6';
  let secondaryColor = '#3dffff';
  let bgColor = '#14141d';
  
  if (isEnvelope) {
    bgColor = '#0a0a0f';
    accentColor = '#ffde59';
  }

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor}" />
          <stop offset="100%" stop-color="#000000" />
        </linearGradient>
        <pattern id="dotPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(0,0,0,0.12)" />
        </pattern>
      </defs>
      
      <!-- Backdrop -->
      <rect width="600" height="450" fill="url(#bgGrad)"/>
      <circle cx="510" cy="80" r="160" fill="rgba(203,108,230,0.08)" />
      <circle cx="90" cy="380" r="150" fill="rgba(61,255,255,0.07)" />
      
      <!-- Stationery Mockup Base Sheet -->
      <g transform="translate(110, 42)">
        <rect x="0" y="0" width="380" height="356" rx="12" fill="#ffffff" filter="drop-shadow(0px 18px 30px rgba(0,0,0,0.5))" />
        
        <!-- Border Frame -->
        <rect x="18" y="18" width="344" height="320" rx="8" fill="none" stroke="${accentColor}" stroke-width="1.8" stroke-dasharray="${isEnvelope ? '4,3' : 'none'}" />
        
        <!-- Paper Dots if Notepad -->
        ${isNotepad ? '<rect x="24" y="90" width="332" height="236" fill="url(#dotPattern)"/>' : ''}
        
        <!-- Brand Title in *The Seasons* / Playfair Italic -->
        <text x="190" y="58" font-family="'Playfair Display', Georgia, serif" font-style="italic" font-size="22" font-weight="700" fill="#000000" text-anchor="middle" letter-spacing="1">
          Printelio
        </text>
        <line x1="120" y1="68" x2="260" y2="68" stroke="${accentColor}" stroke-width="1.5" />
        
        <!-- Center Motif -->
        <g transform="translate(190, 165)">
          <circle cx="0" cy="0" r="42" fill="none" stroke="${secondaryColor}" stroke-width="2" stroke-opacity="0.8"/>
          <circle cx="0" cy="0" r="35" fill="rgba(203,108,230,0.08)" />
          <text x="0" y="8" font-family="'Raleway', sans-serif" font-size="20" font-weight="800" fill="#000000" text-anchor="middle">
            ${designCode}
          </text>
        </g>
        
        <!-- Design Name in Raleway -->
        <text x="190" y="248" font-family="'Raleway', sans-serif" font-size="13" font-weight="700" fill="#333344" text-anchor="middle" letter-spacing="1.2">
          ${designName.toUpperCase()}
        </text>
        <text x="190" y="268" font-family="'Raleway', sans-serif" font-size="11" font-weight="500" fill="#777788" text-anchor="middle">
          Bespoke Custom Stationery
        </text>
        
        <!-- Footer Atelier Watermark -->
        <text x="190" y="322" font-family="'Raleway', sans-serif" font-size="9" font-weight="600" fill="#9999aa" text-anchor="middle" letter-spacing="2">
          ATELIER COLLECTION • MANILA
        </text>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
}

// ============================================================================
// 5. Category & Size Selection Handlers (Clean UI - NO PRICES IN LABELS)
// ============================================================================

function switchCategory(categoryKey) {
  if (!PRODUCTS_DATA[categoryKey]) return;
  
  appState.currentCategory = categoryKey;
  const categoryData = PRODUCTS_DATA[categoryKey];
  
  // Update Tab Buttons UI
  DOM.categoryTabs.forEach(tab => {
    const isCurrent = tab.dataset.category === categoryKey;
    tab.classList.toggle('active', isCurrent);
    tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
  });

  // Update Category Badge text
  DOM.categoryBadge.textContent = categoryData.categoryName;

  // Toggle Sheet Count visibility (Only for Notepads)
  if (categoryData.hasSheets) {
    DOM.sheetCountGroup.style.display = 'block';
  } else {
    DOM.sheetCountGroup.style.display = 'none';
  }

  // Populate Clean Sizes (no prices in labels)
  renderSizeOptions();

  // Populate Design Code dropdown for current category
  populateDesignDropdown();

  // Recalculate and display Unit Price
  updatePricePreview();
}

function renderSizeOptions() {
  const categoryData = PRODUCTS_DATA[appState.currentCategory];
  DOM.sizeCardsGrid.innerHTML = '';

  // Select first size by default if previous size is not valid for category
  if (!categoryData.sizes.some(s => s.id === appState.selectedSizeId)) {
    appState.selectedSizeId = categoryData.sizes[0].id;
  }

  // Set grid layout class based on option count
  DOM.sizeCardsGrid.className = `cards-grid ${categoryData.sizes.length === 3 ? 'three-col' : categoryData.sizes.length === 2 ? 'two-col' : ''}`;

  categoryData.sizes.forEach(size => {
    const isChecked = size.id === appState.selectedSizeId;
    
    // Clean UI: Label displays ONLY name and dimensions (NO PRICES!)
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

  // Attach change listeners to new radio options
  DOM.sizeCardsGrid.querySelectorAll('input[name="sizeOption"]').forEach(input => {
    input.addEventListener('change', (e) => {
      appState.selectedSizeId = e.target.value;
      updatePricePreview();
    });
  });
}

// ============================================================================
// 6. Dynamic Design Code Selection & Mockup Image Rendering
// ============================================================================

function populateDesignDropdown() {
  const categoryData = PRODUCTS_DATA[appState.currentCategory];
  DOM.selectDesignCode.innerHTML = '';

  categoryData.designs.forEach(design => {
    const option = document.createElement('option');
    option.value = design.code;
    option.textContent = `${design.code} - ${design.name}`;
    DOM.selectDesignCode.appendChild(option);
  });

  // Default to first design in list
  appState.selectedDesignCode = categoryData.designs[0].code;
  DOM.selectDesignCode.value = appState.selectedDesignCode;

  updateMockupPreview();
}

function updateMockupPreview() {
  const categoryData = PRODUCTS_DATA[appState.currentCategory];
  const design = categoryData.designs.find(d => d.code === appState.selectedDesignCode) || categoryData.designs[0];
  
  if (!design) return;

  // Update description text
  DOM.designDescriptionText.textContent = design.desc;

  // Update Canvas Fallback metadata
  DOM.canvasBadgeCode.textContent = design.code;
  DOM.canvasMetaTitle.textContent = design.name;

  // Mockup image path: images/{selectedCode}.jpg
  const imageSrcPath = `images/${design.code}.jpg`;
  
  DOM.mockupPreviewImg.style.display = 'block';
  DOM.mockupCanvasFallback.style.display = 'none';

  // High quality dynamic vector artwork fallback
  const svgDataUrl = generateMockupSvgDataUrl(design.code, design.name, appState.currentCategory);
  
  // Test image existence, fall back seamlessly if physical image is not found
  const testImg = new Image();
  testImg.onload = function() {
    DOM.mockupPreviewImg.src = imageSrcPath;
  };
  testImg.onerror = function() {
    DOM.mockupPreviewImg.src = svgDataUrl;
  };
  testImg.src = imageSrcPath;
}

// ============================================================================
// 7. Unit Price Calculation Engine
// ============================================================================

function calculateCurrentItemPrice() {
  const categoryData = PRODUCTS_DATA[appState.currentCategory];
  
  // Notecards & Money Envelopes -> TBA
  if (categoryData.isTba) {
    return {
      isTba: true,
      unitPrice: 0,
      breakdownText: 'Price: To Be Announced (Custom Quotation)',
      displayPrice: 'TBA'
    };
  }

  // Notepads pricing calculation
  // Check if both Size and Sheet options are selected
  if (!appState.selectedSizeId || !appState.selectedSheetCount) {
    return {
      isTba: false,
      isPendingSelection: true,
      unitPrice: 0,
      breakdownText: 'Please select size & sheet count',
      displayPrice: 'Select Options'
    };
  }

  const sizeObj = categoryData.sizes.find(s => s.id === appState.selectedSizeId);
  if (!sizeObj || !sizeObj.prices) {
    return {
      isTba: false,
      isPendingSelection: true,
      unitPrice: 0,
      breakdownText: 'Please select size',
      displayPrice: 'Select Size'
    };
  }

  const sheetCount = appState.selectedSheetCount;
  const basePrice = sizeObj.prices[sheetCount];

  if (basePrice === undefined) {
    return {
      isTba: false,
      isPendingSelection: true,
      unitPrice: 0,
      breakdownText: 'Please select sheet count',
      displayPrice: 'Select Sheets'
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
// 8. Order Item Management & Cart
// ============================================================================

function addItemToCart() {
  const categoryData = PRODUCTS_DATA[appState.currentCategory];
  const sizeObj = categoryData.sizes.find(s => s.id === appState.selectedSizeId) || categoryData.sizes[0];
  const designObj = categoryData.designs.find(d => d.code === appState.selectedDesignCode) || categoryData.designs[0];
  const priceInfo = calculateCurrentItemPrice();
  const qty = parseInt(DOM.inputQuantity.value, 10) || 1;

  if (qty <= 0) {
    showToast('Please enter a valid quantity of 1 or more.');
    return;
  }

  // Check custom text if customization is active
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
    designCode: designObj.code,
    designName: designObj.name,
    mockupImg: generateMockupSvgDataUrl(designObj.code, designObj.name, appState.currentCategory),
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

  // Reset quantity input to 1
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
    DOM.summarySubtotalAmount.textContent = '₱0.00';
    DOM.summaryTbaCount.textContent = '0 items';
    DOM.summaryGrandTotal.textContent = '₱0.00';
    DOM.tbaNoticeBanner.style.display = 'none';
    return;
  }

  DOM.emptyCartState.style.display = 'none';
  DOM.cartItemsList.style.display = 'flex';
  DOM.cartItemsList.innerHTML = '';

  let numericTotal = 0;
  let tbaCount = 0;

  appState.cart.forEach(item => {
    if (item.isTba) {
      tbaCount += item.quantity;
    } else {
      numericTotal += item.subtotal;
    }

    const itemCard = document.createElement('div');
    itemCard.className = 'cart-item-card';
    itemCard.id = `cart-item-${item.id}`;

    let specDetails = `${item.dimensions}`;
    if (item.hasSheets) {
      specDetails += ` • ${item.sheetCount} sheets`;
    }

    let customDetailsBadge = '';
    if (item.isCustomized) {
      customDetailsBadge = `
        <div class="cart-item-custom-badge">
          <span>✨ Custom: "${item.customText}"</span>
        </div>
      `;
    }

    const subtotalText = item.isTba ? '<span class="cart-item-subtotal tba">TBA</span>' : `<span class="cart-item-subtotal">₱${item.subtotal.toFixed(2)}</span>`;
    const unitPriceText = item.isTba ? 'TBA' : `₱${item.unitPrice.toFixed(2)}`;

    itemCard.innerHTML = `
      <div class="cart-item-main">
        <div class="cart-item-thumb-wrapper">
          <img src="${item.mockupImg}" alt="${item.designCode}">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.sizeName}</div>
          <div class="cart-item-spec-line">${specDetails}</div>
          <div class="cart-item-design-badge">Design: ${item.designCode} (${item.designName})</div>
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

  // Update Summary Card Financial Totals
  DOM.summarySubtotalAmount.textContent = `₱${numericTotal.toFixed(2)}`;
  DOM.summaryTbaCount.textContent = `${tbaCount} item${tbaCount === 1 ? '' : 's'}`;
  DOM.summaryGrandTotal.textContent = `₱${numericTotal.toFixed(2)}`;

  if (tbaCount > 0) {
    DOM.tbaNoticeBanner.style.display = 'block';
  } else {
    DOM.tbaNoticeBanner.style.display = 'none';
  }
}

window.removeCartItem = removeCartItem;

// ============================================================================
// 9. Customer Form Validation & Sync
// ============================================================================

function syncCustomerSummaryDisplay() {
  const courierVal = DOM.selectCourier.value;
  DOM.summaryCourierDisplay.textContent = courierVal ? courierVal : 'Not Selected';

  const paymentVal = DOM.selectPayment.value;
  DOM.summaryPaymentDisplay.textContent = paymentVal ? paymentVal : 'Not Selected';
}

function validateCustomerForm() {
  let isValid = true;

  const fields = [
    { el: DOM.inputFullName, group: 'groupFullName', validator: val => val.trim().length > 1 },
    { el: DOM.inputContactNumber, group: 'groupContactNumber', validator: val => val.trim().length >= 7 },
    { el: DOM.inputEmail, group: 'groupEmail', validator: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) },
    { el: DOM.inputSocialHandle, group: 'groupSocialHandle', validator: val => val.trim().length > 1 },
    { el: DOM.inputAddress, group: 'groupAddress', validator: val => val.trim().length > 5 },
    { el: DOM.inputTargetDate, group: 'groupTargetDate', validator: val => Boolean(val) },
    { el: DOM.selectCourier, group: 'groupCourier', validator: val => Boolean(val) },
    { el: DOM.selectPayment, group: 'groupPayment', validator: val => Boolean(val) }
  ];

  fields.forEach(field => {
    const parentGroup = document.getElementById(field.group);
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
    { el: DOM.inputEmail, group: 'groupEmail' },
    { el: DOM.inputSocialHandle, group: 'groupSocialHandle' },
    { el: DOM.inputAddress, group: 'groupAddress' },
    { el: DOM.inputTargetDate, group: 'groupTargetDate' },
    { el: DOM.selectCourier, group: 'groupCourier' },
    { el: DOM.selectPayment, group: 'groupPayment' }
  ];

  inputs.forEach(item => {
    const handler = () => {
      document.getElementById(item.group).classList.remove('has-error');
      syncCustomerSummaryDisplay();
    };
    item.el.addEventListener('input', handler);
    item.el.addEventListener('change', handler);
  });
}

// ============================================================================
// 10. Job Order Slip Generation & Modal Dialog
// ============================================================================

function generateReferenceNumber() {
  const currentYear = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PRNT-${currentYear}-${randomNum}`;
}

function submitJobOrder() {
  // Check Cart
  if (appState.cart.length === 0) {
    showToast('Your order is empty. Please add items before submitting.');
    DOM.btnAddToCart.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Validate Form
  const isFormValid = validateCustomerForm();
  if (!isFormValid) {
    showToast('Please complete all required customer details.');
    DOM.customerDetailsCard.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Save Customer State
  appState.customer = {
    fullName: DOM.inputFullName.value.trim(),
    contactNumber: DOM.inputContactNumber.value.trim(),
    email: DOM.inputEmail.value.trim(),
    socialHandle: DOM.inputSocialHandle.value.trim(),
    address: DOM.inputAddress.value.trim(),
    targetDate: DOM.inputTargetDate.value,
    courier: DOM.selectCourier.value,
    payment: DOM.selectPayment.value
  };

  // Populate Modal Slip
  const refNo = generateReferenceNumber();
  DOM.joReferenceNumber.textContent = refNo;
  
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  DOM.joDateGenerated.textContent = `Generated on ${new Date().toLocaleDateString('en-US', options)}`;
  
  DOM.joCustomerName.textContent = appState.customer.fullName;
  DOM.joCustomerContact.textContent = appState.customer.contactNumber;
  DOM.joCustomerEmail.textContent = appState.customer.email;
  DOM.joCustomerSocial.textContent = appState.customer.socialHandle;
  DOM.joCustomerAddress.textContent = appState.customer.address;
  DOM.joTargetDate.textContent = appState.customer.targetDate;
  DOM.joCourier.textContent = appState.customer.courier;
  DOM.joPayment.textContent = appState.customer.payment;

  // Render Table
  DOM.joTableBody.innerHTML = '';
  let grandTotalNumeric = 0;

  appState.cart.forEach(item => {
    grandTotalNumeric += item.subtotal;

    let personalizationText = 'Standard (None)';
    if (item.isCustomized) {
      personalizationText = `"${item.customText}"`;
    }

    const priceCell = item.isTba ? '<span style="color:#b241ce; font-weight:700;">TBA</span>' : `₱${item.unitPrice.toFixed(2)}`;
    const subtotalCell = item.isTba ? '<span style="color:#b241ce; font-weight:700;">TBA</span>' : `₱${item.subtotal.toFixed(2)}`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong>${item.categoryName} - ${item.sizeName}</strong><br>
        <span style="font-size:0.775rem; color:#666;">${item.dimensions} ${item.hasSheets ? '• ' + item.sheetCount + ' sheets' : ''}</span>
      </td>
      <td>
        <span style="background:#000000; color:#ffde59; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.75rem;">${item.designCode}</span>
      </td>
      <td>${personalizationText}</td>
      <td style="text-align: center; font-weight: 700;">${item.quantity}</td>
      <td style="text-align: right;">${priceCell}</td>
      <td style="text-align: right; font-weight: 700;">${subtotalCell}</td>
    `;
    DOM.joTableBody.appendChild(row);
  });

  DOM.joModalGrandTotal.textContent = `₱${grandTotalNumeric.toFixed(2)}`;

  // Payment Note in Job Order
  DOM.paymentInstructionsText.innerHTML = `
    <p>1. <strong>Payment Privacy:</strong> Official payment details and QR code will be shared separately and privately via your provided email or social account (<strong>${appState.customer.socialHandle}</strong>).</p>
    <p>2. Please reference Job Order No. <strong>${refNo}</strong> when sending proof of payment.</p>
    <p>3. Production starts upon payment confirmation. Standard lead time is 3–5 business days before courier dispatch (${appState.customer.courier}).</p>
  `;

  // Open Modal
  DOM.jobOrderModal.classList.add('active');
}

function closeModal() {
  DOM.jobOrderModal.classList.remove('active');
}

function startNewOrder() {
  closeModal();
  appState.cart = [];
  renderCart();
  DOM.customerForm.reset();
  syncCustomerSummaryDisplay();
  showToast('Ready for a new custom stationery order.');
}

// ============================================================================
// 11. Toast Notifications Utility
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
  }, 3200);
}

// ============================================================================
// 12. Event Listeners & Initialization
// ============================================================================

function initEventListeners() {
  // Category tabs
  DOM.tabNotepads.addEventListener('click', () => switchCategory('notepads'));
  DOM.tabNotecards.addEventListener('click', () => switchCategory('notecards'));
  DOM.tabEnvelopes.addEventListener('click', () => switchCategory('envelopes'));

  // Sheet count radio buttons
  DOM.radioSheet30.addEventListener('change', () => {
    appState.selectedSheetCount = '30';
    updatePricePreview();
  });
  DOM.radioSheet50.addEventListener('change', () => {
    appState.selectedSheetCount = '50';
    updatePricePreview();
  });

  // Design Dropdown Change
  DOM.selectDesignCode.addEventListener('change', (e) => {
    appState.selectedDesignCode = e.target.value;
    updateMockupPreview();
  });

  // Customization Checkbox
  DOM.checkCustomization.addEventListener('change', (e) => {
    appState.isCustomized = e.target.checked;
    DOM.customizationContainer.classList.toggle('active', appState.isCustomized);
    DOM.customInputsCollapse.classList.toggle('show', appState.isCustomized);
    updatePricePreview();
  });

  // Quantity Stepper
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

  // Add Item to Order Button
  DOM.btnAddToCart.addEventListener('click', addItemToCart);

  // Submit Job Order Button
  DOM.btnSubmitOrder.addEventListener('click', submitJobOrder);

  // Modal Controls
  DOM.btnCloseModal.addEventListener('click', closeModal);
  DOM.btnDoneOrder.addEventListener('click', startNewOrder);
  DOM.btnPrintSlip.addEventListener('click', () => window.print());

  // Close modal when clicking outside dialog
  DOM.jobOrderModal.addEventListener('click', (e) => {
    if (e.target === DOM.jobOrderModal) {
      closeModal();
    }
  });

  // Form input validation feedback
  attachValidationClearListeners();

  // Set default min date for target date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  DOM.inputTargetDate.min = tomorrow.toISOString().split('T')[0];
}

// Initial Bootstrapping
document.addEventListener('DOMContentLoaded', () => {
  switchCategory('notepads');
  renderCart();
  initEventListeners();
});

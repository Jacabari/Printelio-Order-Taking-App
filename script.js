/**
 * Printelio - Custom Stationery Order Request Application
 * Integration: EmailJS Transmission, html2canvas Job Order Image Generation,
 * Dynamic Design Code Filtering, Mockup Preview, Dynamic Pricing & Cart Management.
 */

// ============================================================================
// 0. EmailJS Configuration & Initialization
// ============================================================================

const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'atxJrY8b6d4jJp_rp',
  SERVICE_ID: 'service_f3btwvd',
  TEMPLATE_ID: 'template_f80esgo',
  TARGET_EMAIL: 'printelio22@gmail.com'
};

// Initialize EmailJS library safely
if (typeof window !== 'undefined' && typeof window.emailjs !== 'undefined') {
  try {
    window.emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  } catch (err) {
    console.warn('EmailJS initialization warning:', err);
  }
}

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
        name: 'Square Notepad (3 x 3 in)',
        shortName: 'Square Notepad',
        dimensions: '3 × 3 in',
        prices: { '30': 29, '50': 39 },
        designs: ['NP-SQ01', 'NP-SQ02', 'NP-SQ03', 'NP-SQ04']
      },
      {
        id: 'np-a6',
        name: 'A6 Notepad (4 x 5.8 in)',
        shortName: 'A6 Notepad',
        dimensions: '4 × 5.8 in',
        prices: { '30': 49, '50': 69 },
        designs: ['NP-A601', 'NP-A602', 'NP-A603', 'NP-A604']
      },
      {
        id: 'np-a5',
        name: 'A5 Notepad (5.8 x 8.3 in)',
        shortName: 'A5 Notepad',
        dimensions: '5.8 × 8.3 in',
        prices: { '30': 79, '50': 99 },
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
    payment: ''
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
  
  // Customer Form (Removed Email & Target Date)
  customerDetailsCard: document.getElementById('customerDetailsCard'),
  customerForm: document.getElementById('customerForm'),
  inputFullName: document.getElementById('inputFullName'),
  inputContactNumber: document.getElementById('inputContactNumber'),
  inputSocialHandle: document.getElementById('inputSocialHandle'),
  selectCourier: document.getElementById('selectCourier'),
  inputAddress: document.getElementById('inputAddress'),
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
  
  // Modal & Slip Elements
  jobOrderModal: document.getElementById('jobOrderModal'),
  printableJobOrderSlip: document.getElementById('printableJobOrderSlip'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnDownloadImage: document.getElementById('btnDownloadImage'),
  btnDoneOrder: document.getElementById('btnDoneOrder'),
  joReferenceNumber: document.getElementById('joReferenceNumber'),
  joDateGenerated: document.getElementById('joDateGenerated'),
  joCustomerName: document.getElementById('joCustomerName'),
  joCustomerContact: document.getElementById('joCustomerContact'),
  joCustomerSocial: document.getElementById('joCustomerSocial'),
  joCourier: document.getElementById('joCourier'),
  joCustomerAddress: document.getElementById('joCustomerAddress'),
  joPayment: document.getElementById('joPayment'),
  joTableBody: document.getElementById('joTableBody'),
  joModalGrandTotal: document.getElementById('joModalGrandTotal'),
  paymentInstructionsText: document.getElementById('paymentInstructionsText'),
  toastContainer: document.getElementById('toastContainer')
};

// ============================================================================
// 4. Dynamic Design Code Dropdown Population & Image Preview
// ============================================================================

/**
 * Returns available design choices based on current category and selected size.
 */
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

/**
 * Populates the Design Motif Code dropdown.
 */
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

/**
 * Updates the mockup preview image based on selected design code.
 * Directly modifies the standard <img> tag and uses encodeURIComponent.
 */
function updatePreviewImage() {
  const selectedCode = appState.selectedDesignCode;

  if (!DOM.designMockupImg) return;

  if (!selectedCode) {
    DOM.designMockupImg.src = '';
    DOM.designMockupImg.alt = 'Select a design code to view preview';
    if (DOM.designDescriptionText) {
      DOM.designDescriptionText.textContent = 'Please select a design motif code to load the preview image.';
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

  DOM.categoryBadge.textContent = categoryData.categoryName;

  if (categoryData.hasSheets) {
    DOM.sheetCountGroup.style.display = 'block';
  } else {
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
// 7. Order Item Cart Management
// ============================================================================

function addItemToCart() {
  if (!appState.selectedDesignCode) {
    showToast('Please select a Design Motif Code before adding to order.');
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
          <img src="images/${encodeURIComponent(item.designCode)}.png" alt="${item.designCode}" onerror="this.onerror=null; this.style.display='none';">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.sizeName}</div>
          <div class="cart-item-spec-line">${specDetails}</div>
          <div class="cart-item-design-badge">Design: ${item.designCode}</div>
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
// 8. Customer Form Validation & Sync (Streamlined)
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
      syncCustomerSummaryDisplay();
    };
    item.el.addEventListener('input', handler);
    item.el.addEventListener('change', handler);
  });
}

// ============================================================================
// 9. Job Order Slip Generation, Image Download & EmailJS Submission
// ============================================================================

function generateReferenceNumber() {
  const currentYear = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PRNT-${currentYear}-${randomNum}`;
}

/**
 * Builds the UI for Job Order Slip Modal and populates line items.
 */
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

  DOM.paymentInstructionsText.innerHTML = `
    <p>1. <strong>Payment Privacy:</strong> Official payment details and QR code will be shared separately and privately via your social handle (<strong>${appState.customer.socialHandle}</strong>) or contact number (<strong>${appState.customer.contactNumber}</strong>).</p>
    <p>2. Please reference Job Order No. <strong>${refNo}</strong> when sending proof of payment.</p>
    <p>3. Production starts upon payment confirmation. Standard lead time is 3–5 business days before courier dispatch (${appState.customer.courier}).</p>
  `;

  return grandTotalNumeric;
}

/**
 * Converts Job Order Slip into a Canvas using html2canvas.
 */
async function renderJobOrderSlipCanvas() {
  const slipElement = DOM.printableJobOrderSlip || document.getElementById('printableJobOrderSlip');
  if (!slipElement || typeof window.html2canvas === 'undefined') {
    return null;
  }

  return await window.html2canvas(slipElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });
}

/**
 * Downloads the Job Order Slip as a PNG image file.
 */
async function downloadJobOrderAsImage() {
  if (typeof window.html2canvas === 'undefined') {
    showToast('Image generator is loading. Please try again in a moment.');
    return;
  }

  const originalBtnText = DOM.btnDownloadImage ? DOM.btnDownloadImage.textContent : '';
  if (DOM.btnDownloadImage) {
    DOM.btnDownloadImage.textContent = '⏳ Generating Image...';
    DOM.btnDownloadImage.disabled = true;
  }

  try {
    const canvas = await renderJobOrderSlipCanvas();
    if (!canvas) {
      throw new Error('Canvas rendering failed');
    }

    const imageUri = canvas.toDataURL('image/png');
    const refNo = DOM.joReferenceNumber.textContent.trim() || 'JobOrder';
    const downloadLink = document.createElement('a');
    downloadLink.href = imageUri;
    downloadLink.download = `Printelio_Order_Slip_${refNo}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    showToast('Job Order Slip image downloaded successfully!');
  } catch (err) {
    console.error('Error generating image:', err);
    showToast('Could not save image automatically. Please screenshot your order slip.');
  } finally {
    if (DOM.btnDownloadImage) {
      DOM.btnDownloadImage.textContent = originalBtnText;
      DOM.btnDownloadImage.disabled = false;
    }
  }
}

/**
 * Handles Job Order Submission:
 * 1. Validates inputs and cart.
 * 2. Builds modal preview.
 * 3. Uses html2canvas to create image data URL.
 * 4. Transmits email via EmailJS with full order details to printelio22@gmail.com.
 * 5. Shows success notification and displays the Job Order Slip.
 */
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
  appState.customer = {
    fullName: DOM.inputFullName.value.trim(),
    contactNumber: DOM.inputContactNumber.value.trim(),
    socialHandle: DOM.inputSocialHandle.value.trim(),
    courier: DOM.selectCourier.value,
    address: DOM.inputAddress.value.trim(),
    payment: DOM.selectPayment.value
  };

  const refNo = generateReferenceNumber();
  const grandTotal = buildJobOrderSlip(refNo);

  // Show the modal slip to user immediately
  DOM.jobOrderModal.classList.add('active');

  // Submit button visual feedback
  const originalSubmitText = DOM.btnSubmitOrder ? DOM.btnSubmitOrder.innerHTML : '';
  if (DOM.btnSubmitOrder) {
    DOM.btnSubmitOrder.disabled = true;
    DOM.btnSubmitOrder.innerHTML = '<span>⏳ Submitting &amp; Sending...</span>';
  }

  try {
    // 1. Generate base64 image of the order slip via html2canvas
    let slipImageBase64 = '';
    try {
      const canvas = await renderJobOrderSlipCanvas();
      if (canvas) {
        slipImageBase64 = canvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (canvasErr) {
      console.warn('Slip image canvas generation warning:', canvasErr);
    }

    // 2. Format plain-text itemized summary for email
    const itemizedSummaryText = appState.cart.map((item, idx) => {
      const customStr = item.isCustomized ? ` [Custom: "${item.customText}"]` : '';
      const sheetStr = item.hasSheets ? ` (${item.sheetCount} sheets)` : '';
      const priceStr = item.isTba ? 'TBA' : `₱${item.subtotal.toFixed(2)}`;
      return `${idx + 1}. ${item.sizeName} - Design: ${item.designCode}${sheetStr}${customStr} | Qty: ${item.quantity} | ${priceStr}`;
    }).join('\n');

    // 3. Prepare EmailJS template parameters
    const emailParams = {
      to_email: EMAILJS_CONFIG.TARGET_EMAIL,
      to_name: 'Printelio Orders',
      from_name: appState.customer.fullName,
      customer_name: appState.customer.fullName,
      contact_number: appState.customer.contactNumber,
      social_handle: appState.customer.socialHandle,
      courier: appState.customer.courier,
      delivery_address: appState.customer.address,
      payment_method: appState.customer.payment,
      order_reference: refNo,
      order_date: new Date().toLocaleString(),
      total_price: `₱${grandTotal.toFixed(2)}`,
      grand_total: `₱${grandTotal.toFixed(2)}`,
      itemized_orders: itemizedSummaryText,
      order_image: slipImageBase64 || 'Rendered in Job Order Slip',
      message: `New Order Received from ${appState.customer.fullName} (${appState.customer.contactNumber}). Total: ₱${grandTotal.toFixed(2)}.`
    };

    // 4. Send email via EmailJS
    if (typeof window.emailjs !== 'undefined') {
      await window.emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        emailParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );
      showToast(`🎉 Order ${refNo} sent successfully to Printelio!`);
    } else {
      showToast(`Job Order ${refNo} created! (Email service connecting)`);
    }

  } catch (emailError) {
    console.error('EmailJS submission notice:', emailError);
    showToast(`Job Order ${refNo} generated! Please download or screenshot your slip.`);
  } finally {
    if (DOM.btnSubmitOrder) {
      DOM.btnSubmitOrder.disabled = false;
      DOM.btnSubmitOrder.innerHTML = originalSubmitText || '<span>✨ Submit Job Order Request</span>';
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
    updatePreviewImage();
  });

  // Customization Checkbox (+₱10)
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
  if (DOM.btnDownloadImage) {
    DOM.btnDownloadImage.addEventListener('click', downloadJobOrderAsImage);
  }

  // Close modal when clicking outside dialog
  DOM.jobOrderModal.addEventListener('click', (e) => {
    if (e.target === DOM.jobOrderModal) {
      closeModal();
    }
  });

  // Form input validation feedback
  attachValidationClearListeners();
}

// Initial Bootstrapping
document.addEventListener('DOMContentLoaded', () => {
  switchCategory('notepads');
  renderCart();
  initEventListeners();
});

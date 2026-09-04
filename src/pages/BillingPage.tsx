import React, { useState, useEffect } from 'react';
import './BillingPage.css';
import { API_BASE_URL } from '../utils/apiConfig';
import { generateDynamicUPIQR, validateUPIID, validateBillAmount } from '../utils/upiQRGenerator';

interface Product {
  id: string;
  productName: string;
  productCode: string;
  sellingPrice: number;
  currentStock: number;
  gstPercentage: number;
  category: string;
  unit: string;
}

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  amount: number;
  gst: number;
}

interface BillData {
  billNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  createdAt: string;
}

const BillingPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discount, setDiscount] = useState(0);
  const [gstRate, setGstRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [shopInfo, setShopInfo] = useState({
    shopName: '',
    phone: '',
    address: '',
    email: '',
    gstNumber: ''
  });

  // UPI Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [upiQRCode, setUpiQRCode] = useState<string | null>(null);
  const [upiURI, setUpiURI] = useState<string | null>(null);
  const [upiConfig, setUpiConfig] = useState<{ upiId: string; shopName: string }>({
    upiId: '',
    shopName: '',
  });
  const [paymentQRCode, setPaymentQRCode] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    loadShopSettingsFromBackend();
    loadPaymentSettings();
  }, []);

  // Auto-generate QR when upiConfig.upiId is set and bill is displayed
  useEffect(() => {
    if (showBillPreview && billData && paymentMethod === 'upi' && upiConfig.upiId && !upiQRCode) {
      generateUPIQRForBill(billData.total);
    }
  }, [showBillPreview, billData, paymentMethod, upiConfig.upiId, upiQRCode]);

  const loadShopSettingsFromBackend = async () => {
    try {
      const token = localStorage.getItem('token');

      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/settings/shop`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setShopInfo({
          shopName: data.settings.shopName || '',
          phone: data.settings.phone || '',
          address: data.settings.address || '',
          email: data.settings.email || '',
          gstNumber: data.settings.gstNumber || ''
        });
        // Update UPI config shop name and UPI ID from backend
        setUpiConfig(prev => ({
          ...prev,
          shopName: data.settings.shopName || prev.shopName,
          upiId: data.settings.upiId || prev.upiId
        }));
      } else {
        console.error('Failed to load shop settings from backend');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Shop settings load timeout');
      } else {
        console.error('Error loading shop settings:', error);
      }
    }
  };

  const loadPaymentSettings = () => {
    // Load payment QR code from localStorage (kept for UI preferences)
    const savedPaymentSettings = localStorage.getItem('paymentSettings');
    if (savedPaymentSettings) {
      try {
        const settings = JSON.parse(savedPaymentSettings);
        setPaymentQRCode(settings.qrCodeImage || null);
      } catch (error) {
        console.error('Error loading payment settings:', error);
      }
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');

      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Products fetch timeout');
      } else {
        console.error('Failed to fetch products:', error);
      }
    }
  };

  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.productCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.productId === product.id);
    const productPrice = Number(product.sellingPrice) || 0;
    const productStock = Number(product.currentStock) || 0;
    const productGST = Number(product.gstPercentage) || 0;

    if (existingItem) {
      if (existingItem.quantity < productStock) {
        const newQuantity = existingItem.quantity + 1;
        const newAmount = productPrice * newQuantity;
        const newGst = (newAmount * productGST) / 100;

        setCartItems(cartItems.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: newQuantity,
                amount: newAmount,
                gst: newGst,
                price: productPrice
              }
            : item
        ));
      } else {
        setError('Not enough stock available');
      }
    } else {
      const amount = productPrice;
      const gstAmount = (amount * productGST) / 100;

      setCartItems([...cartItems, {
        id: `cart-${Date.now()}`,
        productId: product.id,
        productName: product.productName,
        quantity: 1,
        price: productPrice,
        amount,
        gst: gstAmount,
      }]);
    }
    setError('');
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems(cartItems.map(item => {
      if (item.id === cartItemId) {
        const newAmount = quantity * (Number(item.price) || 0);
        // Get the product to find its GST percentage
        const product = products.find(p => p.id === item.productId);
        const productGST = product ? Number(product.gstPercentage) || 0 : 0;
        const newGst = (newAmount * productGST) / 100;
        return { ...item, quantity, amount: newAmount, gst: newGst };
      }
      return item;
    }));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const discountAmount = parseFloat(discount as any) || 0;
  const taxableAmount = subtotal - discountAmount;
  const gst = (taxableAmount * gstRate) / 100;
  const total = taxableAmount + gst;

  const createBill = async () => {
    if (cartItems.length === 0) {
      setError('Please add items to bill');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for bill creation

      const response = await fetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          discount: discountAmount,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create bill');
      }

      const data = await response.json();

      setBillData({
        billNumber: data.bill.billNumber,
        items: cartItems,
        subtotal,
        discount: discountAmount,
        gst,
        total,
        createdAt: new Date().toLocaleString(),
      });

      setShowBillPreview(true);
      setSuccess(`Bill ${data.bill.billNumber} created successfully!`);
      setTimeout(() => setSuccess(''), 3000);

      fetchProducts();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout - server may be unavailable. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create bill');
      }
    } finally {
      setLoading(false);
    }
  };

  const printBill = async () => {
    if (!billData) return;

    // Use the QR code that's already displayed in preview
    let upiQRForPrint: string | null = null;

    // If UPI payment method and QR is displayed in preview, use it
    if (paymentMethod === 'upi' && upiQRCode) {
      upiQRForPrint = upiQRCode;
    } else if (paymentMethod === 'upi' && upiConfig.upiId && validateUPIID(upiConfig.upiId)) {
      // Otherwise generate it now
      try {
        console.log('Generating UPI QR for printing...', {
          upiId: upiConfig.upiId,
          shopName: upiConfig.shopName,
          amount: billData.total
        });
        const result = await generateDynamicUPIQR({
          upiId: upiConfig.upiId,
          shopName: upiConfig.shopName || shopInfo.shopName,
          amount: Math.round(billData.total * 100) / 100,
          transactionRef: `BILL-${billData.billNumber}`,
        });
        upiQRForPrint = result.qrCodeDataURL;
        console.log('UPI QR Generated successfully:', upiQRForPrint ? 'YES' : 'NO');
      } catch (err) {
        console.error('Error generating UPI QR for print:', err);
      }
    }

    // Create QR section with actual QR data
    const createQRSection = () => {
      if (paymentMethod === 'upi' && upiQRForPrint) {
        return `
          <div class="qr-section">
            <p class="qr-label">📱 UPI PAYMENT - Scan to Pay</p>
            <p style="font-size: 8px; margin: 3px 0;">Amount: ₹${Number(billData.total || 0).toFixed(2)}</p>
            <img src="${upiQRForPrint}" alt="UPI QR Code" style="max-width: 90px; max-height: 90px; margin-top: 5px; border: 1px solid #000;" />
            <p style="font-size: 8px; margin: 3px 0;">UPI ID: ${upiConfig.upiId}</p>
          </div>
        `;
      }
      return '';
    };

    const createReceiptContent = (copyType: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header h1 { margin: 0; font-size: 14px; font-weight: bold; }
          .header p { margin: 2px 0; font-size: 10px; }
          .copy-badge { text-align: center; font-weight: bold; font-size: 12px; margin: 10px 0; color: #000; background: #f0f0f0; padding: 5px; border: 2px solid #000; }
          .bill-info { font-size: 10px; margin-bottom: 15px; text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .bill-info p { margin: 2px 0; }
          .payment-method { font-size: 10px; margin: 10px 0; text-align: center; font-weight: bold; padding: 5px; background: #f0f0f0; border: 1px solid #000; }
          table { width: 100%; font-size: 10px; border-collapse: collapse; margin: 10px 0; }
          th { text-align: left; padding: 3px 0; border-bottom: 1px solid #000; font-weight: bold; }
          td { padding: 3px 0; }
          .item-name { width: 40%; }
          .item-qty { width: 15%; text-align: center; }
          .item-price { width: 20%; text-align: right; }
          .item-total { width: 25%; text-align: right; }
          .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px; font-size: 10px; }
          .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total-row.final { font-weight: bold; font-size: 11px; border-top: 1px solid #000; padding-top: 3px; }
          .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 8px; font-size: 9px; }
          .qr-section { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #000; text-align: center; }
          .qr-label { font-size: 9px; margin: 3px 0; font-weight: bold; }
          .page-break { page-break-after: always; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="copy-badge">${copyType}</div>

        <div class="header">
          <h1>${shopInfo.shopName}</h1>
          <p>${shopInfo.phone}</p>
          <p>${shopInfo.address}</p>
        </div>

        <div class="bill-info">
          <p><strong>RECEIPT</strong></p>
          <p>Bill: ${billData.billNumber}</p>
          <p>Date: ${billData.createdAt}</p>
        </div>

        <div class="payment-method">
          Payment Method: ${paymentMethod === 'cash' ? '💵 CASH' : paymentMethod === 'card' ? '💳 CARD' : '📱 UPI'}
        </div>

        <table>
          <thead>
            <tr>
              <th class="item-name">Item</th>
              <th class="item-qty">Qty</th>
              <th class="item-price">Price</th>
              <th class="item-total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${billData.items.map(item => `
              <tr>
                <td class="item-name">${item.productName}</td>
                <td class="item-qty">${item.quantity}</td>
                <td class="item-price">₹${Number(item.price || 0).toFixed(2)}</td>
                <td class="item-total">₹${Number(item.amount || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${Number(billData.subtotal || 0).toFixed(2)}</span>
          </div>
          ${billData.discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-₹${Number(billData.discount || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>GST (${gstRate}%):</span>
            <span>₹${Number(billData.gst || 0).toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>TOTAL:</span>
            <span>₹${Number(billData.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping!</p>
          <p>Visit us again</p>
          ${paymentMethod === 'upi' && upiQRForPrint ? `
            <div class="qr-section">
              <p class="qr-label">📱 UPI PAYMENT - Scan to Pay</p>
              <p style="font-size: 8px; margin: 3px 0;">Amount: ₹${Number(billData.total || 0).toFixed(2)}</p>
              <img src="${upiQRForPrint}" alt="UPI QR Code" style="max-width: 90px; max-height: 90px; margin-top: 5px;" />
              <p style="font-size: 8px; margin: 3px 0;">UPI ID: ${upiConfig.upiId}</p>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    // Create content for both copies
    const bothCopies = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header h1 { margin: 0; font-size: 14px; font-weight: bold; }
          .header p { margin: 2px 0; font-size: 10px; }
          .copy-badge { text-align: center; font-weight: bold; font-size: 12px; margin: 10px 0; color: #000; background: #f0f0f0; padding: 5px; border: 2px solid #000; }
          .bill-info { font-size: 10px; margin-bottom: 15px; text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .bill-info p { margin: 2px 0; }
          .payment-method { font-size: 10px; margin: 10px 0; text-align: center; font-weight: bold; padding: 5px; background: #f0f0f0; border: 1px solid #000; }
          table { width: 100%; font-size: 10px; border-collapse: collapse; margin: 10px 0; }
          th { text-align: left; padding: 3px 0; border-bottom: 1px solid #000; font-weight: bold; }
          td { padding: 3px 0; }
          .item-name { width: 40%; }
          .item-qty { width: 15%; text-align: center; }
          .item-price { width: 20%; text-align: right; }
          .item-total { width: 25%; text-align: right; }
          .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px; font-size: 10px; }
          .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total-row.final { font-weight: bold; font-size: 11px; border-top: 1px solid #000; padding-top: 3px; }
          .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 8px; font-size: 9px; }
          .qr-section { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #000; text-align: center; }
          .qr-label { font-size: 9px; margin: 3px 0; font-weight: bold; }
          .page-break { page-break-after: always; margin-bottom: 20px; border-bottom: 1px dashed #000; }
          @media print { .page-break { page-break-after: always; } }
        </style>
      </head>
      <body>
        <!-- COPY 1: ORIGINAL -->
        <div class="copy-badge">📋 ORIGINAL</div>

        <div class="header">
          <h1>${shopInfo.shopName}</h1>
          <p>${shopInfo.phone}</p>
          <p>${shopInfo.address}</p>
        </div>

        <div class="bill-info">
          <p><strong>RECEIPT</strong></p>
          <p>Bill: ${billData.billNumber}</p>
          <p>Date: ${billData.createdAt}</p>
        </div>

        <div class="payment-method">
          Payment Method: ${paymentMethod === 'cash' ? '💵 CASH' : paymentMethod === 'card' ? '💳 CARD' : '📱 UPI'}
        </div>

        <table>
          <thead>
            <tr>
              <th class="item-name">Item</th>
              <th class="item-qty">Qty</th>
              <th class="item-price">Price</th>
              <th class="item-total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${billData.items.map(item => `
              <tr>
                <td class="item-name">${item.productName}</td>
                <td class="item-qty">${item.quantity}</td>
                <td class="item-price">₹${Number(item.price || 0).toFixed(2)}</td>
                <td class="item-total">₹${Number(item.amount || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${Number(billData.subtotal || 0).toFixed(2)}</span>
          </div>
          ${billData.discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-₹${Number(billData.discount || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>GST (${gstRate}%):</span>
            <span>₹${Number(billData.gst || 0).toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>TOTAL:</span>
            <span>₹${Number(billData.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping!</p>
          <p>Visit us again</p>
          ${createQRSection()}
        </div>

        <!-- PAGE BREAK -->
        <div class="page-break"></div>

        <!-- COPY 2: DUPLICATE -->
        <div class="copy-badge">📋 DUPLICATE</div>

        <div class="header">
          <h1>${shopInfo.shopName}</h1>
          <p>${shopInfo.phone}</p>
          <p>${shopInfo.address}</p>
        </div>

        <div class="bill-info">
          <p><strong>RECEIPT</strong></p>
          <p>Bill: ${billData.billNumber}</p>
          <p>Date: ${billData.createdAt}</p>
        </div>

        <div class="payment-method">
          Payment Method: ${paymentMethod === 'cash' ? '💵 CASH' : paymentMethod === 'card' ? '💳 CARD' : '📱 UPI'}
        </div>

        <table>
          <thead>
            <tr>
              <th class="item-name">Item</th>
              <th class="item-qty">Qty</th>
              <th class="item-price">Price</th>
              <th class="item-total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${billData.items.map(item => `
              <tr>
                <td class="item-name">${item.productName}</td>
                <td class="item-qty">${item.quantity}</td>
                <td class="item-price">₹${Number(item.price || 0).toFixed(2)}</td>
                <td class="item-total">₹${Number(item.amount || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${Number(billData.subtotal || 0).toFixed(2)}</span>
          </div>
          ${billData.discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-₹${Number(billData.discount || 0).toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>GST (${gstRate}%):</span>
            <span>₹${Number(billData.gst || 0).toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>TOTAL:</span>
            <span>₹${Number(billData.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for shopping!</p>
          <p>Visit us again</p>
          ${createQRSection()}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(bothCopies);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const closePreview = () => {
    setShowBillPreview(false);
    setCartItems([]);
    setDiscount(0);
    setBillData(null);
    setUpiQRCode(null);
    setUpiURI(null);
    setPaymentMethod('cash');
  };

  // Generate dynamic UPI QR code when bill amount changes or payment method changes to UPI
  const generateUPIQRForBill = async (billAmount: number) => {
    try {
      if (!upiConfig.upiId || !validateUPIID(upiConfig.upiId)) {
        setError('⚠️ UPI ID not configured. Please go to Settings and add your UPI ID.');
        setUpiQRCode(null);
        return;
      }

      if (!validateBillAmount(billAmount)) {
        setError('Invalid bill amount for UPI QR generation');
        setUpiQRCode(null);
        return;
      }

      console.log('🔄 Generating UPI QR...', {
        upiId: upiConfig.upiId,
        shopName: upiConfig.shopName,
        amount: billAmount
      });

      const result = await generateDynamicUPIQR({
        upiId: upiConfig.upiId,
        shopName: upiConfig.shopName || shopInfo.shopName,
        amount: billAmount,
        transactionRef: `BILL-${Date.now()}`,
      });

      console.log('✅ UPI QR Generated successfully');
      setUpiQRCode(result.qrCodeDataURL);
      setUpiURI(result.uri);
      setError('');
    } catch (err) {
      console.error('❌ UPI QR Generation Error:', err);
      setError(`❌ ${err instanceof Error ? err.message : 'Failed to generate UPI QR code'}`);
      setUpiQRCode(null);
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = async (method: 'cash' | 'card' | 'upi') => {
    setPaymentMethod(method);
    if (method === 'upi' && billData) {
      // Generate QR for current bill amount
      console.log('📱 Switching to UPI - generating QR for amount:', billData.total);
      await generateUPIQRForBill(billData.total);
    } else {
      setUpiQRCode(null);
      setUpiURI(null);
      setError('');
    }
  };

  // Bill Preview Modal
  if (showBillPreview && billData) {
    return (
      <div className="bill-preview-overlay">
        <div className="bill-preview-card">
          <div className="bill-preview-header" style={{ background: 'linear-gradient(135deg, #ff9500 0%, #ff5722 100%)' }}>
            <h2>📄 Bill Preview</h2>
            <button className="close-btn" onClick={closePreview}>✕</button>
          </div>

          <div className="bill-preview-content">
            <div className="receipt-header">
              <h3>🏪 {shopInfo.shopName}</h3>
              <p>📞 {shopInfo.phone}</p>
              <p>📍 {shopInfo.address}</p>
            </div>

            <div className="receipt-info">
              <div className="info-row">
                <span>📋 Bill:</span>
                <span className="bill-number">{billData.billNumber}</span>
              </div>
              <div className="info-row">
                <span>📅 Date:</span>
                <span>{billData.createdAt}</span>
              </div>
            </div>

            <table className="receipt-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {billData.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>₹{Number(item.price || 0).toFixed(2)}</td>
                    <td>₹{Number(item.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="receipt-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{Number(billData.subtotal || 0).toFixed(2)}</span>
              </div>
              {billData.discount > 0 && (
                <div className="summary-row">
                  <span>Discount:</span>
                  <span className="discount">-₹{Number(billData.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>GST ({gstRate}%):</span>
                <span>₹{Number(billData.gst || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>TOTAL:</span>
                <span>₹{Number(billData.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="receipt-footer">
              <p>✨ Thank you for your purchase!</p>
              <p>🙏 Visit us again</p>
              {paymentQRCode && (
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px dashed #e9ecef' }}>
                  <p style={{ fontSize: '12px', color: '#2c3e50', fontWeight: 600, marginBottom: '10px' }}>💳 Scan to Pay:</p>
                  <img
                    src={paymentQRCode}
                    alt="Payment QR Code"
                    style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '8px', border: '2px solid #ff9500' }}
                  />
                </div>
              )}
            </div>

            {/* UPI Payment Section */}
            <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '2px solid #e9ecef' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#2c3e50', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Payment Method:
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handlePaymentMethodChange('cash')}
                  style={{
                    padding: '8px 12px',
                    background: paymentMethod === 'cash' ? '#ff9500' : 'white',
                    color: paymentMethod === 'cash' ? 'white' : '#2c3e50',
                    border: `2px solid ${paymentMethod === 'cash' ? '#ff9500' : '#e9ecef'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  💵 Cash
                </button>
                <button
                  onClick={() => handlePaymentMethodChange('card')}
                  style={{
                    padding: '8px 12px',
                    background: paymentMethod === 'card' ? '#ff9500' : 'white',
                    color: paymentMethod === 'card' ? 'white' : '#2c3e50',
                    border: `2px solid ${paymentMethod === 'card' ? '#ff9500' : '#e9ecef'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  💳 Card
                </button>
                <button
                  onClick={() => handlePaymentMethodChange('upi')}
                  style={{
                    padding: '8px 12px',
                    background: paymentMethod === 'upi' ? '#ff9500' : 'white',
                    color: paymentMethod === 'upi' ? 'white' : '#2c3e50',
                    border: `2px solid ${paymentMethod === 'upi' ? '#ff9500' : '#e9ecef'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  📱 UPI
                </button>
              </div>

              {/* UPI Payment Details */}
              {paymentMethod === 'upi' && (
                <div style={{ marginTop: '15px', padding: '12px', background: 'white', borderRadius: '6px', border: '2px solid #ff9500' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#2c3e50', fontWeight: 700 }}>💳 UPI PAYMENT</p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#7f8c8d' }}>Amount: <strong style={{ color: '#ff9500', fontSize: '14px' }}>₹{Number(billData.total || 0).toFixed(2)}</strong></p>

                    {upiQRCode ? (
                      <div style={{ textAlign: 'center' }}>
                        <img
                          src={upiQRCode}
                          alt="UPI QR Code"
                          style={{ maxWidth: '140px', maxHeight: '140px', margin: '10px auto', borderRadius: '8px', border: '2px solid #ff9500' }}
                        />
                        <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#27ae60', fontWeight: 600 }}>✅ Scan & Pay</p>
                        <p style={{ margin: '3px 0 0 0', fontSize: '10px', color: '#7f8c8d' }}>UPI ID: {upiConfig.upiId}</p>
                        <button
                          onClick={() => generateUPIQRForBill(billData.total)}
                          style={{
                            marginTop: '8px',
                            padding: '6px 12px',
                            background: '#ff9500',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '11px',
                            transition: 'all 0.2s'
                          }}
                        >
                          🔄 Refresh QR
                        </button>
                      </div>
                    ) : (
                      <div>
                        {upiConfig.upiId ? (
                          <p style={{ margin: '10px 0', fontSize: '11px', color: '#e74c3c' }}>❌ Generating QR code...</p>
                        ) : (
                          <p style={{ margin: '10px 0', fontSize: '11px', color: '#e74c3c' }}>⚠️ UPI ID not configured. Go to Settings to add your UPI ID.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="preview-actions">
            <button className="btn-print" onClick={printBill}>
              🖨️ Print Bill
            </button>
            <button className="btn-back" onClick={closePreview}>
              ← Back to Billing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-page">
      <div className="billing-wrapper">
        {/* Header */}
        <div className="billing-header">
          <div className="shop-info">
            <h1>🏪 {shopInfo.shopName}</h1>
            <div className="shop-details">
              <span>📞 {shopInfo.phone}</span>
              <span>📍 {shopInfo.address}</span>
            </div>
          </div>
        </div>

        <div className="billing-container">
          {/* Left: Products */}
          <div className="products-section">
            <div className="section-header">
              <h2>🛍️ Products</h2>
              <span className="product-count">{filteredProducts.length} items</span>
            </div>

            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="products-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div key={product.id} className="product-item">
                    <div className="product-header">
                      <h4>{product.productName}</h4>
                      <span className="product-code">{product.productCode}</span>
                    </div>
                    <div className="product-details">
                      <div className="detail-row">
                        <span className="label">Price:</span>
                        <span className="value price">₹{product.sellingPrice}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Stock:</span>
                        <span className={`value stock ${product.currentStock > 0 ? 'available' : 'out'}`}>
                          {product.currentStock > 0 ? `${product.currentStock} ${product.unit}` : 'Out of Stock'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">GST:</span>
                        <span className="value gst">{product.gstPercentage}%</span>
                      </div>
                    </div>
                    <button
                      className={`add-to-bill-btn ${product.currentStock === 0 ? 'disabled' : ''}`}
                      onClick={() => addToCart(product)}
                      disabled={product.currentStock === 0}
                    >
                      {product.currentStock > 0 ? '➕ Add to Bill' : '❌ Out of Stock'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-products">📦 No products found</div>
              )}
            </div>
          </div>

          {/* Right: Cart & Billing */}
          <div className="billing-section">
            <div className="section-header">
              <h2>💳 Current Bill</h2>
              <span className="items-count">{cartItems.length} items</span>
            </div>

            {error && <div className="alert alert-error">❌ {error}</div>}
            {success && <div className="alert alert-success">✅ {success}</div>}

            <div className="cart-container">
              {cartItems.length > 0 ? (
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.productName}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                            className="qty-input"
                          />
                        </td>
                        <td>₹{item.price}</td>
                        <td className="amount">₹{Number(item.amount || 0).toFixed(2)}</td>
                        <td>
                          <button
                            className="remove-btn"
                            onClick={() => removeFromCart(item.id)}
                            title="Remove item"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-cart">
                  <div className="empty-icon">🛒</div>
                  <p>No items in bill</p>
                  <small>Add products to start billing</small>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bill-summary">
              <div className="summary-item">
                <span>Subtotal:</span>
                <span>₹{Number(subtotal || 0).toFixed(2)}</span>
              </div>

              <div className="summary-item discount-row">
                <label>
                  🏷️ Discount:
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    min="0"
                    className="summary-input"
                    placeholder="0"
                  />
                </label>
                <span>-₹{Number(discountAmount || 0).toFixed(2)}</span>
              </div>

              <div className="summary-item gst-row">
                <label>
                  📊 GST %:
                  <input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                    className="summary-input"
                  />
                </label>
                <span>₹{Number(gst || 0).toFixed(2)}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-item total">
                <span>💰 Total:</span>
                <span>₹{Number(total || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="billing-actions">
              <button
                className="action-btn clear-btn"
                onClick={() => {
                  setCartItems([]);
                  setDiscount(0);
                  setGstRate(0);
                  setError('');
                }}
              >
                🔄 Clear Bill
              </button>
              <button
                className={`action-btn create-btn ${cartItems.length === 0 ? 'disabled' : ''}`}
                onClick={createBill}
                disabled={loading || cartItems.length === 0}
              >
                {loading ? '⏳ Creating...' : '✅ Create Bill'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;

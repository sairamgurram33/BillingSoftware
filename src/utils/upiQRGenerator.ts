/**
 * Dynamic UPI QR Code Generator
 * Generates UPI payment QR codes with dynamic bill amounts
 */

import QRCode from 'qrcode';

interface UPIQROptions {
  upiId: string;
  shopName: string;
  amount: number;
  transactionRef?: string;
  note?: string;
}

/**
 * Generates a UPI payment URI
 * Format: upi://pay?pa=UPI_ID&pn=SHOP_NAME&am=AMOUNT&cu=INR
 */
function generateUPIURI(options: UPIQROptions): string {
  const { upiId, shopName, amount, transactionRef, note } = options;

  // Validate inputs
  if (!upiId) {
    throw new Error('UPI ID is required');
  }

  if (!validateUPIID(upiId)) {
    throw new Error('Invalid UPI ID format');
  }

  if (!shopName || shopName.trim() === '') {
    throw new Error('Shop name is required');
  }

  if (!validateBillAmount(amount)) {
    throw new Error('Invalid bill amount');
  }

  // Format amount with exactly 2 decimal places
  const formattedAmount = amount.toFixed(2);

  // Properly encode all parameters using encodeURIComponent
  const encodedUpiId = encodeURIComponent(upiId);
  const encodedShopName = encodeURIComponent(shopName);
  const encodedAmount = encodeURIComponent(formattedAmount);

  // Build UPI URI with properly encoded parameters
  let uri = `upi://pay?pa=${encodedUpiId}&pn=${encodedShopName}&am=${encodedAmount}&cu=INR`;

  // Add optional transaction reference if provided
  if (transactionRef && transactionRef.trim() !== '') {
    const encodedRef = encodeURIComponent(transactionRef);
    uri += `&tr=${encodedRef}`;
  }

  // Add optional note if provided
  if (note && note.trim() !== '') {
    const encodedNote = encodeURIComponent(note);
    uri += `&tn=${encodedNote}`;
  }

  return uri;
}

/**
 * Generate QR code as data URL from UPI URI
 */
async function generateQRCodeDataURL(uri: string): Promise<string> {
  if (!uri || uri.trim() === '') {
    throw new Error('UPI URI is required for QR generation');
  }

  try {
    const qrCode = await QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    if (!qrCode || qrCode.trim() === '') {
      throw new Error('QR code generation returned empty data');
    }

    return qrCode;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during QR code generation';
    throw new Error(`Failed to generate QR code: ${errorMessage}`);
  }
}

/**
 * Generate dynamic UPI QR code
 * Returns both the URI and the QR code image as data URL
 */
export async function generateDynamicUPIQR(options: UPIQROptions): Promise<{
  uri: string;
  qrCodeDataURL: string;
}> {
  // Validate required fields before processing
  if (!options) {
    throw new Error('Options object is required');
  }

  if (!options.upiId || options.upiId.trim() === '') {
    throw new Error('UPI ID is required');
  }

  if (!validateUPIID(options.upiId)) {
    throw new Error(`Invalid UPI ID format: ${options.upiId}`);
  }

  if (!options.shopName || options.shopName.trim() === '') {
    throw new Error('Shop name is required');
  }

  if (!options.amount || typeof options.amount !== 'number') {
    throw new Error('Valid bill amount is required');
  }

  if (!validateBillAmount(options.amount)) {
    throw new Error(`Invalid bill amount: ${options.amount}. Amount must be greater than 0 and less than ₹1 crore`);
  }

  try {
    // Generate UPI URI with proper validation and encoding
    const uri = generateUPIURI(options);

    // Generate QR code from URI
    const qrCodeDataURL = await generateQRCodeDataURL(uri);

    return {
      uri,
      qrCodeDataURL,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`UPI QR Generation failed: ${errorMessage}`);
  }
}

/**
 * Validate UPI ID format
 */
export function validateUPIID(upiId: string): boolean {
  if (!upiId) return false;
  const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  return upiPattern.test(upiId);
}

/**
 * Validate bill amount
 */
export function validateBillAmount(amount: number): boolean {
  return amount > 0 && amount <= 100000000; // Max ₹1 Cr
}

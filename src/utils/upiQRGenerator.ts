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
  if (!upiId || !upiId.includes('@')) {
    throw new Error('Invalid UPI ID');
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  // Encode shop name (replace spaces with %20)
  const encodedShopName = encodeURIComponent(shopName);
  const encodedNote = note ? `&tn=${encodeURIComponent(note)}` : '';
  const encodedRef = transactionRef ? `&tr=${transactionRef}` : '';

  // Build UPI URI
  const uri = `upi://pay?pa=${upiId}&pn=${encodedShopName}&am=${amount}&cu=INR${encodedRef}${encodedNote}`;

  return uri;
}

/**
 * Generate QR code as data URL from UPI URI
 */
async function generateQRCodeDataURL(uri: string): Promise<string> {
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
    return qrCode;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  // Validate required fields
  if (!options.upiId) {
    throw new Error('UPI ID is required');
  }

  if (!options.shopName) {
    throw new Error('Shop name is required');
  }

  if (!options.amount || options.amount <= 0) {
    throw new Error('Valid bill amount is required');
  }

  try {
    // Generate UPI URI
    const uri = generateUPIURI(options);

    // Generate QR code
    const qrCodeDataURL = await generateQRCodeDataURL(uri);

    return {
      uri,
      qrCodeDataURL,
    };
  } catch (error) {
    throw new Error(`UPI QR Generation Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

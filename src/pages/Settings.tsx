import React, { useState, useEffect } from 'react';
import './Settings.css';

interface ShopSettings {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
}

interface PrinterSettings {
  printerName: string;
  paperWidth: number;
  autoprint: boolean;
}

interface PaymentSettings {
  qrCodeImage: string | null;
  paymentMethods: string;
  upiId: string;
}

const Settings: React.FC = () => {
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    shopName: 'SmartShop Hardware Store',
    address: '123 Hardware Lane',
    phone: '9876543210',
    email: 'contact@smartshop.com',
    gstNumber: 'GST123456789',
  });

  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    printerName: 'Thermal Printer',
    paperWidth: 80,
    autoprint: false,
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    qrCodeImage: null,
    paymentMethods: 'Cash, Card, UPI',
    upiId: '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedShopSettings = localStorage.getItem('shopSettings');
    const savedPrinterSettings = localStorage.getItem('printerSettings');
    const savedPaymentSettings = localStorage.getItem('paymentSettings');

    if (savedShopSettings) {
      try {
        setShopSettings(JSON.parse(savedShopSettings));
      } catch (error) {
        console.error('Error loading shop settings:', error);
      }
    }

    if (savedPrinterSettings) {
      try {
        setPrinterSettings(JSON.parse(savedPrinterSettings));
      } catch (error) {
        console.error('Error loading printer settings:', error);
      }
    }

    if (savedPaymentSettings) {
      try {
        setPaymentSettings(JSON.parse(savedPaymentSettings));
      } catch (error) {
        console.error('Error loading payment settings:', error);
      }
    }
  }, []);

  const handleSaveShop = () => {
    try {
      localStorage.setItem('shopSettings', JSON.stringify(shopSettings));
      setMessageType('success');
      setMessage('✅ Shop settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessageType('error');
      setMessage('❌ Failed to save shop settings');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSavePrinter = () => {
    try {
      localStorage.setItem('printerSettings', JSON.stringify(printerSettings));
      setMessageType('success');
      setMessage('✅ Printer settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessageType('error');
      setMessage('❌ Failed to save printer settings');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleQRCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setPaymentSettings({ ...paymentSettings, qrCodeImage: imageData });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePayment = () => {
    try {
      localStorage.setItem('paymentSettings', JSON.stringify(paymentSettings));
      setMessageType('success');
      setMessage('✅ Payment settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessageType('error');
      setMessage('❌ Failed to save payment settings');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRemoveQRCode = () => {
    setPaymentSettings({ ...paymentSettings, qrCodeImage: null });
    setMessageType('success');
    setMessage('✅ QR code removed!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="settings-page">
      <div className="settings-wrapper">
        <h1 className="settings-title">⚙️ Settings</h1>

        {message && (
          <div className={`message-alert ${messageType}`}>
            {message}
          </div>
        )}

        <div className="settings-grid">
          {/* Shop Settings */}
          <div className="settings-card">
            <div className="card-header">
              <h2>🏪 Shop Settings</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveShop(); }} className="settings-form">
              <div className="form-group">
                <label>Shop Name</label>
                <input
                  type="text"
                  value={shopSettings.shopName}
                  onChange={(e) => setShopSettings({ ...shopSettings, shopName: e.target.value })}
                  placeholder="Enter shop name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={shopSettings.address}
                  onChange={(e) => setShopSettings({ ...shopSettings, address: e.target.value })}
                  placeholder="Enter shop address"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={shopSettings.phone}
                  onChange={(e) => setShopSettings({ ...shopSettings, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={shopSettings.email}
                  onChange={(e) => setShopSettings({ ...shopSettings, email: e.target.value })}
                  placeholder="Enter email address"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>GST Number</label>
                <input
                  type="text"
                  value={shopSettings.gstNumber}
                  onChange={(e) => setShopSettings({ ...shopSettings, gstNumber: e.target.value })}
                  placeholder="Enter GST number"
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn-save btn-save-shop">
                💾 Save Shop Settings
              </button>
            </form>
          </div>

          {/* Printer Settings */}
          <div className="settings-card">
            <div className="card-header">
              <h2>🖨️ Printer Settings</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSavePrinter(); }} className="settings-form">
              <div className="form-group">
                <label>Printer Name</label>
                <input
                  type="text"
                  value={printerSettings.printerName}
                  onChange={(e) => setPrinterSettings({ ...printerSettings, printerName: e.target.value })}
                  placeholder="Enter printer name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Paper Width (mm)</label>
                <input
                  type="number"
                  value={printerSettings.paperWidth}
                  onChange={(e) => setPrinterSettings({ ...printerSettings, paperWidth: parseInt(e.target.value) || 80 })}
                  min="50"
                  max="300"
                  className="form-input"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={printerSettings.autoprint}
                    onChange={(e) => setPrinterSettings({ ...printerSettings, autoprint: e.target.checked })}
                    className="checkbox-input"
                  />
                  <span>Enable Auto Print</span>
                </label>
              </div>

              <button type="submit" className="btn-save btn-save-printer">
                💾 Save Printer Settings
              </button>
            </form>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="settings-card">
          <div className="card-header">
            <h2>💳 Payment Settings</h2>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSavePayment(); }} className="settings-form">
            <div className="form-group">
              <label>Payment Methods</label>
              <input
                type="text"
                value={paymentSettings.paymentMethods}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, paymentMethods: e.target.value })}
                placeholder="e.g., Cash, Card, UPI"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>UPI ID (For Dynamic QR Codes)</label>
              <input
                type="text"
                value={paymentSettings.upiId}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })}
                placeholder="e.g., yourname@okhdfcbank or yourshop@upi"
                className="form-input"
              />
              <p style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '5px' }}>
                ℹ️ Dynamic UPI QR codes will be generated with the exact bill amount during checkout. Example: yourshop@upi
              </p>
            </div>

            <div className="form-group">
              <label>💰 QR Code for Payment</label>
              <div style={{ 
                background: '#f8f9fa', 
                border: '2px dashed #667eea', 
                padding: '20px', 
                borderRadius: '8px', 
                textAlign: 'center',
                marginBottom: '15px'
              }}>
                {paymentSettings.qrCodeImage ? (
                  <div>
                    <div style={{ marginBottom: '15px' }}>
                      <img 
                        src={paymentSettings.qrCodeImage} 
                        alt="QR Code Preview" 
                        style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', border: '2px solid #667eea' }}
                      />
                    </div>
                    <p style={{ color: '#27ae60', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>✅ QR Code Loaded</p>
                    <button 
                      type="button"
                      onClick={() => document.getElementById('qr-upload')?.click()}
                      style={{
                        padding: '8px 16px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        marginRight: '10px'
                      }}
                    >
                      📸 Change QR Code
                    </button>
                    <button 
                      type="button"
                      onClick={handleRemoveQRCode}
                      style={{
                        padding: '8px 16px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '15px' }}>
                      📷 Upload your payment QR code here
                    </p>
                    <button 
                      type="button"
                      onClick={() => document.getElementById('qr-upload')?.click()}
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '14px'
                      }}
                    >
                      📤 Upload QR Code
                    </button>
                    <p style={{ color: '#95a5a6', fontSize: '11px', marginTop: '10px' }}>
                      Supported: PNG, JPG, JPEG (Max 5MB)
                    </p>
                  </div>
                )}
                <input
                  id="qr-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleQRCodeUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-save" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
            }}>
              💾 Save Payment Settings
            </button>
          </form>
        </div>

        {/* About Section */}
        <div className="settings-card about-card">
          <div className="card-header">
            <h2>ℹ️ About SmartShop POS</h2>
          </div>
          <div className="about-content">
            <p>
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              <strong>API Endpoint:</strong> http://localhost:5000/api
            </p>
            <p>
              <strong>Frontend:</strong> React 18 + TypeScript
            </p>
            <p>
              <strong>Backend:</strong> Express.js + Node.js
            </p>
            <p style={{ marginTop: '15px', color: '#666' }}>
              SmartShop POS is a professional Point of Sale system designed for small and medium retail shops. 
              All your settings are saved locally and persist across sessions.
            </p>
          </div>
        </div>

        {/* Current Settings Display */}
        <div className="settings-card current-settings">
          <div className="card-header">
            <h2>📋 Current Settings</h2>
          </div>
          <div className="settings-display">
            <div className="setting-item">
              <span className="label">Shop Name:</span>
              <span className="value">{shopSettings.shopName}</span>
            </div>
            <div className="setting-item">
              <span className="label">Phone:</span>
              <span className="value">{shopSettings.phone}</span>
            </div>
            <div className="setting-item">
              <span className="label">Address:</span>
              <span className="value">{shopSettings.address}</span>
            </div>
            <div className="setting-item">
              <span className="label">Email:</span>
              <span className="value">{shopSettings.email}</span>
            </div>
            <div className="setting-item">
              <span className="label">GST:</span>
              <span className="value">{shopSettings.gstNumber}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

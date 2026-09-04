import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  amount: number;
  gst: number;
}

interface Sale {
  id: string;
  billNumber: string;
  totalAmount: number;
  createdAt: string;
  items: CartItem[];
  discount?: number;
  gst?: number;
  subtotal?: number;
}

const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Sale | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shopInfo] = useState({
    name: 'SmartShop Hardware Store',
    phone: '9876543210',
    address: '123 Hardware Lane, City Center'
  });

  useEffect(() => {
    fetchSales();
    // Load shop settings from localStorage
    const savedShopSettings = localStorage.getItem('shopSettings');
    if (savedShopSettings) {
      try {
        const settings = JSON.parse(savedShopSettings);
        // Shop info would be used if needed
      } catch (error) {
        console.error('Error loading shop settings:', error);
      }
    }
  }, []);

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem('token');

      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/sales`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      setSales(data.sales);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('Sales fetch timeout');
      } else {
        console.error('Failed to fetch sales:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (saleId: string) => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');

      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/sales/${saleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to delete bill');
      }

      setSales(sales.filter(sale => sale.id !== saleId));
      setDeleteConfirm(null);
      if (selectedBill?.id === saleId) {
        setSelectedBill(null);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        alert('Request timeout - server may be unavailable');
      } else {
        alert('Error deleting bill: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    } finally {
      setDeleting(false);
    }
  };

  if (selectedBill) {
    // If delete confirmation is open, show confirmation modal instead
    if (deleteConfirm) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '30px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)', textAlign: 'center' }}>
            <h2 style={{ color: '#e74c3c', marginTop: 0, marginBottom: '10px', fontSize: '22px' }}>⚠️ Delete Bill?</h2>
            <p style={{ color: '#2c3e50', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
              Are you sure you want to delete bill <strong>{selectedBill.billNumber}</strong>?<br/>
              This action cannot be undone.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => handleDeleteBill(selectedBill.id)}
                disabled={deleting}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s',
                  opacity: deleting ? 0.7 : 1
                }}
                onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(231, 76, 60, 0.3)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {deleting ? '🔄 Deleting...' : '🗑️ Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                style={{
                  padding: '12px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s',
                  opacity: deleting ? 0.7 : 1
                }}
                onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.background = '#7f8c8d'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#95a5a6'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>📄 Bill Details</h2>
            <button
              onClick={() => setSelectedBill(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '25px' }}>
            {/* Shop Header */}
            <div style={{ textAlign: 'center', marginBottom: '25px', paddingBottom: '20px', borderBottom: '2px solid #e9ecef' }}>
              <h3 style={{ color: '#2c3e50', fontSize: '18px', margin: '0 0 8px 0' }}>🏪 {shopInfo.name}</h3>
              <p style={{ color: '#7f8c8d', fontSize: '12px', margin: '3px 0' }}>📞 {shopInfo.phone}</p>
              <p style={{ color: '#7f8c8d', fontSize: '12px', margin: '3px 0' }}>📍 {shopInfo.address}</p>
            </div>

            {/* Bill Info */}
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', color: '#2c3e50', borderBottom: '1px solid #e9ecef' }}>
                <span style={{ fontWeight: 700, color: '#667eea' }}>Bill Number:</span>
                <span style={{ fontWeight: 600 }}>{selectedBill.billNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', color: '#2c3e50' }}>
                <span style={{ fontWeight: 700, color: '#667eea' }}>Date & Time:</span>
                <span style={{ fontWeight: 600 }}>{new Date(selectedBill.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#2c3e50', fontWeight: 700 }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#2c3e50', fontWeight: 700 }}>Qty</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#2c3e50', fontWeight: 700 }}>Price</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#2c3e50', fontWeight: 700 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedBill.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '12px', color: '#2c3e50' }}>{item.productName}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#2c3e50' }}>{item.quantity}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#2c3e50' }}>₹{Number(item.price).toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#2c3e50', fontWeight: 700 }}>₹{Number(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px', color: '#2c3e50', borderBottom: '1px solid #e9ecef' }}>
                <span>Subtotal:</span>
                <span>₹{Number(selectedBill.subtotal || selectedBill.items.reduce((sum, item) => sum + Number(item.amount), 0)).toFixed(2)}</span>
              </div>
              {selectedBill.discount && selectedBill.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px', color: '#2c3e50', borderBottom: '1px solid #e9ecef' }}>
                  <span>Discount:</span>
                  <span>-₹{Number(selectedBill.discount).toFixed(2)}</span>
                </div>
              )}
              {selectedBill.gst && selectedBill.gst > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px', color: '#2c3e50', borderBottom: '1px solid #e9ecef' }}>
                  <span>GST:</span>
                  <span>₹{Number(selectedBill.gst).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '15px', fontWeight: 700, color: '#27ae60' }}>
                <span>Total Amount:</span>
                <span>₹{Number(selectedBill.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '15px 25px', borderTop: '1px solid #e9ecef', background: '#f8f9fa' }}>
            <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  const shopName = 'SmartShop Hardware Store';
                  const shopPhone = shopInfo.phone;
                  const shopAddress = shopInfo.address;

                  const billHTML = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Bill Details</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
                        .header h2 { margin: 5px 0; }
                        .header p { margin: 3px 0; font-size: 12px; color: #666; }
                        .bill-info { margin-bottom: 15px; }
                        .bill-info p { margin: 5px 0; font-size: 13px; }
                        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                        th { background-color: #f5f5f5; font-weight: bold; }
                        .summary { margin: 15px 0; padding: 10px; background: #f9f9f9; }
                        .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
                        .total-row { font-weight: bold; font-size: 16px; margin-top: 10px; }
                        @media print { body { padding: 0; } }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h2>${shopName}</h2>
                        <p>📞 ${shopPhone}</p>
                        <p>📍 ${shopAddress}</p>
                      </div>

                      <div class="bill-info">
                        <p><strong>Bill Number:</strong> ${selectedBill.billNumber}</p>
                        <p><strong>Date & Time:</strong> ${new Date(selectedBill.createdAt).toLocaleString()}</p>
                      </div>

                      <table>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${selectedBill.items.map((item: any) => `
                            <tr>
                              <td>${item.productName}</td>
                              <td>${item.quantity}</td>
                              <td>₹${Number(item.price).toFixed(2)}</td>
                              <td>₹${Number(item.amount).toFixed(2)}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>

                      <div class="summary">
                        <div class="summary-row">
                          <span>Subtotal:</span>
                          <span>₹${Number(selectedBill.subtotal || selectedBill.items.reduce((sum: number, item: any) => sum + Number(item.amount), 0)).toFixed(2)}</span>
                        </div>
                        ${selectedBill.discount && selectedBill.discount > 0 ? `
                        <div class="summary-row">
                          <span>Discount:</span>
                          <span>-₹${Number(selectedBill.discount).toFixed(2)}</span>
                        </div>
                        ` : ''}
                        ${selectedBill.gst && selectedBill.gst > 0 ? `
                        <div class="summary-row">
                          <span>GST:</span>
                          <span>₹${Number(selectedBill.gst).toFixed(2)}</span>
                        </div>
                        ` : ''}
                        <div class="summary-row total-row">
                          <span>Total Amount:</span>
                          <span>₹${Number(selectedBill.totalAmount).toFixed(2)}</span>
                        </div>
                      </div>

                      <p style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">Thank you for your purchase!</p>
                    </body>
                    </html>
                  `;

                  printWindow.document.write(billHTML);
                  printWindow.document.close();
                  setTimeout(() => printWindow.print(), 250);
                }
              }}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              🖨️ Print Bill
            </button>
            <button
              onClick={() => setDeleteConfirm(selectedBill.id)}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(231, 76, 60, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              🗑️ Delete
            </button>
            <button
              onClick={() => setSelectedBill(null)}
              style={{
                padding: '12px 20px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#7f8c8d'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#95a5a6'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '32px', color: '#2c3e50', marginBottom: '30px', fontWeight: 800 }}>📜 Sales History</h1>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '30px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)', textAlign: 'center' }}>
            <h2 style={{ color: '#e74c3c', marginTop: 0, marginBottom: '10px', fontSize: '22px' }}>⚠️ Delete Bill?</h2>
            <p style={{ color: '#2c3e50', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
              Are you sure you want to delete this bill?<br/>
              This action cannot be undone.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => handleDeleteBill(deleteConfirm)}
                disabled={deleting}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s',
                  opacity: deleting ? 0.7 : 1
                }}
                onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(231, 76, 60, 0.3)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {deleting ? '🔄 Deleting...' : '🗑️ Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                style={{
                  padding: '12px 20px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s',
                  opacity: deleting ? 0.7 : 1
                }}
                onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.background = '#7f8c8d'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#95a5a6'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid rgba(102, 126, 234, 0.2)', borderTopColor: '#667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
          <p style={{ color: '#7f8c8d' }}>Loading sales history...</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bill Number</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>Date & Time</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>Items</th>
                <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>Total Amount</th>
                <th style={{ padding: '18px 15px', textAlign: 'center', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.length > 0 ? (
                sales.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #e9ecef', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '16px 15px', fontWeight: 700, color: '#667eea' }}>{sale.billNumber}</td>
                    <td style={{ padding: '16px 15px', color: '#7f8c8d', fontSize: '13px' }}>{new Date(sale.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '16px 15px', color: '#2c3e50' }}>{sale.items.length} items</td>
                    <td style={{ padding: '16px 15px', fontWeight: 700, color: '#27ae60', fontSize: '15px' }}>₹{Number(sale.totalAmount).toFixed(2)}</td>
                    <td style={{ padding: '16px 15px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedBill(sale)}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          transition: 'all 0.3s ease',
                          marginRight: '5px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(sale.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr style={{ borderBottom: 'none' }}>
                  <td colSpan={5} style={{ padding: '60px 20px', textAlign: 'center', color: '#7f8c8d' }}>
                    <div>
                      <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px', opacity: 0.5 }}>📭</span>
                      <p style={{ margin: '8px 0', fontWeight: 600 }}>No sales found</p>
                      <p style={{ fontSize: '12px', color: '#95a5a6' }}>Create bills to see them here</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginTop: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
        <p style={{ margin: 0, color: '#2c3e50', fontSize: '14px', fontWeight: 600 }}>📊 Total Bills: <strong style={{ color: '#667eea', fontWeight: 700 }}>{sales.length}</strong></p>
        <p style={{ margin: 0, color: '#2c3e50', fontSize: '14px', fontWeight: 600 }}>💰 Total Sales: <strong style={{ color: '#667eea', fontWeight: 700 }}>₹{sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0).toFixed(2)}</strong></p>
      </div>
    </div>
  );
};

export default SalesHistory;

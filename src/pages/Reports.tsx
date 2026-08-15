import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';

interface ReportData {
  totalSales: number;
  totalBills: number;
  totalProfit: number;
  totalProducts: number;
  totalCustomers: number;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalBills: 0,
    totalProfit: 0,
    totalProducts: 0,
    totalCustomers: 0,
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/reports/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setReportData({
        totalSales: data.totalSales || 0,
        totalBills: data.totalBills || 0,
        totalProfit: 0, // Can be calculated later if purchase prices are tracked
        totalProducts: data.totalProducts || 0,
        totalCustomers: data.totalCustomers || 0,
      });
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Reports</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '10px' }}>Total Sales</p>
          <p style={{ color: '#27ae60', fontSize: '28px', fontWeight: 'bold' }}>₹{(reportData.totalSales || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '10px' }}>Total Bills</p>
          <p style={{ color: '#3498db', fontSize: '28px', fontWeight: 'bold' }}>{reportData.totalBills || 0}</p>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '10px' }}>Total Profit</p>
          <p style={{ color: '#f39c12', fontSize: '28px', fontWeight: 'bold' }}>₹{(reportData.totalProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '10px' }}>Total Products</p>
          <p style={{ color: '#e74c3c', fontSize: '28px', fontWeight: 'bold' }}>{reportData.totalProducts || 0}</p>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '10px' }}>Total Customers</p>
          <p style={{ color: '#9b59b6', fontSize: '28px', fontWeight: 'bold' }}>{reportData.totalCustomers || 0}</p>
        </div>
      </div>

      <div style={{ marginTop: '30px', background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2>Report Summary</h2>
        <div style={{ marginTop: '20px', lineHeight: '2' }}>
          <p><strong>Total Sales:</strong> ₹{(reportData.totalSales || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <p><strong>Number of Bills Created:</strong> {reportData.totalBills || 0}</p>
          <p><strong>Profit Generated:</strong> ₹{(reportData.totalProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <p><strong>Active Products:</strong> {reportData.totalProducts || 0}</p>
          <p><strong>Registered Customers:</strong> {reportData.totalCustomers || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;

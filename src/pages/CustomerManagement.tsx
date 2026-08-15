import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCustomers(data.customers);
    } catch (err) {
      setError('Failed to fetch customers');
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.phone) {
      setError('Name and phone are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add customer');

      setSuccess('Customer added successfully!');
      setFormData({ name: '', phone: '', email: '' });
      setShowForm(false);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add customer');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Customer Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: showForm ? '#95a5a6' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {error && <div style={{ background: '#fadbd8', border: '1px solid #e74c3c', color: '#c0392b', padding: '12px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}
      {success && <div style={{ background: '#d5f4e6', border: '1px solid #27ae60', color: '#27ae60', padding: '12px', borderRadius: '4px', marginBottom: '15px' }}>{success}</div>}

      {showForm && (
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2>Add New Customer</h2>
          <form onSubmit={handleAddCustomer}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Phone *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
                />
              </div>
            </div>
            <button type="submit" style={{ background: '#27ae60', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
              Add Customer
            </button>
          </form>
        </div>
      )}

      <input
        type="text"
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', maxWidth: '400px', padding: '12px', marginBottom: '20px', border: '1px solid #bdc3c7', borderRadius: '4px' }}
      />

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50', fontWeight: '600' }}>Phone</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50', fontWeight: '600' }}>Email</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '15px' }}>{customer.name}</td>
                  <td style={{ padding: '15px' }}>{customer.phone}</td>
                  <td style={{ padding: '15px' }}>{customer.email || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>No customers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerManagement;

import React, { useState, useEffect } from 'react';
import './ProductManagement.css';
import { API_BASE_URL } from '../utils/apiConfig';

interface Product {
  id: string;
  productName: string;
  productCode: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  gstPercentage: number;
  unit: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const ITEMS_PER_PAGE = 20;
  const [formData, setFormData] = useState({
    productName: '',
    productCode: '',
    category: 'General',
    purchasePrice: '',
    sellingPrice: '',
    currentStock: '',
    gstPercentage: '0',
    unit: 'piece',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
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
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout - server may be unavailable');
      } else {
        setError('Failed to fetch products');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.productName || !formData.productCode) {
      setError('Product name and code are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (editingId) {
        // Update existing product
        // Set up AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${API_BASE_URL}/products/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to update product');
        }

        setSuccess('Product updated successfully!');
        setEditingId(null);
      } else {
        // Add new product
        const response = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to add product');
        }

        setSuccess('Product added successfully!');
      }

      setFormData({
        productName: '',
        productCode: '',
        category: 'General',
        purchasePrice: '',
        sellingPrice: '',
        currentStock: '',
        gstPercentage: '0',
        unit: 'piece',
      });
      setShowForm(false);
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const getUniqueCategories = (): string[] => {
    const categories = products.map(p => p.category);
    return ['all', ...Array.from(new Set(categories))];
  };

  const getFilteredAndPaginatedProducts = () => {
    let filtered = products.filter(p =>
      (p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.productCode.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === 'all' || p.category === selectedCategory)
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { paginatedProducts, totalPages, totalFiltered: filtered.length };
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      productName: product.productName,
      productCode: product.productCode,
      category: product.category,
      purchasePrice: product.purchasePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      currentStock: product.currentStock.toString(),
      gstPercentage: product.gstPercentage.toString(),
      unit: product.unit || 'piece',
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      productName: '',
      productCode: '',
      category: 'General',
      purchasePrice: '',
      sellingPrice: '',
      currentStock: '',
      gstPercentage: '0',
      unit: 'piece',
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');

      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      setSuccess('Product deleted successfully!');
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout - server may be unavailable');
      } else {
        setError('Failed to delete product');
      }
    }
  };

  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.productCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="product-management">
      <div className="page-header">
        <h1>Product Management</h1>
        <button className="btn-primary" onClick={() => editingId ? handleCancel() : setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <div className="form-card">
          <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleAddProduct}>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Product Code *</label>
                <input
                  type="text"
                  value={formData.productCode}
                  onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  style={{
                    padding: '10px',
                    border: '1px solid #bdc3c7',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="piece">Piece</option>
                  <option value="kg">KG (Kilogram)</option>
                  <option value="g">G (Gram)</option>
                  <option value="liter">Liter</option>
                  <option value="ml">ML (Milliliter)</option>
                  <option value="meter">Meter</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
              <div className="form-group">
                <label>GST %</label>
                <input
                  type="number"
                  value={formData.gstPercentage}
                  onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Purchase Price</label>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Selling Price</label>
                <input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Opening Stock</label>
                <input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-success">{editingId ? 'Update Product' : 'Add Product'}</button>
          </form>
        </div>
      )}

      <div className="search-bar">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{ flex: 1 }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '12px',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            {getUniqueCategories().map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Code</th>
              <th>Category</th>
              <th>Purchase Price</th>
              <th>Selling Price</th>
              <th>Stock</th>
              <th>Unit</th>
              <th>GST %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const { paginatedProducts, totalPages, totalFiltered } = getFilteredAndPaginatedProducts();
              return (
                <>
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map(product => (
                      <tr key={product.id}>
                        <td>{product.productName}</td>
                        <td>{product.productCode}</td>
                        <td>{product.category}</td>
                        <td>₹{product.purchasePrice}</td>
                        <td>₹{product.sellingPrice}</td>
                        <td>{product.currentStock} {product.unit}</td>
                        <td>{product.unit}</td>
                        <td>{product.gstPercentage}%</td>
                        <td>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditProduct(product)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="no-data">No products found</td>
                    </tr>
                  )}
                </>
              );
            })()}
          </tbody>
        </table>

        {(() => {
          const { totalPages, totalFiltered } = getFilteredAndPaginatedProducts();
          return (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalFiltered)}-
                {Math.min(currentPage * ITEMS_PER_PAGE, totalFiltered)} of {totalFiltered} products
              </div>
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <span className="pagination-page">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next →
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Last →
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ProductManagement;

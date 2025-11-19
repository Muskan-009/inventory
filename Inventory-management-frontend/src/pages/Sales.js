import React, { useState, useEffect } from 'react';
import { salesService, customerService, productService } from '../services/api';
import { Plus, Eye, Download, Calendar, Package, User, CreditCard } from 'lucide-react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    qty: '',
    price: '',
    gst_applied: false,
    sale_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [salesResponse, customersResponse, productsResponse] = await Promise.all([
        salesService.getAll(),
        customerService.getAll(),
        productService.getAll(),
      ]);
      
      console.log('Sales response:', salesResponse);
      console.log('Customers response:', customersResponse);
      console.log('Products response:', productsResponse);
      
      // Handle different response structures
      let salesData = [];
      let customersData = [];
      let productsData = [];
      
      // Process sales data
      if (salesResponse.data && Array.isArray(salesResponse.data)) {
        salesData = salesResponse.data;
      } else if (salesResponse.data && salesResponse.data.data && Array.isArray(salesResponse.data.data)) {
        salesData = salesResponse.data.data;
      } else if (salesResponse.data && salesResponse.data.sales && Array.isArray(salesResponse.data.sales)) {
        salesData = salesResponse.data.sales;
      }
      
      // Process customers data
      if (customersResponse.data && Array.isArray(customersResponse.data)) {
        customersData = customersResponse.data;
      } else if (customersResponse.data && customersResponse.data.data && Array.isArray(customersResponse.data.data)) {
        customersData = customersResponse.data.data;
      } else if (customersResponse.data && customersResponse.data.customers && Array.isArray(customersResponse.data.customers)) {
        customersData = customersResponse.data.customers;
      }
      
      // Process products data
      if (productsResponse.data && Array.isArray(productsResponse.data)) {
        productsData = productsResponse.data;
      } else if (productsResponse.data && productsResponse.data.data && Array.isArray(productsResponse.data.data)) {
        productsData = productsResponse.data.data;
      } else if (productsResponse.data && productsResponse.data.products && Array.isArray(productsResponse.data.products)) {
        productsData = productsResponse.data.products;
      }
      
      console.log('Sales data to set:', salesData);
      console.log('Customers data to set:', customersData);
      console.log('Products data to set:', productsData);
      
      setSales(salesData);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const saleData = {
        ...formData,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        product_id: parseInt(formData.product_id),
        qty: parseInt(formData.qty),
        price: parseFloat(formData.price),
        gst_applied: formData.gst_applied,
      };

      await salesService.create(saleData);
      toast.success('Sale created successfully');
      
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Submit error:', error);
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    }
  };

  const handleView = async (id) => {
    try {
      const response = await salesService.getById(id);
      setViewingSale(response.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to load sale details');
    }
  };

  const handleDownloadInvoice = async (id) => {
    try {
      const response = await salesService.generateInvoice(id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      customer_id: '',
      product_id: '',
      qty: '',
      price: '',
      gst_applied: false,
      sale_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const product = products.find(p => p.id === parseInt(productId));
    
    setFormData({
      ...formData,
      product_id: productId,
      price: product ? product.price.toString() : '',
    });
  };

  const calculateTotal = () => {
    const qty = parseFloat(formData.qty || 0);
    const price = parseFloat(formData.price || 0);
    const subtotal = qty * price;
    
    if (formData.gst_applied && formData.product_id) {
      const product = products.find(p => p.id === parseInt(formData.product_id));
      if (product && product.gst_rate > 0) {
        return subtotal + (subtotal * product.gst_rate / 100);
      }
    }
    
    return subtotal;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600">Track your sales transactions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Sale
        </button>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Customer</th>
                <th className="table-header-cell">Product</th>
                <th className="table-header-cell">Quantity</th>
                <th className="table-header-cell">Price</th>
                <th className="table-header-cell">GST</th>
                <th className="table-header-cell">Total</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(sales) && sales.map((sale) => (
                <tr key={sale.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      {sale.customer_name}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">{sale.product_name}</p>
                        <p className="text-sm text-gray-500">SKU: {sale.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-primary">{sale.qty}</span>
                  </td>
                  <td className="table-cell">
                    {formatCurrency(sale.price)}
                  </td>
                  <td className="table-cell">
                    {sale.gst_applied ? (
                      <span className="badge badge-success">Applied</span>
                    ) : (
                      <span className="badge badge-secondary">Not Applied</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(sale.total)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(sale.id)}
                        className="text-primary-600 hover:text-primary-800 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(sale.id)}
                        className="text-success-600 hover:text-success-800 transition-colors"
                        title="Download Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sales.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No sales recorded yet</p>
        </div>
      )}

      {/* Add Sale Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="New Sale"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Customer (Optional)</label>
            <select
              name="customer_id"
              className="input"
              value={formData.customer_id}
              onChange={handleChange}
            >
              <option value="">Walk-in Customer</option>
              {Array.isArray(customers) && customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.contact}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label">Product *</label>
            <select
              name="product_id"
              required
              className="input"
              value={formData.product_id}
              onChange={handleProductChange}
            >
              <option value="">Select Product</option>
              {Array.isArray(products) && products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku}) - Stock: {product.stock_qty || 0}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input
                type="number"
                name="qty"
                required
                min="1"
                className="input"
                value={formData.qty}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="label">Unit Price *</label>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="0.01"
                className="input"
                value={formData.price}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sale Date *</label>
              <input
                type="date"
                name="sale_date"
                required
                className="input"
                value={formData.sale_date}
                onChange={handleChange}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="gst_applied"
                name="gst_applied"
                checked={formData.gst_applied}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="gst_applied" className="label">
                Apply GST
              </label>
            </div>
          </div>
          
          {formData.qty && formData.price && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(formData.qty || 0) * parseFloat(formData.price || 0))}
                </span>
              </div>
              
              {formData.gst_applied && formData.product_id && (
                <>
                  {(() => {
                    const product = products.find(p => p.id === parseInt(formData.product_id));
                    const subtotal = parseFloat(formData.qty || 0) * parseFloat(formData.price || 0);
                    const gstAmount = product ? (subtotal * product.gst_rate / 100) : 0;
                    
                    return (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          GST ({product?.gst_rate || 0}%):
                        </span>
                        <span className="font-medium">
                          {formatCurrency(gstAmount)}
                        </span>
                      </div>
                    );
                  })()}
                </>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-900">Total Amount:</span>
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary btn-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-md"
            >
              Create Sale
            </button>
          </div>
        </form>
      </Modal>

      {/* View Sale Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Sale Details"
        size="lg"
      >
        {viewingSale && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sale #{viewingSale.id}
                </h3>
                <p className="text-gray-600">
                  {new Date(viewingSale.sale_date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDownloadInvoice(viewingSale.id)}
                className="btn btn-primary btn-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </button>
            </div>
            
            <div>
              <label className="label">Customer</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{viewingSale.customer_name}</p>
                {viewingSale.customer_contact && (
                  <p className="text-sm text-gray-600">{viewingSale.customer_contact}</p>
                )}
                {viewingSale.customer_email && (
                  <p className="text-sm text-gray-600">{viewingSale.customer_email}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="label">Product</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{viewingSale.product_name}</p>
                <p className="text-sm text-gray-600">
                  SKU: {viewingSale.sku} | Category: {viewingSale.category}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Quantity</label>
                <p className="text-gray-900 font-medium">{viewingSale.qty}</p>
              </div>
              <div>
                <label className="label">Unit Price</label>
                <p className="text-gray-900">{formatCurrency(viewingSale.price)}</p>
              </div>
              <div>
                <label className="label">GST Applied</label>
                <span className={`badge ${viewingSale.gst_applied ? 'badge-success' : 'badge-secondary'}`}>
                  {viewingSale.gst_applied ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-primary-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(viewingSale.total)}
                </span>
              </div>
            </div>
            
            {viewingSale.warranty_end_date && (
              <div className="p-4 bg-success-50 rounded-lg">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-success-600 mr-2" />
                  <div>
                    <p className="font-medium text-success-800">Warranty Information</p>
                    <p className="text-sm text-success-700">
                      Valid until: {new Date(viewingSale.warranty_end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Sales;

import React, { useState, useEffect } from 'react';
import { purchaseService, vendorService, productService } from '../services/api';
import { Plus, Eye, Calendar, Package, User } from 'lucide-react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vendor_id: '',
    product_id: '',
    qty: '',
    price: '',
    purchase_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [purchasesResponse, vendorsResponse, productsResponse] = await Promise.all([
        purchaseService.getAll(),
        vendorService.getAll(),
        productService.getAll(),
      ]);
      
      console.log('Purchases response:', purchasesResponse);
      console.log('Vendors response:', vendorsResponse);
      console.log('Products response:', productsResponse);
      
      // Handle different response structures
      let purchasesData = [];
      let vendorsData = [];
      let productsData = [];
      
      // Process purchases data
      if (purchasesResponse.data && Array.isArray(purchasesResponse.data)) {
        purchasesData = purchasesResponse.data;
      } else if (purchasesResponse.data && purchasesResponse.data.data && Array.isArray(purchasesResponse.data.data)) {
        purchasesData = purchasesResponse.data.data;
      } else if (purchasesResponse.data && purchasesResponse.data.purchases && Array.isArray(purchasesResponse.data.purchases)) {
        purchasesData = purchasesResponse.data.purchases;
      }
      
      // Process vendors data
      if (vendorsResponse.data && Array.isArray(vendorsResponse.data)) {
        vendorsData = vendorsResponse.data;
      } else if (vendorsResponse.data && vendorsResponse.data.data && Array.isArray(vendorsResponse.data.data)) {
        vendorsData = vendorsResponse.data.data;
      } else if (vendorsResponse.data && vendorsResponse.data.vendors && Array.isArray(vendorsResponse.data.vendors)) {
        vendorsData = vendorsResponse.data.vendors;
      }
      
      // Process products data
      if (productsResponse.data && Array.isArray(productsResponse.data)) {
        productsData = productsResponse.data;
      } else if (productsResponse.data && productsResponse.data.data && Array.isArray(productsResponse.data.data)) {
        productsData = productsResponse.data.data;
      } else if (productsResponse.data && productsResponse.data.products && Array.isArray(productsResponse.data.products)) {
        productsData = productsResponse.data.products;
      }
      
      console.log('Purchases data to set:', purchasesData);
      console.log('Vendors data to set:', vendorsData);
      console.log('Products data to set:', productsData);
      
      setPurchases(purchasesData);
      setVendors(vendorsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load data');
      setPurchases([]);
      setVendors([]);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const purchaseData = {
        ...formData,
        vendor_id: parseInt(formData.vendor_id),
        product_id: parseInt(formData.product_id),
        qty: parseInt(formData.qty),
        price: parseFloat(formData.price),
      };

      await purchaseService.create(purchaseData);
      toast.success('Purchase created successfully');
      
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
      const response = await purchaseService.getById(id);
      setViewingPurchase(response.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to load purchase details');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      vendor_id: '',
      product_id: '',
      qty: '',
      price: '',
      purchase_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
          <p className="text-gray-600">Track your inventory purchases</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Purchase
        </button>
      </div>

      {/* Purchases Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Vendor</th>
                <th className="table-header-cell">Product</th>
                <th className="table-header-cell">Quantity</th>
                <th className="table-header-cell">Price</th>
                <th className="table-header-cell">Total</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(purchases) && purchases.map((purchase) => (
                <tr key={purchase.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      {purchase.vendor_name}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">{purchase.product_name}</p>
                        <p className="text-sm text-gray-500">SKU: {purchase.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge badge-primary">{purchase.qty}</span>
                  </td>
                  <td className="table-cell">
                    {formatCurrency(purchase.price)}
                  </td>
                  <td className="table-cell">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(purchase.total)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => handleView(purchase.id)}
                      className="text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {Array.isArray(purchases) && purchases.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No purchases recorded yet</p>
        </div>
      )}

      {/* Add Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Purchase"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Vendor *</label>
            <select
              name="vendor_id"
              required
              className="input"
              value={formData.vendor_id}
              onChange={handleChange}
            >
              <option value="">Select Vendor</option>
              {Array.isArray(vendors) && vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
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
              onChange={handleChange}
            >
              <option value="">Select Product</option>
              {Array.isArray(products) && products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku})
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
          
          <div>
            <label className="label">Purchase Date *</label>
            <input
              type="date"
              name="purchase_date"
              required
              className="input"
              value={formData.purchase_date}
              onChange={handleChange}
            />
          </div>
          
          {formData.qty && formData.price && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Amount:</span>
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(parseFloat(formData.qty || 0) * parseFloat(formData.price || 0))}
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
              Create Purchase
            </button>
          </div>
        </form>
      </Modal>

      {/* View Purchase Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Purchase Details"
      >
        {viewingPurchase && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Purchase ID</label>
                <p className="text-gray-900 font-medium">#{viewingPurchase.id}</p>
              </div>
              <div>
                <label className="label">Date</label>
                <p className="text-gray-900">
                  {new Date(viewingPurchase.purchase_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div>
              <label className="label">Vendor</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{viewingPurchase.vendor_name}</p>
                <p className="text-sm text-gray-600">{viewingPurchase.vendor_contact}</p>
              </div>
            </div>
            
            <div>
              <label className="label">Product</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{viewingPurchase.product_name}</p>
                <p className="text-sm text-gray-600">
                  SKU: {viewingPurchase.sku} | Category: {viewingPurchase.category}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Quantity</label>
                <p className="text-gray-900 font-medium">{viewingPurchase.qty}</p>
              </div>
              <div>
                <label className="label">Unit Price</label>
                <p className="text-gray-900">{formatCurrency(viewingPurchase.price)}</p>
              </div>
              <div>
                <label className="label">Total</label>
                <p className="text-lg font-bold text-primary-600">
                  {formatCurrency(viewingPurchase.total)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Purchases;

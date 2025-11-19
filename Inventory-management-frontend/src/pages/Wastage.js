import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Download, AlertTriangle, Package, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDeleteModal } from '../context/DeleteModalContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Wastage = () => {
  const { user } = useAuth();
  const { showDeleteModal } = useDeleteModal();
  const [wastageRecords, setWastageRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    category_id: '',
    location_id: '',
    wastage_type: '',
    quantity: '',
    unit: 'sheet',
    cost_per_unit: '',
    reason: '',
    wastage_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wastageResponse, productsResponse, categoriesResponse] = await Promise.all([
        api.get('/wastage/records'),
        api.get('/products'),
        api.get('/wastage/categories')
      ]);

      let wastageData = [];
      if (wastageResponse.data && Array.isArray(wastageResponse.data)) {
        wastageData = wastageResponse.data;
      } else if (wastageResponse.data && wastageResponse.data.data && Array.isArray(wastageResponse.data.data)) {
        wastageData = wastageResponse.data.data;
      }

      let productsData = [];
      if (productsResponse.data && Array.isArray(productsResponse.data)) {
        productsData = productsResponse.data;
      } else if (productsResponse.data && productsResponse.data.data && Array.isArray(productsResponse.data.data)) {
        productsData = productsResponse.data.data;
      }

      let categoriesData = [];
      if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
        categoriesData = categoriesResponse.data;
      } else if (categoriesResponse.data && categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data)) {
        categoriesData = categoriesResponse.data.data;
      }

      setWastageRecords(wastageData);
      setProducts(productsData);
      setCategories(categoriesData);
      
      // Set default locations for now
      setLocations([
        { id: 1, name: 'Main Warehouse' },
        { id: 2, name: 'Showroom' },
        { id: 3, name: 'Godown A' }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch wastage data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const wastageData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        cost_per_unit: parseFloat(formData.cost_per_unit),
        total_cost: parseFloat(formData.quantity) * parseFloat(formData.cost_per_unit)
      };

      if (editingRecord) {
        await api.put(`/wastage/records/${editingRecord.id}`, wastageData);
        toast.success('Wastage record updated successfully!');
      } else {
        await api.post('/wastage/records', wastageData);
        toast.success('Wastage record created successfully!');
      }

      setShowModal(false);
      setEditingRecord(null);
      setFormData({
        product_id: '',
        category_id: '',
        location_id: '',
        wastage_type: '',
        quantity: '',
        unit: 'sheet',
        cost_per_unit: '',
        reason: '',
        wastage_date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      console.error('Error saving wastage record:', error);
      const message = error.response?.data?.message || 'Failed to save wastage record';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      product_id: record.product_id || '',
      category_id: record.category_id || '',
      location_id: record.location_id || '',
      wastage_type: record.wastage_type || '',
      quantity: record.quantity || '',
      unit: record.unit || 'sheet',
      cost_per_unit: record.cost_per_unit || '',
      reason: record.reason || '',
      wastage_date: record.wastage_date || new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = (record) => {
    const productName = products.find(p => p.id === record.product_id)?.name || 'Unknown Product';
    showDeleteModal({
      title: 'Delete Wastage Record',
      message: `Are you sure you want to delete wastage record for "${productName}"?`,
      itemName: productName,
      onConfirm: async () => {
        try {
          await api.delete(`/wastage/records/${record.id}`);
          toast.success('Wastage record deleted successfully!');
          fetchData();
        } catch (error) {
          console.error('Error deleting wastage record:', error);
          const message = error.response?.data?.message || 'Failed to delete wastage record';
          toast.error(message);
        }
      }
    });
  };

  const filteredRecords = wastageRecords.filter(record => {
    const matchesSearch = record.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || record.category_id == filterCategory;
    const matchesDate = !filterDate || record.wastage_date === filterDate;
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  const getTotalWastageCost = () => {
    return filteredRecords.reduce((total, record) => total + (parseFloat(record.total_cost) || 0), 0);
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wastage Management</h1>
          <p className="text-gray-600 mt-1">Track and manage product wastage and damaged goods</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Record Wastage
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900">₹{getTotalWastageCost().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Products Affected</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredRecords.map(r => r.product_id)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredRecords.map(r => r.category_id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products or reasons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {Array.isArray(categories) && categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('');
                setFilterDate('');
              }}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Wastage Records Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Wastage Records</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading wastage records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(filteredRecords) && filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getProductName(record.product_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getCategoryName(record.category_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getLocationName(record.location_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {record.wastage_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.quantity} {record.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{parseFloat(record.total_cost || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.wastage_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredRecords.length === 0 && (
              <div className="text-center py-8">
                <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No wastage records</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by recording your first wastage.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-primary-50 to-blue-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRecord ? 'Edit Wastage Record' : 'Record New Wastage'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingRecord(null);
                    setFormData({
                      product_id: '',
                      category_id: '',
                      location_id: '',
                      wastage_type: '',
                      quantity: '',
                      unit: 'sheet',
                      cost_per_unit: '',
                      reason: '',
                      wastage_date: new Date().toISOString().split('T')[0]
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4 overflow-y-auto max-h-96">
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select product that was wasted</option>
                    {Array.isArray(products) && products.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select product category</option>
                    {Array.isArray(categories) && categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <select
                    value={formData.location_id}
                    onChange={(e) => setFormData({...formData, location_id: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select location where wastage occurred</option>
                    {Array.isArray(locations) && locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wastage Type *</label>
                  <select
                    value={formData.wastage_type}
                    onChange={(e) => setFormData({...formData, wastage_type: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select type of wastage</option>
                    <option value="Cutting Waste">Cutting Waste</option>
                    <option value="Damaged Goods">Damaged Goods</option>
                    <option value="Expired Stock">Expired Stock</option>
                    <option value="Production Waste">Production Waste</option>
                    <option value="Transportation Damage">Transportation Damage</option>
                    <option value="Quality Rejection">Quality Rejection</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      required
                      placeholder="Enter quantity wasted (e.g., 10.5)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="sheet">Sheet</option>
                      <option value="sq.ft">Square Feet</option>
                      <option value="cu.ft">Cubic Feet</option>
                      <option value="piece">Piece</option>
                      <option value="kg">Kilogram</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                    required
                    placeholder="Enter cost per unit (e.g., 150.00)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wastage Date *</label>
                  <input
                    type="date"
                    value={formData.wastage_date}
                    onChange={(e) => setFormData({...formData, wastage_date: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    required
                    rows={3}
                    placeholder="Describe the reason for wastage (e.g., damaged during transport, quality issues, etc.)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRecord(null);
                      setFormData({
                        product_id: '',
                        category_id: '',
                        location_id: '',
                        wastage_type: '',
                        quantity: '',
                        unit: 'sheet',
                        cost_per_unit: '',
                        reason: '',
                        wastage_date: new Date().toISOString().split('T')[0]
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingRecord ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wastage;

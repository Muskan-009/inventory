import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Edit, Trash2, Search, Package, User, Calendar, DollarSign, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDeleteModal } from '../context/DeleteModalContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Returns = () => {
  const { user } = useAuth();
  const { showDeleteModal } = useDeleteModal();
  const [returns, setReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  // Form state
  const [formData, setFormData] = useState({
    original_transaction_id: '',
    customer_id: '',
    return_type: 'refund',
    return_reason: '',
    return_date: new Date().toISOString().split('T')[0],
    total_amount: '',
    notes: ''
  });

  // Return items state
  const [returnItems, setReturnItems] = useState([]);
  const [newItem, setNewItem] = useState({
    product_id: '',
    original_quantity: '',
    returned_quantity: '',
    unit_price: '',
    reason: '',
    condition: 'good'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [returnsResponse, productsResponse, customersResponse, statsResponse] = await Promise.all([
        api.get('/returns'),
        api.get('/products'),
        api.get('/customers'),
        api.get('/returns/stats/overview')
      ]);

      let returnsData = [];
      if (returnsResponse.data && Array.isArray(returnsResponse.data)) {
        returnsData = returnsResponse.data;
      } else if (returnsResponse.data && returnsResponse.data.data && Array.isArray(returnsResponse.data.data)) {
        returnsData = returnsResponse.data.data;
      }

      let productsData = [];
      if (productsResponse.data && Array.isArray(productsResponse.data)) {
        productsData = productsResponse.data;
      } else if (productsResponse.data && productsResponse.data.data && Array.isArray(productsResponse.data.data)) {
        productsData = productsResponse.data.data;
      }

      let customersData = [];
      if (customersResponse.data && Array.isArray(customersResponse.data)) {
        customersData = customersResponse.data;
      } else if (customersResponse.data && customersResponse.data.data && Array.isArray(customersResponse.data.data)) {
        customersData = customersResponse.data.data;
      } else if (customersResponse.data && customersResponse.data.customers && Array.isArray(customersResponse.data.customers)) {
        customersData = customersResponse.data.customers;
      }

      console.log('Customers data:', customersData);

      setReturns(returnsData);
      setProducts(productsData);
      setCustomers(customersData);
      
      if (statsResponse.data && statsResponse.data.data) {
        setStats(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingReturn) {
        await api.put(`/returns/${editingReturn.id}`, formData);
      } else {
        const response = await api.post('/returns', formData);
        const returnId = response.data.data.id;
        
        // Add return items
        for (const item of returnItems) {
          await api.post(`/returns/${returnId}/items`, item);
        }
      }

      setShowModal(false);
      setEditingReturn(null);
      setFormData({
        original_transaction_id: '',
        customer_id: '',
        return_type: 'refund',
        return_reason: '',
        return_date: new Date().toISOString().split('T')[0],
        total_amount: '',
        notes: ''
      });
      setReturnItems([]);
      fetchData();
    } catch (error) {
      console.error('Error saving return:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (returnRecord) => {
    setEditingReturn(returnRecord);
    setFormData({
      original_transaction_id: returnRecord.original_transaction_id || '',
      customer_id: returnRecord.customer_id || '',
      return_type: returnRecord.return_type,
      return_reason: returnRecord.return_reason,
      return_date: returnRecord.return_date.split('T')[0],
      total_amount: returnRecord.total_amount,
      notes: returnRecord.notes || ''
    });
    setShowModal(true);
  };

  const addReturnItem = () => {
    if (newItem.product_id && newItem.returned_quantity && newItem.unit_price) {
      setReturnItems([...returnItems, { ...newItem }]);
      setNewItem({
        product_id: '',
        original_quantity: '',
        returned_quantity: '',
        unit_price: '',
        reason: '',
        condition: 'good'
      });
    }
  };

  const removeReturnItem = (index) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const updateReturnStatus = async (returnId, status) => {
    try {
      await api.put(`/returns/${returnId}/status`, { status });
      fetchData();
      toast.success('Return status updated successfully');
    } catch (error) {
      console.error('Error updating return status:', error);
      toast.error('Failed to update return status');
    }
  };

  const handleDelete = (returnRecord) => {
    showDeleteModal({
      title: 'Delete Return',
      message: `Are you sure you want to delete return #${returnRecord.id}?`,
      itemName: `Return #${returnRecord.id}`,
      onConfirm: async () => {
        try {
          await api.delete(`/returns/${returnRecord.id}`);
          toast.success('Return deleted successfully');
          fetchData();
        } catch (error) {
          console.error('Delete error:', error);
          toast.error('Failed to delete return');
        }
      }
    });
  };

  const filteredReturns = returns.filter(returnRecord =>
    returnRecord.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnRecord.return_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    returnRecord.original_transaction_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReturns = filteredReturns.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReturnTypeColor = (type) => {
    switch (type) {
      case 'refund': return 'bg-blue-100 text-blue-800';
      case 'exchange': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Returns Management</h1>
          <p className="text-gray-600 mt-1">Manage product returns, refunds, and exchanges</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Return
        </button>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowLeftRight className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Returns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_returns || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.total_return_amount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_returns || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Exchanges</p>
                <p className="text-2xl font-bold text-gray-900">{stats.exchange_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search returns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Returns List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Returns</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading returns...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentReturns.map((returnRecord) => (
                  <tr key={returnRecord.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{returnRecord.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {returnRecord.customer_name || 'Walk-in Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReturnTypeColor(returnRecord.return_type)}`}>
                        {returnRecord.return_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {returnRecord.return_reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{returnRecord.total_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(returnRecord.status)}`}>
                        {returnRecord.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(returnRecord.return_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(returnRecord)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {returnRecord.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateReturnStatus(returnRecord.id, 'approved')}
                            className="text-green-600 hover:text-green-900 mr-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateReturnStatus(returnRecord.id, 'rejected')}
                            className="text-red-600 hover:text-red-900 mr-2"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(returnRecord)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Return"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {filteredReturns.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredReturns.length)} of {filteredReturns.length} returns
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingReturn ? 'Edit Return' : 'New Return'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                    <select
                      value={formData.customer_id}
                      onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Walk-in Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Return Type</label>
                    <select
                      value={formData.return_type}
                      onChange={(e) => setFormData({...formData, return_type: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="refund">Refund</option>
                      <option value="exchange">Exchange</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason</label>
                    <input
                      type="text"
                      value={formData.return_reason}
                      onChange={(e) => setFormData({...formData, return_reason: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter return reason"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                    <input
                      type="date"
                      value={formData.return_date}
                      onChange={(e) => setFormData({...formData, return_date: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <input
                      type="number"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter total amount"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Return Items */}
                {!editingReturn && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Return Items</h4>
                    <div className="space-y-4">
                      {returnItems.map((item, index) => {
                        const product = products.find(p => p.id === parseInt(item.product_id));
                        return (
                          <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{product?.name}</p>
                              <p className="text-sm text-gray-600">Qty: {item.returned_quantity} | ₹{item.unit_price}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeReturnItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                      
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                        <select
                          value={newItem.product_id}
                          onChange={(e) => setNewItem({...newItem, product_id: e.target.value})}
                          className="border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                        
                        <input
                          type="number"
                          placeholder="Original Qty"
                          value={newItem.original_quantity}
                          onChange={(e) => setNewItem({...newItem, original_quantity: e.target.value})}
                          className="border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        
                        <input
                          type="number"
                          placeholder="Return Qty"
                          value={newItem.returned_quantity}
                          onChange={(e) => setNewItem({...newItem, returned_quantity: e.target.value})}
                          className="border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        
                        <input
                          type="number"
                          placeholder="Unit Price"
                          value={newItem.unit_price}
                          onChange={(e) => setNewItem({...newItem, unit_price: e.target.value})}
                          className="border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        
                        <input
                          type="text"
                          placeholder="Reason"
                          value={newItem.reason}
                          onChange={(e) => setNewItem({...newItem, reason: e.target.value})}
                          className="border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        
                        <button
                          type="button"
                          onClick={addReturnItem}
                          className="bg-primary-600 text-white px-3 py-2 rounded text-sm hover:bg-primary-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingReturn(null);
                      setFormData({
                        original_transaction_id: '',
                        customer_id: '',
                        return_type: 'refund',
                        return_reason: '',
                        return_date: new Date().toISOString().split('T')[0],
                        total_amount: '',
                        notes: ''
                      });
                      setReturnItems([]);
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
                    {loading ? 'Saving...' : (editingReturn ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;

import React, { useState, useEffect } from 'react';
import { inventoryService, productService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Search,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment: '',
    reason: '',
  });
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [inventoryResponse, statsResponse] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getStats(),
      ]);
      
      console.log('Inventory response:', inventoryResponse);
      console.log('Stats response:', statsResponse);
      
      // Handle different response structures
      let inventoryData = [];
      let statsData = null;
      
      if (inventoryResponse.data && Array.isArray(inventoryResponse.data)) {
        inventoryData = inventoryResponse.data;
      } else if (inventoryResponse.data && inventoryResponse.data.data && Array.isArray(inventoryResponse.data.data)) {
        inventoryData = inventoryResponse.data.data;
      } else if (inventoryResponse.data && inventoryResponse.data.inventory && Array.isArray(inventoryResponse.data.inventory)) {
        inventoryData = inventoryResponse.data.inventory;
      }
      
      if (statsResponse.data && statsResponse.data.data) {
        statsData = statsResponse.data.data;
      } else if (statsResponse.data) {
        statsData = statsResponse.data;
      }
      
      console.log('Inventory data to set:', inventoryData);
      console.log('Stats data to set:', statsData);
      
      setInventory(inventoryData);
      setStats(statsData);
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.adjustStock(
        selectedProduct.product_id,
        parseInt(adjustmentData.adjustment),
        adjustmentData.reason
      );
      
      toast.success('Stock adjusted successfully');
      fetchData();
      handleCloseAdjustModal();
    } catch (error) {
      console.error('Adjust stock error:', error);
      const message = error.response?.data?.message || 'Adjustment failed';
      toast.error(message);
    }
  };

  const handleViewMovements = async (product) => {
    try {
      setSelectedProduct(product);
      const response = await inventoryService.getMovements(product.product_id);
      setMovements(response.data);
      setIsMovementsModalOpen(true);
    } catch (error) {
      console.error('View movements error:', error);
      toast.error('Failed to load movements');
    }
  };

  const handleOpenAdjustModal = (product) => {
    setSelectedProduct(product);
    setIsAdjustModalOpen(true);
  };

  const handleCloseAdjustModal = () => {
    setIsAdjustModalOpen(false);
    setSelectedProduct(null);
    setAdjustmentData({
      adjustment: '',
      reason: '',
    });
  };

  const handleAdjustmentChange = (e) => {
    setAdjustmentData({
      ...adjustmentData,
      [e.target.name]: e.target.value,
    });
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { 
      color: 'text-danger-600', 
      bg: 'bg-danger-100', 
      text: 'Out of Stock', 
      icon: AlertTriangle 
    };
    if (stock <= 10) return { 
      color: 'text-warning-600', 
      bg: 'bg-warning-100', 
      text: 'Low Stock', 
      icon: AlertTriangle 
    };
    return { 
      color: 'text-success-600', 
      bg: 'bg-success-100', 
      text: 'In Stock', 
      icon: CheckCircle 
    };
  };

  const filteredInventory = Array.isArray(inventory) ? inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'low') return matchesSearch && item.stock_qty <= 10 && item.stock_qty > 0;
    if (filter === 'out') return matchesSearch && item.stock_qty === 0;
    if (filter === 'in') return matchesSearch && item.stock_qty > 10;
    
    return matchesSearch;
  }) : [];

  const canAdjust = hasPermission(['admin', 'super_admin']);

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
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Monitor your stock levels and movements</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_products}</p>
              </div>
              <Package className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_stock}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-warning-600">{stats.low_stock_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning-600" />
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-danger-600">{stats.out_of_stock_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-danger-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-48"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Products</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Product</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Stock</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Price</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredInventory) && filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item.stock_qty);
                const StatusIcon = stockStatus.icon;
                
                return (
                  <tr key={item.product_id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">{item.category}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-lg font-semibold text-gray-900">
                        {item.stock_qty}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {stockStatus.text}
                      </div>
                    </td>
                    <td className="table-cell">
                      ₹{item.price.toLocaleString()}
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewMovements(item)}
                          className="text-primary-600 hover:text-primary-800 transition-colors"
                          title="View Movements"
                        >
                          <Activity className="h-4 w-4" />
                        </button>
                        {canAdjust && (
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="text-warning-600 hover:text-warning-800 transition-colors"
                            title="Adjust Stock"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || filter !== 'all' ? 'No products found matching your criteria' : 'No inventory data available'}
          </p>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={handleCloseAdjustModal}
        title="Adjust Stock"
      >
        {selectedProduct && (
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
              <p className="text-sm text-gray-600">SKU: {selectedProduct.sku}</p>
              <p className="text-sm text-gray-600">Current Stock: {selectedProduct.stock_qty}</p>
            </div>
            
            <div>
              <label className="label">Adjustment *</label>
              <input
                type="number"
                name="adjustment"
                required
                className="input"
                placeholder="Enter positive or negative number"
                value={adjustmentData.adjustment}
                onChange={handleAdjustmentChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use positive numbers to add stock, negative to reduce
              </p>
            </div>
            
            <div>
              <label className="label">Reason *</label>
              <textarea
                name="reason"
                required
                rows="3"
                className="input"
                placeholder="Reason for adjustment..."
                value={adjustmentData.reason}
                onChange={handleAdjustmentChange}
              />
            </div>
            
            {adjustmentData.adjustment && (
              <div className="p-4 bg-primary-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">New Stock Level:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {selectedProduct.stock_qty + parseInt(adjustmentData.adjustment || 0)}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCloseAdjustModal}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-md"
              >
                Adjust Stock
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Stock Movements Modal */}
      <Modal
        isOpen={isMovementsModalOpen}
        onClose={() => setIsMovementsModalOpen(false)}
        title="Stock Movements"
        size="lg"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
              <p className="text-sm text-gray-600">SKU: {selectedProduct.sku}</p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {movements.length > 0 ? (
                <div className="space-y-3">
                  {Array.isArray(movements) && movements.map((movement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        {movement.quantity > 0 ? (
                          <TrendingUp className="h-5 w-5 text-success-600 mr-3" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-danger-600 mr-3" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {movement.type}
                          </p>
                          <p className="text-sm text-gray-600">{movement.reference}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(movement.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${movement.quantity > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </p>
                        <p className="text-sm text-gray-600">
                          ₹{movement.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No movements recorded</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;

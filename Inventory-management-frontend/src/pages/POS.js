import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Receipt, Package, DollarSign, User, Search, Camera, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_mode_id: '',
    amount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
    checkActiveSession();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsResponse, customersResponse] = await Promise.all([
        api.get('/products'),
        api.get('/customers')
      ]);

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
      }

      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch products and customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSession = async () => {
    try {
      const response = await api.get('/pos/sessions/active');
      if (response.data && response.data.data) {
        setActiveSession(response.data.data);
      }
    } catch (error) {
      console.log('No active session found');
    }
  };

  const startSession = async () => {
    try {
      const response = await api.post('/pos/sessions', {
        location_id: 1, // Default location
        opening_cash: 0
      });
      setActiveSession(response.data.data);
      toast.success('POS session started successfully!');
    } catch (error) {
      console.error('Error starting session:', error);
      const message = error.response?.data?.message || 'Failed to start POS session';
      toast.error(message);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success(`${product.name} quantity updated in cart!`);
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        unit: 'sheet'
      }]);
      toast.success(`${product.name} added to cart!`);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    const product = cart.find(item => item.id === productId);
    setCart(cart.filter(item => item.id !== productId));
    if (product) {
      toast.success(`${product.name} removed from cart!`);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartTax = () => {
    return getCartTotal() * 0.18; // 18% GST
  };

  const getCartGrandTotal = () => {
    return getCartTotal() + getCartTax();
  };

  const processPayment = async () => {
    if (!activeSession) {
      toast.error('Please start a POS session first');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      // Create transaction
      const transactionResponse = await api.post('/pos/transactions', {
        session_id: activeSession.id,
        customer_id: selectedCustomer?.id || null,
        transaction_type: 'sale',
        subtotal: getCartTotal(),
        discount_amount: 0,
        tax_amount: getCartTax(),
        total_amount: getCartGrandTotal(),
        notes: paymentData.notes
      });

      const transaction = transactionResponse.data.data;

      // Add items to transaction
      for (const item of cart) {
        await api.post(`/pos/transactions/${transaction.id}/items`, {
          product_id: item.id,
          quantity: item.quantity,
          unit_type: item.unit,
          unit_price: item.price,
          discount_percentage: 0
        });
      }

      // Clear cart and show success
      setCart([]);
      setSelectedCustomer(null);
      setShowPaymentModal(false);
      setPaymentData({ payment_mode_id: '', amount: 0, notes: '' });
      
      toast.success('Transaction completed successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      const message = error.response?.data?.message || 'Error processing payment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScan = (barcode) => {
    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (product) {
      addToCart(product);
      setShowScanner(false);
    } else {
      alert('Product not found with this barcode');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
            <p className="text-gray-600">
              {activeSession ? `Session: ${activeSession.session_number}` : 'No active session'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {!activeSession ? (
              <button
                onClick={startSession}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Start Session
              </button>
            ) : (
              <div className="text-sm text-gray-600">
                Opening Cash: ₹{activeSession.opening_cash}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Products */}
        <div className="w-2/3 flex flex-col">
          {/* Search */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowScanner(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 transition-all duration-200"
              >
                <QrCode className="h-4 w-4" />
                Scan
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl shadow-sm border hover:shadow-lg cursor-pointer transition-all duration-200 transform hover:scale-105"
                >
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">₹{product.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col">
          {/* Customer Selection */}
          <div className="p-4 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customer = customers.find(c => c.id === parseInt(e.target.value));
                setSelectedCustomer(customer || null);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>

          {/* Cart Items */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cart Items</h3>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-red-400 hover:text-red-600 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST (18%):</span>
                  <span>₹{getCartTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{getCartGrandTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={!activeSession}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="h-5 w-5" />
                Process Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Barcode Scanner</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Camera scanner would be here</p>
                  <p className="text-sm text-gray-500">For demo, enter barcode manually:</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode/SKU</label>
                  <input
                    type="text"
                    placeholder="Enter barcode or SKU"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleBarcodeScan(e.target.value);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowScanner(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Enter barcode or SKU"]');
                      if (input && input.value) {
                        handleBarcodeScan(input.value);
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                  >
                    Scan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Process Payment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentData.payment_mode_id}
                    onChange={(e) => setPaymentData({...paymentData, payment_mode_id: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Payment Mode</option>
                    <option value="1">Cash</option>
                    <option value="2">UPI</option>
                    <option value="3">Card</option>
                    <option value="4">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={paymentData.amount || getCartGrandTotal()}
                    onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processPayment}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Complete Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;

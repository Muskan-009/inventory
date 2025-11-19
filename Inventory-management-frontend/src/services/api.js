import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Request - Token from localStorage:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request - Authorization header set:', config.headers.Authorization);
    } else {
      console.log('API Request - No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Dashboard services
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getChartData: () => api.get('/dashboard/charts'),
};

// Vendor services
export const vendorService = {
  getAll: () => api.get('/vendors'),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
};

// Customer services
export const customerService = {
  getAll: (search = '') => api.get(`/customers${search ? `?search=${search}` : ''}`),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Product services
export const productService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/products${query ? `?${query}` : ''}`);
  },
  getById: (id) => api.get(`/products/${id}`),
  getByCode: (code) => api.get(`/products/code/${code}`),
  getLowStock: (threshold = 10) => api.get(`/products/low-stock?threshold=${threshold}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Purchase services
export const purchaseService = {
  getAll: () => api.get('/purchases'),
  getById: (id) => api.get(`/purchases/${id}`),
  getByVendor: (vendorId) => api.get(`/purchases/vendor/${vendorId}`),
  getByProduct: (productId) => api.get(`/purchases/product/${productId}`),
  getStats: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/purchases/stats?${params.toString()}`);
  },
  getTrends: () => api.get('/purchases/trends'),
  create: (data) => api.post('/purchases', data),
};

// Sales services
export const salesService = {
  getAll: () => api.get('/sales'),
  getById: (id) => api.get(`/sales/${id}`),
  getByCustomer: (customerId) => api.get(`/sales/customer/${customerId}`),
  getByProduct: (productId) => api.get(`/sales/product/${productId}`),
  getStats: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/sales/stats?${params.toString()}`);
  },
  getTrends: () => api.get('/sales/trends'),
  create: (data) => api.post('/sales', data),
  generateInvoice: (id) => {
    return api.get(`/sales/${id}/invoice`, {
      responseType: 'blob',
    });
  },
};

// Inventory services
export const inventoryService = {
  getAll: () => api.get('/inventory'),
  getByProduct: (productId) => api.get(`/inventory/product/${productId}`),
  getLowStock: (threshold = 10) => api.get(`/inventory/low-stock?threshold=${threshold}`),
  getOutOfStock: () => api.get('/inventory/out-of-stock'),
  getStats: () => api.get('/inventory/stats'),
  getMovements: (productId, limit = 50) => api.get(`/inventory/movements/${productId}?limit=${limit}`),
  updateStock: (productId, quantity) => api.put(`/inventory/product/${productId}`, { quantity }),
  adjustStock: (productId, adjustment, reason) => api.post(`/inventory/adjust/${productId}`, { adjustment, reason }),
};

export default api;

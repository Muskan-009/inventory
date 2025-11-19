import React, { useState, useEffect } from 'react';
import { dashboardService, purchaseService, salesService, customerService, vendorService } from '../services/api';
import {
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Activity,
  DollarSign
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsResponse, chartResponse] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getChartData(),
      ]);

      console.log('Dashboard stats response:', statsResponse);
      console.log('Dashboard chart response:', chartResponse);

      // Handle different response structures
      let statsData = null;
      let chartDataResponse = null;

      if (statsResponse.data && statsResponse.data.data) {
        statsData = statsResponse.data.data;
      } else if (statsResponse.data) {
        statsData = statsResponse.data;
      }

      if (chartResponse.data && chartResponse.data.data) {
        chartDataResponse = chartResponse.data.data;
      } else if (chartResponse.data) {
        chartDataResponse = chartResponse.data;
      }

      console.log('Stats data to set:', statsData);
      console.log('Chart data to set:', chartDataResponse);

      setStats(statsData);
      setChartData(chartDataResponse);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
      setStats(null);
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

  const handleCardClick = async (type) => {
    setModalType(type);
    setShowModal(true);
    setIsLoading(true);

    try {
      let response;
      switch (type) {
        case 'purchases':
          response = await purchaseService.getAll();
          break;
        case 'sales':
          response = await salesService.getAll();
          break;
        case 'customers':
          response = await customerService.getAll();
          break;
        case 'vendors':
          response = await vendorService.getAll();
          break;
        default:
          return;
      }

      // Handle different response structures
      let data = [];
      if (response.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (response.data && response.data.purchases && Array.isArray(response.data.purchases)) {
        data = response.data.purchases;
      } else if (response.data && response.data.sales && Array.isArray(response.data.sales)) {
        data = response.data.sales;
      } else if (response.data && response.data.customers && Array.isArray(response.data.customers)) {
        data = response.data.customers;
      } else if (response.data && response.data.vendors && Array.isArray(response.data.vendors)) {
        data = response.data.vendors;
      }

      setModalData(data);
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      toast.error(`Failed to load ${type} data`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChartClick = (chartType, data) => {
    if (!data || data.length === 0) {
      toast.error('No data available for this chart');
      return;
    }

    setModalType(chartType);
    setModalData(data);
    setShowModal(true);
  };

  const handleTableRowClick = (item, type) => {
    setModalType(type);
    setModalData([item]); // Show single item in modal
    setShowModal(true);
  };

  const handleActivityClick = (activity) => {
    setModalType('activityDetail');
    setModalData([activity]);
    setShowModal(true);
  };

  const handleSectionClick = async (sectionType) => {
    setModalType(sectionType);
    setShowModal(true);
    setIsLoading(true);

    try {
      let data = [];
      let response;

      switch (sectionType) {
        case 'thisMonth':
          // Get this month's data
          const [salesResponse, purchasesResponse] = await Promise.all([
            salesService.getAll(),
            purchaseService.getAll()
          ]);

          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          // Filter sales data for this month
          let salesData = [];
          if (salesResponse.data && Array.isArray(salesResponse.data)) {
            salesData = salesResponse.data;
          } else if (salesResponse.data && salesResponse.data.data && Array.isArray(salesResponse.data.data)) {
            salesData = salesResponse.data.data;
          }

          const thisMonthSales = salesData.filter(item => {
            const itemDate = new Date(item.sale_date || item.created_at);
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
          });

          data = thisMonthSales;
          break;

        case 'inventory':
          // Get inventory data
          response = await dashboardService.getStats();
          if (response.data && response.data.inventory) {
            data = [response.data.inventory];
          }
          break;

        case 'alerts':
          // Get alerts data
          response = await dashboardService.getStats();
          const alerts = [];
          if (response.data && response.data.inventory) {
            const inventory = response.data.inventory;
            if (inventory.lowStockCount > 0) {
              alerts.push({
                type: 'Low Stock',
                count: inventory.lowStockCount,
                message: `${inventory.lowStockCount} products are running low on stock`
              });
            }
            if (inventory.outOfStockCount > 0) {
              alerts.push({
                type: 'Out of Stock',
                count: inventory.outOfStockCount,
                message: `${inventory.outOfStockCount} products are out of stock`
              });
            }
          }
          data = alerts;
          break;

        case 'recentActivity':
          // Get recent activity data
          response = await dashboardService.getChartData();
          if (response.data && response.data.recentActivity) {
            data = response.data.recentActivity;
          }
          break;

        default:
          return;
      }

      setModalData(data);
    } catch (error) {
      console.error(`Error fetching ${sectionType} data:`, error);
      toast.error(`Failed to load ${sectionType} data`);
      setModalData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, gradient, onClick }) => (
    <div
      className={`${gradient} p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-all duration-300 cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-opacity-80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-white text-opacity-70 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-3 bg-white bg-opacity-20 rounded-full">
          <Icon className="h-8 w-8" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-200' : 'text-red-200'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-white text-opacity-70 text-sm ml-2">from last month</span>
        </div>
      )}
      <div className="mt-2 text-white text-opacity-60 text-xs">
        Click to view details →
      </div>
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Purchases"
          value={formatCurrency(stats?.totalPurchases?.amount || 0)}
          subtitle={`${stats?.totalPurchases?.count || 0} orders`}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          trend={12}
          onClick={() => handleCardClick('purchases')}
        />
        <StatCard
          title="Total Sales"
          value={formatCurrency(stats?.totalSales?.amount || 0)}
          subtitle={`${stats?.totalSales?.count || 0} transactions`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
          trend={8}
          onClick={() => handleCardClick('sales')}
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          subtitle="Active customers"
          icon={Users}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          trend={5}
          onClick={() => handleCardClick('customers')}
        />
        <StatCard
          title="Total Vendors"
          value={stats?.totalVendors || 0}
          subtitle="Active vendors"
          icon={Package}
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
          trend={3}
          onClick={() => handleCardClick('vendors')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GST vs Non-GST Sales Pie Chart */}
        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleChartClick('pieChart', chartData?.pieChart)}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Breakdown</h3>
          {chartData?.pieChart && Array.isArray(chartData.pieChart) && chartData.pieChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.pieChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.pieChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No sales data available
            </div>
          )}
        </div>

        {/* Monthly Trends Bar Chart */}
        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleChartClick('barChart', chartData?.barChart)}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          {chartData?.barChart && Array.isArray(chartData.barChart) && chartData.barChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.barChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="sales" fill="#0ea5e9" name="Sales" />
                <Bar dataKey="purchases" fill="#22c55e" name="Purchases" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Performance */}
        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSectionClick('thisMonth')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Sales</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(stats?.monthlySales?.amount || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Purchases</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(stats?.monthlyPurchases?.amount || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Profit</span>
              <span className="text-sm font-medium text-success-600">
                {formatCurrency((stats?.monthlySales?.amount || 0) - (stats?.monthlyPurchases?.amount || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSectionClick('inventory')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inventory</h3>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Products</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.inventory?.totalProducts || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Stock</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.inventory?.totalStock || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Low Stock</span>
              <span className="text-sm font-medium text-warning-600">
                {stats?.inventory?.lowStockCount || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Out of Stock</span>
              <span className="text-sm font-medium text-danger-600">
                {stats?.inventory?.outOfStockCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSectionClick('alerts')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
            <AlertTriangle className="h-5 w-5 text-warning-500" />
          </div>
          <div className="space-y-3">
            {stats?.inventory?.lowStockCount > 0 && (
              <div className="flex items-center p-2 bg-warning-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning-500 mr-2" />
                <span className="text-sm text-warning-700">
                  {stats.inventory.lowStockCount} items low in stock
                </span>
              </div>
            )}
            {stats?.inventory?.outOfStockCount > 0 && (
              <div className="flex items-center p-2 bg-danger-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-danger-500 mr-2" />
                <span className="text-sm text-danger-700">
                  {stats.inventory.outOfStockCount} items out of stock
                </span>
              </div>
            )}
            {(!stats?.inventory?.lowStockCount && !stats?.inventory?.outOfStockCount) && (
              <div className="text-sm text-gray-500 text-center py-4">
                No alerts at the moment
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {chartData?.recentActivity && Array.isArray(chartData.recentActivity) && chartData.recentActivity.length > 0 && (
        <div className="card p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSectionClick('recentActivity')}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {chartData.recentActivity.slice(0, 5).map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleActivityClick(activity)}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-full mr-3">
                    <DollarSign className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(activity.amount)}
                  </p>
                  {activity.gstApplied && (
                    <span className="badge badge-success text-xs">GST</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Data Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-2xl rounded-xl bg-white modal-enter" style={{ maxHeight: '80vh' }}>
            <div className="mt-3 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 100px)' }}>
              <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-primary-50 to-blue-50 p-4 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 capitalize">
                  {modalType} Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  ×
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Activity Detail View */}
                  {modalType === 'activityDetail' && modalData?.[0] && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-blue-100 rounded-full">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {modalData[0].description}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(modalData[0].date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium text-gray-900 mb-2">Transaction Details</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Amount:</span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(modalData[0].amount)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">GST Applied:</span>
                                <span className={`font-semibold ${modalData[0].gstApplied ? 'text-green-600' : 'text-gray-600'}`}>
                                  {modalData[0].gstApplied ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Type:</span>
                                <span className="font-semibold text-blue-600">
                                  {modalData[0].type || 'Sale'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border">
                            <h5 className="font-medium text-gray-900 mb-2">Additional Information</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Customer:</span>
                                <span className="font-semibold">
                                  {modalData[0].customer_name || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Product:</span>
                                <span className="font-semibold">
                                  {modalData[0].product_name || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Quantity:</span>
                                <span className="font-semibold">
                                  {modalData[0].quantity || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Regular Summary Cards for other modal types */}
                  {modalType !== 'activityDetail' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg text-white">
                        <h4 className="text-xs font-medium opacity-80">Total Count</h4>
                        <p className="text-xl font-bold">{modalData?.length || 0}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg text-white">
                        <h4 className="text-xs font-medium opacity-80">This Month</h4>
                        <p className="text-xl font-bold">
                          {modalData?.filter(item => {
                            const itemDate = new Date(item.created_at || item.purchase_date || item.sale_date);
                            const now = new Date();
                            return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                          }).length || 0}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg text-white">
                        <h4 className="text-xs font-medium opacity-80">Active</h4>
                        <p className="text-xl font-bold">
                          {modalData?.filter(item => item.is_active !== false).length || 0}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chart - Hide for activity detail */}
                  {modalType !== 'activityDetail' && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <h4 className="text-md font-semibold mb-3">Monthly Trend</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={getMonthlyData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Data Table - Hide for activity detail */}
                  {modalType !== 'activityDetail' && (
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <h4 className="text-md font-semibold">Recent {modalType}</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {getTableHeaders().map((header, index) => (
                                <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {modalData?.slice(0, 8).map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleTableRowClick(item, modalType)}>
                                {getTableRow(item).map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper functions for modal data
  function getMonthlyData() {
    if (!modalData) return [];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts = {};

    modalData.forEach(item => {
      const date = new Date(item.created_at || item.purchase_date || item.sale_date);
      const month = months[date.getMonth()];
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    return months.map(month => ({
      month,
      count: monthlyCounts[month] || 0
    }));
  }

  function getTableHeaders() {
    switch (modalType) {
      case 'purchases':
        return ['ID', 'Vendor', 'Amount', 'Date', 'Status'];
      case 'sales':
        return ['ID', 'Customer', 'Amount', 'Date', 'Status'];
      case 'customers':
        return ['Name', 'Email', 'Phone', 'Created', 'Status'];
      case 'vendors':
        return ['Name', 'Email', 'Phone', 'Created', 'Status'];
      case 'thisMonth':
        return ['ID', 'Customer', 'Amount', 'Date', 'Status'];
      case 'inventory':
        return ['Metric', 'Count', 'Percentage', 'Status'];
      case 'alerts':
        return ['Type', 'Count', 'Message', 'Priority'];
      case 'recentActivity':
        return ['Activity', 'User', 'Time', 'Details'];
      case 'pieChart':
        return ['Category', 'Value', 'Percentage', 'Color'];
      case 'barChart':
        return ['Month', 'Sales', 'Purchases', 'Net'];
      default:
        return ['ID', 'Name', 'Date', 'Status'];
    }
  }

  function getTableRow(item) {
    switch (modalType) {
      case 'purchases':
        return [
          item.id,
          item.vendor_name || 'N/A',
          formatCurrency(item.total_amount || 0),
          new Date(item.purchase_date || item.created_at).toLocaleDateString(),
          item.status || 'Completed'
        ];
      case 'sales':
        return [
          item.id,
          item.customer_name || 'Walk-in',
          formatCurrency(item.total_amount || 0),
          new Date(item.sale_date || item.created_at).toLocaleDateString(),
          item.status || 'Completed'
        ];
      case 'customers':
        return [
          item.name,
          item.email,
          item.phone || 'N/A',
          new Date(item.created_at).toLocaleDateString(),
          item.is_active ? 'Active' : 'Inactive'
        ];
      case 'vendors':
        return [
          item.name,
          item.email,
          item.phone || 'N/A',
          new Date(item.created_at).toLocaleDateString(),
          item.is_active ? 'Active' : 'Inactive'
        ];
      case 'thisMonth':
        return [
          item.id,
          item.customer_name || 'Walk-in',
          formatCurrency(item.total_amount || 0),
          new Date(item.sale_date || item.created_at).toLocaleDateString(),
          item.status || 'Completed'
        ];
      case 'inventory':
        return [
          item.metric || 'Total Products',
          item.count || item.totalProducts || 0,
          item.percentage || '100%',
          item.status || 'Active'
        ];
      case 'alerts':
        return [
          item.type || 'Alert',
          item.count || 0,
          item.message || 'No message',
          item.priority || 'Medium'
        ];
      case 'recentActivity':
        return [
          item.activity || item.type || 'Activity',
          item.user || item.user_name || 'System',
          item.time || new Date(item.created_at).toLocaleString(),
          item.details || item.description || 'No details'
        ];
      case 'pieChart':
        return [
          item.name || 'Category',
          formatCurrency(item.value || 0),
          `${((item.value / item.total) * 100).toFixed(1)}%`,
          item.color || '#8884d8'
        ];
      case 'barChart':
        return [
          item.month || 'Month',
          formatCurrency(item.sales || 0),
          formatCurrency(item.purchases || 0),
          formatCurrency((item.sales || 0) - (item.purchases || 0))
        ];
      default:
        return [
          item.id,
          item.name,
          new Date(item.created_at).toLocaleDateString(),
          item.status || 'Active'
        ];
    }
  }
};

export default Dashboard;

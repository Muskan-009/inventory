const db = require('../config/database');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');

// Get dashboard statistics
const getStats = async (req, res) => {
  try {
    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get total counts
    const [purchasesResult, salesResult, customersResult, vendorsResult] = await Promise.all([
      db.query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM purchases'),
      db.query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM sales'),
      db.query('SELECT COUNT(*) as count FROM customers'),
      db.query('SELECT COUNT(*) as count FROM vendors')
    ]);

    // Get monthly stats
    const [monthlyPurchases, monthlySales] = await Promise.all([
      Purchase.getStats(startOfMonth, now),
      Sale.getStats(startOfMonth, now)
    ]);

    // Get inventory stats
    const inventoryResult = await db.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(stock_qty) as total_stock,
        SUM(CASE WHEN stock_qty <= 10 THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock_qty = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM inventory i
      JOIN products p ON i.product_id = p.id
    `);

    const stats = {
      totalPurchases: {
        count: parseInt(purchasesResult.rows[0].count),
        amount: parseFloat(purchasesResult.rows[0].total)
      },
      totalSales: {
        count: parseInt(salesResult.rows[0].count),
        amount: parseFloat(salesResult.rows[0].total)
      },
      totalCustomers: parseInt(customersResult.rows[0].count),
      totalVendors: parseInt(vendorsResult.rows[0].count),
      monthlyPurchases: {
        count: parseInt(monthlyPurchases.total_purchases || 0),
        amount: parseFloat(monthlyPurchases.total_amount || 0)
      },
      monthlySales: {
        count: parseInt(monthlySales.total_sales || 0),
        amount: parseFloat(monthlySales.total_amount || 0)
      },
      inventory: {
        totalProducts: parseInt(inventoryResult.rows[0].total_products),
        totalStock: parseInt(inventoryResult.rows[0].total_stock),
        lowStockCount: parseInt(inventoryResult.rows[0].low_stock_count),
        outOfStockCount: parseInt(inventoryResult.rows[0].out_of_stock_count)
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get chart data
const getChartData = async (req, res) => {
  try {
    // Get GST vs Non-GST breakdown
    const gstBreakdown = await Sale.getGSTBreakdown();
    
    // Get monthly trends for the last 12 months
    const [salesTrends, purchaseTrends] = await Promise.all([
      Sale.getMonthlyTrends(),
      Purchase.getMonthlyTrends()
    ]);

    // Format GST breakdown for pie chart
    const pieChartData = gstBreakdown.map(item => ({
      name: item.gst_applied ? 'GST Sales' : 'Non-GST Sales',
      value: parseFloat(item.total_amount),
      count: parseInt(item.count)
    }));

    // Format monthly trends for bar chart
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Create a map for sales data
    const salesMap = new Map();
    salesTrends.forEach(item => {
      const month = new Date(item.month).getMonth();
      salesMap.set(month, {
        sales: parseFloat(item.total_amount),
        gstSales: parseFloat(item.gst_amount || 0),
        nonGstSales: parseFloat(item.non_gst_amount || 0)
      });
    });

    // Create a map for purchase data
    const purchaseMap = new Map();
    purchaseTrends.forEach(item => {
      const month = new Date(item.month).getMonth();
      purchaseMap.set(month, parseFloat(item.total_amount));
    });

    // Generate last 12 months data
    const barChartData = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.getMonth();
      const monthName = monthNames[month];
      
      barChartData.push({
        month: monthName,
        sales: salesMap.get(month)?.sales || 0,
        purchases: purchaseMap.get(month) || 0,
        gstSales: salesMap.get(month)?.gstSales || 0,
        nonGstSales: salesMap.get(month)?.nonGstSales || 0
      });
    }

    // Get recent sales for activity feed
    const recentSales = await db.query(`
      SELECT s.id, s.total, s.sale_date, s.gst_applied,
             COALESCE(c.name, 'Walk-in Customer') as customer_name,
             p.name as product_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN products p ON s.product_id = p.id
      ORDER BY s.sale_date DESC
      LIMIT 10
    `);

    const chartData = {
      pieChart: pieChartData,
      barChart: barChartData,
      recentActivity: recentSales.rows.map(sale => ({
        id: sale.id,
        type: 'sale',
        description: `Sale of ${sale.product_name} to ${sale.customer_name}`,
        amount: parseFloat(sale.total),
        gstApplied: sale.gst_applied,
        date: sale.sale_date
      }))
    };

    res.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Dashboard chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getStats,
  getChartData
};

# Enhanced Inventory Management System

## 🚀 New Features Overview

This enhanced inventory management system now supports comprehensive wood product management and advanced stock tracking capabilities.

## 📦 Product & Catalog Management

### Wood Product Attributes
- **Size**: 8x4, 6x3, etc.
- **Thickness**: 6mm, 12mm, 18mm, etc.
- **Grade**: MR (Moisture Resistant), BWR (Boiling Water Resistant), Marine
- **Finish**: Various finish types
- **Brand/Series**: Greenply, Century, local brands with series management

### Multi-Unit Handling
- **Primary Units**: Sheet, Sq.Ft., Cu.Ft.
- **Conversion Factors**: Automatic conversion between units
- **Pricing**: Different prices for different units

### Custom Cutting Options
- **Per Sheet**: Standard sheet pricing
- **Per Sq.Ft./Meter**: Area-based pricing
- **Wastage Tracking**: Track cut pieces and odd sizes

## 🏪 Stock Management

### Real-Time Stock Updates
- **Multi-Location**: Warehouse, showroom, godown, retail store
- **Live Updates**: Real-time stock level updates
- **Reserved Stock**: Track reserved vs available stock

### Batch/Lot Tracking
- **Quality Control**: Track by manufacturing date, expiry date
- **Grade Tracking**: Monitor quality grades per batch
- **Supplier Tracking**: Link batches to suppliers

### Multi-Location Management
- **Location Types**: Warehouse, showroom, godown, retail store
- **Stock Transfers**: Inter-location stock transfers
- **Location-Specific**: Reorder levels per location

### Stock Transfer System
- **Transfer Requests**: Create transfer requests between locations
- **Approval Workflow**: Multi-level approval process
- **Tracking**: Track transfer status (pending, in-transit, completed)

### Damaged/Defective Stock
- **Damage Types**: Defective, damaged, expired, broken, water damage
- **Disposal Methods**: Scrap, return to supplier, repair, donate, destroy
- **Loss Tracking**: Calculate total losses

### Stock Valuation Methods
- **FIFO**: First In, First Out
- **LIFO**: Last In, First Out
- **Weighted Average**: Average cost method
- **Specific Identification**: Track specific items

### Odd-Size/Balance Pieces
- **Cut Piece Tracking**: Track pieces from cutting operations
- **Size Management**: Manage different piece sizes
- **Value Calculation**: Calculate value of odd pieces

### Stock Alerts
- **Low Stock**: Automatic alerts when stock falls below reorder level
- **Out of Stock**: Immediate alerts for zero stock
- **Expiry Warnings**: Alerts for near-expiry batches
- **Damage Alerts**: Alerts for damaged stock

## 🛠️ API Endpoints

### Product Management
```
GET    /api/products/brands/all                    # Get all brands
GET    /api/products/brands/:brandId/series        # Get series by brand
GET    /api/products/brand/:brand                  # Get products by brand
GET    /api/products/grade/:grade                  # Get products by grade
GET    /api/products/thickness/:thickness          # Get products by thickness
GET    /api/products/:productId/wastage            # Get wastage for product
POST   /api/products/:productId/wastage            # Add wastage entry
GET    /api/products/:productId/units              # Get product units
POST   /api/products/:productId/units              # Add product unit
```

### Stock Management
```
GET    /api/stock/locations                        # Get all locations
POST   /api/stock/locations                        # Create location
POST   /api/stock/batches                          # Create batch
GET    /api/stock/products/:productId/batches      # Get batches by product
GET    /api/stock/locations/:locationId/stock      # Get stock by location
GET    /api/stock/products/:productId/stock        # Get stock by product
PUT    /api/stock/products/:productId/locations/:locationId/quantity  # Update stock
POST   /api/stock/movements                        # Record movement
GET    /api/stock/movements                        # Get movements
POST   /api/stock/movements/process                # Process movement with batch tracking
POST   /api/stock/transfers                        # Create transfer
GET    /api/stock/transfers/:transferId            # Get transfer details
POST   /api/stock/transfers/:transferId/items      # Add transfer item
POST   /api/stock/damaged                          # Report damaged stock
GET    /api/stock/damaged                          # Get damaged stock
GET    /api/stock/products/:productId/locations/:locationId/valuation  # Calculate valuation
PUT    /api/stock/products/:productId/locations/:locationId/valuation  # Update valuation
POST   /api/stock/odd-size-pieces                  # Add odd size piece
GET    /api/stock/odd-size-pieces                  # Get odd size pieces
GET    /api/stock/alerts                           # Get stock alerts
POST   /api/stock/alerts/check-low-stock           # Check low stock alerts
GET    /api/stock/report                           # Get comprehensive stock report
```

## 🗄️ Database Schema

### New Tables
- `brands` - Brand master data
- `series` - Series master data
- `product_wastage` - Wastage tracking
- `product_units` - Multi-unit handling
- `locations` - Location master
- `stock_batches` - Batch/lot tracking
- `stock_locations` - Multi-location stock
- `stock_movements` - Stock movement history
- `stock_transfers` - Inter-location transfers
- `stock_transfer_items` - Transfer items
- `damaged_stock` - Damaged stock tracking
- `stock_valuations` - Stock valuation data
- `odd_size_pieces` - Odd size piece management
- `stock_alerts` - Stock alerts

### Enhanced Tables
- `products` - Added wood product attributes

## 🚀 Setup Instructions

### 1. Run Database Setup
```bash
cd inventory/backend
node scripts/setup-enhanced-schema.js
```

### 2. Start Backend Server
```bash
cd inventory/backend
npm start
```

### 3. Start Frontend Server
```bash
cd inventory/frontend
npm start
```

## 📊 Usage Examples

### Creating a Wood Product
```javascript
const productData = {
  name: "Greenply MR Plywood",
  sku: "GP-MR-18-8X4",
  category: "Plywood",
  brand: "Greenply",
  series: "Greenply MR",
  size: "8x4",
  thickness: "18mm",
  grade: "MR",
  finish: "Plain",
  unit_type: "sheet",
  price: 2500,
  price_per_sqft: 78.125,
  cutting_option: "per_sheet",
  wastage_percentage: 5
};
```

### Creating a Batch
```javascript
const batchData = {
  product_id: 1,
  batch_number: "BATCH-001",
  lot_number: "LOT-2024-001",
  manufacturing_date: "2024-01-15",
  expiry_date: "2026-01-15",
  quality_grade: "A",
  initial_quantity: 100,
  unit_cost: 2500,
  location_id: 1
};
```

### Stock Transfer
```javascript
const transferData = {
  from_location_id: 1,  // Warehouse
  to_location_id: 2,    // Showroom
  notes: "Transfer for showroom display"
};

const transferItem = {
  product_id: 1,
  batch_id: 1,
  quantity: 10,
  unit_cost: 2500,
  total_cost: 25000
};
```

### Reporting Damaged Stock
```javascript
const damageData = {
  product_id: 1,
  batch_id: 1,
  location_id: 1,
  damage_type: "water_damage",
  damage_reason: "Water leakage in storage",
  quantity: 5,
  unit_cost: 2500,
  total_loss: 12500
};
```

## 🔧 Configuration

### Environment Variables
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### Default Locations
- Main Warehouse
- Showroom
- Godown A
- Retail Store

### Default Brands
- Greenply (with MR and BWR series)
- Century (with Marine series)
- Local Brand

## 📈 Benefits

1. **Complete Wood Product Management**: Handle all aspects of wood products
2. **Real-Time Stock Tracking**: Always know your current stock levels
3. **Quality Control**: Track batches and quality grades
4. **Multi-Location Support**: Manage stock across multiple locations
5. **Automated Alerts**: Never run out of stock unexpectedly
6. **Wastage Management**: Track and minimize wastage
7. **Financial Control**: Accurate stock valuation and cost tracking
8. **Audit Trail**: Complete history of all stock movements

## 🎯 Next Steps

1. **Frontend Integration**: Update frontend components to use new APIs
2. **Reporting**: Create comprehensive reports and dashboards
3. **Mobile App**: Develop mobile app for field operations
4. **Integration**: Connect with accounting and ERP systems
5. **Analytics**: Add advanced analytics and forecasting

This enhanced system provides a complete solution for wood product inventory management with advanced stock tracking capabilities.

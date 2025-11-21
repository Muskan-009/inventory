# Inventory Management System - Setup Guide

## Prerequisites

- Node.js 16+ installed
- PostgreSQL 15/16 installed and running
- Git (optional)

## Quick Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install-all
```

### 2. Database Setup

1. Create a PostgreSQL database named `inventory_db`
2. Copy `backend/env.example` to `backend/.env`
3. Update database credentials in `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 3. Initialize Database

```bash
# Create database tables
npm run setup-db

# Seed with sample data
npm run seed
```

### 4. Start Development

```bash
# Start both backend and frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@inventory.com | admin123 |
| Manager | manager@inventory.com | manager123 |
| Staff | staff@inventory.com | staff123 |

## Features Implemented

### ✅ User Roles & Authentication
- **Super Admin**: Full system access, manage all users and data
- **Admin (Manager)**: Manage team data, purchases, inventory
- **User (Staff)**: Sales operations, limited access

### ✅ Dashboard
- 4 top grid cards (Total Purchases, Sales, Customers, Vendors)
- Interactive Pie Chart (GST vs Non-GST sales)
- Bar Graph (Monthly sales & purchases trends)
- Recent activity feed
- Inventory alerts

### ✅ Vendor Management
- Add, edit, delete vendors
- GST number tracking
- Contact information management
- Purchase history integration

### ✅ Customer Management
- Complete customer database
- Search functionality
- GST customer support
- Sales history tracking

### ✅ Product Management
- Product catalog with SKU/barcode
- Category management
- GST rate configuration
- Warranty tracking
- Stock level monitoring

### ✅ Purchase Management
- Record purchases from vendors
- Automatic inventory updates
- Purchase history and analytics
- Vendor-wise purchase tracking

### ✅ Sales Management
- **GST/Non-GST sales options**
- Walk-in customer support
- Barcode/SKU scanning ready
- **PDF invoice generation**
- Warranty tracking
- Automatic inventory deduction

### ✅ Inventory Management
- Real-time stock tracking
- Low stock alerts
- Out of stock monitoring
- Stock movement history
- Manual stock adjustments

### ✅ Technical Features
- **PostgreSQL 15/16 compatible**
- JWT authentication
- Role-based access control
- API rate limiting
- Input validation
- Error handling
- Responsive design
- Modern UI with Tailwind CSS

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/charts` - Chart data

### Vendors
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Products
- `GET /api/products` - List products
- `GET /api/products/code/:code` - Get by SKU/barcode
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Purchases
- `GET /api/purchases` - List purchases
- `POST /api/purchases` - Create purchase
- `GET /api/purchases/:id` - Get purchase details

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details
- `GET /api/sales/:id/invoice` - Download PDF invoice

### Inventory
- `GET /api/inventory` - List inventory
- `GET /api/inventory/low-stock` - Low stock items
- `PUT /api/inventory/product/:id` - Update stock
- `POST /api/inventory/adjust/:id` - Adjust stock

## Database Schema

### Users Table
```sql
id, name, email, role, password_hash, created_at, updated_at
```

### Vendors Table
```sql
id, name, contact, email, gst_no, address, created_at, updated_at
```

### Customers Table
```sql
id, name, contact, email, gst_no, address, created_at, updated_at
```

### Products Table
```sql
id, name, sku, barcode, category, price, gst_rate, warranty_months, description, created_at, updated_at
```

### Purchases Table
```sql
id, vendor_id, product_id, qty, price, total, purchase_date, created_at
```

### Sales Table
```sql
id, customer_id, product_id, qty, price, gst_applied, total, sale_date, warranty_end_date, created_at
```

### Inventory Table
```sql
product_id, stock_qty, updated_at
```

## Production Deployment

1. Set `NODE_ENV=production` in backend/.env
2. Update CORS origins in backend/server.js
3. Set strong JWT_SECRET
4. Configure PostgreSQL for production
5. Build frontend: `cd frontend && npm run build`
6. Serve built files with nginx/apache
7. Use PM2 for backend process management

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in .env
- Verify database exists

### Port Conflicts
- Backend runs on port 5000
- Frontend runs on port 3000
- Change ports in package.json if needed

### Permission Issues
- Check user roles in database
- Verify JWT token is being sent
- Check browser console for errors

## Support

For issues or questions:
1. Check the console logs
2. Verify database connection
3. Ensure all dependencies are installed
4. Check API endpoints with tools like Postman

## License

MIT License - Feel free to use for commercial projects.

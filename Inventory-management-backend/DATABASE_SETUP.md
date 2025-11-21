# Database Setup Guide - Inventory Management System

## Method 1: Using pgAdmin (Recommended)

### Step 1: Create Database
1. Open pgAdmin
2. Right-click on "Databases" 
3. Select "Create" → "Database"
4. Name: `inventory_db`
5. Click "Save"

### Step 2: Restore from Backup
1. Right-click on `inventory_db` database
2. Select "Restore"
3. Choose "Custom or tar" format
4. Browse and select `database_backup.sql` file
5. Click "Restore"

## Method 2: Using Command Line

### Step 1: Create Database
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
CREATE DATABASE inventory_db;

# Exit psql
\q
```

### Step 2: Import SQL File
```bash
# Import the backup file
psql -U postgres -d inventory_db -f database_backup.sql
```

## Method 3: Using SQL Commands Directly

### Step 1: Connect to PostgreSQL
```bash
psql -U postgres
```

### Step 2: Create Database
```sql
CREATE DATABASE inventory_db;
\c inventory_db;
```

### Step 3: Copy and paste the entire content of `database_backup.sql`

## Verification

After setup, verify the database:

```sql
-- Connect to inventory_db
\c inventory_db;

-- Check tables
\dt

-- Check sample data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM inventory;

-- Check inventory status
SELECT * FROM inventory_status LIMIT 5;
```

## Expected Results:
- **Users**: 3 records (Super Admin, Manager, Staff)
- **Vendors**: 5 records
- **Customers**: 8 records  
- **Products**: 15 records
- **Inventory**: 15 records
- **Purchases**: 10 records
- **Sales**: 10 records
- **Notifications**: 5 records

## Default Login Credentials:
- **Super Admin**: admin@inventory.com / admin123
- **Manager**: manager@inventory.com / manager123  
- **Staff**: staff@inventory.com / staff123

## Database Structure:

### Tables Created:
1. **users** - User accounts with roles
2. **vendors** - Supplier information
3. **customers** - Customer database
4. **products** - Product catalog
5. **purchases** - Purchase transactions
6. **sales** - Sales transactions
7. **inventory** - Stock levels
8. **notifications** - System notifications
9. **inventory_adjustments** - Stock adjustment history

### Indexes Created:
- Purchase date indexing
- Sales date indexing
- Product SKU/barcode indexing
- Foreign key indexing for performance

### Views Created:
- **inventory_status** - Easy inventory checking with status

## Troubleshooting:

### Error: "database does not exist"
- Make sure you created the database first
- Check database name spelling: `inventory_db`

### Error: "permission denied"
- Run as postgres superuser
- Grant proper permissions to your user

### Error: "relation already exists"
- Database already has tables
- Drop existing tables or use a fresh database

## Connection Settings:
Make sure your `backend/.env` file has:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=root
```

## Next Steps:
After database setup:
1. Start the backend server: `npm run server`
2. Start the frontend: `npm run client`
3. Access: http://localhost:3000

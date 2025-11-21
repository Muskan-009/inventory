-- Inventory Management System Database Backup
-- PostgreSQL 15/16 Compatible
-- Created: October 2024

-- Create database (run this separately if needed)
-- CREATE DATABASE inventory_db;

-- Connect to inventory_db database before running below commands

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS inventory_adjustments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Vendors table
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    gst_no VARCHAR(15),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    gst_no VARCHAR(15),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50),
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    gst_rate DECIMAL(5,2) DEFAULT 0,
    warranty_months INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Purchases table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    gst_applied BOOLEAN DEFAULT FALSE,
    total DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMP NOT NULL,
    warranty_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Inventory table
CREATE TABLE inventory (
    product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Inventory adjustments table (for audit trail)
CREATE TABLE inventory_adjustments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    adjustment INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_vendor_id ON purchases(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);

CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Insert sample users (passwords are hashed for: admin123, manager123, staff123)
INSERT INTO users (name, email, role, password_hash) VALUES
('Super Admin', 'admin@inventory.com', 'super_admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2'),
('Store Manager', 'manager@inventory.com', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2'),
('Sales Staff', 'staff@inventory.com', 'user', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2');

-- Insert sample vendors
INSERT INTO vendors (name, contact, email, gst_no, address) VALUES
('Tech Supplies Ltd', '9876543210', 'contact@techsupplies.com', '27AABCT1332L1ZZ', '123 Tech Street, Mumbai'),
('Electronics Hub', '9876543211', 'sales@electronicshub.com', '27AABCT1332L2ZZ', '456 Electronics Ave, Delhi'),
('Global Traders', '9876543212', 'info@globaltraders.com', '27AABCT1332L3ZZ', '789 Trade Center, Bangalore'),
('Smart Devices Co', '9876543213', 'orders@smartdevices.com', '27AABCT1332L4ZZ', '321 Smart Plaza, Chennai'),
('Digital World', '9876543214', 'support@digitalworld.com', '27AABCT1332L5ZZ', '654 Digital Street, Pune');

-- Insert sample customers
INSERT INTO customers (name, contact, email, gst_no, address) VALUES
('Rajesh Kumar', '9123456789', 'rajesh@email.com', '27AABCT1332L6ZZ', '12 MG Road, Mumbai'),
('Priya Sharma', '9123456790', 'priya@email.com', NULL, '34 Park Street, Delhi'),
('Amit Patel', '9123456791', 'amit@email.com', '27AABCT1332L7ZZ', '56 Commercial Street, Bangalore'),
('Sunita Singh', '9123456792', 'sunita@email.com', NULL, '78 Market Road, Chennai'),
('Vikram Gupta', '9123456793', 'vikram@email.com', '27AABCT1332L8ZZ', '90 Business District, Pune'),
('Neha Agarwal', '9123456794', 'neha@email.com', NULL, '11 Shopping Complex, Hyderabad'),
('Ravi Verma', '9123456795', 'ravi@email.com', '27AABCT1332L9ZZ', '22 Tech Park, Noida'),
('Kavita Joshi', '9123456796', 'kavita@email.com', NULL, '33 City Center, Jaipur');
-- Insert sample plywood products
INSERT INTO products (name, sku, barcode, category, price, gst_rate, warranty_months, description) VALUES
('Plywood MR Grade 18mm', 'PLY001', '8901234567001', 'Plywood', 1800, 18, 0, 'Moisture Resistant Plywood 18mm thickness'),
('Plywood BWR Grade 12mm', 'PLY002', '8901234567002', 'Plywood', 1500, 18, 0, 'Boiling Water Resistant Plywood 12mm thickness'),
('Plywood Marine Grade 19mm', 'PLY003', '8901234567003', 'Plywood', 2500, 18, 0, 'Marine Grade Plywood 19mm thickness for water resistance'),
('Commercial Plywood 16mm', 'PLY004', '8901234567004', 'Plywood', 1200, 18, 0, 'Commercial Grade Plywood 16mm thickness'),
('Plywood Shuttering 25mm', 'PLY005', '8901234567005', 'Plywood', 3000, 18, 0, 'Shuttering Plywood 25mm for construction use'),
('Blockboard 19mm', 'PLY006', '8901234567006', 'Plywood', 2200, 18, 0, 'Plywood Blockboard 19mm thickness'),
('Laminated Plywood 18mm', 'PLY007', '8901234567007', 'Plywood', 2800, 18, 0, 'Decorative Laminated Plywood 18mm thickness'),
('Plywood BWP Grade 20mm', 'PLY008', '8901234567008', 'Plywood', 2600, 18, 0, 'Boiling Waterproof Plywood 20mm thickness'),
('Calibrated Plywood 16mm', 'PLY009', '8901234567009', 'Plywood', 2000, 18, 0, 'Calibrated Plywood 16mm smooth surface'),
('Gurjan Plywood 19mm', 'PLY010', '8901234567010', 'Plywood', 3500, 18, 0, 'High-quality Gurjan core Plywood 19mm thickness');

-- Initialize inventory for all products with random stock
INSERT INTO inventory (product_id, stock_qty) VALUES
(1, 25), (2, 15), (3, 20), (4, 8), (5, 50),
(6, 100), (7, 30), (8, 40), (9, 12), (10, 18),
(11, 10), (12, 35), (13, 22), (14, 8), (15, 12);

-- Insert sample purchases
INSERT INTO purchases (vendor_id, product_id, qty, price, total, purchase_date) VALUES
(1, 1, 5, 42000, 210000, '2024-01-15'),
(2, 2, 10, 62000, 620000, '2024-01-20'),
(3, 3, 8, 52000, 416000, '2024-02-01'),
(1, 4, 3, 14000, 42000, '2024-02-10'),
(4, 5, 50, 750, 37500, '2024-02-15'),
(5, 6, 100, 280, 28000, '2024-03-01'),
(2, 7, 15, 2300, 34500, '2024-03-05'),
(3, 8, 25, 1100, 27500, '2024-03-10'),
(4, 9, 12, 3200, 38400, '2024-03-15'),
(5, 10, 8, 4200, 33600, '2024-03-20');

-- Insert sample sales
INSERT INTO sales (customer_id, product_id, qty, price, gst_applied, total, sale_date, warranty_end_date) VALUES
(1, 1, 1, 45000, true, 53100, '2024-01-25', '2026-01-25'),
(2, 2, 1, 65000, true, 76700, '2024-02-05', '2025-02-05'),
(NULL, 5, 2, 800, false, 1600, '2024-02-20', '2024-08-20'),
(3, 6, 5, 300, false, 1500, '2024-03-01', '2024-06-01'),
(4, 7, 1, 2500, true, 2950, '2024-03-08', '2025-03-08'),
(5, 8, 2, 1200, false, 2400, '2024-03-12', '2024-09-12'),
(NULL, 9, 1, 3500, true, 4130, '2024-03-18', '2025-03-18'),
(6, 10, 1, 4500, true, 5310, '2024-03-22', '2026-03-22'),
(7, 11, 1, 12000, true, 14160, '2024-03-25', '2027-03-25'),
(8, 12, 1, 4000, false, 4000, '2024-03-28', '2026-03-28');

-- Insert sample notifications
INSERT INTO notifications (message, type) VALUES
('Low stock alert: Wireless Mouse quantity is below threshold', 'warning'),
('New purchase order received from Tech Supplies Ltd', 'info'),
('Monthly sales report is ready for review', 'info'),
('System backup completed successfully', 'success'),
('USB Cable Type-C is out of stock', 'error');

-- Update inventory based on purchases and sales (this is normally done automatically)
UPDATE inventory SET stock_qty = stock_qty + 5 WHERE product_id = 1;
UPDATE inventory SET stock_qty = stock_qty + 10 WHERE product_id = 2;
UPDATE inventory SET stock_qty = stock_qty + 8 WHERE product_id = 3;
UPDATE inventory SET stock_qty = stock_qty + 3 WHERE product_id = 4;
UPDATE inventory SET stock_qty = stock_qty + 50 WHERE product_id = 5;
UPDATE inventory SET stock_qty = stock_qty + 100 WHERE product_id = 6;
UPDATE inventory SET stock_qty = stock_qty + 15 WHERE product_id = 7;
UPDATE inventory SET stock_qty = stock_qty + 25 WHERE product_id = 8;
UPDATE inventory SET stock_qty = stock_qty + 12 WHERE product_id = 9;
UPDATE inventory SET stock_qty = stock_qty + 8 WHERE product_id = 10;

-- Subtract sold quantities
UPDATE inventory SET stock_qty = stock_qty - 1 WHERE product_id = 1;
UPDATE inventory SET stock_qty = stock_qty - 1 WHERE product_id = 2;
UPDATE inventory SET stock_qty = stock_qty - 2 WHERE product_id = 5;
UPDATE inventory SET stock_qty = stock_qty - 5 WHERE product_id = 6;
UPDATE inventory SET stock_qty = stock_qty - 1 WHERE product_id = 7;
UPDATE inventory SET stock_qty = stock_qty - 2 WHERE product_id = 8;
UPDATE inventory SET stock_qty = stock_qty - 1 WHERE product_id = 9;
UPDATE inventory SET stock_qty = stock_qty - 1 WHERE product_id = 10;
UPDATE inventory SET stock_qty = stock_qty - 1 WHERE product_id = 11;
UPDATE inventory SET stock_qty = stock_qty - 1 WHERE product_id = 12;

-- Create a view for easy inventory checking
CREATE OR REPLACE VIEW inventory_status AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.category,
    p.price,
    i.stock_qty,
    CASE 
        WHEN i.stock_qty = 0 THEN 'Out of Stock'
        WHEN i.stock_qty <= 10 THEN 'Low Stock'
        ELSE 'In Stock'
    END as status
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
ORDER BY i.stock_qty ASC;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- Database setup complete
SELECT 'Database setup completed successfully!' as message;

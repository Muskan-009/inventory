const db = require('../config/database');

class StockManagement {
  // ==================== LOCATION MANAGEMENT ====================
  
  // Get all locations
  static async getLocations() {
    const result = await db.query(
      'SELECT * FROM locations WHERE is_active = true ORDER BY name ASC'
    );
    return result.rows;
  }

  // Create new location
  static async createLocation(locationData) {
    const { name, type, address, contact_person, contact_phone } = locationData;
    
    const result = await db.query(
      `INSERT INTO locations (name, type, address, contact_person, contact_phone, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING *`,
      [name, type, address, contact_person, contact_phone]
    );
    
    return result.rows[0];
  }

  // ==================== BATCH MANAGEMENT ====================
  
  // Create new batch
  static async createBatch(batchData) {
    const { 
      product_id, batch_number, lot_number, supplier_batch, manufacturing_date, 
      expiry_date, quality_grade, initial_quantity, unit_cost, location_id 
    } = batchData;
    
    const result = await db.query(
      `INSERT INTO stock_batches (
        product_id, batch_number, lot_number, supplier_batch, manufacturing_date,
        expiry_date, quality_grade, initial_quantity, remaining_quantity, unit_cost, location_id
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        product_id, batch_number, lot_number, supplier_batch, manufacturing_date,
        expiry_date, quality_grade, initial_quantity, initial_quantity, unit_cost, location_id
      ]
    );
    
    return result.rows[0];
  }

  // Get batches by product
  static async getBatchesByProduct(productId, locationId = null) {
    let query = `
      SELECT sb.*, p.name as product_name, l.name as location_name
      FROM stock_batches sb
      JOIN products p ON sb.product_id = p.id
      JOIN locations l ON sb.location_id = l.id
      WHERE sb.product_id = $1
    `;
    let params = [productId];
    
    if (locationId) {
      query += ' AND sb.location_id = $2';
      params.push(locationId);
    }
    
    query += ' ORDER BY sb.created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Update batch quantity
  static async updateBatchQuantity(batchId, quantityChange, movementType) {
    const result = await db.query(
      `UPDATE stock_batches 
       SET remaining_quantity = remaining_quantity + $1, updated_at = NOW()
       WHERE id = $2 AND remaining_quantity + $1 >= 0
       RETURNING *`,
      [quantityChange, batchId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Insufficient batch quantity or batch not found');
    }
    
    return result.rows[0];
  }

  // ==================== STOCK LOCATION MANAGEMENT ====================
  
  // Get stock by location
  static async getStockByLocation(locationId) {
    const result = await db.query(
      `SELECT sl.*, p.name as product_name, p.sku, p.category, p.brand, p.size, p.thickness, p.grade
       FROM stock_locations sl
       JOIN products p ON sl.product_id = p.id
       WHERE sl.location_id = $1
       ORDER BY p.name ASC`,
      [locationId]
    );
    return result.rows;
  }

  // Get stock by product across all locations
  static async getStockByProduct(productId) {
    const result = await db.query(
      `SELECT sl.*, l.name as location_name, l.type as location_type
       FROM stock_locations sl
       JOIN locations l ON sl.location_id = l.id
       WHERE sl.product_id = $1
       ORDER BY l.name ASC`,
      [productId]
    );
    return result.rows;
  }

  // Update stock quantity
  static async updateStockQuantity(productId, locationId, quantityChange, movementType) {
    // First, ensure stock location record exists
    await db.query(
      `INSERT INTO stock_locations (product_id, location_id, current_stock, last_updated)
       VALUES ($1, $2, 0, NOW())
       ON CONFLICT (product_id, location_id) DO NOTHING`,
      [productId, locationId]
    );
    
    // Update stock quantity
    const result = await db.query(
      `UPDATE stock_locations 
       SET current_stock = current_stock + $1, last_updated = NOW()
       WHERE product_id = $2 AND location_id = $3 AND current_stock + $1 >= 0
       RETURNING *`,
      [quantityChange, productId, locationId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Insufficient stock or location not found');
    }
    
    return result.rows[0];
  }

  // ==================== STOCK MOVEMENTS ====================
  
  // Record stock movement
  static async recordMovement(movementData) {
    const {
      product_id, batch_id, from_location_id, to_location_id, movement_type,
      quantity, unit_cost, total_cost, reference_type, reference_id, notes, created_by
    } = movementData;
    
    const result = await db.query(
      `INSERT INTO stock_movements (
        product_id, batch_id, from_location_id, to_location_id, movement_type,
        quantity, unit_cost, total_cost, reference_type, reference_id, notes, created_by
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        product_id, batch_id, from_location_id, to_location_id, movement_type,
        quantity, unit_cost, total_cost, reference_type, reference_id, notes, created_by
      ]
    );
    
    return result.rows[0];
  }

  // Get stock movements
  static async getStockMovements(productId = null, locationId = null, limit = 100) {
    let query = `
      SELECT sm.*, p.name as product_name, p.sku,
             fl.name as from_location_name, tl.name as to_location_name,
             sb.batch_number, u.name as created_by_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN locations fl ON sm.from_location_id = fl.id
      LEFT JOIN locations tl ON sm.to_location_id = tl.id
      LEFT JOIN stock_batches sb ON sm.batch_id = sb.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;
    
    if (productId) {
      paramCount++;
      query += ` AND sm.product_id = $${paramCount}`;
      params.push(productId);
    }
    
    if (locationId) {
      paramCount++;
      query += ` AND (sm.from_location_id = $${paramCount} OR sm.to_location_id = $${paramCount})`;
      params.push(locationId);
    }
    
    query += ` ORDER BY sm.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // ==================== STOCK TRANSFERS ====================
  
  // Create stock transfer
  static async createTransfer(transferData) {
    const {
      from_location_id, to_location_id, requested_by, notes
    } = transferData;
    
    // Generate transfer number
    const transferNumber = `TRF-${Date.now()}`;
    
    const result = await db.query(
      `INSERT INTO stock_transfers (
        transfer_number, from_location_id, to_location_id, requested_by, notes
      ) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [transferNumber, from_location_id, to_location_id, requested_by, notes]
    );
    
    return result.rows[0];
  }

  // Add transfer item
  static async addTransferItem(transferId, itemData) {
    const { product_id, batch_id, quantity, unit_cost, total_cost, notes } = itemData;
    
    const result = await db.query(
      `INSERT INTO stock_transfer_items (
        transfer_id, product_id, batch_id, quantity, unit_cost, total_cost, notes
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [transferId, product_id, batch_id, quantity, unit_cost, total_cost, notes]
    );
    
    return result.rows[0];
  }

  // Get transfer details
  static async getTransfer(transferId) {
    const result = await db.query(
      `SELECT st.*, 
              fl.name as from_location_name, tl.name as to_location_name,
              rb.name as requested_by_name, ab.name as approved_by_name,
              db.name as dispatched_by_name, rcb.name as received_by_name
       FROM stock_transfers st
       JOIN locations fl ON st.from_location_id = fl.id
       JOIN locations tl ON st.to_location_id = tl.id
       LEFT JOIN users rb ON st.requested_by = rb.id
       LEFT JOIN users ab ON st.approved_by = ab.id
       LEFT JOIN users db ON st.dispatched_by = db.id
       LEFT JOIN users rcb ON st.received_by = rcb.id
       WHERE st.id = $1`,
      [transferId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const transfer = result.rows[0];
    
    // Get transfer items
    const itemsResult = await db.query(
      `SELECT sti.*, p.name as product_name, p.sku, sb.batch_number
       FROM stock_transfer_items sti
       JOIN products p ON sti.product_id = p.id
       LEFT JOIN stock_batches sb ON sti.batch_id = sb.id
       WHERE sti.transfer_id = $1`,
      [transferId]
    );
    
    transfer.items = itemsResult.rows;
    return transfer;
  }

  // ==================== DAMAGED STOCK ====================
  
  // Report damaged stock
  static async reportDamagedStock(damageData) {
    const {
      product_id, batch_id, location_id, damage_type, damage_reason,
      quantity, unit_cost, total_loss, reported_by
    } = damageData;
    
    const result = await db.query(
      `INSERT INTO damaged_stock (
        product_id, batch_id, location_id, damage_type, damage_reason,
        quantity, unit_cost, total_loss, reported_by
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        product_id, batch_id, location_id, damage_type, damage_reason,
        quantity, unit_cost, total_loss, reported_by
      ]
    );
    
    return result.rows[0];
  }

  // Get damaged stock
  static async getDamagedStock(locationId = null, status = null) {
    let query = `
      SELECT ds.*, p.name as product_name, p.sku, l.name as location_name,
             sb.batch_number, rb.name as reported_by_name, ab.name as approved_by_name
      FROM damaged_stock ds
      JOIN products p ON ds.product_id = p.id
      JOIN locations l ON ds.location_id = l.id
      LEFT JOIN stock_batches sb ON ds.batch_id = sb.id
      LEFT JOIN users rb ON ds.reported_by = rb.id
      LEFT JOIN users ab ON ds.approved_by = ab.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;
    
    if (locationId) {
      paramCount++;
      query += ` AND ds.location_id = $${paramCount}`;
      params.push(locationId);
    }
    
    if (status) {
      paramCount++;
      query += ` AND ds.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY ds.created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // ==================== STOCK VALUATION ====================
  
  // Calculate stock valuation
  static async calculateStockValuation(productId, locationId, method = 'FIFO') {
    let query;
    
    switch (method) {
      case 'FIFO':
        query = `
          SELECT 
            SUM(remaining_quantity * unit_cost) as total_value,
            SUM(remaining_quantity) as total_quantity,
            CASE 
              WHEN SUM(remaining_quantity) > 0 
              THEN SUM(remaining_quantity * unit_cost) / SUM(remaining_quantity)
              ELSE 0 
            END as average_cost
          FROM stock_batches 
          WHERE product_id = $1 AND location_id = $2 AND remaining_quantity > 0
          ORDER BY created_at ASC
        `;
        break;
      case 'Weighted_Average':
        query = `
          SELECT 
            SUM(remaining_quantity * unit_cost) as total_value,
            SUM(remaining_quantity) as total_quantity,
            CASE 
              WHEN SUM(remaining_quantity) > 0 
              THEN SUM(remaining_quantity * unit_cost) / SUM(remaining_quantity)
              ELSE 0 
            END as average_cost
          FROM stock_batches 
          WHERE product_id = $1 AND location_id = $2 AND remaining_quantity > 0
        `;
        break;
      default:
        throw new Error('Unsupported valuation method');
    }
    
    const result = await db.query(query, [productId, locationId]);
    return result.rows[0];
  }

  // Update stock valuation
  static async updateStockValuation(productId, locationId, method, currentValue, averageCost) {
    const result = await db.query(
      `INSERT INTO stock_valuations (product_id, location_id, valuation_method, current_value, average_cost, last_calculated)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (product_id, location_id, valuation_method)
       DO UPDATE SET 
         current_value = EXCLUDED.current_value,
         average_cost = EXCLUDED.average_cost,
         last_calculated = EXCLUDED.last_calculated,
         updated_at = NOW()
       RETURNING *`,
      [productId, locationId, method, currentValue, averageCost]
    );
    
    return result.rows[0];
  }

  // ==================== ODD SIZE PIECES ====================
  
  // Add odd size piece
  static async addOddSizePiece(pieceData) {
    const {
      product_id, original_batch_id, location_id, piece_size, quantity,
      unit_cost, total_value, created_from, notes
    } = pieceData;
    
    const result = await db.query(
      `INSERT INTO odd_size_pieces (
        product_id, original_batch_id, location_id, piece_size, quantity,
        unit_cost, total_value, created_from, notes
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        product_id, original_batch_id, location_id, piece_size, quantity,
        unit_cost, total_value, created_from, notes
      ]
    );
    
    return result.rows[0];
  }

  // Get odd size pieces
  static async getOddSizePieces(productId = null, locationId = null) {
    let query = `
      SELECT osp.*, p.name as product_name, p.sku, l.name as location_name,
             sb.batch_number
      FROM odd_size_pieces osp
      JOIN products p ON osp.product_id = p.id
      JOIN locations l ON osp.location_id = l.id
      LEFT JOIN stock_batches sb ON osp.original_batch_id = sb.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;
    
    if (productId) {
      paramCount++;
      query += ` AND osp.product_id = $${paramCount}`;
      params.push(productId);
    }
    
    if (locationId) {
      paramCount++;
      query += ` AND osp.location_id = $${paramCount}`;
      params.push(locationId);
    }
    
    query += ' ORDER BY osp.created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // ==================== STOCK ALERTS ====================
  
  // Create stock alert
  static async createStockAlert(alertData) {
    const { product_id, location_id, alert_type, current_stock, threshold_value, message } = alertData;
    
    const result = await db.query(
      `INSERT INTO stock_alerts (product_id, location_id, alert_type, current_stock, threshold_value, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [product_id, location_id, alert_type, current_stock, threshold_value, message]
    );
    
    return result.rows[0];
  }

  // Get stock alerts
  static async getStockAlerts(locationId = null, isRead = null) {
    let query = `
      SELECT sa.*, p.name as product_name, p.sku, l.name as location_name,
             rb.name as resolved_by_name
      FROM stock_alerts sa
      JOIN products p ON sa.product_id = p.id
      JOIN locations l ON sa.location_id = l.id
      LEFT JOIN users rb ON sa.resolved_by = rb.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;
    
    if (locationId) {
      paramCount++;
      query += ` AND sa.location_id = $${paramCount}`;
      params.push(locationId);
    }
    
    if (isRead !== null) {
      paramCount++;
      query += ` AND sa.is_read = $${paramCount}`;
      params.push(isRead);
    }
    
    query += ' ORDER BY sa.created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Check and create low stock alerts
  static async checkLowStockAlerts() {
    const result = await db.query(`
      SELECT sl.*, p.name as product_name, l.name as location_name
      FROM stock_locations sl
      JOIN products p ON sl.product_id = p.id
      JOIN locations l ON sl.location_id = l.id
      WHERE sl.current_stock <= sl.reorder_level
      AND sl.reorder_level > 0
    `);
    
    const alerts = [];
    for (const stock of result.rows) {
      // Check if alert already exists
      const existingAlert = await db.query(
        `SELECT id FROM stock_alerts 
         WHERE product_id = $1 AND location_id = $2 AND alert_type = 'low_stock' AND is_resolved = false`,
        [stock.product_id, stock.location_id]
      );
      
      if (existingAlert.rows.length === 0) {
        const alert = await this.createStockAlert({
          product_id: stock.product_id,
          location_id: stock.location_id,
          alert_type: 'low_stock',
          current_stock: stock.current_stock,
          threshold_value: stock.reorder_level,
          message: `${stock.product_name} is low in stock at ${stock.location_name}. Current: ${stock.current_stock}, Reorder Level: ${stock.reorder_level}`
        });
        alerts.push(alert);
      }
    }
    
    return alerts;
  }
}

module.exports = StockManagement;

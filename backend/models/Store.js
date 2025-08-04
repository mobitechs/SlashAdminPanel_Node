// models/Store.js - Store Model
const db = require('../config/database');

class Store {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.category_id = data.category_id;
    this.description = data.description;
    this.phone_number = data.phone_number;
    this.email = data.email;
    this.address = data.address;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.logo = data.logo;
    this.banner_image = data.banner_image;
    this.rating = data.rating;
    this.total_reviews = data.total_reviews;
    this.normal_discount_percentage = data.normal_discount_percentage;
    this.vip_discount_percentage = data.vip_discount_percentage;
    this.minimum_order_amount = data.minimum_order_amount;
    this.qr_code = data.qr_code;
    this.upi_id = data.upi_id;
    this.google_business_url = data.google_business_url;
    this.is_partner = data.is_partner;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Get all stores with optional filtering
  static async getAll(options = {}) {
    try {
      const {
        search = '',
        category = '',
        is_partner = '',
        is_active = '',
        sortBy = 'created_at',
        sortOrder = 'desc',
        limit = 15,
        offset = 0
      } = options;

      // Build WHERE clause
      let whereConditions = [];
      let queryParams = [];

      if (search) {
        whereConditions.push(`(s.name LIKE ? OR s.email LIKE ? OR s.phone_number LIKE ? OR s.address LIKE ?)`);
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (category) {
        whereConditions.push('s.category_id = ?');
        queryParams.push(category);
      }

      if (is_partner !== '') {
        whereConditions.push('s.is_partner = ?');
        queryParams.push(is_partner === 'true' ? 1 : 0);
      }

      if (is_active !== '') {
        whereConditions.push('s.is_active = ?');
        queryParams.push(is_active === 'true' ? 1 : 0);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Build ORDER BY clause
      const validSortFields = ['name', 'category_name', 'rating', 'created_at', 'total_transactions', 'total_revenue'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Main query with LEFT JOINs for additional data
      const query = `
        SELECT 
          s.*,
          c.name as category_name,
          COALESCE(t.transaction_count, 0) as total_transactions,
          COALESCE(t.total_revenue, 0) as total_revenue,
          COALESCE(t.unique_customers, 0) as unique_customers,
          CASE 
            WHEN t.transaction_count > 0 THEN t.total_revenue / t.transaction_count 
            ELSE 0 
          END as avg_order_value
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN (
          SELECT 
            store_id,
            COUNT(*) as transaction_count,
            SUM(final_amount) as total_revenue,
            COUNT(DISTINCT user_id) as unique_customers
          FROM transactions 
          WHERE payment_status = 'success'
          GROUP BY store_id
        ) t ON s.id = t.store_id
        ${whereClause}
        ORDER BY ${sortField === 'category_name' ? 'c.name' : (sortField === 'total_transactions' ? 't.transaction_count' : (sortField === 'total_revenue' ? 't.total_revenue' : `s.${sortField}`))} ${sortDirection}
        LIMIT ? OFFSET ?
      `;

      const [stores] = await db.execute(query, [...queryParams, parseInt(limit), parseInt(offset)]);
      
      return stores.map(store => new Store(store));
    } catch (error) {
      console.error('Error in Store.getAll:', error);
      throw error;
    }
  }

  // Get total count for pagination
  static async getCount(options = {}) {
    try {
      const {
        search = '',
        category = '',
        is_partner = '',
        is_active = ''
      } = options;

      let whereConditions = [];
      let queryParams = [];

      if (search) {
        whereConditions.push(`(s.name LIKE ? OR s.email LIKE ? OR s.phone_number LIKE ? OR s.address LIKE ?)`);
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (category) {
        whereConditions.push('s.category_id = ?');
        queryParams.push(category);
      }

      if (is_partner !== '') {
        whereConditions.push('s.is_partner = ?');
        queryParams.push(is_partner === 'true' ? 1 : 0);
      }

      if (is_active !== '') {
        whereConditions.push('s.is_active = ?');
        queryParams.push(is_active === 'true' ? 1 : 0);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT COUNT(*) as total
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        ${whereClause}
      `;

      const [[result]] = await db.execute(query, queryParams);
      return result.total;
    } catch (error) {
      console.error('Error in Store.getCount:', error);
      throw error;
    }
  }

  // Get store by ID with related data
  static async getById(id) {
    try {
      const query = `
        SELECT 
          s.*,
          c.name as category_name,
          COALESCE(t.transaction_count, 0) as total_transactions,
          COALESCE(t.total_revenue, 0) as total_revenue,
          COALESCE(t.unique_customers, 0) as unique_customers,
          CASE 
            WHEN t.transaction_count > 0 THEN t.total_revenue / t.transaction_count 
            ELSE 0 
          END as avg_order_value
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN (
          SELECT 
            store_id,
            COUNT(*) as transaction_count,
            SUM(final_amount) as total_revenue,
            COUNT(DISTINCT user_id) as unique_customers
          FROM transactions 
          WHERE payment_status = 'success'
          GROUP BY store_id
        ) t ON s.id = t.store_id
        WHERE s.id = ?
      `;

      const [[store]] = await db.execute(query, [id]);
      
      if (!store) {
        return null;
      }

      return new Store(store);
    } catch (error) {
      console.error('Error in Store.getById:', error);
      throw error;
    }
  }

  // Get store with recent transactions and reviews
  static async getWithDetails(id) {
    try {
      const store = await Store.getById(id);
      if (!store) {
        return null;
      }

      // Get recent transactions
      const transactionsQuery = `
        SELECT 
          t.id,
          t.bill_amount,
          t.final_amount,
          t.payment_status,
          t.created_at,
          CONCAT(u.first_name, ' ', u.last_name) as user_name
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.store_id = ?
        ORDER BY t.created_at DESC
        LIMIT 10
      `;

      // Get recent reviews
      const reviewsQuery = `
        SELECT 
          r.id,
          r.rating,
          r.comment,
          r.created_at,
          CONCAT(u.first_name, ' ', u.last_name) as user_name
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.store_id = ? AND r.is_active = 1
        ORDER BY r.created_at DESC
        LIMIT 5
      `;

      const [recentTransactions] = await db.execute(transactionsQuery, [id]);
      const [recentReviews] = await db.execute(reviewsQuery, [id]);

      return {
        store,
        recentTransactions,
        recentReviews
      };
    } catch (error) {
      console.error('Error in Store.getWithDetails:', error);
      throw error;
    }
  }

  // Create new store
  static async create(storeData) {
    try {
      const {
        name,
        category_id,
        description,
        phone_number,
        email,
        address,
        latitude,
        longitude,
        logo,
        banner_image,
        normal_discount_percentage,
        vip_discount_percentage,
        minimum_order_amount,
        qr_code,
        upi_id,
        google_business_url,
        is_partner = false,
        is_active = true
      } = storeData;

      const query = `
        INSERT INTO stores (
          name, category_id, description, phone_number, email, address,
          latitude, longitude, logo, banner_image,
          normal_discount_percentage, vip_discount_percentage, minimum_order_amount,
          qr_code, upi_id, google_business_url, is_partner, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const [result] = await db.execute(query, [
        name, category_id, description, phone_number, email, address,
        latitude || null, longitude || null, logo || null, banner_image || null,
        normal_discount_percentage, vip_discount_percentage, minimum_order_amount,
        qr_code || null, upi_id || null, google_business_url || null,
        is_partner ? 1 : 0, is_active ? 1 : 0
      ]);

      return await Store.getById(result.insertId);
    } catch (error) {
      console.error('Error in Store.create:', error);
      throw error;
    }
  }

  // Update store
  static async update(id, storeData) {
    try {
      const {
        name,
        category_id,
        description,
        phone_number,
        email,
        address,
        latitude,
        longitude,
        logo,
        banner_image,
        normal_discount_percentage,
        vip_discount_percentage,
        minimum_order_amount,
        qr_code,
        upi_id,
        google_business_url,
        is_partner,
        is_active
      } = storeData;

      const query = `
        UPDATE stores SET
          name = ?, category_id = ?, description = ?, phone_number = ?, email = ?, address = ?,
          latitude = ?, longitude = ?, logo = ?, banner_image = ?,
          normal_discount_percentage = ?, vip_discount_percentage = ?, minimum_order_amount = ?,
          qr_code = ?, upi_id = ?, google_business_url = ?, is_partner = ?, is_active = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      await db.execute(query, [
        name, category_id, description, phone_number, email, address,
        latitude || null, longitude || null, logo || null, banner_image || null,
        normal_discount_percentage, vip_discount_percentage, minimum_order_amount,
        qr_code || null, upi_id || null, google_business_url || null,
        is_partner ? 1 : 0, is_active ? 1 : 0, id
      ]);

      return await Store.getById(id);
    } catch (error) {
      console.error('Error in Store.update:', error);
      throw error;
    }
  }

  // Delete store
  static async delete(id) {
    try {
      // Check if store has transactions
      const [[transactionCount]] = await db.execute(
        'SELECT COUNT(*) as count FROM transactions WHERE store_id = ?',
        [id]
      );

      if (transactionCount.count > 0) {
        throw new Error('Cannot delete store with existing transactions');
      }

      const [result] = await db.execute('DELETE FROM stores WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Store.delete:', error);
      throw error;
    }
  }

  // Update store status
  static async updateStatus(id, isActive) {
    try {
      await db.execute(
        'UPDATE stores SET is_active = ?, updated_at = NOW() WHERE id = ?',
        [isActive ? 1 : 0, id]
      );

      return await Store.getById(id);
    } catch (error) {
      console.error('Error in Store.updateStatus:', error);
      throw error;
    }
  }

  // Get store analytics
  static async getAnalytics() {
    try {
      // Get overall store statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_stores,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_stores,
          COUNT(CASE WHEN is_partner = 1 THEN 1 END) as partner_stores,
          AVG(rating) as avg_rating,
          SUM(total_reviews) as total_reviews
        FROM stores
      `;

      // Get transaction statistics
      const transactionStatsQuery = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(final_amount) as total_revenue,
          COUNT(DISTINCT user_id) as unique_customers,
          COUNT(DISTINCT store_id) as stores_with_transactions
        FROM transactions 
        WHERE payment_status = 'success'
      `;

      const [[storeStats]] = await db.execute(statsQuery);
      const [[transactionStats]] = await db.execute(transactionStatsQuery);

      return {
        ...storeStats,
        ...transactionStats,
        avg_rating: parseFloat(storeStats.avg_rating || 0).toFixed(1)
      };
    } catch (error) {
      console.error('Error in Store.getAnalytics:', error);
      throw error;
    }
  }

  // Get top performing stores
  static async getTopPerforming(limit = 10) {
    try {
      const query = `
        SELECT 
          s.*,
          c.name as category_name,
          COALESCE(t.transaction_count, 0) as total_transactions,
          COALESCE(t.total_revenue, 0) as total_revenue,
          COALESCE(t.unique_customers, 0) as unique_customers
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        LEFT JOIN (
          SELECT 
            store_id,
            COUNT(*) as transaction_count,
            SUM(final_amount) as total_revenue,
            COUNT(DISTINCT user_id) as unique_customers
          FROM transactions 
          WHERE payment_status = 'success'
          GROUP BY store_id
        ) t ON s.id = t.store_id
        WHERE s.is_active = 1
        ORDER BY t.total_revenue DESC, t.transaction_count DESC
        LIMIT ?
      `;

      const [stores] = await db.execute(query, [limit]);
      return stores.map(store => new Store(store));
    } catch (error) {
      console.error('Error in Store.getTopPerforming:', error);
      throw error;
    }
  }

  // Check if store name exists
  static async nameExists(name, excludeId = null) {
    try {
      let query = 'SELECT id FROM stores WHERE name = ?';
      let params = [name];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const [stores] = await db.execute(query, params);
      return stores.length > 0;
    } catch (error) {
      console.error('Error in Store.nameExists:', error);
      throw error;
    }
  }

  // Get stores by category
  static async getByCategory(categoryId) {
    try {
      const query = `
        SELECT s.*, c.name as category_name
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.category_id = ? AND s.is_active = 1
        ORDER BY s.name
      `;

      const [stores] = await db.execute(query, [categoryId]);
      return stores.map(store => new Store(store));
    } catch (error) {
      console.error('Error in Store.getByCategory:', error);
      throw error;
    }
  }

  // Get partner stores
  static async getPartners() {
    try {
      const query = `
        SELECT s.*, c.name as category_name
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_partner = 1 AND s.is_active = 1
        ORDER BY s.name
      `;

      const [stores] = await db.execute(query);
      return stores.map(store => new Store(store));
    } catch (error) {
      console.error('Error in Store.getPartners:', error);
      throw error;
    }
  }

  // Search stores
  static async search(searchTerm) {
    try {
      const query = `
        SELECT s.*, c.name as category_name
        FROM stores s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE (s.name LIKE ? OR s.address LIKE ? OR c.name LIKE ?) 
        AND s.is_active = 1
        ORDER BY s.name
      `;

      const searchPattern = `%${searchTerm}%`;
      const [stores] = await db.execute(query, [searchPattern, searchPattern, searchPattern]);
      return stores.map(store => new Store(store));
    } catch (error) {
      console.error('Error in Store.search:', error);
      throw error;
    }
  }

  // Instance method to save
  async save() {
    try {
      if (this.id) {
        return await Store.update(this.id, this);
      } else {
        return await Store.create(this);
      }
    } catch (error) {
      console.error('Error in Store.save:', error);
      throw error;
    }
  }

  // Instance method to delete
  async remove() {
    try {
      if (!this.id) {
        throw new Error('Cannot delete store without ID');
      }
      return await Store.delete(this.id);
    } catch (error) {
      console.error('Error in Store.remove:', error);
      throw error;
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      category_id: this.category_id,
      description: this.description,
      phone_number: this.phone_number,
      email: this.email,
      address: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
      logo: this.logo,
      banner_image: this.banner_image,
      rating: parseFloat(this.rating || 0),
      total_reviews: parseInt(this.total_reviews || 0),
      normal_discount_percentage: parseFloat(this.normal_discount_percentage || 0),
      vip_discount_percentage: parseFloat(this.vip_discount_percentage || 0),
      minimum_order_amount: parseFloat(this.minimum_order_amount || 0),
      qr_code: this.qr_code,
      upi_id: this.upi_id,
      google_business_url: this.google_business_url,
      is_partner: Boolean(this.is_partner),
      is_active: Boolean(this.is_active),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Store;
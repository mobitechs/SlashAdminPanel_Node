// config/database.js - MAKE SURE THIS IS CORRECT
const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔧 Database Configuration:');
console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`User: ${process.env.DB_USER || 'root'}`);
console.log(`Database: ${process.env.DB_NAME || 'slash_app'}`);
console.log(`Password: ${process.env.DB_PASSWORD ? 'Pratik@10' : '***not set***'}`);

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Pratik@10',
  database: process.env.DB_NAME || 'slash_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4'
};

const pool = mysql.createPool(config);

// Test connection function
const testConnection = async () => {
  let connection;
  try {
    console.log('🔍 Testing database connection...');
    connection = await pool.getConnection();
    console.log('✅ Database connection established successfully');
    
    await connection.execute('SELECT 1 as test');
    console.log('✅ Database query test successful');
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 Found ${tables.length} tables in database`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = { 
  pool, 
  testConnection,
  config 
};
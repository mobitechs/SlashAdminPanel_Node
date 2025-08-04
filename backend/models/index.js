// models/index.js - Central export file for all models
const Admin = require('./Admin');
const User = require('./User');
const Transaction = require('./Transaction');
const Store = require('./Store');

module.exports = {
  Admin,
  User,
  Transaction,
  Store
};
const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login route
router.post('/login', authController.login);

// Verify token route  
router.get('/verify', authenticateToken, authController.verifyToken);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working!' });
});

module.exports = router;
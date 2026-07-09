const express = require('express');
const router = express.Router();
const {
  sendRegisterCode,
  register,
  login,
  verifyLoginCode,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register/send-code', sendRegisterCode);
router.post('/register', register);
router.post('/login', login);
router.post('/verify-login-code', verifyLoginCode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  analyzeCode,
  getReviews,
  getReview,
  deleteReview,
  shareReview,
  getPublicReview
} = require('../controllers/reviewController');

router.post('/analyze', protect, analyzeCode);
router.get('/history', protect, getReviews);
router.get('/public/:token', getPublicReview);
router.get('/:id', protect, getReview);
router.delete('/:id', protect, deleteReview);
router.post('/share/:id', protect, shareReview);

module.exports = router;
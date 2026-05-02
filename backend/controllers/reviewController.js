const Review = require('../models/Review');
const crypto = require('crypto');
const axios = require('axios');

const AI_SERVICE_URL = 'http://localhost:8000';

const analyzeCode = async (req, res) => {
  const { code, language, title, sourceType, githubRepo } = req.body;

  try {
    console.log('Sending code to AI service...');
    
    // Call YOUR OWN AI API
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze`, {
      code,
      language: language || 'unknown'
    }, {
      timeout: 130000 // 2 min timeout for AI processing
    });

    const reviewData = aiResponse.data;
    console.log('AI response received. Score:', reviewData.overallScore);

    // Save to MongoDB
    const review = await Review.create({
      user: req.user._id,
      title: title || 'Untitled Review',
      originalCode: code,
      language,
      suggestions: reviewData.suggestions,
      overallScore: reviewData.overallScore,
      summary: reviewData.summary,
      sourceType: sourceType || 'paste',
      githubRepo: githubRepo || null,
      shareableLink: crypto.randomBytes(16).toString('hex')
    });

    res.status(201).json(review);

  } catch (error) {
    console.error('Review error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        message: 'AI service is not running. Please start the AI service.' 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const shareReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    review.isPublic = true;
    await review.save();
    res.json({ shareableLink: review.shareableLink });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { analyzeCode, getReviews, getReview, deleteReview, shareReview };
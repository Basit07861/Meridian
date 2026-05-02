const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
  line: Number,           // Which line has the issue
  severity: {
    type: String,
    enum: ['high', 'medium', 'low']  // Only these 3 values allowed
  },
  issue: String,          // What the problem is
  suggestion: String,     // How to fix it
  refactoredCode: String  // The improved code
});

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',          // Links to User model
    required: true
  },
  title: {
    type: String,
    default: 'Untitled Review'
  },
  originalCode: {
    type: String,
    required: true        // The code that was submitted
  },
  language: {
    type: String,         // javascript, python, java etc
    default: 'unknown'
  },
  suggestions: [SuggestionSchema],  // Array of AI suggestions
  overallScore: {
    type: Number,         // 0-100 score
    default: 0
  },
  summary: {
    type: String          // Overall AI summary
  },
  shareableLink: {
    type: String,         // Unique link for sharing
    unique: true,
    sparse: true
  },
  isPublic: {
    type: Boolean,
    default: false        // Private by default
  },
  sourceType: {
    type: String,
    enum: ['paste', 'upload', 'github'],  // How code was submitted
    default: 'paste'
  },
  githubRepo: {
    type: String          // If from GitHub, store repo name
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    // Not required because GitHub login users won't have a password
  },
  githubId: {
    type: String,
    // Only filled for GitHub login users
  },
  githubUsername: {
    type: String,
  },
  githubToken: {
  type: String  // Stored temporarily in session
},
  avatar: {
    type: String, // Profile picture URL
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
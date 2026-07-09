const mongoose = require('mongoose');

const PendingRegistrationSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 40,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address.'],
  },
  passwordHash: {
    type: String,
    required: true,
  },
  codeHash: {
    type: String,
    required: true,
  },
  codeExpiresAt: {
    type: Date,
    required: true,
  },
  codeAttempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60,
  },
});

PendingRegistrationSchema.index({ email: 1 });
PendingRegistrationSchema.index({ username: 1 });

module.exports = mongoose.model('PendingRegistration', PendingRegistrationSchema);

const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendRegistrationCodeEmail, sendLoginCodeEmail, sendPasswordResetEmail } = require('../utils/emailService');

const ALLOWED_AVATARS = User.ALLOWED_AVATARS || ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_CODE_EXPIRY_MINUTES = 10;
const REGISTRATION_CODE_EXPIRY_MINUTES = 10;
const MAX_LOGIN_CODE_ATTEMPTS = 5;
const MAX_REGISTRATION_CODE_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY_MINUTES = 15;

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const getAccountType = (user) => (user.githubId ? 'github' : 'email');

const cleanString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const maskEmail = (email) => {
  if (!email || !email.includes('@')) {
    return email || '';
  }

  const [name, domain] = email.split('@');
  const visibleName = name.length <= 2 ? name[0] || '*' : `${name[0]}${'*'.repeat(Math.min(name.length - 2, 5))}${name[name.length - 1]}`;
  return `${visibleName}@${domain}`;
};

const generateLoginCode = () => crypto.randomInt(100000, 1000000).toString();

const generateRegistrationCode = () => crypto.randomInt(100000, 1000000).toString();

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const clearLoginCode = (user) => {
  user.loginCodeHash = undefined;
  user.loginCodeExpiresAt = undefined;
  user.loginCodeAttempts = 0;
};

const clearPasswordResetToken = (user) => {
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
};

const findUserByLoginIdentifier = async (identifier) => {
  const cleanIdentifier = cleanString(identifier);

  if (!cleanIdentifier) {
    return null;
  }

  const query = EMAIL_REGEX.test(cleanIdentifier)
    ? { email: cleanIdentifier.toLowerCase() }
    : { username: cleanIdentifier };

  return User.findOne(query);
};

const buildUserResponse = (user, includeToken = false) => {
  const response = {
    _id: user._id,
    username: user.username,
    displayName: user.displayName || user.username || user.githubUsername || 'User',
    email: user.email,
    avatar: user.avatar,
    selectedAvatar: user.githubId ? null : (user.selectedAvatar || 'avatar-1'),
    bio: user.bio || '',
    githubUsername: user.githubUsername,
    accountType: getAccountType(user),
    githubConnected: Boolean(user.githubId),
    createdAt: user.createdAt,
  };

  if (includeToken) {
    response.token = generateToken(user._id);
  }

  return response;
};

const handleAuthError = (error, res, fallbackMessage = 'Authentication request failed.') => {
  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];

    if (duplicateField === 'email') {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    if (duplicateField === 'username') {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    return res.status(400).json({ message: 'User already exists.' });
  }

  if (error.name === 'ValidationError') {
    const firstMessage = Object.values(error.errors || {})[0]?.message;
    return res.status(400).json({ message: firstMessage || 'Invalid user data.' });
  }

  console.error('Auth error:', error.message);
  return res.status(500).json({ message: fallbackMessage });
};

const validateRegisterInput = ({ username, email, password, confirmPassword }, requireConfirmPassword = true) => {
  const cleanUsername = cleanString(username);
  const cleanEmail = cleanString(email).toLowerCase();

  if (!cleanUsername || !cleanEmail || typeof password !== 'string') {
    return 'Username, email, and password are required.';
  }

  if (requireConfirmPassword && typeof confirmPassword !== 'string') {
    return 'Confirm password is required.';
  }

  if (cleanUsername.length < 3 || cleanUsername.length > 40) {
    return 'Username must be between 3 and 40 characters.';
  }

  if (!/^[A-Za-z0-9_.-]+$/.test(cleanUsername)) {
    return 'Username can only contain letters, numbers, dots, underscores, and hyphens.';
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    return 'Please enter a valid email address.';
  }

  if (password.length < 6 || password.length > 72) {
    return 'Password must be between 6 and 72 characters.';
  }

  if (requireConfirmPassword && password !== confirmPassword) {
    return 'Password and confirm password do not match.';
  }

  return null;
};

// REGISTRATION STEP 1: validate details and send email verification code
const sendRegisterCode = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  const validationError = validateRegisterInput({ username, email, password, confirmPassword });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const cleanUsername = cleanString(username);
  const cleanEmail = cleanString(email).toLowerCase();

  try {
    const userExists = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (userExists) {
      return res.status(400).json({
        message: userExists.email === cleanEmail ? 'Email is already registered.' : 'Username is already taken.',
      });
    }

    const registrationCode = generateRegistrationCode();
    const [passwordHash, codeHash] = await Promise.all([
      bcrypt.hash(password, 10),
      bcrypt.hash(registrationCode, 10),
    ]);

    await PendingRegistration.deleteMany({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    await PendingRegistration.create({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      codeHash,
      codeExpiresAt: new Date(Date.now() + REGISTRATION_CODE_EXPIRY_MINUTES * 60 * 1000),
      codeAttempts: 0,
    });

    const emailResult = await sendRegistrationCodeEmail({
      to: cleanEmail,
      username: cleanUsername,
      code: registrationCode,
    });

    return res.json({
      requiresEmailCode: true,
      message: emailResult.devFallback
        ? 'Registration code generated. SMTP fallback is active, so check the backend console for the code.'
        : 'Registration verification code sent to your email.',
      email: maskEmail(cleanEmail),
      username: cleanUsername,
      devFallback: emailResult.devFallback,
    });
  } catch (error) {
    return handleAuthError(error, res, 'Failed to send registration verification code.');
  }
};

// REGISTRATION STEP 2: verify code and create account
const register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  const code = cleanString(req.body.code);
  const validationError = validateRegisterInput({ username, email, password, confirmPassword });

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: 'Registration verification code must be 6 digits.' });
  }

  const cleanUsername = cleanString(username);
  const cleanEmail = cleanString(email).toLowerCase();

  try {
    const userExists = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (userExists) {
      await PendingRegistration.deleteMany({
        $or: [{ email: cleanEmail }, { username: cleanUsername }],
      });

      return res.status(400).json({
        message: userExists.email === cleanEmail ? 'Email is already registered.' : 'Username is already taken.',
      });
    }

    const pendingRegistration = await PendingRegistration.findOne({
      email: cleanEmail,
      username: cleanUsername,
    });

    if (!pendingRegistration) {
      return res.status(400).json({ message: 'Registration code is invalid or expired. Please request a new code.' });
    }

    if (pendingRegistration.codeExpiresAt.getTime() < Date.now()) {
      await pendingRegistration.deleteOne();
      return res.status(400).json({ message: 'Registration code has expired. Please request a new code.' });
    }

    if (pendingRegistration.codeAttempts >= MAX_REGISTRATION_CODE_ATTEMPTS) {
      await pendingRegistration.deleteOne();
      return res.status(429).json({ message: 'Too many invalid registration code attempts. Please request a new code.' });
    }

    const isCodeValid = await bcrypt.compare(code, pendingRegistration.codeHash);

    if (!isCodeValid) {
      pendingRegistration.codeAttempts += 1;
      await pendingRegistration.save({ validateBeforeSave: false });
      return res.status(400).json({
        message: `Invalid registration code. ${Math.max(MAX_REGISTRATION_CODE_ATTEMPTS - pendingRegistration.codeAttempts, 0)} attempt(s) left.`,
      });
    }

    const user = await User.create({
      username: cleanUsername,
      displayName: cleanUsername,
      email: cleanEmail,
      password: pendingRegistration.passwordHash,
      selectedAvatar: 'avatar-1',
      bio: '',
    });

    await PendingRegistration.deleteMany({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    return res.status(201).json(buildUserResponse(user, true));
  } catch (error) {
    return handleAuthError(error, res, 'Failed to register user.');
  }
};

// LOGIN STEP 1: verify email/username + password and send authentication code
const login = async (req, res) => {
  const identifier = cleanString(req.body.identifier || req.body.email);
  const { password } = req.body;

  if (!identifier || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email/username and password are required.' });
  }

  try {
    const user = await findUserByLoginIdentifier(identifier);

    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid email/username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email/username or password' });
    }

    const loginCode = generateLoginCode();
    const salt = await bcrypt.genSalt(10);

    user.loginCodeHash = await bcrypt.hash(loginCode, salt);
    user.loginCodeExpiresAt = new Date(Date.now() + LOGIN_CODE_EXPIRY_MINUTES * 60 * 1000);
    user.loginCodeAttempts = 0;
    await user.save({ validateBeforeSave: false });

    const emailResult = await sendLoginCodeEmail({
      to: user.email,
      username: user.displayName || user.username,
      code: loginCode,
    });

    return res.json({
      requiresEmailCode: true,
      message: emailResult.devFallback
        ? 'Authentication code generated. SMTP is not configured, so check the backend console for the code.'
        : 'Authentication code sent to your email.',
      email: maskEmail(user.email),
      identifier,
    });
  } catch (error) {
    return handleAuthError(error, res, 'Failed to send authentication code.');
  }
};

// LOGIN STEP 2: verify authentication code and issue JWT token
const verifyLoginCode = async (req, res) => {
  const identifier = cleanString(req.body.identifier || req.body.email);
  const code = cleanString(req.body.code);

  if (!identifier || !code) {
    return res.status(400).json({ message: 'Email/username and authentication code are required.' });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: 'Authentication code must be 6 digits.' });
  }

  try {
    const user = await findUserByLoginIdentifier(identifier);

    if (!user || !user.loginCodeHash || !user.loginCodeExpiresAt) {
      return res.status(400).json({ message: 'Authentication code is invalid or expired. Please login again.' });
    }

    if (user.loginCodeExpiresAt.getTime() < Date.now()) {
      clearLoginCode(user);
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ message: 'Authentication code expired. Please login again.' });
    }

    if (user.loginCodeAttempts >= MAX_LOGIN_CODE_ATTEMPTS) {
      clearLoginCode(user);
      await user.save({ validateBeforeSave: false });
      return res.status(429).json({ message: 'Too many wrong code attempts. Please login again.' });
    }

    const isCodeValid = await bcrypt.compare(code, user.loginCodeHash);

    if (!isCodeValid) {
      user.loginCodeAttempts += 1;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({
        message: `Invalid authentication code. ${Math.max(MAX_LOGIN_CODE_ATTEMPTS - user.loginCodeAttempts, 0)} attempt(s) left.`,
      });
    }

    clearLoginCode(user);
    await user.save({ validateBeforeSave: false });

    return res.json(buildUserResponse(user, true));
  } catch (error) {
    return handleAuthError(error, res, 'Failed to verify authentication code.');
  }
};

// FORGOT PASSWORD: create reset token and email reset link
const forgotPassword = async (req, res) => {
  const identifier = cleanString(req.body.identifier || req.body.email);

  if (!identifier) {
    return res.status(400).json({ message: 'Email or username is required.' });
  }

  try {
    const user = await findUserByLoginIdentifier(identifier);

    // Do not reveal whether an unknown email/username exists.
    if (!user) {
      return res.json({
        message: 'If an email/password account exists for this email or username, a reset link has been sent.',
      });
    }

    if (user.githubId && !user.password) {
      return res.status(400).json({
        message: 'This account uses GitHub login. Please reset your password through GitHub.',
      });
    }

    const resetToken = generateResetToken();
    user.resetPasswordTokenHash = hashToken(resetToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      username: user.displayName || user.username,
      resetLink,
      expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
    });

    return res.json({
      message: emailResult.devFallback
        ? 'Password reset link generated. SMTP is not configured, so check the backend console for the reset link.'
        : 'Password reset link sent to your registered email.',
      email: maskEmail(user.email),
      devFallback: emailResult.devFallback,
    });
  } catch (error) {
    return handleAuthError(error, res, 'Failed to create password reset link.');
  }
};

// RESET PASSWORD: verify token and set new password
const resetPassword = async (req, res) => {
  const token = cleanString(req.params.token || req.body.token);
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Password reset token is required.' });
  }

  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'New password is required.' });
  }

  if (password.length < 6 || password.length > 72) {
    return res.status(400).json({ message: 'Password must be between 6 and 72 characters.' });
  }

  try {
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset link is invalid or expired.' });
    }

    if (user.githubId && !user.password) {
      clearPasswordResetToken(user);
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ message: 'This account uses GitHub login. Please reset your password through GitHub.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    clearPasswordResetToken(user);
    clearLoginCode(user);
    await user.save({ validateBeforeSave: false });

    return res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    return handleAuthError(error, res, 'Failed to reset password.');
  }
};

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -githubToken -loginCodeHash -resetPasswordTokenHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(buildUserResponse(user));
  } catch (error) {
    return handleAuthError(error, res, 'Failed to fetch profile.');
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { displayName, bio, selectedAvatar } = req.body;

    if (displayName !== undefined) {
      if (typeof displayName !== 'string') {
        return res.status(400).json({ message: 'Display name must be text.' });
      }

      const cleanDisplayName = displayName.trim();

      if (!cleanDisplayName) {
        return res.status(400).json({ message: 'Display name cannot be empty.' });
      }

      if (cleanDisplayName.length > 60) {
        return res.status(400).json({ message: 'Display name must be 60 characters or less.' });
      }

      user.displayName = cleanDisplayName;
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return res.status(400).json({ message: 'Bio must be text.' });
      }

      const cleanBio = bio.trim();

      if (cleanBio.length > 180) {
        return res.status(400).json({ message: 'Bio must be 180 characters or less.' });
      }

      user.bio = cleanBio;
    }

    // GitHub users keep their GitHub profile picture only.
    // Email/password users can choose from preset Meridian avatars.
    if (!user.githubId && selectedAvatar !== undefined) {
      if (typeof selectedAvatar !== 'string' || !ALLOWED_AVATARS.includes(selectedAvatar)) {
        return res.status(400).json({ message: 'Invalid avatar selection.' });
      }

      user.selectedAvatar = selectedAvatar;
    }

    await user.save();

    return res.json(buildUserResponse(user));
  } catch (error) {
    return handleAuthError(error, res, 'Failed to update profile.');
  }
};

module.exports = {
  sendRegisterCode,
  register,
  login,
  verifyLoginCode,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
};

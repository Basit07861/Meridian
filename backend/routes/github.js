const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const {
  getRepos,
  getRepoContents,
  getFileContent,
} = require('../controllers/githubController');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Redirect to GitHub login. prompt=select_account helps during testing/account switching.
router.get('/login', passport.authenticate('github', {
  scope: ['user:email', 'repo'],
  prompt: 'select_account',
}));

// GitHub callback
router.get('/callback',
  passport.authenticate('github', {
    failureRedirect: `${FRONTEND_URL}/login`,
    session: true,
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.redirect(`${FRONTEND_URL}/github/callback?token=${token}`);
    } catch (error) {
      console.error('GitHub callback error:', error.message);
      res.redirect(`${FRONTEND_URL}/login`);
    }
  }
);

router.get('/repos', protect, getRepos);
router.get('/repos/:owner/:repo/contents', protect, getRepoContents);
router.get('/repos/:owner/:repo/file', protect, getFileContent);

module.exports = router;

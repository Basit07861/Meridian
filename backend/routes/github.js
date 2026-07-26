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
  session: false,
}));

// GitHub callback
router.get('/callback', (req, res, next) => {
  passport.authenticate('github', { session: false }, (error, user) => {
    if (error) {
      console.error('GitHub callback authentication error:', error.message);
      return res.redirect(`${FRONTEND_URL}/login?githubError=oauth_failed`);
    }

    if (!user) {
      console.error('GitHub callback authentication failed: no user returned.');
      return res.redirect(`${FRONTEND_URL}/login?githubError=oauth_failed`);
    }

    try {
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.redirect(`${FRONTEND_URL}/github/callback?token=${token}`);
    } catch (jwtError) {
      console.error('GitHub callback token error:', jwtError.message);
      return res.redirect(`${FRONTEND_URL}/login?githubError=token_failed`);
    }
  })(req, res, next);
});

router.get('/repos', protect, getRepos);
router.get('/repos/:owner/:repo/contents', protect, getRepoContents);
router.get('/repos/:owner/:repo/file', protect, getFileContent);

module.exports = router;

const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const {
  getRepos,
  getRepoContents,
  getFileContent
} = require('../controllers/githubController');

// Redirect to GitHub login
router.get('/login', passport.authenticate('github', {
  scope: ['user:email', 'repo']
}));

// GitHub callback
router.get('/callback',
  passport.authenticate('github', {
    failureRedirect: 'http://localhost:5173/login',
    session: true
  }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Send only token to frontend (not user data in URL)
      res.redirect(`http://localhost:5173/github/callback?token=${token}`);
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.redirect('http://localhost:5173/login');
    }
  }
);

router.get('/repos', protect, getRepos);
router.get('/repos/:owner/:repo/contents', protect, getRepoContents);
router.get('/repos/:owner/:repo/file', protect, getFileContent);

module.exports = router;
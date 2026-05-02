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

      const userData = {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        githubUsername: req.user.githubUsername
      };

      // Send token and user data to frontend via URL params
      const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
      res.redirect(
        `http://localhost:5173/github/callback?token=${token}&user=${userDataEncoded}`
      );
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
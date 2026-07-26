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

const getBackendBaseUrl = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto || req.protocol;

  return `${protocol}://${req.get('host')}`;
};

const isConnectCallback = (state) => {
  if (!state || typeof state !== 'string') return false;

  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    return decoded?.mode === 'connect' && Boolean(decoded?.userId);
  } catch (error) {
    return false;
  }
};

// Redirect to GitHub login. prompt=select_account helps during testing/account switching.
router.get('/login', passport.authenticate('github', {
  scope: ['user:email', 'repo'],
  prompt: 'select_account',
}));

// Protected route used by email/password users to start GitHub account linking.
router.get('/connect-url', protect, (req, res) => {
  const state = jwt.sign(
    {
      mode: 'connect',
      userId: req.user._id.toString(),
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  return res.json({
    url: `${getBackendBaseUrl(req)}/api/github/connect?state=${encodeURIComponent(state)}`,
  });
});

// Opens GitHub authorization for connecting GitHub to an already logged-in Meridian account.
router.get('/connect', (req, res, next) => {
  const { state } = req.query;

  if (!isConnectCallback(state)) {
    return res.redirect(`${FRONTEND_URL}/profile?github=connect_failed`);
  }

  return passport.authenticate('github', {
    scope: ['user:email', 'repo'],
    prompt: 'select_account',
    state,
    session: true,
  })(req, res, next);
});

const getGithubFailureRedirect = (connectFlow, error, info) => {
  if (!connectFlow) {
    return `${FRONTEND_URL}/login?github=error`;
  }

  const failureCode = error?.code || info?.code;

  if (failureCode === 'GITHUB_ALREADY_LINKED') {
    return `${FRONTEND_URL}/profile?github=already_linked`;
  }

  if (failureCode === 'MERIDIAN_ACCOUNT_ALREADY_LINKED') {
    return `${FRONTEND_URL}/profile?github=account_already_linked`;
  }

  return `${FRONTEND_URL}/profile?github=connect_failed`;
};

// GitHub callback for both login/signup and profile account linking.
router.get('/callback', (req, res, next) => {
  const connectFlow = isConnectCallback(req.query.state);

  passport.authenticate('github', { session: true }, (error, user, info) => {
    if (error) {
      console.error('GitHub callback error:', error.message);
      return res.redirect(getGithubFailureRedirect(connectFlow, error, info));
    }

    if (!user) {
      console.error('GitHub callback failed:', info?.message || 'No user returned from GitHub OAuth.');
      return res.redirect(getGithubFailureRedirect(connectFlow, error, info));
    }

    req.logIn(user, (loginError) => {
      if (loginError) {
        console.error('GitHub session error:', loginError.message);
        return res.redirect(getGithubFailureRedirect(connectFlow, loginError, info));
      }

      if (info?.mode === 'connect') {
        return res.redirect(`${FRONTEND_URL}/profile?github=connected`);
      }

      try {
        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.redirect(`${FRONTEND_URL}/github/callback?token=${token}`);
      } catch (tokenError) {
        console.error('GitHub JWT creation error:', tokenError.message);
        return res.redirect(`${FRONTEND_URL}/login?github=error`);
      }
    });
  })(req, res, next);
});

router.get('/repos', protect, getRepos);
router.get('/repos/:owner/:repo/contents', protect, getRepoContents);
router.get('/repos/:owner/:repo/file', protect, getFileContent);

module.exports = router;

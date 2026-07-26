const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getGithubEmail = (profile) => {
  const emails = Array.isArray(profile.emails) ? profile.emails : [];
  const primaryVerified = emails.find((email) => email.primary && email.verified && email.value);
  const verified = emails.find((email) => email.verified && email.value);
  const firstAvailable = emails.find((email) => email.value);

  return String(
    primaryVerified?.value
    || verified?.value
    || firstAvailable?.value
    || `github-${profile.id}@users.noreply.github.com`
  ).toLowerCase();
};

const getGithubUsername = (profile) => {
  return String(profile.username || profile.displayName || `github-${profile.id}`).trim();
};

const getSafeUsernameBase = (profile) => {
  const rawUsername = getGithubUsername(profile);
  const safeUsername = rawUsername
    .replace(/[^A-Za-z0-9_.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[_.-]+|[_.-]+$/g, '')
    .slice(0, 34);

  return safeUsername.length >= 3 ? safeUsername : `github-${profile.id}`.slice(0, 34);
};

const createUniqueUsername = async (profile) => {
  const baseUsername = getSafeUsernameBase(profile);
  let username = baseUsername.slice(0, 40);
  let counter = 0;

  while (await User.findOne({ username })) {
    counter += 1;
    const suffix = counter === 1
      ? `-${String(profile.id).slice(-6)}`
      : `-${String(profile.id).slice(-6)}-${counter}`;

    username = `${baseUsername.slice(0, Math.max(3, 40 - suffix.length))}${suffix}`;
  }

  return username;
};

const getConnectState = (req) => {
  const state = req.query?.state;

  if (!state || typeof state !== 'string') {
    return null;
  }

  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);

    if (decoded?.mode === 'connect' && decoded?.userId) {
      return decoded;
    }
  } catch (error) {
    console.warn('Invalid GitHub connect state:', error.message);
  }

  return null;
};

const linkGithubToUser = async (user, accessToken, profile) => {
  const githubId = String(profile.id);
  const githubUsername = getGithubUsername(profile);
  const githubAvatar = profile.photos?.[0]?.value || user.avatar;

  const existingGithubUser = await User.findOne({ githubId });

  if (existingGithubUser && String(existingGithubUser._id) !== String(user._id)) {
    const error = new Error('This GitHub account is already linked to another Meridian account.');
    error.code = 'GITHUB_ALREADY_LINKED';
    throw error;
  }

  if (user.githubId && String(user.githubId) !== githubId) {
    const error = new Error('This Meridian account is already linked to another GitHub account.');
    error.code = 'MERIDIAN_ACCOUNT_ALREADY_LINKED';
    throw error;
  }

  user.githubId = githubId;
  user.githubUsername = githubUsername;
  user.githubToken = accessToken;
  user.avatar = githubAvatar;

  if (!user.displayName) {
    user.displayName = user.username || githubUsername;
  }

  await user.save({ validateBeforeSave: false });
  return user;
};

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
  scope: ['user:email', 'repo'],
  passReqToCallback: true,
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    const connectState = getConnectState(req);

    if (connectState) {
      const currentUser = await User.findById(connectState.userId);

      if (!currentUser) {
        return done(null, false, {
          mode: 'connect',
          message: 'Meridian account not found for GitHub connection.',
        });
      }

      const connectedUser = await linkGithubToUser(currentUser, accessToken, profile);
      return done(null, connectedUser, { mode: 'connect' });
    }

    let user = await User.findOne({ githubId: String(profile.id) });

    if (user) {
      user.githubToken = accessToken;
      user.githubUsername = getGithubUsername(profile);
      user.avatar = profile.photos?.[0]?.value || user.avatar;
      await user.save({ validateBeforeSave: false });
      return done(null, user, { mode: 'login' });
    }

    const githubEmail = getGithubEmail(profile);
    const existingEmailUser = await User.findOne({ email: githubEmail });

    if (existingEmailUser) {
      const linkedUser = await linkGithubToUser(existingEmailUser, accessToken, profile);
      return done(null, linkedUser, { mode: 'login' });
    }

    const username = await createUniqueUsername(profile);

    user = await User.create({
      githubId: String(profile.id),
      username,
      displayName: profile.displayName || username,
      email: githubEmail,
      avatar: profile.photos?.[0]?.value,
      githubUsername: getGithubUsername(profile),
      githubToken: accessToken,
      selectedAvatar: 'avatar-1',
      bio: '',
    });

    return done(null, user, { mode: 'login' });
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

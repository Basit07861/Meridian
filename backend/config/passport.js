const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanUsername = (value, fallback) => {
  const raw = String(value || fallback || 'github-user').trim();
  const cleaned = raw
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9_.-]/g, '')
    .slice(0, 40);

  if (cleaned.length >= 3) {
    return cleaned;
  }

  return `github-${cleaned || 'user'}`.slice(0, 40);
};

const getPrimaryEmail = (profile) => {
  const primaryEmail = profile.emails?.find((item) => item?.value)?.value;

  if (primaryEmail && EMAIL_REGEX.test(primaryEmail)) {
    return primaryEmail.toLowerCase();
  }

  // Some GitHub accounts keep their email private. The User model requires an email,
  // so create a stable fallback that will not collide with a normal email account.
  return `github-${profile.id}@users.noreply.github.com`;
};

const getAvatar = (profile) => profile.photos?.[0]?.value || '';

const getDisplayName = (profile, username) => {
  const displayName = String(profile.displayName || '').trim();
  return displayName || username;
};

const buildUniqueUsername = async (preferredUsername, githubId) => {
  const base = cleanUsername(preferredUsername, `github-${githubId}`);
  let candidate = base;
  let counter = 1;

  while (await User.exists({ username: candidate })) {
    const suffix = `-${counter}`;
    candidate = `${base.slice(0, 40 - suffix.length)}${suffix}`;
    counter += 1;
  }

  return candidate;
};

const updateGithubFields = async (user, { accessToken, profile, githubEmail }) => {
  const githubUsername = cleanUsername(profile.username, `github-${profile.id}`);

  user.githubId = profile.id;
  user.githubToken = accessToken;
  user.githubUsername = githubUsername;
  user.avatar = getAvatar(profile) || user.avatar;

  if (!user.displayName) {
    user.displayName = getDisplayName(profile, user.username || githubUsername);
  }

  if (!user.email && githubEmail) {
    user.email = githubEmail;
  }

  await user.save({ validateBeforeSave: false });
  return user;
};

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
  scope: ['user:email', 'repo'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const githubUsername = cleanUsername(profile.username, `github-${profile.id}`);
    const githubEmail = getPrimaryEmail(profile);

    // Existing GitHub user: update token/avatar and continue.
    const existingGithubUser = await User.findOne({ githubId: profile.id });
    if (existingGithubUser) {
      const updatedUser = await updateGithubFields(existingGithubUser, {
        accessToken,
        profile,
        githubEmail,
      });
      return done(null, updatedUser);
    }

    // Existing email account: link GitHub instead of creating a duplicate user.
    const existingEmailUser = await User.findOne({ email: githubEmail });
    if (existingEmailUser) {
      const updatedUser = await updateGithubFields(existingEmailUser, {
        accessToken,
        profile,
        githubEmail,
      });
      return done(null, updatedUser);
    }

    // New GitHub user: generate a unique username to avoid duplicate-key crashes.
    const username = await buildUniqueUsername(githubUsername, profile.id);

    const user = await User.create({
      githubId: profile.id,
      username,
      displayName: getDisplayName(profile, username),
      email: githubEmail,
      avatar: getAvatar(profile),
      githubUsername,
      githubToken: accessToken,
      selectedAvatar: 'avatar-1',
      bio: '',
    });

    return done(null, user);
  } catch (error) {
    console.error('GitHub strategy error:', error.message);
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

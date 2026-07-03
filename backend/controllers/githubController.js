const axios = require('axios');

const GITHUB_API_BASE = 'https://api.github.com';
const MAX_FILE_SIZE_BYTES = 300000;

const getGithubToken = (req) => req.user?.githubToken;

const buildGithubHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github.v3+json',
});

const sanitizePath = (path = '') => {
  if (typeof path !== 'string') {
    return '';
  }

  const cleanPath = path.trim();

  if (cleanPath.includes('..')) {
    return null;
  }

  return cleanPath;
};

const handleGithubError = (error, res, fallbackMessage = 'GitHub request failed.') => {
  console.error('GitHub API error:', error.response?.data?.message || error.message);

  if (error.response?.status === 401 || error.response?.status === 403) {
    return res.status(error.response.status).json({
      message: 'GitHub access failed. Please login with GitHub again.',
    });
  }

  if (error.response?.status === 404) {
    return res.status(404).json({ message: 'GitHub repository, path, or file was not found.' });
  }

  if (error.response?.status === 429 || error.response?.status === 403) {
    return res.status(429).json({ message: 'GitHub API rate limit reached. Please try again later.' });
  }

  return res.status(500).json({ message: fallbackMessage });
};

const requireGithubToken = (req, res) => {
  const githubToken = getGithubToken(req);

  if (!githubToken) {
    res.status(401).json({ message: 'GitHub token not found. Please login with GitHub first.' });
    return null;
  }

  return githubToken;
};

const getRepos = async (req, res) => {
  const githubToken = requireGithubToken(req, res);
  if (!githubToken) return;

  try {
    const response = await axios.get(`${GITHUB_API_BASE}/user/repos`, {
      headers: buildGithubHeaders(githubToken),
      params: { sort: 'updated', per_page: 30 },
      timeout: 20000,
    });

    return res.json(response.data);
  } catch (error) {
    return handleGithubError(error, res, 'Failed to fetch repositories.');
  }
};

const getRepoContents = async (req, res) => {
  const githubToken = requireGithubToken(req, res);
  if (!githubToken) return;

  const { owner, repo } = req.params;
  const cleanPath = sanitizePath(req.query.path || '');

  if (cleanPath === null) {
    return res.status(400).json({ message: 'Invalid GitHub path.' });
  }

  try {
    const encodedPath = cleanPath
      .split('/')
      .filter(Boolean)
      .map(encodeURIComponent)
      .join('/');

    const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;

    const response = await axios.get(url, {
      headers: buildGithubHeaders(githubToken),
      timeout: 20000,
    });

    return res.json(response.data);
  } catch (error) {
    return handleGithubError(error, res, 'Failed to fetch repository contents.');
  }
};

const getFileContent = async (req, res) => {
  const githubToken = requireGithubToken(req, res);
  if (!githubToken) return;

  const { owner, repo } = req.params;
  const cleanPath = sanitizePath(req.query.path);

  if (!cleanPath) {
    return res.status(400).json({ message: 'File path is required.' });
  }

  if (cleanPath === null) {
    return res.status(400).json({ message: 'Invalid GitHub file path.' });
  }

  try {
    const encodedPath = cleanPath
      .split('/')
      .filter(Boolean)
      .map(encodeURIComponent)
      .join('/');

    const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;

    const response = await axios.get(url, {
      headers: buildGithubHeaders(githubToken),
      timeout: 20000,
    });

    if (Array.isArray(response.data) || response.data.type !== 'file') {
      return res.status(400).json({ message: 'Selected GitHub path is not a file.' });
    }

    if (Number(response.data.size || 0) > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({ message: 'Selected GitHub file is too large to analyze.' });
    }

    const content = Buffer.from(response.data.content || '', 'base64').toString('utf-8');
    return res.json({ content, name: response.data.name, path: response.data.path });
  } catch (error) {
    return handleGithubError(error, res, 'Failed to fetch GitHub file content.');
  }
};

module.exports = { getRepos, getRepoContents, getFileContent };

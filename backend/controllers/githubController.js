const axios = require('axios');

const getRepos = async (req, res) => {
  try {
    // Get token from session or user object
    const githubToken = req.user.githubToken;

    if (!githubToken) {
      return res.status(401).json({ 
        message: 'GitHub token not found. Please login with GitHub first.' 
      });
    }

    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: { sort: 'updated', per_page: 30 }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Get repos error:', error.message);
    res.status(500).json({ message: 'Failed to fetch repositories' });
  }
};

const getRepoContents = async (req, res) => {
  const { owner, repo } = req.params;
  const path = req.query.path || '';

  try {
    const githubToken = req.user.githubToken;

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFileContent = async (req, res) => {
  const { owner, repo } = req.params;
  const path = req.query.path;

  try {
    const githubToken = req.user.githubToken;

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    res.json({ content, name: response.data.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRepos, getRepoContents, getFileContent };
const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeReviewSource } = require('../utils/reviewSource');

test('missing source type defaults to paste', () => {
  const result = normalizeReviewSource({});
  assert.deepEqual(result.value, {
    sourceType: 'paste',
    sourceFileName: null,
    githubRepo: null,
    githubPath: null,
  });
});

test('upload source requires a supported file name', () => {
  assert.match(
    normalizeReviewSource({ sourceType: 'upload' }).error,
    /original file name/
  );
  assert.match(
    normalizeReviewSource({ sourceType: 'upload', sourceFileName: 'notes.txt' }).error,
    /Unsupported uploaded file type/
  );

  assert.deepEqual(
    normalizeReviewSource({ sourceType: 'upload', sourceFileName: 'Main.java' }).value,
    {
      sourceType: 'upload',
      sourceFileName: 'Main.java',
      githubRepo: null,
      githubPath: null,
    }
  );
});

test('GitHub source requires owner/repository and a supported path', () => {
  assert.match(
    normalizeReviewSource({ sourceType: 'github', githubRepo: 'invalid', githubPath: 'src/App.jsx' }).error,
    /owner\/repository/
  );

  assert.match(
    normalizeReviewSource({ sourceType: 'github', githubRepo: 'owner/repo', githubPath: 'README.md' }).error,
    /Unsupported GitHub file type/
  );

  assert.deepEqual(
    normalizeReviewSource({
      sourceType: 'github',
      sourceFileName: 'App.jsx',
      githubRepo: 'owner/repo',
      githubPath: 'src/App.jsx',
    }).value,
    {
      sourceType: 'github',
      sourceFileName: 'App.jsx',
      githubRepo: 'owner/repo',
      githubPath: 'src/App.jsx',
    }
  );
});

test('invalid source types are rejected', () => {
  assert.match(
    normalizeReviewSource({ sourceType: 'external' }).error,
    /Invalid review source type/
  );
});

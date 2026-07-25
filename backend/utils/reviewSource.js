const path = require('path');

const ALLOWED_SOURCE_TYPES = Object.freeze(['paste', 'upload', 'github']);
const ALLOWED_FILE_EXTENSIONS = Object.freeze([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.py',
  '.java',
  '.kt',
  '.kts',
  '.cpp',
  '.cc',
  '.cxx',
  '.hpp',
  '.c',
  '.h',
  '.php',
  '.go',
  '.rs',
  '.html',
  '.htm',
  '.css',
]);

const cleanLimitedText = (value, maxLength) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
};

const normalizeSourceType = (sourceType) => {
  const value = cleanLimitedText(sourceType, 20).toLowerCase();

  if (!value) return 'paste';
  return ALLOWED_SOURCE_TYPES.includes(value) ? value : null;
};

const isSupportedFileName = (fileName) => {
  const normalized = cleanLimitedText(fileName, 255).toLowerCase();
  const extension = path.extname(normalized);
  return ALLOWED_FILE_EXTENSIONS.includes(extension);
};

const normalizeReviewSource = ({ sourceType, sourceFileName, githubRepo, githubPath }) => {
  const normalizedType = normalizeSourceType(sourceType);
  const normalizedFileName = cleanLimitedText(sourceFileName, 255);
  const normalizedGithubRepo = cleanLimitedText(githubRepo, 200);
  const normalizedGithubPath = cleanLimitedText(githubPath, 500);

  if (!normalizedType) {
    return { error: 'Invalid review source type.' };
  }

  if (normalizedType === 'upload') {
    if (!normalizedFileName) {
      return { error: 'Uploaded reviews must include the original file name.' };
    }

    if (!isSupportedFileName(normalizedFileName)) {
      return { error: 'Unsupported uploaded file type.' };
    }
  }

  if (normalizedType === 'github') {
    if (!normalizedGithubRepo || !/^[^/\s]+\/[^/\s]+$/.test(normalizedGithubRepo)) {
      return { error: 'GitHub reviews must include a valid owner/repository name.' };
    }

    if (!normalizedGithubPath && !normalizedFileName) {
      return { error: 'GitHub reviews must include the selected file path.' };
    }

    const githubFileName = normalizedFileName || path.basename(normalizedGithubPath);
    if (!isSupportedFileName(githubFileName)) {
      return { error: 'Unsupported GitHub file type.' };
    }
  }

  return {
    value: {
      sourceType: normalizedType,
      sourceFileName: normalizedType === 'paste' ? null : normalizedFileName || null,
      githubRepo: normalizedType === 'github' ? normalizedGithubRepo : null,
      githubPath: normalizedType === 'github' ? normalizedGithubPath || normalizedFileName : null,
    },
  };
};

module.exports = {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_SOURCE_TYPES,
  isSupportedFileName,
  normalizeReviewSource,
  normalizeSourceType,
};

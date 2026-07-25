export const MAX_UPLOAD_FILE_SIZE_BYTES = 1024 * 1024;

export const SUPPORTED_FILE_EXTENSIONS = Object.freeze([
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

export const FILE_INPUT_ACCEPT = SUPPORTED_FILE_EXTENSIONS.join(',');

export const getFileExtension = (fileName = '') => {
  const normalized = String(fileName).trim().toLowerCase();
  const lastDot = normalized.lastIndexOf('.');
  return lastDot >= 0 ? normalized.slice(lastDot) : '';
};

export const isSupportedFileName = (fileName) => {
  return SUPPORTED_FILE_EXTENSIONS.includes(getFileExtension(fileName));
};

export const validateUploadFile = (file) => {
  if (!file) return 'Please choose a code file.';

  if (!isSupportedFileName(file.name)) {
    return `Unsupported file type. Allowed extensions: ${SUPPORTED_FILE_EXTENSIONS.join(', ')}`;
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return 'The selected file is larger than 1 MB.';
  }

  return null;
};

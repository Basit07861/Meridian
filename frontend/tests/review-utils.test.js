import test from 'node:test';
import assert from 'node:assert/strict';

import { detectLanguage } from '../src/utils/languageDetect.js';
import { getQualityKey, matchesQualityFilter } from '../src/utils/reviewQuality.js';
import { isSupportedFileName, validateUploadFile } from '../src/utils/reviewSource.js';

test('quality thresholds use Good 80+, Fair 50-79, and Poor below 50', () => {
  assert.equal(getQualityKey(100), 'good');
  assert.equal(getQualityKey(80), 'good');
  assert.equal(getQualityKey(79), 'fair');
  assert.equal(getQualityKey(50), 'fair');
  assert.equal(getQualityKey(49), 'poor');
  assert.equal(getQualityKey(0), 'poor');
  assert.equal(matchesQualityFilter(80, 'good'), true);
  assert.equal(matchesQualityFilter(79, 'good'), false);
  assert.equal(matchesQualityFilter(49, 'poor'), true);
});

test('language detection recognizes supported file extensions', () => {
  const samples = [
    ['app.js', 'javascript'],
    ['app.tsx', 'typescript'],
    ['main.py', 'python'],
    ['Main.java', 'java'],
    ['Main.kt', 'kotlin'],
    ['main.c', 'c'],
    ['main.cpp', 'cpp'],
    ['main.go', 'go'],
    ['main.rs', 'rust'],
    ['index.php', 'php'],
    ['index.html', 'html'],
    ['styles.css', 'css'],
  ];

  for (const [fileName, expected] of samples) {
    assert.equal(detectLanguage('sample code', fileName), expected, fileName);
  }
});

test('pasted HTML is not misclassified as JSX', () => {
  const html = '<!doctype html><html><head><title>Test</title></head><body><main>Hello</main></body></html>';
  assert.equal(detectLanguage(html), 'html');
});

test('pasted React JSX is detected as JavaScript', () => {
  const jsx = "import { useState } from 'react'; export default function App(){ const [x] = useState(1); return <main className=\"app\">{x}</main>; }";
  assert.equal(detectLanguage(jsx), 'javascript');
});

test('upload validation rejects unsupported and oversized files', () => {
  assert.equal(isSupportedFileName('review.py'), true);
  assert.equal(isSupportedFileName('notes.txt'), false);
  assert.match(validateUploadFile({ name: 'notes.txt', size: 10 }), /Unsupported file type/);
  assert.match(validateUploadFile({ name: 'review.py', size: 1024 * 1024 + 1 }), /larger than 1 MB/);
  assert.equal(validateUploadFile({ name: 'review.py', size: 1024 }), null);
});

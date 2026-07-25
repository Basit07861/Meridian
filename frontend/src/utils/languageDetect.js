export const SUPPORTED_LANGUAGES = Object.freeze([
  'javascript',
  'typescript',
  'python',
  'java',
  'kotlin',
  'c',
  'cpp',
  'go',
  'rust',
  'php',
  'html',
  'css',
]);

const EXTENSION_LANGUAGE_MAP = Object.freeze([
  { extensions: ['.jsx', '.js', '.mjs', '.cjs'], language: 'javascript' },
  { extensions: ['.tsx', '.ts'], language: 'typescript' },
  { extensions: ['.java'], language: 'java' },
  { extensions: ['.kt', '.kts'], language: 'kotlin' },
  { extensions: ['.py'], language: 'python' },
  { extensions: ['.cpp', '.cc', '.cxx', '.hpp'], language: 'cpp' },
  { extensions: ['.c', '.h'], language: 'c' },
  { extensions: ['.go'], language: 'go' },
  { extensions: ['.rs'], language: 'rust' },
  { extensions: ['.php'], language: 'php' },
  { extensions: ['.html', '.htm'], language: 'html' },
  { extensions: ['.css'], language: 'css' },
]);

const detectFromFileName = (fileName = '') => {
  const name = String(fileName).trim().toLowerCase();

  for (const item of EXTENSION_LANGUAGE_MAP) {
    if (item.extensions.some((extension) => name.endsWith(extension))) {
      return item.language;
    }
  }

  return null;
};

export const detectLanguage = (code, fileName = '') => {
  const fileLanguage = detectFromFileName(fileName);
  if (fileLanguage) return fileLanguage;

  if (!code || String(code).trim().length === 0) return 'unknown';

  const text = String(code).trim();

  const score = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((language) => [language, 0])
  );

  const add = (language, points) => {
    score[language] += points;
  };

  // PHP
  if (text.includes('<?php')) add('php', 12);
  if (/\$_GET|\$_POST|\$_SERVER|\$_SESSION|\$_COOKIE/.test(text)) add('php', 5);
  if (/\becho\s+["']/.test(text)) add('php', 3);
  if (/\bfunction\s+\w+\s*\([^)]*\)\s*\{/.test(text) && text.includes('$')) add('php', 3);

  // HTML
  if (/<!doctype\s+html>/i.test(text)) add('html', 14);
  if (/<html(?:\s[^>]*)?>/i.test(text)) add('html', 10);
  if (/<(?:head|body|meta|title|script|link|section|article|main|nav|form)(?:\s[^>]*)?>/i.test(text)) add('html', 5);
  if (/<\/[a-z][a-z0-9-]*>/i.test(text)) add('html', 3);

  // CSS
  if (/^\s*@(?:media|supports|keyframes|font-face|import)\b/m.test(text)) add('css', 8);
  if (/--[a-z0-9-]+\s*:/i.test(text)) add('css', 5);
  if (/\b(?:display|position|margin|padding|font-size|background|color|border|grid-template-columns|flex-direction)\s*:/i.test(text)) add('css', 4);
  if (/(?:^|\})\s*(?:[.#][a-z_-][\w-]*|[a-z][\w-]*(?:\s+[a-z][\w-]*)?)\s*\{[^}]*:[^;}]+[;}]/ims.test(text)) add('css', 6);

  // C++
  if (/#include\s*<iostream>/.test(text)) add('cpp', 10);
  if (/\busing\s+namespace\s+std\b/.test(text)) add('cpp', 6);
  if (/\bstd::/.test(text)) add('cpp', 6);
  if (/\bcout\s*<</.test(text)) add('cpp', 6);
  if (/\bcin\s*>>/.test(text)) add('cpp', 6);
  if (/\btemplate\s*</.test(text)) add('cpp', 4);

  // C
  if (/#include\s*<stdio\.h>/.test(text)) add('c', 10);
  if (/\bprintf\s*\(/.test(text)) add('c', 5);
  if (/\bscanf\s*\(/.test(text)) add('c', 5);
  if (/\bmalloc\s*\(|\bcalloc\s*\(|\bfree\s*\(/.test(text)) add('c', 4);

  // Go
  if (/^\s*package\s+\w+/m.test(text)) add('go', 9);
  if (/\bfunc\s+main\s*\(\s*\)/.test(text)) add('go', 7);
  if (/\bfmt\.(?:Print|Printf|Println)/.test(text)) add('go', 6);
  if (/:=/.test(text)) add('go', 3);
  if (/\bgo\s+\w+\s*\(/.test(text)) add('go', 3);

  // Rust
  if (/\bfn\s+main\s*\(\s*\)/.test(text)) add('rust', 9);
  if (/\bprintln!\s*\(/.test(text)) add('rust', 6);
  if (/\blet\s+mut\b/.test(text)) add('rust', 5);
  if (/\buse\s+std::/.test(text)) add('rust', 5);
  if (/\bimpl\s+\w+/.test(text)) add('rust', 4);
  if (/\bResult<[^>]+>/.test(text)) add('rust', 3);

  // Python
  if (/^\s*def\s+\w+\s*\(/m.test(text)) add('python', 8);
  if (/^\s*class\s+\w+(?:\([^)]*\))?\s*:/m.test(text)) add('python', 7);
  if (/\bself\./.test(text)) add('python', 5);
  if (/\b__init__\s*\(/.test(text)) add('python', 6);
  if (/^\s*from\s+\w+(?:\.\w+)*\s+import\s+/m.test(text)) add('python', 5);
  if (/^\s*import\s+(?:os|sys|json|re|numpy|pandas|flask|django|fastapi)\b/m.test(text)) add('python', 5);
  if (/^\s*elif\s+/m.test(text)) add('python', 4);
  if (/\bprint\s*\(/.test(text) && !/[{};]/.test(text.slice(0, 500))) add('python', 3);

  // Java
  if (/\bpublic\s+class\s+\w+/.test(text)) add('java', 12);
  if (/\bpublic\s+static\s+void\s+main\s*\(/.test(text)) add('java', 10);
  if (/\bSystem\.out\.print/.test(text)) add('java', 7);
  if (/^\s*import\s+java\./m.test(text)) add('java', 8);
  if (/\bnew\s+Scanner\s*\(/.test(text)) add('java', 6);
  if (/@Override\b/.test(text)) add('java', 5);
  if (/\bprivate\s+(?:static\s+)?(?:final\s+)?(?:String|int|double|float|boolean|long|List|Map|Set|ArrayList)\b/.test(text)) add('java', 5);
  if (/\bpublic\s+(?:static\s+)?(?:void|String|int|double|float|boolean|long|List|Map|Set)\s+\w+\s*\(/.test(text)) add('java', 5);

  // Kotlin
  if (/\bfun\s+main\s*\(\s*\)/.test(text)) add('kotlin', 11);
  if (/\bdata\s+class\s+\w+/.test(text)) add('kotlin', 8);
  if (/\b(?:val|var)\s+\w+\s*(?::\s*[A-Z]\w*(?:<[^>]+>)?)?\s*=/.test(text)) add('kotlin', 5);
  if (/\bprintln\s*\(/.test(text)) add('kotlin', 5);
  if (/\bwhen\s*\([^)]*\)\s*\{/.test(text)) add('kotlin', 5);
  if (/\b(?:String|Int|Long|Double|Boolean)\?\b/.test(text) || /\?\.|!!/.test(text)) add('kotlin', 4);
  if (/^\s*import\s+kotlin\./m.test(text)) add('kotlin', 7);

  // JavaScript / JSX
  if (/\bconst\s+\w+/.test(text)) add('javascript', 5);
  if (/\blet\s+\w+/.test(text)) add('javascript', 5);
  if (/\bvar\s+\w+/.test(text)) add('javascript', 4);
  if (/\bfunction\s+\w+\s*\(/.test(text)) add('javascript', 5);
  if (/=>/.test(text)) add('javascript', 5);
  if (/\bconsole\.log\s*\(/.test(text)) add('javascript', 5);
  if (/\brequire\s*\(/.test(text)) add('javascript', 7);
  if (/\bmodule\.exports\b/.test(text)) add('javascript', 9);
  if (/\bexport\s+default\b/.test(text)) add('javascript', 6);
  if (/^\s*import\s+.*\s+from\s+["'][^"']+["']/m.test(text)) add('javascript', 6);
  if (/\buseState\s*\(|\buseEffect\s*\(/.test(text)) add('javascript', 8);
  if (/<[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?>/.test(text) || /\bclassName=/.test(text)) add('javascript', 7);
  if (/\{[^{}]*\}/.test(text) && /<\/?[A-Za-z][^>]*>/.test(text)) add('javascript', 3);

  // TypeScript / TSX
  if (/\binterface\s+\w+/.test(text)) add('typescript', 8);
  if (/\btype\s+\w+\s*=/.test(text)) add('typescript', 7);
  if (/\benum\s+\w+/.test(text)) add('typescript', 6);
  if (/\bReact\.FC\b/.test(text)) add('typescript', 6);
  if (/\bas\s+(?:string|number|boolean|const|unknown|any)\b/.test(text)) add('typescript', 5);
  if (/\b:\s*(?:string|number|boolean|void|unknown|any)\b/.test(text)) add('typescript', 5);
  if (/\)\s*:\s*(?:string|number|boolean|void|Promise<[^>]+>)\s*(?:=>|\{)/.test(text)) add('typescript', 5);
  if (/\b(?:Record|Partial|Pick|Omit|Readonly)<[^>]+>/.test(text)) add('typescript', 4);

  if (score.typescript > 0 && score.javascript > 0) {
    add('typescript', 3);
  }

  if (score.cpp > 0 && score.c > 0) {
    score.c -= 2;
  }

  if (score.kotlin > 0 && score.java > 0 && /\bfun\s+|\bval\s+|\bvar\s+/.test(text)) {
    score.kotlin += 5;
    score.java -= 3;
  }

  if (score.javascript > 0 && score.java > 0) {
    if (/\bmodule\.exports\b|\brequire\s*\(|\bconst\s+\w+|\blet\s+\w+|=>/.test(text)) {
      score.javascript += 6;
      score.java -= 4;
    }
  }

  // A complete HTML document should not be treated as JSX merely because it contains tags.
  if (score.html >= 10 && !/\b(?:import|export|useState|useEffect|className)\b/.test(text)) {
    score.javascript = Math.max(0, score.javascript - 6);
    score.typescript = Math.max(0, score.typescript - 4);
  }

  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const [bestLanguage, bestScore] = ranked[0];

  return bestScore > 0 ? bestLanguage : 'unknown';
};

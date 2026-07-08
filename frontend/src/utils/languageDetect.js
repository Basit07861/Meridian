export const detectLanguage = (code, fileName = '') => {
  if (!code || code.trim().length === 0) return 'unknown';

  const text = code.trim();
  const lower = text.toLowerCase();
  const name = fileName.toLowerCase();

  const extensionMap = [
    { extensions: ['.jsx'], language: 'javascript' },
    { extensions: ['.tsx'], language: 'typescript' },
    { extensions: ['.ts'], language: 'typescript' },
    { extensions: ['.js', '.mjs', '.cjs'], language: 'javascript' },
    { extensions: ['.java'], language: 'java' },
    { extensions: ['.py'], language: 'python' },
    { extensions: ['.cpp', '.cc', '.cxx', '.hpp'], language: 'cpp' },
    { extensions: ['.c', '.h'], language: 'c' },
    { extensions: ['.go'], language: 'go' },
    { extensions: ['.rs'], language: 'rust' },
    { extensions: ['.php'], language: 'php' },
  ];

  for (const item of extensionMap) {
    if (item.extensions.some((ext) => name.endsWith(ext))) {
      return item.language;
    }
  }

  const score = {
    javascript: 0,
    typescript: 0,
    java: 0,
    python: 0,
    cpp: 0,
    c: 0,
    go: 0,
    rust: 0,
    php: 0,
  };

  const add = (language, points) => {
    score[language] += points;
  };

  if (text.includes('<?php')) add('php', 8);
  if (/\$_GET|\$_POST|\$_SERVER|\$_SESSION/.test(text)) add('php', 4);
  if (/echo\s+["']/.test(text)) add('php', 2);

  if (/#include\s*<iostream>/.test(text)) add('cpp', 8);
  if (/\busing\s+namespace\s+std\b/.test(text)) add('cpp', 5);
  if (/\bstd::/.test(text)) add('cpp', 5);
  if (/\bcout\s*<</.test(text)) add('cpp', 5);
  if (/\bcin\s*>>/.test(text)) add('cpp', 5);

  if (/#include\s*<stdio\.h>/.test(text)) add('c', 8);
  if (/\bprintf\s*\(/.test(text)) add('c', 4);
  if (/\bscanf\s*\(/.test(text)) add('c', 4);

  if (/\bpackage\s+main\b/.test(text)) add('go', 8);
  if (/\bfunc\s+main\s*\(\s*\)/.test(text)) add('go', 6);
  if (/\bfmt\.Print/.test(text)) add('go', 5);
  if (/:=\s*/.test(text)) add('go', 2);

  if (/\bfn\s+main\s*\(\s*\)/.test(text)) add('rust', 8);
  if (/\bprintln!\s*\(/.test(text)) add('rust', 5);
  if (/\blet\s+mut\b/.test(text)) add('rust', 4);
  if (/\buse\s+std::/.test(text)) add('rust', 4);

  if (/^\s*def\s+\w+\s*\(/m.test(text)) add('python', 7);
  if (/^\s*class\s+\w+(\([^)]*\))?\s*:/m.test(text)) add('python', 6);
  if (/\bself\./.test(text)) add('python', 4);
  if (/\b__init__\s*\(/.test(text)) add('python', 5);
  if (/^\s*from\s+\w+(\.\w+)*\s+import\s+/m.test(text)) add('python', 4);
  if (/^\s*import\s+(os|sys|json|re|numpy|pandas|flask|django|fastapi)\b/m.test(text)) add('python', 4);
  if (/^\s*elif\s+/m.test(text)) add('python', 3);
  if (/\bprint\s*\(/.test(text) && !/[{};]/.test(text.slice(0, 500))) add('python', 2);

  if (/\bpublic\s+class\s+\w+/.test(text)) add('java', 10);
  if (/\bpublic\s+static\s+void\s+main\s*\(/.test(text)) add('java', 8);
  if (/\bSystem\.out\.print/.test(text)) add('java', 6);
  if (/^\s*import\s+java\./m.test(text)) add('java', 7);
  if (/\bnew\s+Scanner\s*\(/.test(text)) add('java', 5);
  if (/@Override\b/.test(text)) add('java', 4);
  if (/\bprivate\s+(static\s+)?(final\s+)?(String|int|double|float|boolean|long|List|Map|Set|ArrayList)\b/.test(text)) add('java', 5);
  if (/\bpublic\s+(static\s+)?(void|String|int|double|float|boolean|long|List|Map|Set)\s+\w+\s*\(/.test(text)) add('java', 5);
  if (/\bextends\s+(RuntimeException|Exception|Thread|Activity|Application|Controller|Service|Repository)\b/.test(text)) add('java', 4);
  if (/\bimplements\s+\w+/.test(text) && /;\s*$|public\s+class|private\s+/m.test(text)) add('java', 3);
  if (/\bnew\s+(ArrayList|HashMap|HashSet|LocalDateTime|BigDecimal)\s*</.test(text)) add('java', 4);

  if (/\bconst\s+\w+/.test(text)) add('javascript', 5);
  if (/\blet\s+\w+/.test(text)) add('javascript', 5);
  if (/\bvar\s+\w+/.test(text)) add('javascript', 4);
  if (/\bfunction\s+\w+\s*\(/.test(text)) add('javascript', 5);
  if (/=>/.test(text)) add('javascript', 5);
  if (/\bconsole\.log\s*\(/.test(text)) add('javascript', 4);
  if (/\brequire\s*\(/.test(text)) add('javascript', 6);
  if (/\bmodule\.exports\b/.test(text)) add('javascript', 8);
  if (/\bexport\s+default\b/.test(text)) add('javascript', 5);
  if (/^\s*import\s+.*\s+from\s+["'][^"']+["']/m.test(text)) add('javascript', 5);
  if (/\buseState\s*\(|\buseEffect\s*\(/.test(text)) add('javascript', 6);
  if (/<[A-Za-z][A-Za-z0-9]*(\s+[^>]*)?>/.test(text) && /<\/[A-Za-z][A-Za-z0-9]*>/.test(text)) add('javascript', 5);
  if (/\bclass\s+\w+\s+extends\s+Error\b/.test(text)) add('javascript', 8);
  if (/\bnew\s+Date\s*\(\s*\)\.(toISOString|toLocaleString|toLocaleDateString)\s*\(/.test(text)) add('javascript', 3);

  if (/\binterface\s+\w+/.test(text)) add('typescript', 7);
  if (/\btype\s+\w+\s*=/.test(text)) add('typescript', 6);
  if (/\benum\s+\w+/.test(text)) add('typescript', 5);
  if (/\bReact\.FC\b/.test(text)) add('typescript', 5);
  if (/\bas\s+(string|number|boolean|const)\b/.test(text)) add('typescript', 4);
  if (/\b:\s*(string|number|boolean|void|unknown|any)\b/.test(text)) add('typescript', 4);
  if (/\)\s*:\s*(string|number|boolean|void|Promise<[^>]+>)\s*=>|\)\s*:\s*(string|number|boolean|void)\s*\{/.test(text)) {
    add('typescript', 4);
  }

  if (score.typescript > 0 && score.javascript > 0) {
    add('typescript', 3);
  }

  if (score.cpp > 0 && score.c > 0) {
    score.c -= 2;
  }

  if (score.javascript > 0 && score.java > 0) {
    if (
      /\bmodule\.exports\b/.test(text) ||
      /\brequire\s*\(/.test(text) ||
      /\bconst\s+\w+/.test(text) ||
      /\blet\s+\w+/.test(text) ||
      /=>/.test(text)
    ) {
      score.javascript += 6;
      score.java -= 4;
    }
  }

  const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const [bestLanguage, bestScore] = ranked[0];

  if (bestScore <= 0) return 'unknown';

  return bestLanguage;
};
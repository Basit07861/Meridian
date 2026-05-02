export const detectLanguage = (code) => {
  if (!code) return 'unknown';

  // JavaScript / TypeScript
  if (
    code.includes('const ') ||
    code.includes('let ') ||
    code.includes('console.log') ||
    code.includes('=>') ||
    code.includes('document.') ||
    code.includes('useState')
  ) {
    if (code.includes(': string') || code.includes(': number') || 
        code.includes('interface ') || code.includes(': boolean')) {
      return 'typescript';
    }
    return 'javascript';
  }

  // Python
  if (
    code.includes('def ') ||
    code.includes('import ') && code.includes(':') ||
    code.includes('print(') ||
    code.includes('elif ') ||
    code.includes('self.')
  ) return 'python';

  // Java
  if (
    code.includes('public class') ||
    code.includes('System.out.println') ||
    code.includes('public static void main')
  ) return 'java';

  // C++
  if (
    code.includes('#include') ||
    code.includes('cout <<') ||
    code.includes('cin >>') ||
    code.includes('std::')
  ) return 'cpp';

  // C
  if (
    code.includes('#include <stdio.h>') ||
    code.includes('printf(') ||
    code.includes('scanf(')
  ) return 'c';

  // PHP
  if (code.includes('<?php') || code.includes('echo ')) return 'php';

  // Go
  if (
    code.includes('func ') ||
    code.includes('package main') ||
    code.includes('fmt.Println')
  ) return 'go';

  // Rust
  if (
    code.includes('fn main()') ||
    code.includes('println!') ||
    code.includes('let mut ')
  ) return 'rust';

  return 'unknown';
};
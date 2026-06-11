export const detectLanguage = (code) => {
  if (!code || code.trim().length === 0) return 'unknown';

  // Java — check FIRST before Python (import keyword conflict)
  if (
    code.includes('public class') ||
    code.includes('public static void main') ||
    code.includes('System.out.println') ||
    code.includes('System.out.print') ||
    code.includes('private static') ||
    code.includes('public void') ||
    code.includes('extends ') ||
    code.includes('implements ') ||
    code.includes('new Scanner') ||
    code.includes('@Override')
  ) return 'java';

  // C++ — check before C
  if (
    code.includes('#include<iostream>') ||
    code.includes('#include <iostream>') ||
    code.includes('cout <<') ||
    code.includes('cin >>') ||
    code.includes('std::') ||
    code.includes('using namespace std')
  ) return 'cpp';

  // C
  if (
    code.includes('#include <stdio.h>') ||
    code.includes('#include<stdio.h>') ||
    code.includes('printf(') ||
    code.includes('scanf(') ||
    (code.includes('#include') && !code.includes('iostream'))
  ) return 'c';

  // TypeScript — check before JavaScript
  if (
    code.includes(': string') ||
    code.includes(': number') ||
    code.includes(': boolean') ||
    code.includes(': void') ||
    code.includes('interface ') ||
    code.includes('<T>') ||
    code.includes('as string') ||
    code.includes('as number')
  ) return 'typescript';

  // JavaScript
  if (
    code.includes('const ') ||
    code.includes('let ') ||
    code.includes('var ') ||
    code.includes('console.log') ||
    code.includes('=>') ||
    code.includes('document.') ||
    code.includes('useState') ||
    code.includes('function ') ||
    code.includes('require(') ||
    code.includes('module.exports')
  ) return 'javascript';

  // Python — use strict checks only
  if (
    code.includes('def ') ||
    code.includes('elif ') ||
    code.includes('self.') ||
    code.includes('print(') ||
    code.includes('__init__') ||
    code.includes('import numpy') ||
    code.includes('import pandas') ||
    code.includes('import os') ||
    (code.includes('def ') && code.includes(':'))
  ) return 'python';

  // Go
  if (
    code.includes('package main') ||
    code.includes('func main()') ||
    code.includes('fmt.Println') ||
    code.includes(':= ')
  ) return 'go';

  // Rust
  if (
    code.includes('fn main()') ||
    code.includes('println!') ||
    code.includes('let mut ') ||
    code.includes('use std::')
  ) return 'rust';

  // PHP
  if (
    code.includes('<?php') ||
    code.includes('echo ') ||
    code.includes('$_GET') ||
    code.includes('$_POST')
  ) return 'php';

  return 'unknown';
};
/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    TreeSitter: any;
  }
}

let parser: any = null;
const languages: Map<string, any> = new Map();

export async function initializeParser() {
  if (parser) return parser;

  if (typeof window === 'undefined') {
    throw new Error('TreeSitter only works in browser');
  }

  if (!window.TreeSitter) {
    // Load TreeSitter from CDN
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/web-tree-sitter@0.20.8/tree-sitter.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  await window.TreeSitter.init();
  parser = new window.TreeSitter.Parser();
  return parser;
}

export async function getLanguage(languageName: string): Promise<any> {
  if (languages.has(languageName)) {
    return languages.get(languageName)!;
  }

  try {
    const wasmUrl = `https://cdn.jsdelivr.net/npm/tree-sitter-${languageName}@latest/tree-sitter-${languageName}.wasm`;
    const language = await window.TreeSitter.Language.load(wasmUrl);
    languages.set(languageName, language);
    return language;
  } catch (error) {
    console.error(`Failed to load language: ${languageName}`, error);
    throw new Error(`Unsupported language: ${languageName}`);
  }
}

export async function parseCode(code: string, languageName: string) {
  const p = await initializeParser();
  const language = await getLanguage(languageName);
  p.setLanguage(language);
  return p.parse(code);
}

export interface QueryMatch {
  pattern: number;
  captures: Array<{
    node: any;
    name: string;
    text: string;
  }>;
}

export async function queryTree(
  tree: any,
  queryString: string,
  languageName: string
): Promise<QueryMatch[]> {
  try {
    const language = await getLanguage(languageName);
    const query = language.query(queryString);
    return query.matches(tree.rootNode) as QueryMatch[];
  } catch (error) {
    console.error('Query error:', error);
    throw new Error(`Invalid query: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export interface TreeNodeJSON {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children: TreeNodeJSON[];
}

export function treeToJSON(node: any): TreeNodeJSON {
  return {
    type: node.type,
    text: node.text,
    startPosition: { row: node.startPosition.row, column: node.startPosition.column },
    endPosition: { row: node.endPosition.row, column: node.endPosition.column },
    children: node.children.map((child: any) => treeToJSON(child)),
  };
}

export function getNodeAtPosition(
  tree: any,
  row: number,
  column: number
): any {
  return tree.rootNode.descendantForPosition({ row, column });
}


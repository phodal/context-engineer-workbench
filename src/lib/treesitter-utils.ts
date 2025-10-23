/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Client-side TreeSitter utilities using web-tree-sitter from CDN
 * Loads Parser and Language grammars from jsDelivr CDN
 */

// Language grammar URLs mapping
const LANGUAGE_URLS: Record<string, string> = {
  bash: 'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-bash.wasm',
  c: 'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-c.wasm',
  cpp: 'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-cpp.wasm',
  c_sharp:
    'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-c_sharp.wasm',
  COBOL:
    'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-COBOL.wasm',
  go: 'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-go.wasm',
  java: 'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-java.wasm',
  javascript:
    'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-javascript.wasm',
  kotlin:
    'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-kotlin.wasm',
  lua: 'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-lua.wasm',
  ocaml:
    'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-ocaml.wasm',
  php: 'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-php.wasm',
  python:
    'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-python.wasm',
  rescript:
    'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-rescript.wasm',
  rust: 'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-rust.wasm',
  swift:
    'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-swift.wasm',
  tlaplus:
    'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-tlaplus.wasm',
  tsx: 'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-tsx.wasm',
  typescript:
    'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-typescript.wasm',
  zig: 'https://cdn.jsdelivr.net/npm/@unit-mesh/treesitter-artifacts@latest/wasm/tree-sitter-zig.wasm',
};

export interface TreeNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children?: TreeNode[];
  // Enhanced fields for better visualization
  id?: number;
  fieldName?: string;
  isNamed?: boolean;
  isMissing?: boolean;
  isError?: boolean;
  isAnonymous?: boolean;
}

export interface QueryMatch {
  pattern: number;
  captures: Array<{
    name: string;
    type: string;
    text: string;
    startPosition: { row: number; column: number };
    endPosition: { row: number; column: number };
  }>;
}

// Color palettes for light and dark themes
export const LIGHT_COLORS = [
  '#0550ae', // blue
  '#ab5000', // rust brown
  '#116329', // forest green
  '#844708', // warm brown
  '#6639ba', // purple
  '#7d4e00', // orange brown
  '#0969da', // bright blue
  '#1a7f37', // green
  '#cf222e', // red
  '#8250df', // violet
  '#6e7781', // gray
  '#953800', // dark orange
  '#1b7c83', // teal
];

export const DARK_COLORS = [
  '#79c0ff', // light blue
  '#ffa657', // orange
  '#7ee787', // light green
  '#ff7b72', // salmon
  '#d2a8ff', // light purple
  '#ffa198', // pink
  '#a5d6ff', // pale blue
  '#56d364', // bright green
  '#ff9492', // light red
  '#e0b8ff', // pale purple
  '#9ca3af', // gray
  '#ffb757', // yellow orange
  '#80cbc4', // light teal
];

// Global parser instance and initialization state
let parserInstance: any = null;
let parserInitPromise: Promise<void> | null = null;
const languageCache = new Map<string, any>();

/**
 * Initialize the parser (one-time setup)
 */
async function initializeParser(): Promise<void> {
  if (parserInitPromise) {
    return parserInitPromise;
  }

  parserInitPromise = (async () => {
    try {
      // Dynamic import from CDN - using Function to avoid TypeScript errors
      const importModule = new Function(
        'return import("https://cdn.jsdelivr.net/npm/web-tree-sitter@0.25.3/tree-sitter.js")'
      ) as any;
      const loadedModule = await importModule();
      const { Parser } = loadedModule;

      await Parser.init({
        locateFile: () => {
          return 'https://cdn.jsdelivr.net/npm/web-tree-sitter@0.25.3/tree-sitter.wasm';
        },
      });

      parserInstance = new Parser();
    } catch (error) {
      console.error('Failed to initialize parser:', error);
      parserInitPromise = null;
      throw error;
    }
  })();

  return parserInitPromise;
}

/**
 * Load a language grammar
 */
async function loadLanguage(language: string): Promise<any> {
  if (languageCache.has(language)) {
    return languageCache.get(language);
  }

  try {
    // Dynamic import from CDN - using Function to avoid TypeScript errors
    const importModule = new Function(
      'return import("https://cdn.jsdelivr.net/npm/web-tree-sitter@0.25.3/tree-sitter.js")'
    ) as any;
    const loadedModule = await importModule();
    const { Language } = loadedModule;

    const languageUrl = LANGUAGE_URLS[language];
    if (!languageUrl) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const lang = await Language.load(languageUrl);
    languageCache.set(language, lang);
    return lang;
  } catch (error) {
    console.error(`Failed to load language ${language}:`, error);
    throw error;
  }
}

/**
 * Convert a tree-sitter SyntaxNode to our TreeNode interface
 */
function syntaxNodeToTreeNode(node: any): TreeNode {
  const children: TreeNode[] = [];
  for (let i = 0; i < node.childCount; i++) {
    children.push(syntaxNodeToTreeNode(node.child(i)));
  }

  // Determine node classification
  const isError = node.type === 'ERROR';
  const isMissing = node.isMissing;
  const isNamed = node.isNamed;
  const isAnonymous = !isNamed;

  return {
    type: node.type,
    text: node.text,
    startPosition: {
      row: node.startPosition.row,
      column: node.startPosition.column,
    },
    endPosition: {
      row: node.endPosition.row,
      column: node.endPosition.column,
    },
    children: children.length > 0 ? children : undefined,
    // Enhanced fields
    id: node.id,
    fieldName: node.currentFieldName,
    isNamed,
    isMissing,
    isError,
    isAnonymous,
  };
}

/**
 * Parse code using web-tree-sitter
 */
export async function parseCode(code: string, language: string): Promise<any> {
  try {
    await initializeParser();
    const lang = await loadLanguage(language);
    parserInstance.setLanguage(lang);

    const tree = parserInstance.parse(code);
    const rootNode = syntaxNodeToTreeNode(tree.rootNode);

    return {
      rootNode,
    };
  } catch (error) {
    console.error('Parse error:', error);
    throw error;
  }
}

/**
 * Query tree with code using web-tree-sitter
 */
export async function queryTreeWithCode(
  code: string,
  query: string,
  language: string
): Promise<QueryMatch[]> {
  try {
    await initializeParser();
    const lang = await loadLanguage(language);
    parserInstance.setLanguage(lang);

    const tree = parserInstance.parse(code);
    const queryObj = lang.query(query);
    const matches = queryObj.matches(tree.rootNode);

    return matches.map((match: any) => ({
      pattern: match.patternIndex,
      captures: match.captures.map((capture: any) => ({
        name: capture.name,
        type: capture.node.type,
        text: capture.node.text,
        startPosition: {
          row: capture.node.startPosition.row,
          column: capture.node.startPosition.column,
        },
        endPosition: {
          row: capture.node.endPosition.row,
          column: capture.node.endPosition.column,
        },
      })),
    }));
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

/**
 * Convert tree node to JSON (identity function for compatibility)
 */
export function treeToJSON(node: TreeNode): TreeNode {
  return node;
}

/**
 * Get node at specific position
 */
export function getNodeAtPosition(tree: TreeNode, row: number, column: number): TreeNode | null {
  if (!tree) return null;

  const isInRange = (node: TreeNode) => {
    const startRow = node.startPosition.row;
    const startCol = node.startPosition.column;
    const endRow = node.endPosition.row;
    const endCol = node.endPosition.column;

    if (row < startRow || row > endRow) return false;
    if (row === startRow && column < startCol) return false;
    if (row === endRow && column > endCol) return false;

    return true;
  };

  if (!isInRange(tree)) return null;

  if (tree.children && tree.children.length > 0) {
    for (const child of tree.children) {
      const result = getNodeAtPosition(child, row, column);
      if (result) return result;
    }
  }

  return tree;
}

/**
 * Get color for a capture name based on theme
 */
export function getColorForCaptureName(
  captureName: string,
  captureNames: string[],
  isDark: boolean = false
): string {
  const id = captureNames.indexOf(captureName);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  return colors[id % colors.length];
}

/**
 * Extract unique node types from a tree
 */
export function extractNodeTypes(
  node: TreeNode | null,
  maxDepth = 3,
  currentDepth = 0
): Set<string> {
  const types = new Set<string>();

  if (!node || currentDepth >= maxDepth) {
    return types;
  }

  if (node.isNamed && !node.isMissing && !node.isError) {
    types.add(node.type);
  }

  if (node.children) {
    for (const child of node.children) {
      const childTypes = extractNodeTypes(child, maxDepth, currentDepth + 1);
      childTypes.forEach((type) => types.add(type));
    }
  }

  return types;
}

/**
 * Generate example queries based on node types
 */
export function generateExampleQueries(
  nodeTypes: Set<string>,
  language: string
): Record<string, string> {
  const examples: Record<string, string> = {};

  // Language-specific patterns
  const patterns: Record<string, Record<string, string>> = {
    javascript: {
      FunctionDeclaration: '(function_declaration name: (identifier) @name)',
      VariableDeclaration: '(variable_declarator name: (identifier) @name)',
      FunctionCall: '(call_expression function: (identifier) @function)',
      StringLiteral: '(string) @string',
      Comment: '(comment) @comment',
    },
    typescript: {
      FunctionDeclaration: '(function_declaration name: (identifier) @name)',
      VariableDeclaration: '(variable_declarator name: (identifier) @name)',
      FunctionCall: '(call_expression function: (identifier) @function)',
      Interface: '(interface_declaration name: (type_identifier) @name)',
      TypeAlias: '(type_alias_declaration name: (type_identifier) @name)',
    },
    python: {
      FunctionDefinition: '(function_definition name: (identifier) @name)',
      ClassDefinition: '(class_definition name: (identifier) @name)',
      Assignment: '(assignment left: (identifier) @name)',
      String: '(string) @string',
      Comment: '(comment) @comment',
    },
    java: {
      MethodDeclaration: '(method_declaration name: (identifier) @name)',
      ClassDeclaration: '(class_declaration name: (identifier) @name)',
      VariableDeclaration: '(variable_declarator name: (identifier) @name)',
      StringLiteral: '(string_literal) @string',
    },
  };

  // Get language-specific patterns or use default
  const langPatterns = patterns[language] || patterns.javascript;

  // Add all available patterns
  Object.assign(examples, langPatterns);

  // Add dynamic patterns based on detected node types
  if (nodeTypes.has('function_declaration') || nodeTypes.has('function_definition')) {
    examples['All Functions'] = '(function_declaration name: (identifier) @name) @function';
  }

  if (nodeTypes.has('class_declaration') || nodeTypes.has('class_definition')) {
    examples['All Classes'] = '(class_declaration name: (identifier) @name) @class';
  }

  if (nodeTypes.has('variable_declarator') || nodeTypes.has('assignment')) {
    examples['All Variables'] = '(variable_declarator name: (identifier) @name) @variable';
  }

  if (nodeTypes.has('call_expression')) {
    examples['All Function Calls'] =
      '(call_expression function: (identifier) @function arguments: (arguments) @args)';
  }

  return examples;
}

/**
 * Dispose of resources
 */
export function dispose() {
  // Clear caches
  languageCache.clear();
  parserInstance = null;
  parserInitPromise = null;
}

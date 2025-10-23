/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Global test setup for mocking tree-sitter functionality
 * This setup ensures that tree-sitter dynamic imports work in Jest environment
 */

// Store original Function constructor
const originalFunction = global.Function;

// Helper function to create mock tree nodes
function createMockNode(
  type: string,
  text: string,
  startRow = 0,
  startCol = 0,
  endRow = 0,
  endCol = 0,
  children: any[] = []
): any {
  return {
    type,
    text,
    startPosition: { row: startRow, column: startCol },
    endPosition: { row: endRow, column: endCol },
    childCount: children.length,
    namedChildCount: children.filter((c) => c.isNamed()).length,
    children,
    child: (index: number) => children[index] || null,
    namedChild: (index: number) => children.filter((c) => c.isNamed())[index] || null,
    firstChild: children[0] || null,
    lastChild: children[children.length - 1] || null,
    nextSibling: null,
    previousSibling: null,
    parent: null,
    hasError: () => false,
    isMissing: () => false,
    isNamed: () => type !== '(' && type !== ')' && type !== '{' && type !== '}' && type !== ';',
    toString: () => text,
    id: Math.random(),
    currentFieldName: null,
  };
}

// Simple JavaScript parser mock
function parseJavaScript(code: string): any {
  const children: any[] = [];

  // Extract function declarations
  const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*\}/g;
  let match;
  while ((match = functionRegex.exec(code)) !== null) {
    const functionName = match[1];
    const nameNode = createMockNode('identifier', functionName);
    const functionNode = createMockNode(
      'function_declaration',
      match[0],
      0,
      match.index,
      0,
      match.index + match[0].length,
      [nameNode]
    );
    children.push(functionNode);
  }

  // Extract class declarations
  const classRegex = /class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{[^}]*\}/g;
  while ((match = classRegex.exec(code)) !== null) {
    const className = match[1];
    const nameNode = createMockNode('identifier', className);
    const classNode = createMockNode(
      'class_declaration',
      match[0],
      0,
      match.index,
      0,
      match.index + match[0].length,
      [nameNode]
    );
    children.push(classNode);
  }

  return createMockNode('program', code, 0, 0, 0, code.length, children);
}

// Simple Python parser mock
function parsePython(code: string): any {
  const children: any[] = [];

  // Extract function definitions (def keyword)
  const functionRegex = /def\s+(\w+)\s*\([^)]*\):/g;
  let match;
  while ((match = functionRegex.exec(code)) !== null) {
    const functionName = match[1];
    const nameNode = createMockNode('identifier', functionName);
    const functionNode = createMockNode(
      'function_definition',
      match[0],
      0,
      match.index,
      0,
      match.index + match[0].length,
      [nameNode]
    );
    children.push(functionNode);
  }

  // Extract class definitions
  const classRegex = /class\s+(\w+)(?:\([^)]*\))?:/g;
  while ((match = classRegex.exec(code)) !== null) {
    const className = match[1];
    const nameNode = createMockNode('identifier', className);
    const classNode = createMockNode(
      'class_definition',
      match[0],
      0,
      match.index,
      0,
      match.index + match[0].length,
      [nameNode]
    );
    children.push(classNode);
  }

  return createMockNode('program', code, 0, 0, 0, code.length, children);
}

// Mock modules for tree-sitter
const mockModules: Record<string, any> = {
  'https://cdn.jsdelivr.net/npm/web-tree-sitter@0.25.3/tree-sitter.js': {
    Parser: class MockParser {
      private language: any = null;

      static async init() {
        // Mock init - do nothing
        return Promise.resolve();
      }

      setLanguage(lang: any) {
        this.language = lang;
      }

      parse(code: string) {
        // Return a more realistic mock tree structure based on the code
        if (code.trim() === '') {
          return {
            rootNode: createMockNode('program', code, 0, 0, 0, 0, []),
          };
        }

        // Use appropriate parser based on the language set
        if (this.language && this.language.name === 'python') {
          return {
            rootNode: parsePython(code),
          };
        }

        // Default to JavaScript parsing
        return {
          rootNode: parseJavaScript(code),
        };
      }
    },
    Language: {
      load: async (url: string) => {
        // Determine language name from URL
        let languageName = 'javascript'; // default
        if (url.includes('python')) {
          languageName = 'python';
        } else if (url.includes('typescript')) {
          languageName = 'typescript';
        } else if (url.includes('java')) {
          languageName = 'java';
        }

        // Mock language loading
        return {
          name: languageName,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          query: (_queryString: string) => ({
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            matches: (_node: any) => {
              // Return mock query matches
              return [
                {
                  patternIndex: 0,
                  captures: [
                    {
                      name: 'test',
                      node: {
                        type: 'identifier',
                        text: 'mockIdentifier',
                        startPosition: { row: 0, column: 0 },
                        endPosition: { row: 0, column: 14 },
                        children: [],
                        childCount: 0,
                        namedChildCount: 0,
                        hasError: () => false,
                        isMissing: () => false,
                        isNamed: () => true,
                        toString: () => 'mockIdentifier',
                      },
                    },
                  ],
                },
              ];
            },
          }),
        };
      },
    },
  },
};

// Mock Function constructor to handle dynamic imports
(global as any).Function = function (...args: any[]) {
  const code = args[args.length - 1];

  // Check if this is a dynamic import call
  if (code && typeof code === 'string' && code.includes('import(')) {
    return async () => {
      const match = code.match(/import\("([^"]+)"\)/);
      if (match && mockModules[match[1]]) {
        return mockModules[match[1]];
      }
      // For unsupported modules, throw an error
      throw new Error(`Module not mocked: ${match?.[1] || 'unknown'}`);
    };
  }

  // For non-import Function calls, use original behavior
  return originalFunction.apply(this, args);
};

// Set up environment variable to indicate we're in test mode
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests (optional)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Filter out expected tree-sitter errors in tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Failed to initialize parser') ||
      message.includes('Parse error') ||
      message.includes('Failed to load language') ||
      message.includes('Query error') ||
      message.includes('Error building code graph'))
  ) {
    // Suppress these expected errors in test environment
    return;
  }
  // Log other errors normally
  originalConsoleError.apply(console, args);
};

// Note: Jest lifecycle hooks are not available in setup files
// Individual test files should handle their own cleanup if needed

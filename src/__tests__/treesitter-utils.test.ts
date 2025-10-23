/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  parseCode,
  queryTreeWithCode,
  treeToJSON,
  getNodeAtPosition,
  dispose,
} from '../lib/treesitter-utils';

// Mock the global Function to intercept dynamic imports
const originalFunction = global.Function;
const mockModules: Record<string, any> = {
  'https://cdn.jsdelivr.net/npm/web-tree-sitter@0.25.3/tree-sitter.js': {
    Parser: class MockParser {
      static async init() {
        // Mock init
      }

      setLanguage(lang: any) {
        this.language = lang;
      }

      parse(code: string) {
        return {
          rootNode: {
            type: 'program',
            text: code,
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: code.length },
            childCount: 0,
            child: () => null,
          },
        };
      }
    },
    Language: {
      load: async () => ({
        query: () => ({
          matches: () => [
            {
              patternIndex: 0,
              captures: [
                {
                  name: 'test',
                  node: {
                    type: 'identifier',
                    text: 'x',
                    startPosition: { row: 0, column: 6 },
                    endPosition: { row: 0, column: 7 },
                  },
                },
              ],
            },
          ],
        }),
      }),
    },
  },
};

// Mock Function constructor to handle dynamic imports
(global as any).Function = function (...args: any[]) {
  const code = args[args.length - 1];
  if (code && code.includes('import(')) {
    return async () => {
      const match = code.match(/import\("([^"]+)"\)/);
      if (match && mockModules[match[1]]) {
        return mockModules[match[1]];
      }
      throw new Error(`Module not mocked: ${match?.[1]}`);
    };
  }
  return originalFunction.apply(this, args);
};

describe('TreeSitter Utils (Web-based)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dispose();
  });

  describe('parseCode', () => {
    it('should parse code and return tree structure', async () => {
      const result = await parseCode('const x = 1;', 'javascript');

      expect(result).toHaveProperty('rootNode');
      expect(result.rootNode).toHaveProperty('type');
      expect(result.rootNode).toHaveProperty('text');
      expect(result.rootNode).toHaveProperty('startPosition');
      expect(result.rootNode).toHaveProperty('endPosition');
    });

    it('should handle unsupported languages', async () => {
      await expect(parseCode('const x = 1;', 'unsupported-lang')).rejects.toThrow(
        'Unsupported language'
      );
    });

    it('should return correct tree structure', async () => {
      const result = await parseCode('const x = 1;', 'javascript');

      expect(result.rootNode.type).toBe('program');
      expect(result.rootNode.text).toBe('const x = 1;');
      expect(result.rootNode.startPosition).toEqual({ row: 0, column: 0 });
    });
  });

  describe('queryTreeWithCode', () => {
    it('should query code and return matches', async () => {
      const result = await queryTreeWithCode('const x = 1;', '(identifier) @var', 'javascript');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return matches with correct structure', async () => {
      const result = await queryTreeWithCode('const x = 1;', '(identifier) @var', 'javascript');

      expect(result[0]).toHaveProperty('pattern');
      expect(result[0]).toHaveProperty('captures');
      expect(Array.isArray(result[0].captures)).toBe(true);
    });

    it('should handle unsupported languages in query', async () => {
      await expect(
        queryTreeWithCode('const x = 1;', '(identifier) @var', 'unsupported-lang')
      ).rejects.toThrow('Unsupported language');
    });
  });

  describe('treeToJSON', () => {
    it('should return tree node as-is', () => {
      const node = {
        type: 'program',
        text: 'const x = 1;',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 12 },
        children: [],
      };

      const result = treeToJSON(node);
      expect(result).toEqual(node);
    });
  });

  describe('getNodeAtPosition', () => {
    it('should find node at specific position', () => {
      const tree = {
        type: 'program',
        text: 'const x = 1;',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 12 },
        children: [
          {
            type: 'identifier',
            text: 'x',
            startPosition: { row: 0, column: 6 },
            endPosition: { row: 0, column: 7 },
            children: [],
          },
        ],
      };

      const result = getNodeAtPosition(tree, 0, 6);
      expect(result?.type).toBe('identifier');
      expect(result?.text).toBe('x');
    });

    it('should return null if position is outside tree', () => {
      const tree = {
        type: 'program',
        text: 'const x = 1;',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 12 },
        children: [],
      };

      const result = getNodeAtPosition(tree, 5, 0);
      expect(result).toBeNull();
    });

    it('should return null if tree is null', () => {
      const result = getNodeAtPosition(null as any, 0, 0);
      expect(result).toBeNull();
    });

    it('should find nested nodes', () => {
      const tree = {
        type: 'program',
        text: 'const x = 1;',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 12 },
        children: [
          {
            type: 'variable_declaration',
            text: 'const x = 1;',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 12 },
            children: [
              {
                type: 'identifier',
                text: 'x',
                startPosition: { row: 0, column: 6 },
                endPosition: { row: 0, column: 7 },
              },
            ],
          },
        ],
      };

      const result = getNodeAtPosition(tree, 0, 6);
      expect(result?.type).toBe('identifier');
    });
  });

  describe('dispose', () => {
    it('should clear caches', () => {
      expect(() => dispose()).not.toThrow();
    });

    it('should allow re-initialization after dispose', async () => {
      dispose();
      // Should be able to parse again after dispose
      const result = await parseCode('const x = 1;', 'javascript');
      expect(result).toHaveProperty('rootNode');
    });
  });
});

/**
 * Multi-language instantiation tests
 * Tests for enhanced new/instantiation handling across different languages
 */

import { describe, it, expect } from '@jest/globals';
import { getLanguageParser } from '@/lib/language-parsers';

// Mock TreeNode for testing
const createMockNode = (type: string, text: string, children?: unknown[]): unknown => ({
  type,
  text,
  children: children || [],
  isNamed: true,
});

describe('Multi-language Instantiation Support', () => {
  describe('JavaScript Parser', () => {
    const parser = getLanguageParser('javascript');

    it('should extract simple new expressions', () => {
      const node = createMockNode('new_expression', 'new User()', [
        createMockNode('identifier', 'User'),
      ]);

      const refs = parser.extractInstantiations(node, 'method_definition:addUser');

      expect(refs).toHaveLength(1);
      expect(refs[0]).toEqual({
        caller: 'method_definition:addUser',
        callee: 'User',
        type: 'instantiation',
        metadata: {
          nodeType: 'new_expression',
          targetType: 'class_declaration',
          fullExpression: 'new User()',
        },
      });
    });

    it('should extract member expression new calls', () => {
      const memberExpr = createMockNode('member_expression', 'module.User', [
        createMockNode('identifier', 'module'),
        createMockNode('identifier', 'User'),
      ]);

      const node = createMockNode('new_expression', 'new module.User()', [memberExpr]);

      const refs = parser.extractInstantiations(node, 'global');

      expect(refs).toHaveLength(1);
      expect(refs[0].callee).toBe('User');
      expect(refs[0].type).toBe('instantiation');
    });

    it('should extract direct function calls', () => {
      const node = createMockNode('call_expression', 'validateEmail()', [
        createMockNode('identifier', 'validateEmail'),
      ]);

      const refs = parser.extractCalls(node, 'method_definition:getProfile');

      expect(refs).toHaveLength(1);
      expect(refs[0]).toEqual({
        caller: 'method_definition:getProfile',
        callee: 'validateEmail',
        type: 'call',
        metadata: {
          nodeType: 'call_expression',
          targetType: 'function_declaration',
        },
      });
    });

    it('should extract method calls from member expressions', () => {
      const memberExpr = createMockNode('member_expression', 'user.getProfile', [
        createMockNode('identifier', 'user'),
        createMockNode('identifier', 'getProfile'),
      ]);

      const node = createMockNode('call_expression', 'user.getProfile()', [memberExpr]);

      const refs = parser.extractCalls(node, 'global');

      expect(refs).toHaveLength(1);
      expect(refs[0]).toEqual({
        caller: 'global',
        callee: 'getProfile',
        type: 'method_call',
        metadata: {
          nodeType: 'call_expression',
          targetType: 'method_definition',
          fullExpression: 'user.getProfile',
        },
      });
    });
  });

  describe('Java Parser', () => {
    const parser = getLanguageParser('java');

    it('should extract simple object creation', () => {
      const node = createMockNode('object_creation_expression', 'new User()', [
        createMockNode('type_identifier', 'User'),
      ]);

      const refs = parser.extractInstantiations(node, 'method_declaration:addUser');

      expect(refs).toHaveLength(1);
      expect(refs[0]).toEqual({
        caller: 'method_declaration:addUser',
        callee: 'User',
        type: 'instantiation',
        metadata: {
          nodeType: 'object_creation_expression',
          targetType: 'class_declaration',
          fullExpression: 'new User()',
        },
      });
    });

    it('should extract generic type instantiation', () => {
      const genericType = createMockNode('generic_type', 'List<String>', [
        createMockNode('type_identifier', 'List'),
      ]);

      const node = createMockNode('object_creation_expression', 'new List<String>()', [
        genericType,
      ]);

      const refs = parser.extractInstantiations(node, 'global');

      expect(refs).toHaveLength(1);
      expect(refs[0].callee).toBe('List');
      expect(refs[0].type).toBe('instantiation');
    });

    it('should extract method invocations', () => {
      const node = createMockNode('method_invocation', 'validateEmail()', [
        createMockNode('identifier', 'validateEmail'),
      ]);

      const refs = parser.extractCalls(node, 'method_declaration:getProfile');

      expect(refs).toHaveLength(1);
      expect(refs[0]).toEqual({
        caller: 'method_declaration:getProfile',
        callee: 'validateEmail',
        type: 'call',
        metadata: {
          nodeType: 'method_invocation',
          targetType: 'method_declaration',
          fullExpression: 'validateEmail()',
        },
      });
    });
  });

  describe('Python Parser', () => {
    const parser = getLanguageParser('python');

    it('should extract class instantiation (uppercase heuristic)', () => {
      const node = createMockNode('call', 'User()', [createMockNode('identifier', 'User')]);

      const refs = parser.extractInstantiations(node, 'function_definition:add_user');

      expect(refs).toHaveLength(1);
      expect(refs[0]).toEqual({
        caller: 'function_definition:add_user',
        callee: 'User',
        type: 'instantiation',
        metadata: {
          nodeType: 'call',
          targetType: 'class_definition',
          fullExpression: 'User()',
          heuristic: 'uppercase_name',
        },
      });
    });

    it('should extract function calls (lowercase heuristic)', () => {
      const node = createMockNode('call', 'validate_email()', [
        createMockNode('identifier', 'validate_email'),
      ]);

      const refs = parser.extractCalls(node, 'function_definition:get_profile');

      expect(refs).toHaveLength(1);
      expect(refs[0]).toEqual({
        caller: 'function_definition:get_profile',
        callee: 'validate_email',
        type: 'call',
        metadata: {
          nodeType: 'call',
          targetType: 'function_definition',
          fullExpression: 'validate_email()',
          heuristic: 'lowercase_name',
        },
      });
    });

    it('should extract module class instantiation', () => {
      const attrNode = createMockNode('attribute', 'models.User', [
        createMockNode('identifier', 'models'),
        createMockNode('identifier', 'User'),
      ]);

      const node = createMockNode('call', 'models.User()', [attrNode]);

      const refs = parser.extractInstantiations(node, 'global');

      expect(refs).toHaveLength(1);
      expect(refs[0].callee).toBe('User');
      expect(refs[0].type).toBe('instantiation');
    });
  });

  describe('TypeScript Parser', () => {
    const parser = getLanguageParser('typescript');

    it('should inherit JavaScript behavior', () => {
      const node = createMockNode('new_expression', 'new User()', [
        createMockNode('identifier', 'User'),
      ]);

      const refs = parser.extractInstantiations(node, 'method_definition:addUser');

      expect(refs).toHaveLength(1);
      expect(refs[0].callee).toBe('User');
      expect(refs[0].type).toBe('instantiation');
    });

    it('should include TypeScript-specific definition types', () => {
      const definitionTypes = parser.getDefinitionNodeTypes();

      expect(definitionTypes).toContain('interface_declaration');
      expect(definitionTypes).toContain('type_alias_declaration');
      expect(definitionTypes).toContain('function_declaration');
      expect(definitionTypes).toContain('class_declaration');
    });
  });

  describe('Language Parser Factory', () => {
    it('should return correct parser for each language', () => {
      expect(getLanguageParser('javascript').constructor.name).toBe('JavaScriptParser');
      expect(getLanguageParser('typescript').constructor.name).toBe('TypeScriptParser');
      expect(getLanguageParser('java').constructor.name).toBe('JavaParser');
      expect(getLanguageParser('python').constructor.name).toBe('PythonParser');
    });

    it('should default to JavaScript parser for unknown languages', () => {
      expect(getLanguageParser('unknown').constructor.name).toBe('JavaScriptParser');
    });
  });

  describe('Integration Test Scenarios', () => {
    it('should demonstrate the User-UserManager relationship problem is solved', () => {
      // This test demonstrates the conceptual fix for the original problem
      // In the real scenario, this would be tested with actual TreeSitter parsing

      const jsParser = getLanguageParser('javascript');

      // Simulate the "new User()" expression from UserManager.addUser method
      const newUserNode = createMockNode('new_expression', 'new User(name, email)', [
        createMockNode('identifier', 'User'),
      ]);

      const instantiationRefs = jsParser.extractInstantiations(
        newUserNode,
        'method_definition:addUser'
      );

      expect(instantiationRefs).toHaveLength(1);
      expect(instantiationRefs[0]).toEqual({
        caller: 'method_definition:addUser',
        callee: 'User',
        type: 'instantiation',
        metadata: {
          nodeType: 'new_expression',
          targetType: 'class_declaration',
          fullExpression: 'new User(name, email)',
        },
      });

      // The key improvement: metadata.targetType tells us to look for 'class_declaration:User'
      // instead of the old broken logic that looked for 'instantiation:User'
      expect(instantiationRefs[0].metadata?.targetType).toBe('class_declaration');
    });
  });
});

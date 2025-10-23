/**
 * Language-specific parsers for handling different instantiation patterns
 * Provides extensible architecture for multi-language support
 */

import { TreeNode } from './treesitter-utils';

export interface ReferenceInfo {
  caller: string;
  callee: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface LanguageParser {
  /**
   * Extract instantiation references from AST node
   */
  extractInstantiations(node: TreeNode, context: string): ReferenceInfo[];

  /**
   * Extract method/function call references from AST node
   */
  extractCalls(node: TreeNode, context: string): ReferenceInfo[];

  /**
   * Extract member access references from AST node
   */
  extractMemberAccess(node: TreeNode, context: string): ReferenceInfo[];

  /**
   * Get supported node types for definitions
   */
  getDefinitionNodeTypes(): string[];

  /**
   * Get supported node types for context (functions, classes, etc.)
   */
  getContextNodeTypes(): string[];
}

/**
 * JavaScript/TypeScript parser
 */
export class JavaScriptParser implements LanguageParser {
  extractInstantiations(node: TreeNode, context: string): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];

    if (node.type === 'new_expression' && node.children) {
      // Handle: new ClassName()
      // Handle: new module.ClassName()
      // Handle: new this.ClassName()

      let classNode: TreeNode | undefined;

      // Simple case: new ClassName()
      classNode = node.children.find((child) => child.type === 'identifier');

      // Member expression case: new module.ClassName()
      if (!classNode) {
        const memberExpr = node.children.find((child) => child.type === 'member_expression');
        if (memberExpr && memberExpr.children) {
          classNode = memberExpr.children[memberExpr.children.length - 1];
        }
      }

      if (classNode && classNode.text) {
        references.push({
          caller: context,
          callee: classNode.text,
          type: 'instantiation',
          metadata: {
            nodeType: 'new_expression',
            targetType: 'class_declaration',
            fullExpression: node.text,
          },
        });
      }
    }

    return references;
  }

  extractCalls(node: TreeNode, context: string): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];

    if (node.type === 'call_expression' && node.children) {
      const funcNode = node.children[0];

      // Handle direct function calls: functionName()
      if (funcNode && funcNode.type === 'identifier') {
        references.push({
          caller: context,
          callee: funcNode.text,
          type: 'call',
          metadata: {
            nodeType: 'call_expression',
            targetType: 'function_declaration',
          },
        });
      }

      // Handle member function calls: obj.method()
      if (funcNode && funcNode.type === 'member_expression' && funcNode.children) {
        const methodNode = funcNode.children[funcNode.children.length - 1];
        if (methodNode && methodNode.type === 'identifier') {
          references.push({
            caller: context,
            callee: methodNode.text,
            type: 'method_call',
            metadata: {
              nodeType: 'call_expression',
              targetType: 'method_definition',
              fullExpression: funcNode.text,
            },
          });
        }
      }
    }

    return references;
  }

  extractMemberAccess(node: TreeNode, context: string): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];

    if (node.type === 'member_expression' && node.children) {
      const propertyNode = node.children[node.children.length - 1];
      if (propertyNode && propertyNode.type === 'identifier') {
        references.push({
          caller: context,
          callee: propertyNode.text,
          type: 'method_call',
          metadata: {
            nodeType: 'member_expression',
            targetType: 'method_definition',
          },
        });
      }
    }

    return references;
  }

  getDefinitionNodeTypes(): string[] {
    return ['function_declaration', 'class_declaration', 'arrow_function', 'method_definition'];
  }

  getContextNodeTypes(): string[] {
    return ['function_declaration', 'class_declaration', 'arrow_function', 'method_definition'];
  }
}

/**
 * TypeScript parser (extends JavaScript with additional types)
 */
export class TypeScriptParser extends JavaScriptParser {
  getDefinitionNodeTypes(): string[] {
    return [...super.getDefinitionNodeTypes(), 'interface_declaration', 'type_alias_declaration'];
  }

  getContextNodeTypes(): string[] {
    return [...super.getContextNodeTypes(), 'interface_declaration'];
  }
}

/**
 * Java parser
 */
export class JavaParser implements LanguageParser {
  extractInstantiations(node: TreeNode, context: string): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];

    if (node.type === 'object_creation_expression' && node.children) {
      // Handle: new ClassName()
      // Handle: new package.ClassName()
      // Handle: new ClassName<T>() (generics)

      let typeNode: TreeNode | undefined;

      // Look for type_identifier or generic_type
      typeNode = node.children.find(
        (child) => child.type === 'type_identifier' || child.type === 'generic_type'
      );

      // If it's a generic type, get the base type
      if (typeNode && typeNode.type === 'generic_type' && typeNode.children) {
        typeNode = typeNode.children.find((child) => child.type === 'type_identifier');
      }

      // Handle qualified names (package.ClassName)
      if (!typeNode) {
        const scopedTypeId = node.children.find((child) => child.type === 'scoped_type_identifier');
        if (scopedTypeId && scopedTypeId.children) {
          typeNode = scopedTypeId.children[scopedTypeId.children.length - 1];
        }
      }

      if (typeNode && typeNode.text) {
        references.push({
          caller: context,
          callee: typeNode.text,
          type: 'instantiation',
          metadata: {
            nodeType: 'object_creation_expression',
            targetType: 'class_declaration',
            fullExpression: node.text,
          },
        });
      }
    }

    return references;
  }

  extractCalls(node: TreeNode, context: string): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];

    if (node.type === 'method_invocation' && node.children) {
      // Handle: methodName()
      // Handle: obj.methodName()
      // Handle: Class.staticMethod()

      let nameNode: TreeNode | undefined;

      // Look for the method name (usually the last identifier)
      const identifiers = node.children.filter((child) => child.type === 'identifier');
      if (identifiers.length > 0) {
        nameNode = identifiers[identifiers.length - 1];
      }

      if (nameNode && nameNode.text) {
        references.push({
          caller: context,
          callee: nameNode.text,
          type: 'call',
          metadata: {
            nodeType: 'method_invocation',
            targetType: 'method_declaration',
            fullExpression: node.text,
          },
        });
      }
    }

    return references;
  }

  extractMemberAccess(node: TreeNode, context: string): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];

    if (node.type === 'field_access' && node.children) {
      const fieldNode = node.children[node.children.length - 1];
      if (fieldNode && fieldNode.type === 'identifier') {
        references.push({
          caller: context,
          callee: fieldNode.text,
          type: 'field_access',
          metadata: {
            nodeType: 'field_access',
            targetType: 'field_declaration',
          },
        });
      }
    }

    return references;
  }

  getDefinitionNodeTypes(): string[] {
    return ['method_declaration', 'class_declaration', 'field_declaration'];
  }

  getContextNodeTypes(): string[] {
    return ['method_declaration', 'class_declaration'];
  }
}

/**
 * Python parser
 */
export class PythonParser implements LanguageParser {
  extractInstantiations(node: TreeNode, context: string): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];

    // In Python, class instantiation is just a call expression
    if (node.type === 'call' && node.children) {
      const funcNode = node.children[0];

      // Handle: ClassName()
      // Handle: module.ClassName()
      // Handle: self.ClassName()

      let className: string | undefined;

      if (funcNode && funcNode.type === 'identifier') {
        className = funcNode.text;
      } else if (funcNode && funcNode.type === 'attribute' && funcNode.children) {
        // Handle attribute access like module.ClassName
        const attrNode = funcNode.children[funcNode.children.length - 1];
        if (attrNode && attrNode.type === 'identifier') {
          className = attrNode.text;
        }
      }

      // Heuristic: if the name starts with uppercase, it's likely a class
      // In a real implementation, we'd need type information or symbol table
      if (className && className[0] === className[0].toUpperCase()) {
        references.push({
          caller: context,
          callee: className,
          type: 'instantiation',
          metadata: {
            nodeType: 'call',
            targetType: 'class_definition',
            fullExpression: node.text,
            heuristic: 'uppercase_name',
          },
        });
      }
    }

    return references;
  }

  extractCalls(node: TreeNode, context: string): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];

    if (node.type === 'call' && node.children) {
      const funcNode = node.children[0];

      // Handle: function_name()
      // Handle: module.function_name()
      // Handle: obj.method_name()

      let functionName: string | undefined;

      if (funcNode && funcNode.type === 'identifier') {
        functionName = funcNode.text;
      } else if (funcNode && funcNode.type === 'attribute' && funcNode.children) {
        // Handle attribute access like module.function or obj.method
        const attrNode = funcNode.children[funcNode.children.length - 1];
        if (attrNode && attrNode.type === 'identifier') {
          functionName = attrNode.text;
        }
      }

      // Heuristic: if the name starts with lowercase, it's likely a function
      // Skip if it looks like a class name (handled in extractInstantiations)
      if (functionName && functionName[0] === functionName[0].toLowerCase()) {
        references.push({
          caller: context,
          callee: functionName,
          type: 'call',
          metadata: {
            nodeType: 'call',
            targetType: 'function_definition',
            fullExpression: node.text,
            heuristic: 'lowercase_name',
          },
        });
      }
    }

    return references;
  }

  extractMemberAccess(node: TreeNode, context: string): ReferenceInfo[] {
    const references: ReferenceInfo[] = [];

    if (node.type === 'attribute' && node.children) {
      const attrNode = node.children[node.children.length - 1];
      if (attrNode && attrNode.type === 'identifier') {
        references.push({
          caller: context,
          callee: attrNode.text,
          type: 'method_call',
          metadata: {
            nodeType: 'attribute',
            targetType: 'function_definition',
          },
        });
      }
    }

    return references;
  }

  getDefinitionNodeTypes(): string[] {
    return ['function_definition', 'class_definition'];
  }

  getContextNodeTypes(): string[] {
    return ['function_definition', 'class_definition'];
  }
}

/**
 * Factory function to get appropriate parser for language
 */
export function getLanguageParser(language: string): LanguageParser {
  switch (language.toLowerCase()) {
    case 'javascript':
      return new JavaScriptParser();
    case 'typescript':
      return new TypeScriptParser();
    case 'java':
      return new JavaParser();
    case 'python':
      return new PythonParser();
    default:
      // Default to JavaScript parser for unknown languages
      return new JavaScriptParser();
  }
}

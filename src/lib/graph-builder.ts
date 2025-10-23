/**
 * Graph Builder - Constructs code relationship graphs using TreeSitter
 * Uses graphology for graph representation and D3.js for visualization
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import Graph from 'graphology';
import { parseCode, TreeNode } from './treesitter-utils';

export interface NodeAttributes {
  label: string;
  type: string;
  size?: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface EdgeAttributes {
  type: string;
  weight?: number;
}

export type CodeGraph = Graph<NodeAttributes, EdgeAttributes>;

export interface GraphData {
  nodes: Array<{ id: string; label: string; type: string; color?: string; size?: number }>;
  edges: Array<{ source: string; target: string; type: string }>;
  metadata: {
    language: string;
    totalNodes: number;
    totalEdges: number;
  };
}

/**
 * Extract function/class definitions from AST
 */
function extractDefinitions(
  node: TreeNode | null,
  language: string,
  definitions: Map<string, GraphNode> = new Map()
): Map<string, GraphNode> {
  if (!node) return definitions;

  // Language-specific patterns for definitions
  const patterns: Record<string, string[]> = {
    javascript: ['function_declaration', 'class_declaration', 'arrow_function'],
    typescript: [
      'function_declaration',
      'class_declaration',
      'interface_declaration',
      'type_alias_declaration',
    ],
    python: ['function_definition', 'class_definition'],
    java: ['method_declaration', 'class_declaration'],
    rust: ['function_item', 'struct_item', 'impl_item'],
  };

  const langPatterns = patterns[language] || patterns.javascript;

  if (node.isNamed && langPatterns.includes(node.type)) {
    // Extract name from node
    let name = 'unknown';
    if (node.children) {
      const nameNode = node.children.find(
        (child) => child.type === 'identifier' || child.type === 'type_identifier'
      );
      if (nameNode) {
        name = nameNode.text;
      }
    }

    const id = `${node.type}:${name}`;
    if (!definitions.has(id)) {
      definitions.set(id, {
        id,
        label: name,
        type: node.type,
        size: 10,
        metadata: {
          startLine: node.startPosition.row,
          endLine: node.endPosition.row,
          nodeType: node.type,
        },
      });
    }
  }

  // Recursively process children
  if (node.children) {
    for (const child of node.children) {
      extractDefinitions(child, language, definitions);
    }
  }

  return definitions;
}

/**
 * Extract function calls and references
 */
function extractReferences(
  node: TreeNode | null,
  language: string,
  references: Array<{ caller: string; callee: string; type: string }> = []
): Array<{ caller: string; callee: string; type: string }> {
  if (!node) return references;

  // Detect function calls
  if (node.type === 'call_expression' && node.children) {
    const funcNode = node.children[0];
    if (funcNode && funcNode.type === 'identifier') {
      references.push({
        caller: 'global',
        callee: funcNode.text,
        type: 'call',
      });
    }
  }

  // Detect class instantiation
  if (node.type === 'new_expression' && node.children) {
    const classNode = node.children.find((child) => child.type === 'identifier');
    if (classNode) {
      references.push({
        caller: 'global',
        callee: classNode.text,
        type: 'instantiation',
      });
    }
  }

  // Recursively process children
  if (node.children) {
    for (const child of node.children) {
      extractReferences(child, language, references);
    }
  }

  return references;
}

/**
 * Build a code relationship graph from source code
 */
export async function buildCodeGraph(code: string, language: string): Promise<CodeGraph> {
  try {
    // Parse code using TreeSitter
    const parseResult = await parseCode(code, language);
    const rootNode = parseResult.rootNode;

    // Extract definitions (functions, classes, etc.)
    const definitions = extractDefinitions(rootNode, language);

    // Extract references (calls, instantiations, etc.)
    const references = extractReferences(rootNode, language);

    // Convert definitions to graph nodes
    const nodes: GraphNode[] = Array.from(definitions.values());

    // Create edges from references
    const edges: GraphEdge[] = references
      .filter((ref) => definitions.has(`${ref.type}:${ref.callee}`))
      .map((ref) => ({
        source: ref.caller,
        target: `${ref.type}:${ref.callee}`,
        type: ref.type,
        weight: 1,
      }));

    return {
      nodes,
      edges,
      metadata: {
        language,
        totalNodes: nodes.length,
        totalEdges: edges.length,
      },
    };
  } catch (error) {
    console.error('Error building code graph:', error);
    throw error;
  }
}

/**
 * Assign colors to nodes based on type
 */
export function colorizeNodes(nodes: GraphNode[]): GraphNode[] {
  const colorMap: Record<string, string> = {
    function_declaration: '#3b82f6',
    class_declaration: '#8b5cf6',
    interface_declaration: '#ec4899',
    type_alias_declaration: '#f59e0b',
    function_definition: '#10b981',
    class_definition: '#06b6d4',
    method_declaration: '#6366f1',
    struct_item: '#14b8a6',
    impl_item: '#f97316',
  };

  return nodes.map((node) => ({
    ...node,
    color: colorMap[node.type] || '#6b7280',
  }));
}

/**
 * Calculate node sizes based on degree (number of connections)
 */
export function calculateNodeSizes(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const degreeMap = new Map<string, number>();

  // Count connections for each node
  edges.forEach((edge) => {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  });

  return nodes.map((node) => ({
    ...node,
    size: Math.max(10, (degreeMap.get(node.id) || 0) * 5 + 10),
  }));
}

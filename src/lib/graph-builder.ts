/**
 * Graph Builder - Constructs code relationship graphs using TreeSitter
 * Uses graphology for graph representation and D3.js for visualization
 */

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
  definitions: Map<string, NodeAttributes> = new Map()
): Map<string, NodeAttributes> {
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
 * Build a code relationship graph from source code using Graphology
 */
export async function buildCodeGraph(code: string, language: string): Promise<CodeGraph> {
  try {
    // Create a new directed graph
    const graph = new Graph<NodeAttributes, EdgeAttributes>();

    // Parse code using TreeSitter
    const parseResult = await parseCode(code, language);
    const rootNode = parseResult.rootNode;

    // Extract definitions (functions, classes, etc.)
    const definitions = extractDefinitions(rootNode, language);

    // Add nodes to graph
    definitions.forEach((attrs, nodeId) => {
      graph.addNode(nodeId, attrs);
    });

    // Extract references (calls, instantiations, etc.)
    const references = extractReferences(rootNode, language);

    // Add edges to graph
    references.forEach((ref) => {
      const targetId = `${ref.type}:${ref.callee}`;
      if (definitions.has(targetId)) {
        graph.addEdge(ref.caller, targetId, {
          type: ref.type,
          weight: 1,
        });
      }
    });

    return graph;
  } catch (error) {
    console.error('Error building code graph:', error);
    throw error;
  }
}

/**
 * Assign colors to nodes based on type
 */
export function colorizeGraph(graph: CodeGraph): void {
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

  graph.forEachNode((_nodeId, attrs) => {
    attrs.color = colorMap[attrs.type] || '#6b7280';
  });
}

/**
 * Calculate node sizes based on degree (number of connections)
 */
export function calculateNodeSizesInGraph(graph: CodeGraph): void {
  graph.forEachNode((nodeId) => {
    const degree = graph.degree(nodeId);
    const attrs = graph.getNodeAttributes(nodeId);
    attrs.size = Math.max(10, degree * 5 + 10);
  });
}

/**
 * Convert Graphology graph to D3-compatible data format
 * This format is used for both force-directed and hierarchical visualizations
 */
export function graphToD3Data(graph: CodeGraph, language: string = 'unknown'): GraphData {
  const nodes = graph.nodes().map((nodeId) => {
    const attrs = graph.getNodeAttributes(nodeId);
    return {
      id: nodeId,
      label: attrs.label,
      type: attrs.type,
      color: attrs.color,
      size: attrs.size,
    };
  });

  const edges = graph.edges().map((edgeId) => {
    const [source, target] = graph.extremities(edgeId);
    const attrs = graph.getEdgeAttributes(edgeId);
    return {
      source,
      target,
      type: attrs.type,
    };
  });

  return {
    nodes,
    edges,
    metadata: {
      language,
      totalNodes: nodes.length,
      totalEdges: edges.length,
    },
  };
}

/**
 * Export hierarchical graph utilities for convenience
 */
export { graphDataToHierarchy, graphToHierarchy } from './hierarchical-graph';
export type { HierarchicalNode } from './hierarchical-graph';

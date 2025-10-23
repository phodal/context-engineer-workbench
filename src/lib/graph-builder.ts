/**
 * Graph Builder - Constructs code relationship graphs using TreeSitter
 * Uses graphology for graph representation and D3.js for visualization
 */

import Graph from 'graphology';
import { parseCode, TreeNode } from './treesitter-utils';
import { getLanguageParser, ReferenceInfo } from './language-parsers';

export interface NodeAttributes {
  label: string;
  type: string;
  size?: number;
  color?: string;
  parent?: string; // Track parent node for hierarchical relationships
  metadata?: Record<string, unknown>;
}

export interface EdgeAttributes {
  type: string;
  weight?: number;
  originalCaller?: string; // Track the original caller for detailed analysis
}

export type CodeGraph = Graph<NodeAttributes, EdgeAttributes>;

export interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    color?: string;
    size?: number;
    metadata?: Record<string, unknown>;
  }>;
  edges: Array<{ source: string; target: string; type: string }>;
  metadata: {
    language: string;
    totalNodes: number;
    totalEdges: number;
  };
}

/**
 * Extract function/class definitions from AST using language-specific parser
 */
function extractDefinitions(
  node: TreeNode | null,
  language: string,
  definitions: Map<string, NodeAttributes> = new Map(),
  parentContext: string | null = null
): Map<string, NodeAttributes> {
  if (!node) return definitions;

  // Get language-specific parser
  const parser = getLanguageParser(language);
  const langPatterns = parser.getDefinitionNodeTypes();

  let currentContext = parentContext;

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
        parent: parentContext || undefined, // Track parent relationship
        metadata: {
          startLine: node.startPosition.row,
          endLine: node.endPosition.row,
          startColumn: node.startPosition.column,
          endColumn: node.endPosition.column,
          nodeType: node.type,
        },
      });
    }

    // Update current context for children
    currentContext = id;
  }

  // Recursively process children with updated context
  if (node.children) {
    for (const child of node.children) {
      extractDefinitions(child, language, definitions, currentContext);
    }
  }

  return definitions;
}

/**
 * Extract function calls and references with context awareness using language-specific parsers
 */
function extractReferences(
  node: TreeNode | null,
  language: string,
  references: ReferenceInfo[] = [],
  currentContext: string = 'global'
): ReferenceInfo[] {
  if (!node) return references;

  // Get language-specific parser
  const parser = getLanguageParser(language);

  // Update context if we're entering a function or method
  let context = currentContext;
  if (node.isNamed) {
    const langPatterns = parser.getContextNodeTypes();

    if (langPatterns.includes(node.type)) {
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
      context = `${node.type}:${name}`;
    }
  }

  // Use language-specific parsers to extract different types of references
  const instantiations = parser.extractInstantiations(node, context);
  const calls = parser.extractCalls(node, context);
  const memberAccess = parser.extractMemberAccess(node, context);

  // Add all extracted references
  references.push(...instantiations, ...calls, ...memberAccess);

  // Recursively process children with updated context
  if (node.children) {
    for (const child of node.children) {
      extractReferences(child, language, references, context);
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
    const references = extractReferences(rootNode, language, [], 'global');

    // Add edges to graph with improved target resolution and parent context handling
    references.forEach((ref) => {
      // Try to find the target node using metadata hints
      let targetId: string | null = null;

      // Use metadata to determine the expected target type
      const expectedTargetType = ref.metadata?.targetType as string;
      if (expectedTargetType) {
        const targetWithType = `${expectedTargetType}:${ref.callee}`;
        if (definitions.has(targetWithType)) {
          targetId = targetWithType;
        }
      }

      // Fallback: try common patterns
      if (!targetId) {
        const commonTargets = [
          `class_declaration:${ref.callee}`,
          `function_declaration:${ref.callee}`,
          `method_declaration:${ref.callee}`,
          `function_definition:${ref.callee}`,
          `class_definition:${ref.callee}`,
          `method_definition:${ref.callee}`,
        ];

        for (const target of commonTargets) {
          if (definitions.has(target)) {
            targetId = target;
            break;
          }
        }
      }

      // Determine the source node for the edge
      let sourceId = ref.caller;

      // If the caller is a method, we might want to show the relationship from the parent class
      if (definitions.has(ref.caller)) {
        const callerDef = definitions.get(ref.caller);

        // For instantiation relationships, show from the parent class if it exists
        if (
          ref.type === 'instantiation' &&
          callerDef?.parent &&
          callerDef.type === 'method_definition'
        ) {
          sourceId = callerDef.parent;
        }
      }

      // Only add edge if both source and target exist in definitions
      if (targetId && (definitions.has(sourceId) || sourceId === 'global')) {
        // Check if edge already exists to avoid duplicates
        const existingEdge = graph.edges().find((edgeId) => {
          return graph.source(edgeId) === sourceId && graph.target(edgeId) === targetId;
        });

        if (!existingEdge) {
          graph.addEdge(sourceId, targetId, {
            type: ref.type,
            weight: 1,
            originalCaller: ref.caller, // Keep track of the original caller
          });
        }
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
      metadata: attrs.metadata,
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

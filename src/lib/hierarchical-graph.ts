/**
 * Hierarchical Graph - Structures code relationships as a hierarchy
 * Uses graphology for graph representation and supports D3.js Icicle visualization
 */

import { CodeGraph, GraphData } from './graph-builder';

/**
 * Hierarchical node structure for Icicle visualization
 */
export interface HierarchicalNode {
  name: string;
  id: string;
  type: string;
  color?: string;
  size?: number;
  children?: HierarchicalNode[];
  metadata?: Record<string, unknown>;
}

/**
 * Convert a flat graph to a hierarchical structure
 * Groups nodes by type and creates parent-child relationships
 */
export function graphToHierarchy(graph: CodeGraph): HierarchicalNode {
  const typeGroups = new Map<string, HierarchicalNode[]>();
  const nodeMap = new Map<string, HierarchicalNode>();

  // Group nodes by type
  graph.nodes().forEach((nodeId) => {
    const attrs = graph.getNodeAttributes(nodeId);
    const hierarchicalNode: HierarchicalNode = {
      name: attrs.label,
      id: nodeId,
      type: attrs.type,
      color: attrs.color,
      size: attrs.size,
      metadata: attrs.metadata,
    };
    nodeMap.set(nodeId, hierarchicalNode);

    if (!typeGroups.has(attrs.type)) {
      typeGroups.set(attrs.type, []);
    }
    typeGroups.get(attrs.type)!.push(hierarchicalNode);
  });

  // Create type category nodes
  const typeNodes: HierarchicalNode[] = [];
  typeGroups.forEach((nodes, type) => {
    typeNodes.push({
      name: type,
      id: `type:${type}`,
      type: 'category',
      children: nodes,
    });
  });

  // Create root node
  const root: HierarchicalNode = {
    name: 'Code Structure',
    id: 'root',
    type: 'root',
    children: typeNodes,
  };

  return root;
}

/**
 * Convert GraphData to hierarchical structure for Icicle visualization
 */
export function graphDataToHierarchy(graphData: GraphData): HierarchicalNode {
  const typeGroups = new Map<string, HierarchicalNode[]>();

  // Group nodes by type
  graphData.nodes.forEach((node) => {
    const hierarchicalNode: HierarchicalNode = {
      name: node.label,
      id: node.id,
      type: node.type,
      color: node.color,
      size: node.size,
    };

    if (!typeGroups.has(node.type)) {
      typeGroups.set(node.type, []);
    }
    typeGroups.get(node.type)!.push(hierarchicalNode);
  });

  // Create type category nodes
  const typeNodes: HierarchicalNode[] = [];
  typeGroups.forEach((nodes, type) => {
    typeNodes.push({
      name: type,
      id: `type:${type}`,
      type: 'category',
      children: nodes,
    });
  });

  // Create root node
  const root: HierarchicalNode = {
    name: 'Code Structure',
    id: 'root',
    type: 'root',
    children: typeNodes,
  };

  return root;
}

/**
 * Build a hierarchical graph from source code
 * Combines code parsing with hierarchical structuring
 */
export async function buildHierarchicalGraph(
  code: string,
  language: string,
  buildCodeGraphFn: (code: string, language: string) => Promise<CodeGraph>
): Promise<HierarchicalNode> {
  const graph = await buildCodeGraphFn(code, language);
  return graphToHierarchy(graph);
}

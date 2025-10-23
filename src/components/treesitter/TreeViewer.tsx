'use client';

import React, { useState, useCallback } from 'react';
import type { TreeNode } from '@/lib/treesitter-utils';

interface TreeViewerProps {
  tree: TreeNode | null;
  isLoading: boolean;
  onNodeClick?: (node: TreeNode) => void;
  highlightedNodeId?: number;
}

function TreeNodeComponent({
  node,
  depth = 0,
  onNodeClick,
  isHighlighted = false,
  highlightedNodeId,
}: {
  node: TreeNode;
  depth?: number;
  onNodeClick?: (node: TreeNode) => void;
  isHighlighted?: boolean;
  highlightedNodeId?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  // Determine node display name and styling
  let displayName = node.type;
  let nodeClass = 'text-blue-600';

  if (node.isMissing) {
    displayName = `MISSING ${node.isNamed ? node.type : `"${node.type}"`}`;
    nodeClass = 'text-red-600 font-semibold';
  } else if (node.isError) {
    displayName = 'ERROR';
    nodeClass = 'text-red-600 font-semibold';
  } else if (node.isNamed) {
    nodeClass = 'text-blue-600 font-semibold';
  } else if (node.isAnonymous) {
    displayName = `"${node.type}"`;
    nodeClass = 'text-slate-500';
  }

  const fieldNameDisplay = node.fieldName ? `${node.fieldName}: ` : '';
  const positionInfo = `[${node.startPosition.row}, ${node.startPosition.column}] - [${node.endPosition.row}, ${node.endPosition.column}]`;

  const handleClick = useCallback(() => {
    setExpanded(!expanded);
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [expanded, node, onNodeClick]);

  return (
    <div className="font-mono text-sm">
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors ${
          isHighlighted ? 'bg-yellow-100 border-l-2 border-yellow-500' : 'hover:bg-slate-100'
        }`}
        onClick={handleClick}
      >
        {hasChildren && (
          <span className="w-4 text-center text-slate-600">{expanded ? '▼' : '▶'}</span>
        )}
        {!hasChildren && <span className="w-4"></span>}

        <span className="text-slate-600 text-xs">{fieldNameDisplay}</span>
        <span className={nodeClass}>{displayName}</span>
        <span className="text-slate-400 text-xs ml-auto">{positionInfo}</span>
      </div>

      {expanded && hasChildren && (
        <div className="ml-4 border-l border-slate-200">
          {node.children!.map((child, idx) => (
            <TreeNodeComponent
              key={idx}
              node={child}
              depth={depth + 1}
              onNodeClick={onNodeClick}
              isHighlighted={isHighlighted && child.id === highlightedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeViewer({
  tree,
  isLoading,
  onNodeClick,
  highlightedNodeId,
}: TreeViewerProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-linear-to-r from-green-50 to-green-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Syntax Tree</h2>
        <p className="text-xs text-slate-600 mt-1">
          Parsed syntax tree structure with field names and positions
        </p>
      </div>

      <div className="p-4 h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
              <p className="mt-2 text-slate-600 text-sm">Parsing...</p>
            </div>
          </div>
        ) : tree ? (
          <TreeNodeComponent
            node={tree}
            onNodeClick={onNodeClick}
            highlightedNodeId={highlightedNodeId}
          />
        ) : (
          <p className="text-slate-500 text-sm">No tree to display</p>
        )}
      </div>
    </div>
  );
}

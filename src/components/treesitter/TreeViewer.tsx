'use client';

import React, { useState } from 'react';

interface TreeNode {
  type: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children?: TreeNode[];
}

interface TreeViewerProps {
  tree: TreeNode | null;
  isLoading: boolean;
}

function TreeNodeComponent({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="font-mono text-sm">
      <div
        className="flex items-center gap-2 py-1 hover:bg-blue-50 px-2 rounded cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren && <span className="w-4 text-center">{expanded ? '▼' : '▶'}</span>}
        {!hasChildren && <span className="w-4"></span>}

        <span className="font-semibold text-blue-600">{node.type}</span>
        <span className="text-slate-500 text-xs">
          ({node.startPosition.row}:{node.startPosition.column} - {node.endPosition.row}:
          {node.endPosition.column})
        </span>
      </div>

      {expanded && hasChildren && (
        <div className="ml-4 border-l border-slate-200">
          {node.children!.map((child, idx) => (
            <TreeNodeComponent key={idx} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeViewer({ tree, isLoading }: TreeViewerProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Syntax Tree</h2>
        <p className="text-xs text-slate-600 mt-1">Parsed syntax tree structure</p>
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
          <TreeNodeComponent node={tree} />
        ) : (
          <p className="text-slate-500 text-sm">No tree to display</p>
        )}
      </div>
    </div>
  );
}

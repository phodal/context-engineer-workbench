/**
 * Debug component to inspect graph data and identify rendering issues
 */

'use client';

import React from 'react';
import { GraphData } from '@/lib/graph-builder';

interface GraphDataInspectorProps {
  data: GraphData | null;
}

export default function GraphDataInspector({ data }: GraphDataInspectorProps) {
  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 Graph Data Inspector</h3>
        <p className="text-yellow-700">No graph data available</p>
      </div>
    );
  }

  // Analyze the data for potential issues
  const issues: string[] = [];
  const unknownNodes = data.nodes.filter((node) => node.label === 'unknown');
  const userNodes = data.nodes.filter((node) => node.label === 'User');
  const userManagerNodes = data.nodes.filter((node) => node.label === 'UserManager');
  const instantiationEdges = data.edges.filter((edge) => edge.type === 'instantiation');

  if (unknownNodes.length > 0) {
    issues.push(`Found ${unknownNodes.length} nodes with label "unknown"`);
  }

  if (userNodes.length === 0) {
    issues.push('No User nodes found');
  }

  if (userManagerNodes.length === 0) {
    issues.push('No UserManager nodes found');
  }

  if (instantiationEdges.length === 0) {
    issues.push('No instantiation edges found');
  }

  // Find the specific UserManager -> User edge
  const userManagerToUserEdges = instantiationEdges.filter((edge) => {
    const sourceNode = data.nodes.find((n) => n.id === edge.source);
    const targetNode = data.nodes.find((n) => n.id === edge.target);
    return sourceNode?.label === 'UserManager' && targetNode?.label === 'User';
  });

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">🔍 Graph Data Inspector</h3>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-red-700 mb-2">⚠️ Potential Issues:</h4>
          <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
            {issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Findings */}
      <div className="mb-4">
        <h4 className="font-semibold text-blue-700 mb-2">🎯 Key Findings:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">User nodes:</span> {userNodes.length}
            {userNodes.map((node) => (
              <div key={node.id} className="ml-4 text-xs text-gray-600">
                ID: {node.id}
              </div>
            ))}
          </div>
          <div>
            <span className="font-medium">UserManager nodes:</span> {userManagerNodes.length}
            {userManagerNodes.map((node) => (
              <div key={node.id} className="ml-4 text-xs text-gray-600">
                ID: {node.id}
              </div>
            ))}
          </div>
          <div>
            <span className="font-medium">Instantiation edges:</span> {instantiationEdges.length}
          </div>
          <div>
            <span className="font-medium">UserManager → User edges:</span>{' '}
            {userManagerToUserEdges.length}
            {userManagerToUserEdges.length > 0 && (
              <span className="ml-2 text-green-600 font-semibold">✅ FOUND!</span>
            )}
          </div>
        </div>
      </div>

      {/* All Nodes */}
      <div className="mb-4">
        <h4 className="font-semibold text-blue-700 mb-2">📋 All Nodes ({data.nodes.length}):</h4>
        <div className="max-h-40 overflow-y-auto bg-white rounded border p-2">
          {data.nodes.map((node) => (
            <div key={node.id} className="text-xs mb-1 p-1 border-b border-gray-100">
              <span className="font-mono text-blue-600">{node.id}</span>
              <span className="mx-2">→</span>
              <span className="font-semibold">{node.label}</span>
              <span className="text-gray-500 ml-2">({node.type})</span>
            </div>
          ))}
        </div>
      </div>

      {/* All Edges */}
      <div className="mb-4">
        <h4 className="font-semibold text-blue-700 mb-2">🔗 All Edges ({data.edges.length}):</h4>
        <div className="max-h-40 overflow-y-auto bg-white rounded border p-2">
          {data.edges.map((edge, index) => {
            const sourceNode = data.nodes.find((n) => n.id === edge.source);
            const targetNode = data.nodes.find((n) => n.id === edge.target);
            const isUserManagerToUser =
              sourceNode?.label === 'UserManager' && targetNode?.label === 'User';

            return (
              <div
                key={index}
                className={`text-xs mb-1 p-1 border-b border-gray-100 ${
                  isUserManagerToUser ? 'bg-green-100 border-green-300' : ''
                }`}
              >
                <span className="font-semibold">{sourceNode?.label || 'Unknown'}</span>
                <span className="mx-2 text-gray-500">--[{edge.type}]--&gt;</span>
                <span className="font-semibold">{targetNode?.label || 'Unknown'}</span>
                {isUserManagerToUser && (
                  <span className="ml-2 text-green-600 font-bold">🎯 TARGET EDGE!</span>
                )}
                <div className="text-gray-400 text-xs ml-4">
                  {edge.source} → {edge.target}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded border p-3">
        <h4 className="font-semibold text-blue-700 mb-2">📊 Summary:</h4>
        <div className="text-sm space-y-1">
          <div>
            Total nodes: <span className="font-semibold">{data.metadata.totalNodes}</span>
          </div>
          <div>
            Total edges: <span className="font-semibold">{data.metadata.totalEdges}</span>
          </div>
          <div>
            Language: <span className="font-semibold">{data.metadata.language}</span>
          </div>
          <div>
            UserManager → User relationship:
            <span
              className={`ml-2 font-semibold ${
                userManagerToUserEdges.length > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {userManagerToUserEdges.length > 0 ? '✅ Present' : '❌ Missing'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

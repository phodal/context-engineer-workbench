'use client';

import React, { useState } from 'react';
import type { StructuredOutput } from '@/lib/structured-output';
import { formatStructuredOutput } from '@/lib/structured-output';

interface StructuredOutputViewerProps {
  outputs: StructuredOutput[];
}

interface ExpandedState {
  [key: number]: boolean;
}

export default function StructuredOutputViewer({ outputs }: StructuredOutputViewerProps) {
  // Initialize with all outputs expanded by default
  const [expandedOutputs, setExpandedOutputs] = useState<ExpandedState>(
    outputs.reduce((acc, _, idx) => ({ ...acc, [idx]: true }), {})
  );
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (!outputs || outputs.length === 0) {
    return null;
  }

  const toggleExpanded = (index: number) => {
    setExpandedOutputs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const selectedOutput = outputs[selectedIndex];
  const formattedOutput = formatStructuredOutput(selectedOutput);

  return (
    <div className="mb-6 p-4 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Structured Output Parse</h3>

      {/* Output Tabs */}
      {outputs.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {outputs.map((output, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors ${
                selectedIndex === idx
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              {output.type.toUpperCase()} {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Output Type Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            selectedOutput.type === 'json'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          }`}
        >
          {selectedOutput.type.toUpperCase()}
        </span>
        {selectedOutput.isValid && (
          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
            Valid
          </span>
        )}
        {!selectedOutput.isValid && (
          <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">
            Invalid
          </span>
        )}
      </div>

      {/* Output Content */}
      <div className="bg-white rounded border border-amber-100 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => toggleExpanded(selectedIndex)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-amber-100"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expandedOutputs[selectedIndex] ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            <span className="text-sm font-medium text-gray-900">
              {selectedOutput.type === 'json' ? 'JSON Object' : 'XML Document'}
            </span>
          </div>
          <span className="text-xs text-gray-500">{formattedOutput.length} chars</span>
        </button>

        {/* Content */}
        {expandedOutputs[selectedIndex] && (
          <div className="p-3 bg-gray-50 max-h-96 overflow-y-auto">
            <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
              {formattedOutput}
            </pre>
          </div>
        )}

        {/* Copy Button */}
        <div className="px-3 py-2 bg-gray-50 border-t border-amber-100 flex justify-end">
          <button
            onClick={() => {
              navigator.clipboard.writeText(formattedOutput);
            }}
            className="px-3 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Error Message */}
      {!selectedOutput.isValid && selectedOutput.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-700">{selectedOutput.error}</p>
        </div>
      )}

      {/* Parsed Data Preview (for valid JSON) */}
      {selectedOutput.isValid && selectedOutput.type === 'json' && (
        <div className="mt-3 p-3 bg-white rounded border border-amber-100">
          <div className="text-xs font-medium text-gray-700 mb-2">Parsed Structure:</div>
          <JSONTreeView data={selectedOutput.parsed} />
        </div>
      )}
    </div>
  );
}

/**
 * Simple JSON tree viewer component
 */
function JSONTreeView({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const maxDepth = 3;

  if (depth > maxDepth) {
    return <span className="text-xs text-gray-500">[...]</span>;
  }

  if (data === null) {
    return <span className="text-xs text-gray-500">null</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="text-xs text-purple-600">{String(data)}</span>;
  }

  if (typeof data === 'number') {
    return <span className="text-xs text-blue-600">{data}</span>;
  }

  if (typeof data === 'string') {
    return <span className="text-xs text-green-600">&quot;{data}&quot;</span>;
  }

  if (Array.isArray(data)) {
    return (
      <div className="text-xs">
        <span className="text-gray-600">[</span>
        <div className="ml-4 space-y-1">
          {data.slice(0, 5).map((item, idx) => (
            <div key={idx}>
              <JSONTreeView data={item} depth={depth + 1} />
              {idx < data.length - 1 && <span className="text-gray-600">,</span>}
            </div>
          ))}
          {data.length > 5 && <div className="text-gray-500">... {data.length - 5} more items</div>}
        </div>
        <span className="text-gray-600">]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    return (
      <div className="text-xs">
        <span className="text-gray-600">{'{'}</span>
        <div className="ml-4 space-y-1">
          {entries.slice(0, 5).map(([key, value], idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-orange-600 font-medium">{key}:</span>
              <JSONTreeView data={value} depth={depth + 1} />
              {idx < entries.length - 1 && <span className="text-gray-600">,</span>}
            </div>
          ))}
          {entries.length > 5 && (
            <div className="text-gray-500">... {entries.length - 5} more fields</div>
          )}
        </div>
        <span className="text-gray-600">{'}'}</span>
      </div>
    );
  }

  return <span className="text-xs text-gray-500">unknown</span>;
}

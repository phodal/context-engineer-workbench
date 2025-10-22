'use client';

import React from 'react';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const QUERY_EXAMPLES: Record<string, string> = {
  'Function Declaration': '(function_declaration name: (identifier) @name)',
  'Variable Declaration': '(variable_declarator name: (identifier) @name)',
  'Function Call': '(call_expression function: (identifier) @function)',
  'String Literal': '(string) @string',
  'Comment': '(comment) @comment',
};

export default function QueryEditor({ value, onChange }: QueryEditorProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Query</h2>
        <p className="text-xs text-slate-600 mt-1">Tree-sitter query language</p>
      </div>

      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
          placeholder="Enter Tree-sitter query..."
        />
      </div>

      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
        <p className="text-xs font-semibold text-slate-700 mb-2">Examples:</p>
        <div className="space-y-1">
          {Object.entries(QUERY_EXAMPLES).map(([label, query]) => (
            <button
              key={label}
              onClick={() => onChange(query)}
              className="block w-full text-left text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
            >
              {label}: <code className="text-slate-600">{query}</code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


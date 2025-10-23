'use client';

import React from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  isLoading: boolean;
}

export default function CodeEditor({ value, onChange, language, isLoading }: CodeEditorProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Code</h2>
        <p className="text-xs text-slate-600 mt-1">Language: {language}</p>
      </div>

      <div className="p-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className="w-full h-96 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
          placeholder="Enter code here..."
        />
      </div>
    </div>
  );
}

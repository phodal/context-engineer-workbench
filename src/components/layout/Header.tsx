'use client';

import React from 'react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Context Engineer's Workbench
          </h1>
          <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
            Beta
          </span>
        </div>

        <nav className="flex items-center space-x-6">
          <button className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
            Getting Started
          </button>
          <button className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
            Examples
          </button>
          <button className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
            Documentation
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
            Export Config
          </button>
        </nav>
      </div>
    </header>
  );
}

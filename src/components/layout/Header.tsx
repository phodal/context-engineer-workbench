'use client';

import React from 'react';
import Link from "next/link";

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Context Engineer Workbench
                    </h1>
                    <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
            Beta
          </span>
                </div>

                <nav className="flex items-center space-x-6">
                    <button className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                        Getting Started
                    </button>
                    <Link className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                          href="/rag-keyword-playground">Keyword Search
                    </Link>
                </nav>
            </div>
        </header>
    );
}

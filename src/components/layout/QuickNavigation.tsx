'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  description: string;
  icon: string;
  keywords: string[];
}

const navigationItems: NavItem[] = [
  {
    name: 'Workbench',
    href: '/',
    description: 'Main context engineering workbench',
    icon: '🔧',
    keywords: ['workbench', 'main', 'home', 'context', 'engineering']
  },
  {
    name: 'Keyword Search',
    href: '/rag-keyword-playground',
    description: 'Learn keyword-based retrieval',
    icon: '🔍',
    keywords: ['keyword', 'search', 'rag', 'bm25', 'retrieval']
  },
  {
    name: 'Vector Search',
    href: '/rag-vector-playground',
    description: 'Explore semantic vector search',
    icon: '🎯',
    keywords: ['vector', 'semantic', 'embedding', 'similarity', 'cosine']
  },
  {
    name: 'Graph Search',
    href: '/rag-graph-playground',
    description: 'Visualize code relationships',
    icon: '🕸️',
    keywords: ['graph', 'code', 'relationships', 'visualization', 'treesitter']
  },
  {
    name: 'TreeSitter',
    href: '/treesitter-playground',
    description: 'Parse and analyze code structure',
    icon: '🌳',
    keywords: ['treesitter', 'parser', 'ast', 'syntax', 'code']
  }
];

interface QuickNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickNavigation({ isOpen, onClose }: QuickNavigationProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Filter items based on query
  const filteredItems = navigationItems.filter(item => {
    const searchText = query.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchText) ||
      item.description.toLowerCase().includes(searchText) ||
      item.keywords.some(keyword => keyword.includes(searchText))
    );
  });

  // Reset selection when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredItems.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            router.push(filteredItems[selectedIndex].href);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, router, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-50">
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center px-4 py-3 border-b border-slate-200">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 mr-3" />
            <input
              type="text"
              placeholder="Search pages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 outline-none text-slate-900 placeholder-slate-500"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors
                    flex items-center space-x-3
                    ${index === selectedIndex ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''}
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-sm text-slate-500">{item.description}</div>
                  </div>
                  {index === selectedIndex && (
                    <kbd className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded">
                      ↵
                    </kbd>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500">
                <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No pages found for "{query}"</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>Use ↑↓ to navigate</span>
            <span>Press Enter to select</span>
          </div>
        </div>
      </div>
    </>
  );
}

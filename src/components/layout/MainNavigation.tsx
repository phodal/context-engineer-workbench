'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import QuickNavigation from './QuickNavigation';
import StatusIndicator from './StatusIndicator';

interface MainNavigationProps {
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  description: string;
  icon: string;
}

const navigationItems: NavItem[] = [
  {
    name: 'Workbench',
    href: '/',
    description: 'Main context engineering workbench',
    icon: '🔧',
  },
  {
    name: 'Keyword Search',
    href: '/rag-keyword-playground',
    description: 'Learn keyword-based retrieval',
    icon: '🔍',
  },
  {
    name: 'Vector Search',
    href: '/rag-vector-playground',
    description: 'Explore semantic vector search',
    icon: '🎯',
  },
  {
    name: 'Graph Search',
    href: '/rag-graph-playground',
    description: 'Visualize code relationships',
    icon: '🕸️',
  },
  {
    name: 'TreeSitter',
    href: '/treesitter-playground',
    description: 'Parse and analyze code structure',
    icon: '🌳',
  },
];

export default function MainNavigation({
  onSidebarToggle,
  showSidebarToggle,
}: MainNavigationProps) {
  const pathname = usePathname();
  const [quickNavOpen, setQuickNavOpen] = useState(false);

  // Global keyboard shortcut for quick navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickNavOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            {/* Sidebar toggle for workbench */}
            {showSidebarToggle && (
              <button
                onClick={onSidebarToggle}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            )}

            <Link href="/" className="flex items-center space-x-3 group">
              <div className="text-2xl">⚡</div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Context Engineer Workbench
                </h1>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                    Beta
                  </span>
                  <StatusIndicator />
                </div>
              </div>
            </Link>
          </div>

          {/* Right side - Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Quick search button */}
            <button
              onClick={() => setQuickNavOpen(true)}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                         text-slate-600 hover:text-slate-900 hover:bg-slate-100
                         flex items-center space-x-2 group"
              title="Quick navigation (⌘K)"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden lg:inline px-1.5 py-0.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded">
                ⌘K
              </kbd>
            </button>
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  flex items-center space-x-2 group
                  ${
                    isActive(item.href)
                      ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
                title={item.description}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
                {isActive(item.href) && (
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <MobileMenu items={navigationItems} currentPath={pathname} />
          </div>
        </div>
      </div>

      {/* Quick Navigation Modal */}
      <QuickNavigation isOpen={quickNavOpen} onClose={() => setQuickNavOpen(false)} />
    </header>
  );
}

// Mobile menu component
function MobileMenu({ items, currentPath }: { items: NavItem[]; currentPath: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(href);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  block px-4 py-3 text-sm transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500'
                      : 'text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.description}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

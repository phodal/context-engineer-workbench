'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import MainNavigation from './MainNavigation';
import Sidebar from './Sidebar';
import PageTransition from './PageTransition';
import ScrollToTop from './ScrollToTop';

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl';
}

export default function AppLayout({
  children,
  showSidebar = false,
  sidebarContent,
  maxWidth = '7xl',
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Determine if we're on the main workbench page
  const isWorkbenchPage = pathname === '/';

  const maxWidthClass = {
    full: 'max-w-full',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
  }[maxWidth];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main Navigation */}
      <MainNavigation
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        showSidebarToggle={showSidebar}
      />

      <div className="flex">
        {/* Sidebar for workbench page */}
        {showSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            content={sidebarContent}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 ${showSidebar ? 'lg:ml-80' : ''} transition-all duration-300`}>
          <PageTransition>
            {isWorkbenchPage ? (
              // For workbench page, use full height layout
              <div className="h-[calc(100vh-4rem)]">{children}</div>
            ) : (
              // For other pages, use standard layout with padding
              <div className={`${maxWidthClass} mx-auto px-6 py-8`}>{children}</div>
            )}
          </PageTransition>
        </main>
      </div>

      {/* Scroll to top button */}
      <ScrollToTop />
    </div>
  );
}

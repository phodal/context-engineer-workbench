'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  name: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
}

// Auto-generate breadcrumbs based on pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Map of path segments to readable names
  const pathNameMap: Record<string, string> = {
    'rag-keyword-playground': 'Keyword Search',
    'rag-vector-playground': 'Vector Search',
    'rag-graph-playground': 'Graph Search',
    'treesitter-playground': 'TreeSitter',
  };

  let currentPath = '';

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;

    breadcrumbs.push({
      name: pathNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}

export default function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Use provided items or auto-generate from pathname
  const breadcrumbItems = items || generateBreadcrumbs(pathname);

  // Don't show breadcrumbs on home page
  if (pathname === '/' || breadcrumbItems.length === 0) {
    return null;
  }

  const allItems: BreadcrumbItem[] = showHome
    ? [{ name: 'Home', href: '/', icon: <HomeIcon className="h-4 w-4" /> }, ...breadcrumbItems]
    : breadcrumbItems;

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-4">
      {allItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRightIcon className="h-4 w-4 text-slate-400" />}
          {item.href ? (
            <Link
              href={item.href}
              className="flex items-center space-x-1 hover:text-slate-900 transition-colors"
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ) : (
            <div className="flex items-center space-x-1 text-slate-900 font-medium">
              {item.icon}
              <span>{item.name}</span>
            </div>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsLoading(true);

    // Small delay to show transition effect
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div className="relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-sm text-slate-600">Loading...</p>
          </div>
        </div>
      )}

      {/* Page content with fade transition */}
      <div
        className={`
        transition-opacity duration-200 ease-in-out
        ${isLoading ? 'opacity-50' : 'opacity-100'}
      `}
      >
        {displayChildren}
      </div>
    </div>
  );
}

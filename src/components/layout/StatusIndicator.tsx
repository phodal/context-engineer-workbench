'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface StatusIndicatorProps {
  className?: string;
}

export default function StatusIndicator({ className = '' }: StatusIndicatorProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor route changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center space-x-1 text-xs text-slate-500">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Online status */}
      <div className="flex items-center space-x-1 text-xs">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-slate-500">{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
}

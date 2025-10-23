'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import TreeSitterPlayground from '@/components/treesitter/TreeSitterPlayground';

export default function TreeSitterPlaygroundPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600">Loading TreeSitter Playground...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <TreeSitterPlayground />
    </div>
  );
}

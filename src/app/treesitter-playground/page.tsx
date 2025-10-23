'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import TreeSitterPlayground from '@/components/treesitter/TreeSitterPlayground';

export default function TreeSitterPlaygroundPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600">Loading TreeSitter Playground...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="TreeSitter Playground"
        description="Parse and analyze code structure using TreeSitter"
        flowDescription="Code → TreeSitter Parser → AST → Syntax Highlighting & Analysis"
        breadcrumbs={[{ name: 'Code Analysis' }, { name: 'TreeSitter' }]}
      />
      <TreeSitterPlayground />
    </AppLayout>
  );
}

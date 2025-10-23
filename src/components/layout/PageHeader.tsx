'use client';

import React from 'react';
import Breadcrumbs from './Breadcrumbs';

interface BreadcrumbItem {
  name: string;
  href?: string;
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  description: string;
  flowDescription?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  flowDescription,
  breadcrumbs,
  actions
}: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-40 shadow-sm">
      <div className="px-6 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Header content */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-600 mb-2">{description}</p>
            {flowDescription && (
              <p className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <span className="font-medium">Flow:</span> {flowDescription}
              </p>
            )}
          </div>
          
          {/* Actions */}
          {actions && (
            <div className="ml-6 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

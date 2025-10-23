'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  content?: React.ReactNode;
}

export default function Sidebar({ isOpen, onClose, content }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-white border-r border-slate-200 z-50
        transform transition-transform duration-300 ease-in-out overflow-y-auto
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4 border-b border-slate-200">
          <button
            onClick={onClose}
            className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="p-0">{content}</div>
      </div>
    </>
  );
}

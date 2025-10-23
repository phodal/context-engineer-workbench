'use client';

import React from 'react';
import type { QueryMatch } from '@/lib/treesitter-utils';

interface QueryResultsProps {
  results: QueryMatch[];
}

export default function QueryResults({ results }: QueryResultsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Query Results</h2>
        <p className="text-xs text-slate-600 mt-1">
          Found {results.length} match{results.length !== 1 ? 'es' : ''}
        </p>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-slate-500 text-sm">No matches found</p>
        ) : (
          <div className="space-y-4">
            {results.map((match, matchIdx) => (
              <div key={matchIdx} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="text-xs font-semibold text-slate-600 mb-2">
                  Match #{matchIdx + 1}
                </div>
                <div className="space-y-2">
                  {match.captures.map((capture, captureIdx) => (
                    <div key={captureIdx} className="text-xs">
                      <div className="font-mono text-orange-600 font-semibold">@{capture.name}</div>
                      <div className="text-slate-700 mt-1 break-words">{capture.text}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        Line {capture.startPosition.row + 1}:{capture.startPosition.column + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import type { QueryMatch } from '@/lib/treesitter-utils';
import { getColorForCaptureName } from '@/lib/treesitter-utils';

interface QueryResultsProps {
  results: QueryMatch[];
  captureNames: string[];
  onCaptureClick?: (capture: {
    startRow: number;
    startColumn: number;
    endRow: number;
    endColumn: number;
  }) => void;
}

export default function QueryResults({ results, captureNames, onCaptureClick }: QueryResultsProps) {
  const getCaptureColor = (captureName: string) => {
    return getColorForCaptureName(captureName, captureNames, false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-linear-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-slate-200">
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
                <div className="text-xs font-semibold text-slate-600 mb-3">
                  Pattern #{match.pattern + 1} - Match #{matchIdx + 1}
                </div>
                <div className="space-y-3">
                  {match.captures.map((capture, captureIdx) => {
                    const color = getCaptureColor(capture.name);
                    return (
                      <div
                        key={captureIdx}
                        className="text-xs border-l-2 pl-3 cursor-pointer hover:bg-white transition-colors rounded"
                        style={{ borderColor: color }}
                        onClick={() => {
                          if (onCaptureClick) {
                            onCaptureClick({
                              startRow: capture.startPosition.row,
                              startColumn: capture.startPosition.column,
                              endRow: capture.endPosition.row,
                              endColumn: capture.endPosition.column,
                            });
                          }
                        }}
                      >
                        <div className="font-mono font-semibold" style={{ color }}>
                          @{capture.name}
                        </div>
                        <div className="text-slate-700 mt-1 break-words font-mono bg-white px-2 py-1 rounded">
                          {capture.text}
                        </div>
                        <div className="text-slate-500 text-xs mt-1 flex gap-4">
                          <span>
                            Type: <code className="text-slate-600">{capture.type}</code>
                          </span>
                          <span>
                            Position: [{capture.startPosition.row}, {capture.startPosition.column}]
                            - [{capture.endPosition.row}, {capture.endPosition.column}]
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface RewriteResult {
  original: string;
  rewritten: string;
  technique: string;
  timestamp: number;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
}

interface ExecutionResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: string;
  error?: string;
}

interface ResultsPanelProps {
  rewriteResult: RewriteResult | null;
  searchResults: SearchResult[];
  executionResult: ExecutionResult;
  onExecute: () => void;
  isLoading: boolean;
}

export default function ResultsPanel({
  rewriteResult,
  searchResults,
  executionResult,
  onExecute,
  isLoading,
}: ResultsPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-900';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-900';
    return 'bg-orange-100 text-orange-900';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-6">
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Search Results</h2>
            <p className="text-xs text-slate-600 mt-1">BM25 ranked results</p>
          </div>

          <div className="p-6 space-y-4">
            {/* BM25 Formula */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-semibold text-slate-900 mb-2">BM25 Formula:</p>
              <div className="bg-white p-2 rounded border border-slate-200 overflow-x-auto">
                <code className="text-xs text-slate-700 font-mono whitespace-nowrap">
                  score = Σ IDF(qi) × (f(qi,D) × (k1+1)) / (f(qi,D) + k1 × (1-b + b×|D|/avgdl))
                </code>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                <span className="font-semibold">Parameters:</span> k1=1.5 (saturation), b=0.75
                (normalization)
              </p>
            </div>

            {/* Results List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <div
                  key={result.id}
                  className="border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-700">
                        {idx + 1}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                        {result.title}
                      </h3>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${getScoreColor(result.score)}`}
                    >
                      {(result.score * 100).toFixed(0)}%
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">{result.content}</p>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getScoreBgColor(result.score)}`}
                        style={{ width: `${result.score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-mono w-10 text-right">
                      {result.score.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Execution Result */}
      {rewriteResult && (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Execute</h2>
            <p className="text-xs text-slate-600 mt-1">Generate RAG answer</p>
          </div>

          <div className="p-6 space-y-4">
            <button
              onClick={onExecute}
              disabled={isLoading || executionResult.status === 'loading'}
              className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {executionResult.status === 'loading' ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Try Execute
                </>
              )}
            </button>

            {executionResult.status === 'success' && executionResult.result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="prose prose-sm max-w-none text-slate-900 text-sm leading-relaxed">
                  <ReactMarkdown>{executionResult.result}</ReactMarkdown>
                </div>
              </div>
            )}

            {executionResult.status === 'error' && executionResult.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-semibold mb-2">Error</p>
                <p className="text-xs text-red-600">{executionResult.error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

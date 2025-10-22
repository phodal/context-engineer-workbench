'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  embedding?: number[];
}

interface ExecutionResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: string;
  error?: string;
}

interface VectorSearchResultsPanelProps {
  searchResults: SearchResult[];
  executionResult: ExecutionResult;
  onExecute: () => void;
  isLoading: boolean;
}

export default function VectorSearchResultsPanel({
  searchResults,
  executionResult,
  onExecute,
  isLoading,
}: VectorSearchResultsPanelProps) {
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
      {/* Vector Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Vector Search Results</h2>
            <p className="text-xs text-slate-600 mt-1">Ranked by Cosine Similarity Score</p>
          </div>

          <div className="p-6 space-y-4">
            {/* RXDB Vector Search Formula */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-semibold text-slate-900 mb-2">RXDB Vector Search (Distance to Samples):</p>
              <div className="bg-white p-3 rounded border border-slate-200 overflow-x-auto space-y-2">
                <div>
                  <p className="text-xs text-slate-600 mb-1">1. Euclidean Distance:</p>
                  <code className="text-xs text-slate-700 font-mono whitespace-nowrap">
                    distance = √(Σ(a<sub>i</sub> - b<sub>i</sub>)²)
                  </code>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">2. Convert to Similarity:</p>
                  <code className="text-xs text-slate-700 font-mono whitespace-nowrap">
                    similarity = 1 / (1 + distance)
                  </code>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                <span className="font-semibold">Method:</span> Distance to Samples Indexing (5 sample vectors)
              </p>
              <p className="text-xs text-slate-600 mt-1">
                <span className="font-semibold">Range:</span> 0 to 1 (higher = more semantically similar)
              </p>
            </div>

            {/* Results List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <div 
                  key={result.id} 
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-slate-50 to-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {result.title}
                        </h3>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${getScoreColor(result.score)}`}>
                      {(result.score * 100).toFixed(1)}%
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-3 leading-relaxed line-clamp-3">
                    {result.content}
                  </p>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${getScoreBgColor(result.score)}`}
                          style={{ width: `${result.score * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 font-mono font-semibold w-12 text-right">
                      {result.score.toFixed(3)}
                    </span>
                  </div>

                  {/* Embedding Vector Display */}
                  {result.embedding && (
                    <div className="bg-slate-100 rounded p-2 border border-slate-300">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Embedding Vector (1024-dim):</p>
                      <div className="text-xs text-slate-600 font-mono overflow-x-auto">
                        <code>
                          [{result.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ..., {result.embedding.slice(-5).map(v => v.toFixed(4)).join(', ')}]
                        </code>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Showing first 5 and last 5 dimensions of {result.embedding.length} total
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Execution Result */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Generate RAG Answer</h2>
            <p className="text-xs text-slate-600 mt-1">Use vector search results to generate answer</p>
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
                  Generating...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Generate Answer
                </>
              )}
            </button>

            {executionResult.status === 'success' && executionResult.result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="prose prose-sm max-w-none text-slate-900 text-sm leading-relaxed">
                  <ReactMarkdown>
                    {executionResult.result}
                  </ReactMarkdown>
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


'use client';

import React from 'react';

interface RewriteResult {
  original: string;
  rewritten: string;
  technique: string;
  timestamp: number;
}

interface TokenCost {
  step: string;
  tokens: number;
  percentage: number;
}

interface InteractionPanelProps {
  userQuery: string;
  onQueryChange: (query: string) => void;
  onRewrite: () => void;
  rewriteResult: RewriteResult | null;
  tokenCosts: TokenCost[];
  isLoading: boolean;
}

export default function InteractionPanel({
  userQuery,
  onQueryChange,
  onRewrite,
  rewriteResult,
  tokenCosts,
  isLoading,
}: InteractionPanelProps) {
  const totalTokens = tokenCosts.reduce((sum, cost) => sum + cost.tokens, 0);

  return (
    <div className="space-y-6">
      {/* User Input Section */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">User Input</h2>
          <p className="text-xs text-slate-600 mt-1">Enter your natural language query</p>
        </div>

        <div className="p-6 space-y-4">
          <textarea
            value={userQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="e.g., What is vector database and how does it work?"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={isLoading}
          />

          <button
            onClick={onRewrite}
            disabled={!userQuery.trim() || isLoading}
            className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <span>✏️</span>
                Rewrite Query
              </>
            )}
          </button>
        </div>
      </div>

      {/* Query Display Section */}
      {rewriteResult && (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Query Display</h2>
            <p className="text-xs text-slate-600 mt-1">Original vs Rewritten</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Original</p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">{rewriteResult.original}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Rewritten</p>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-700">{rewriteResult.rewritten}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Technique</p>
              <p className="text-sm font-semibold text-slate-900">{rewriteResult.technique}</p>
            </div>
          </div>
        </div>
      )}

      {/* Token Consumption Section */}
      {tokenCosts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Token Consumption</h2>
            <p className="text-xs text-slate-600 mt-1">Estimated usage per step</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Total Tokens</p>
                <p className="text-lg font-bold text-slate-900">{totalTokens.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Est. Cost</p>
                <p className="text-lg font-bold text-slate-900">
                  ${((totalTokens / 1000) * 0.03).toFixed(4)}
                </p>
              </div>
            </div>

            {/* Token Breakdown */}
            <div className="space-y-3">
              {tokenCosts.map((cost, idx) => (
                <div key={cost.step}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-900">{cost.step}</span>
                    <span className="text-xs text-slate-600">{cost.tokens} tokens</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-pink-500'
                      }`}
                      style={{ width: `${cost.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

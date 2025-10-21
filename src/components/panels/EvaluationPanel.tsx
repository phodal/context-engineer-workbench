'use client';

import React, { useState } from 'react';
import type { UIMessage } from 'ai';
import type { APIMetrics } from '@/lib/metrics';
import { formatDuration } from '@/lib/metrics';

interface TraceStep {
  step: string;
  duration: number;
  tokens: number;
  details: unknown;
}

interface EvaluationPanelProps {
  messages: UIMessage[];
  trace: TraceStep[];
  metrics?: APIMetrics | null;
}

export default function EvaluationPanel({ trace, metrics }: EvaluationPanelProps) {
  const [viewMode, setViewMode] = useState<'trace' | 'comparison'>('trace');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const totalLatency = trace.reduce((sum, step) => sum + step.duration, 0);
  const totalTokens = trace.reduce((sum, step) => sum + step.tokens, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Evaluation & Analysis</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('trace')}
            className={`px-3 py-1 text-xs font-medium rounded ${
              viewMode === 'trace'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Trace
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-3 py-1 text-xs font-medium rounded ${
              viewMode === 'comparison'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Compare
          </button>
        </div>
      </div>

      {/* API Performance Metrics - Always Display */}
      {metrics && (
        <div className="mb-6 p-4 bg-linear-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">API Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="text-xs text-purple-600 font-medium">First Token Latency</div>
              <div className="text-lg font-bold text-purple-900">{formatDuration(metrics.firstTokenLatency)}</div>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="text-xs text-purple-600 font-medium">Total Time</div>
              <div className="text-lg font-bold text-purple-900">{formatDuration(metrics.totalLatency)}</div>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="text-xs text-purple-600 font-medium">Throughput</div>
              <div className="text-lg font-bold text-purple-900">{metrics.tokensPerSecond.toFixed(2)} tok/s</div>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="text-xs text-purple-600 font-medium">Avg Latency/Token</div>
              <div className="text-lg font-bold text-purple-900">{formatDuration(metrics.averageLatencyPerToken)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="text-xs text-purple-600 font-medium">Input Tokens</div>
              <div className="text-sm font-bold text-purple-900">{metrics.inputTokens}</div>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="text-xs text-purple-600 font-medium">Output Tokens</div>
              <div className="text-sm font-bold text-purple-900">{metrics.outputTokens}</div>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <div className="text-xs text-purple-600 font-medium">Total Tokens</div>
              <div className="text-sm font-bold text-purple-900">{metrics.totalTokens}</div>
            </div>
          </div>
        </div>
      )}

      {/* Trace Performance Metrics - Fallback */}
      {trace.length > 0 && !metrics && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-600 font-medium">Total Latency</div>
            <div className="text-lg font-bold text-blue-900">{totalLatency}ms</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-600 font-medium">Total Tokens</div>
            <div className="text-lg font-bold text-green-900">{totalTokens}</div>
          </div>
        </div>
      )}

      {viewMode === 'trace' ? (
        <>


          {/* Trace Viewer */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Execution Timeline</h3>
            
            {trace.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No trace data available yet</p>
                <p className="text-xs text-gray-400 mt-1">Send a message to see the execution trace</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trace.map((step, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleStep(idx)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">{step.step}</div>
                          <div className="text-xs text-gray-500">
                            {step.duration}ms
                            {step.tokens > 0 && ` • ${step.tokens} tokens`}
                          </div>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedSteps.has(idx) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {expandedSteps.has(idx) && (
                      <div className="px-3 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium text-gray-900">{step.duration}ms</span>
                          </div>
                          {step.tokens > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tokens:</span>
                              <span className="font-medium text-gray-900">{step.tokens}</span>
                            </div>
                          )}
                          {Object.keys(step.details as Record<string, unknown>).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-gray-600 mb-1">Details:</div>
                              <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                                {JSON.stringify(step.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          {trace.length > 0 && (
            <div className="mt-4">
              <button className="w-full px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                Export Trace as JSON
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">Comparison view coming soon</p>
          <p className="text-xs text-gray-400 mt-1">Compare different configurations side-by-side</p>
        </div>
      )}
    </div>
  );
}

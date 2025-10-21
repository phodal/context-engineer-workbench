'use client';

import React from 'react';
import { encode } from 'gpt-tokenizer';

interface ContextAssemblyViewProps {
  context: {
    systemPrompt: string;
    retrievedDocs: Array<{ content: string; score: number }>;
    chatHistory: string;
    toolDefinitions: string;
    userInput: string;
  };
  config: {
    enableRAG: boolean;
    enableMemory: boolean;
    enableTools: boolean;
  };
}

export default function ContextAssemblyView({ context, config }: ContextAssemblyViewProps) {
  const estimateTokens = (text: string | undefined) => {
    if (!text) return 0;
    try {
      return encode(text).length;
    } catch (error) {
      // Fallback to rough estimation if encoding fails
      console.warn('Token encoding failed, using fallback estimation:', error);
      return Math.ceil(text.length / 4);
    }
  };

  const totalTokens = 
    estimateTokens(context.systemPrompt) +
    context.retrievedDocs.reduce((sum, doc) => sum + estimateTokens(doc.content), 0) +
    estimateTokens(context.chatHistory) +
    estimateTokens(context.toolDefinitions) +
    estimateTokens(context.userInput);

  const contextWindowSize = 8000; // Example context window
  const usagePercent = Math.min((totalTokens / contextWindowSize) * 100, 100);
  const estimatedCost = (totalTokens / 1000) * 0.002; // Example pricing

  const getUsageColor = () => {
    if (usagePercent < 70) return 'bg-green-500';
    if (usagePercent < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full bg-white">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Context Assembly View</h3>
          <button className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
            Copy Context
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Total Tokens</div>
            <div className="text-xl font-semibold text-gray-900">{totalTokens.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Context Window Usage</div>
            <div className="text-xl font-semibold text-gray-900">{usagePercent.toFixed(1)}%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Estimated Cost</div>
            <div className="text-xl font-semibold text-gray-900">${estimatedCost.toFixed(4)}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getUsageColor()}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Context Blocks */}
      <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 200px)' }}>
        {/* System Prompt */}
        {context.systemPrompt && (
          <div className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">System Prompt</span>
              <span className="text-xs text-blue-700">{estimateTokens(context.systemPrompt)} tokens</span>
            </div>
            <div className="text-sm text-blue-800 whitespace-pre-wrap">{context.systemPrompt}</div>
          </div>
        )}

        {/* Retrieved Documents */}
        {config.enableRAG && context.retrievedDocs.length > 0 && (
          <div className="border-l-4 border-green-500 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Retrieved Documents</span>
              <span className="text-xs text-green-700">
                {context.retrievedDocs.reduce((sum, doc) => sum + estimateTokens(doc.content), 0)} tokens
              </span>
            </div>
            <div className="space-y-2">
              {context.retrievedDocs.map((doc, idx) => (
                <div key={idx} className="bg-white rounded p-3 border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-green-700">Document {idx + 1}</span>
                    <span className="text-xs text-green-600">Score: {doc.score.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-green-800">{doc.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat History */}
        {config.enableMemory && context.chatHistory && (
          <div className="border-l-4 border-purple-500 bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900">Chat History</span>
              <span className="text-xs text-purple-700">{estimateTokens(context.chatHistory)} tokens</span>
            </div>
            <div className="text-sm text-purple-800 whitespace-pre-wrap">{context.chatHistory}</div>
          </div>
        )}

        {/* Tool Definitions */}
        {config.enableTools && context.toolDefinitions && (
          <div className="border-l-4 border-orange-500 bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-900">Tool Definitions</span>
              <span className="text-xs text-orange-700">{estimateTokens(context.toolDefinitions)} tokens</span>
            </div>
            <div className="text-sm text-orange-800 font-mono">{context.toolDefinitions}</div>
          </div>
        )}

        {/* User Input */}
        {context.userInput && (
          <div className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-900">User Input</span>
              <span className="text-xs text-red-700">{estimateTokens(context.userInput)} tokens</span>
            </div>
            <div className="text-sm text-red-800 whitespace-pre-wrap">{context.userInput}</div>
          </div>
        )}
      </div>
    </div>
  );
}

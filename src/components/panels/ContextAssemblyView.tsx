'use client';

import React from 'react';

interface ContextAssemblyViewProps {
  context: {
    systemPrompt: string;
    retrievedDocs: Array<{ content: string; score: number }>;
    chatHistory: string;
    toolDefinitions: string;
    userInput: string;
  };
  maxTokens: number;
  model: string;
}

export default function ContextAssemblyView({ context, maxTokens, model }: ContextAssemblyViewProps) {
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);
  
  const totalTokens = 
    estimateTokens(context.systemPrompt) +
    context.retrievedDocs.reduce((sum, doc) => sum + estimateTokens(doc.content), 0) +
    estimateTokens(context.chatHistory) +
    estimateTokens(context.toolDefinitions) +
    estimateTokens(context.userInput);
  
  const usagePercent = (totalTokens / maxTokens) * 100;
  const estimatedCost = (totalTokens / 1000) * 0.03;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Context Assembly View</h2>
        <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
          Copy Context
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Visual representation of the complete prompt sent to {model}
      </p>

      {/* Metrics Display */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium">Total Tokens</div>
          <div className="text-lg font-bold text-blue-900">{totalTokens}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-xs text-purple-600 font-medium">Usage</div>
          <div className="text-lg font-bold text-purple-900">{usagePercent.toFixed(1)}%</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-xs text-green-600 font-medium">Est. Cost</div>
          <div className="text-lg font-bold text-green-900">${estimatedCost.toFixed(4)}</div>
        </div>
      </div>

      {/* Context Window Usage Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Context Window</span>
          <span>{totalTokens} / {maxTokens}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Context Blocks */}
      <div className="space-y-3">
        {/* System Prompt */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-900 text-sm">System Prompt</h3>
            <span className="text-xs text-blue-600">{estimateTokens(context.systemPrompt)} tokens</span>
          </div>
          <p className="text-sm text-blue-800">{context.systemPrompt}</p>
        </div>

        {/* Retrieved Documents */}
        {context.retrievedDocs.length > 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-green-900 text-sm">
                Retrieved Documents ({context.retrievedDocs.length})
              </h3>
              <span className="text-xs text-green-600">
                {context.retrievedDocs.reduce((sum, doc) => sum + estimateTokens(doc.content), 0)} tokens
              </span>
            </div>
            <div className="space-y-2">
              {context.retrievedDocs.map((doc, idx) => (
                <div key={idx} className="bg-white border border-green-200 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-green-700">Document {idx + 1}</span>
                    <span className="text-xs text-green-600">Score: {doc.score.toFixed(3)}</span>
                  </div>
                  <p className="text-xs text-green-800 line-clamp-2">{doc.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat History */}
        {context.chatHistory && (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-purple-900 text-sm">Chat History</h3>
              <span className="text-xs text-purple-600">{estimateTokens(context.chatHistory)} tokens</span>
            </div>
            <pre className="text-xs text-purple-800 whitespace-pre-wrap font-mono">{context.chatHistory}</pre>
          </div>
        )}

        {/* Tool Definitions */}
        {context.toolDefinitions && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-orange-900 text-sm">Tool Definitions</h3>
              <span className="text-xs text-orange-600">{estimateTokens(context.toolDefinitions)} tokens</span>
            </div>
            <p className="text-sm text-orange-800">{context.toolDefinitions}</p>
          </div>
        )}

        {/* User Input */}
        {context.userInput && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-red-900 text-sm">User Input</h3>
              <span className="text-xs text-red-600">{estimateTokens(context.userInput)} tokens</span>
            </div>
            <p className="text-sm text-red-800">{context.userInput}</p>
          </div>
        )}

        {!context.userInput && (
          <div className="bg-gray-100 border border-gray-300 p-6 rounded text-center text-gray-500">
            <p className="text-sm">No context assembled yet. Start by sending a message below.</p>
          </div>
        )}
      </div>
    </div>
  );
}

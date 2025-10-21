'use client';

import React, { useState } from 'react';

interface ConfigPanelProps {
  config: {
    model: string;
    provider: string;
    temperature: number;
    maxTokens: number;
    streamResponses: boolean;
    enableRAG: boolean;
    enableMemory: boolean;
    enableTools: boolean;
    ragConfig: {
      chunkSize: number;
      topK: number;
      searchMode: 'semantic' | 'keyword' | 'hybrid';
      similarityThreshold: number;
    };
    memoryConfig: {
      enableChatHistory: boolean;
      historyLength: number;
    };
  };
  onConfigChange: (updates: any) => void;
  onRAGConfigChange: (updates: any) => void;
  onMemoryConfigChange: (updates: any) => void;
}

export default function ConfigPanel({ config, onConfigChange, onRAGConfigChange, onMemoryConfigChange }: ConfigPanelProps) {
  const [ragExpanded, setRagExpanded] = useState(false);
  const [memoryExpanded, setMemoryExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration Center</h2>
        
        {/* LLM Provider */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={config.provider}
              onChange={(e) => onConfigChange({ provider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="DeepSeek">DeepSeek</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Anthropic">Anthropic</option>
              <option value="Google">Google</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={config.model}
              onChange={(e) => onConfigChange({ model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="deepseek-chat">deepseek-chat</option>
              <option value="deepseek-coder">deepseek-coder</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => onConfigChange({ temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Tokens: {config.maxTokens}
            </label>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={config.maxTokens}
              onChange={(e) => onConfigChange({ maxTokens: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="stream"
              checked={config.streamResponses}
              onChange={(e) => onConfigChange({ streamResponses: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="stream" className="ml-2 text-sm text-gray-700">
              Stream Responses
            </label>
          </div>
        </div>
      </div>

      {/* RAG Module */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => {
            setRagExpanded(!ragExpanded);
            if (!config.enableRAG) {
              onConfigChange({ enableRAG: true });
            }
          }}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.enableRAG}
              onChange={(e) => {
                onConfigChange({ enableRAG: e.target.checked });
                if (e.target.checked) setRagExpanded(true);
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-900">RAG Module</span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${ragExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {ragExpanded && config.enableRAG && (
          <div className="mt-4 space-y-4 pl-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chunk Size: {config.ragConfig.chunkSize}
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={config.ragConfig.chunkSize}
                onChange={(e) => onRAGConfigChange({ chunkSize: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top-K: {config.ragConfig.topK}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={config.ragConfig.topK}
                onChange={(e) => onRAGConfigChange({ topK: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Mode
              </label>
              <select
                value={config.ragConfig.searchMode}
                onChange={(e) => onRAGConfigChange({ searchMode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="semantic">Semantic</option>
                <option value="keyword">Keyword</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Memory Module */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => {
            setMemoryExpanded(!memoryExpanded);
            if (!config.enableMemory) {
              onConfigChange({ enableMemory: true });
            }
          }}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.enableMemory}
              onChange={(e) => {
                onConfigChange({ enableMemory: e.target.checked });
                if (e.target.checked) setMemoryExpanded(true);
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-900">Memory Module</span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${memoryExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {memoryExpanded && config.enableMemory && (
          <div className="mt-4 space-y-4 pl-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="chatHistory"
                checked={config.memoryConfig.enableChatHistory}
                onChange={(e) => onMemoryConfigChange({ enableChatHistory: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="chatHistory" className="ml-2 text-sm text-gray-700">
                Enable Chat History
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                History Length: {config.memoryConfig.historyLength}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={config.memoryConfig.historyLength}
                onChange={(e) => onMemoryConfigChange({ historyLength: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tools Module */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => {
            setToolsExpanded(!toolsExpanded);
            if (!config.enableTools) {
              onConfigChange({ enableTools: true });
            }
          }}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.enableTools}
              onChange={(e) => {
                onConfigChange({ enableTools: e.target.checked });
                if (e.target.checked) setToolsExpanded(true);
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-900">Tool Use</span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${toolsExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {toolsExpanded && config.enableTools && (
          <div className="mt-4 pl-6">
            <button className="w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
              + Add Tool
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

interface ConfigPanelProps {
  state: any;
  onConfigChange: (config: any) => void;
}

export default function ConfigPanel({ state, onConfigChange }: ConfigPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    rag: false,
    memory: false,
    tools: false,
    prompting: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-6 text-gray-900">Configuration Center</h2>
      
      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          LLM Provider
        </label>
        <select
          value={state.provider}
          onChange={(e) => onConfigChange({ provider: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="OpenAI">OpenAI</option>
          <option value="Anthropic">Anthropic</option>
          <option value="Google">Google</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model
        </label>
        <select
          value={state.model}
          onChange={(e) => onConfigChange({ model: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
        </select>
      </div>

      {/* Temperature */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Temperature: {state.temperature.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={state.temperature}
          onChange={(e) => onConfigChange({ temperature: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Tokens: {state.maxTokens}
        </label>
        <input
          type="range"
          min="100"
          max="4000"
          step="100"
          value={state.maxTokens}
          onChange={(e) => onConfigChange({ maxTokens: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Stream Responses */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={state.streamResponses}
            onChange={(e) => onConfigChange({ streamResponses: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="ml-2 text-sm text-gray-700">Stream responses</span>
        </label>
      </div>

      {/* Module Toggles */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Context Modules</h3>
        
        {/* RAG Module */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('rag')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={state.enableRAG}
                onChange={(e) => {
                  e.stopPropagation();
                  onConfigChange({ enableRAG: e.target.checked });
                }}
                className="rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm font-medium text-gray-900">RAG Module</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.rag ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.rag && state.enableRAG && (
            <div className="p-4 border-t border-gray-200 space-y-4 bg-gray-50">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chunk Size: {state.ragConfig.chunkSize}
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={state.ragConfig.chunkSize}
                  onChange={(e) => onConfigChange({
                    ragConfig: { ...state.ragConfig, chunkSize: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Top-K: {state.ragConfig.topK}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={state.ragConfig.topK}
                  onChange={(e) => onConfigChange({
                    ragConfig: { ...state.ragConfig, topK: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Search Mode
                </label>
                <select
                  value={state.ragConfig.searchMode}
                  onChange={(e) => onConfigChange({
                    ragConfig: { ...state.ragConfig, searchMode: e.target.value }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('memory')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={state.enableMemory}
                onChange={(e) => {
                  e.stopPropagation();
                  onConfigChange({ enableMemory: e.target.checked });
                }}
                className="rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm font-medium text-gray-900">Memory Module</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.memory ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.memory && state.enableMemory && (
            <div className="p-4 border-t border-gray-200 space-y-3 bg-gray-50">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={state.memoryConfig.enableChatHistory}
                  onChange={(e) => onConfigChange({
                    memoryConfig: { ...state.memoryConfig, enableChatHistory: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="ml-2 text-xs text-gray-700">Enable Chat History</span>
              </label>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  History Length: {state.memoryConfig.historyLength}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={state.memoryConfig.historyLength}
                  onChange={(e) => onConfigChange({
                    memoryConfig: { ...state.memoryConfig, historyLength: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tools Module */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('tools')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={state.enableTools}
                onChange={(e) => {
                  e.stopPropagation();
                  onConfigChange({ enableTools: e.target.checked });
                }}
                className="rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm font-medium text-gray-900">Tool Use Module</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.tools ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.tools && state.enableTools && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button className="w-full px-3 py-2 text-xs font-medium text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50">
                + Add Tool
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

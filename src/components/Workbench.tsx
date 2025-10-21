'use client';

import React, { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import Header from './layout/Header';
import ConfigPanel from './panels/ConfigPanel';
import ContextAssemblyView from './panels/ContextAssemblyView';
import InteractionPanel from './panels/InteractionPanel';
import EvaluationPanel from './panels/EvaluationPanel';

interface WorkbenchConfig {
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  streamResponses: boolean;
  enableRAG: boolean;
  enableMemory: boolean;
  enableTools: boolean;
  enableAdvancedPrompting: boolean;
  ragConfig: {
    chunkSize: number;
    chunkOverlap: number;
    topK: number;
    similarityThreshold: number;
    searchMode: 'semantic' | 'keyword' | 'hybrid';
  };
  memoryConfig: {
    enableChatHistory: boolean;
    historyLength: number;
    enableUserProfile: boolean;
  };
}

export default function Workbench() {
  const [config, setConfig] = useState<WorkbenchConfig>({
    model: 'deepseek-chat',
    provider: 'DeepSeek',
    temperature: 0.7,
    maxTokens: 2000,
    streamResponses: true,
    enableRAG: false,
    enableMemory: false,
    enableTools: false,
    enableAdvancedPrompting: false,
    ragConfig: {
      chunkSize: 500,
      chunkOverlap: 50,
      topK: 3,
      similarityThreshold: 0.7,
      searchMode: 'semantic',
    },
    memoryConfig: {
      enableChatHistory: true,
      historyLength: 10,
      enableUserProfile: false,
    },
  });

  const [trace, ] = useState<Array<{
    step: string;
    duration: number;
    tokens: number;
    details: Record<string, unknown>;
  }>>([]);

  // Manual input state management for AI SDK 5.0
  const [input, setInput] = useState('');

  // Use AI SDK's useChat hook with proper configuration for v5.0
  const { messages, sendMessage, error, status } = useChat();

  // Derive isLoading from status
  const isLoading = status === 'streaming' || status === 'submitted';

  // Manual input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Manual submit handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Send message using AI SDK 5.0 - use CreateUIMessage format
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: input }]
    }, {
      body: {
        config: config
      }
    });
    setInput(''); // Clear input after sending
  };

  const updateConfig = (updates: Partial<WorkbenchConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateRAGConfig = (updates: Partial<WorkbenchConfig['ragConfig']>) => {
    setConfig(prev => ({
      ...prev,
      ragConfig: { ...prev.ragConfig, ...updates },
    }));
  };

  const updateMemoryConfig = (updates: Partial<WorkbenchConfig['memoryConfig']>) => {
    setConfig(prev => ({
      ...prev,
      memoryConfig: { ...prev.memoryConfig, ...updates },
    }));
  };

  // Build context for visualization
  const context = {
    systemPrompt: 'You are a helpful AI assistant specialized in context engineering.',
    retrievedDocs: config.enableRAG ? [
      { content: 'Sample retrieved document 1', score: 0.95 },
      { content: 'Sample retrieved document 2', score: 0.87 },
    ] : [],
    chatHistory: messages.slice(-config.memoryConfig.historyLength).map(m => 
      `${m.role}: ${JSON.stringify(m)}`
    ).join('\n'),
    toolDefinitions: config.enableTools ? 'function search(query: string): string' : '',
    userInput: input,
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Config Center */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <ConfigPanel
            config={config}
            onConfigChange={updateConfig as (updates: unknown) => void}
            onRAGConfigChange={updateRAGConfig as (updates: unknown) => void}
            onMemoryConfigChange={updateMemoryConfig as (updates: unknown) => void}
          />
        </div>

        {/* Middle Panel - Split vertically */}
        <div className="flex-1 flex flex-col">
          {/* Top: Context Assembly View */}
          <div className="flex-1 border-b border-gray-200 overflow-y-auto">
            <ContextAssemblyView
              context={context}
              config={config}
            />
          </div>

          {/* Bottom: Interaction Panel */}
          <div className="flex-1 overflow-y-auto">
            <InteractionPanel
              messages={messages}
              input={input}
              isLoading={isLoading}
              error={error}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit as (e: unknown) => void}
            />
          </div>
        </div>

        {/* Right Panel - Evaluation */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <EvaluationPanel messages={messages}
            trace={trace}
          />
        </div>
      </div>
    </div>
  );
}

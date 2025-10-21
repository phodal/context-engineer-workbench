'use client';

import React, { useState } from 'react';
import Header from './layout/Header';
import ConfigPanel from './panels/ConfigPanel';
import ContextAssemblyView from './panels/ContextAssemblyView';
import InteractionPanel from './panels/InteractionPanel';
import EvaluationPanel from './panels/EvaluationPanel';

interface WorkbenchState {
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
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  context: {
    systemPrompt: string;
    retrievedDocs: Array<{ content: string; score: number }>;
    chatHistory: string;
    toolDefinitions: string;
    userInput: string;
  };
  trace: Array<{
    step: string;
    duration: number;
    tokens: number;
    details: any;
  }>;
}

export default function Workbench() {
  const [state, setState] = useState<WorkbenchState>({
    model: 'gpt-4o',
    provider: 'OpenAI',
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
    messages: [],
    context: {
      systemPrompt: 'You are a helpful AI assistant specialized in context engineering.',
      retrievedDocs: [],
      chatHistory: '',
      toolDefinitions: '',
      userInput: '',
    },
    trace: [],
  });

  const handleConfigChange = (config: Partial<WorkbenchState>) => {
    setState((prev) => ({ ...prev, ...config }));
  };

  const handleSendMessage = (message: string) => {
    const timestamp = new Date();
    const newMessages = [
      ...state.messages,
      { role: 'user' as const, content: message, timestamp },
    ];
    
    const trace = [
      { step: 'Query Embedding', duration: 45, tokens: 0, details: {} },
      { step: 'Vector Search', duration: 120, tokens: 0, details: { results: 3 } },
      { step: 'Context Assembly', duration: 30, tokens: 1250, details: {} },
      { step: 'LLM Generation', duration: 850, tokens: 450, details: {} },
      { step: 'Response Parsing', duration: 15, tokens: 0, details: {} },
    ];

    setState((prev) => ({
      ...prev,
      messages: newMessages,
      context: {
        ...prev.context,
        userInput: message,
        chatHistory: newMessages.slice(-prev.memoryConfig.historyLength).map(m => `${m.role}: ${m.content}`).join('\n'),
      },
      trace,
    }));

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        messages: [
          ...newMessages,
          {
            role: 'assistant' as const,
            content: 'This is a simulated response demonstrating the context engineering workbench.',
            timestamp: new Date(),
          },
        ],
      }));
    }, 500);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          <ConfigPanel state={state} onConfigChange={handleConfigChange} />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-1/2 border-b border-gray-200 bg-white overflow-y-auto">
            <ContextAssemblyView 
              context={state.context} 
              maxTokens={state.maxTokens}
              model={state.model}
            />
          </div>

          <div className="h-1/2 bg-white overflow-hidden">
            <InteractionPanel
              messages={state.messages}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>

        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
          <EvaluationPanel 
            messages={state.messages} 
            trace={state.trace}
          />
        </div>
      </div>
    </div>
  );
}

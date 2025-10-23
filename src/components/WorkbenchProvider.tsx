'use client';

import React, { createContext, useContext, useState } from 'react';

export interface WorkbenchConfig {
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

interface WorkbenchContextType {
  config: WorkbenchConfig;
  updateConfig: (updates: Partial<WorkbenchConfig>) => void;
  updateRAGConfig: (updates: Partial<WorkbenchConfig['ragConfig']>) => void;
  updateMemoryConfig: (updates: Partial<WorkbenchConfig['memoryConfig']>) => void;
}

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export function useWorkbench() {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbench must be used within a WorkbenchProvider');
  }
  return context;
}

interface WorkbenchProviderProps {
  children: React.ReactNode;
}

export function WorkbenchProvider({ children }: WorkbenchProviderProps) {
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

  const updateConfig = (updates: Partial<WorkbenchConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateRAGConfig = (updates: Partial<WorkbenchConfig['ragConfig']>) => {
    setConfig((prev) => ({
      ...prev,
      ragConfig: { ...prev.ragConfig, ...updates },
    }));
  };

  const updateMemoryConfig = (updates: Partial<WorkbenchConfig['memoryConfig']>) => {
    setConfig((prev) => ({
      ...prev,
      memoryConfig: { ...prev.memoryConfig, ...updates },
    }));
  };

  const value = {
    config,
    updateConfig,
    updateRAGConfig,
    updateMemoryConfig,
  };

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
}

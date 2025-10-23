'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import ContextAssemblyView from './panels/ContextAssemblyView';
import InteractionPanel from './panels/InteractionPanel';
import EvaluationPanel from './panels/EvaluationPanel';
import { useWorkbench } from './WorkbenchProvider';
import type { APIMetrics } from '@/lib/metrics';

export default function Workbench() {
  const { config } = useWorkbench();

  const [trace] = useState<
    Array<{
      step: string;
      duration: number;
      tokens: number;
      details: Record<string, unknown>;
    }>
  >([]);

  const [metrics, setMetrics] = useState<APIMetrics | null>(null);

  // Refs to track timing for metrics
  const requestStartTimeRef = useRef<number | null>(null);
  const firstTokenTimeRef = useRef<number | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const userInputRef = useRef<string>(''); // Store user input for token counting

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

  // Manual submit handler with metrics collection
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Store user input for token counting
    userInputRef.current = input;

    // Record the start time and reset first token time
    requestStartTimeRef.current = Date.now();
    firstTokenTimeRef.current = null;
    lastMessageCountRef.current = messages.length;

    // Send message using AI SDK 5.0 - use CreateUIMessage format
    sendMessage(
      {
        role: 'user',
        parts: [{ type: 'text', text: input }],
      },
      {
        body: {
          config: config,
        },
      }
    );

    setInput(''); // Clear input after sending
  };

  // Monitor messages to calculate metrics when response arrives
  useEffect(() => {
    if (
      requestStartTimeRef.current &&
      messages.length > lastMessageCountRef.current &&
      messages[messages.length - 1].role === 'assistant'
    ) {
      // Record first token time on first message part
      if (!firstTokenTimeRef.current) {
        firstTokenTimeRef.current = Date.now();
      }

      // Only calculate metrics when streaming is complete (status is not 'streaming')
      if (status !== 'streaming') {
        const endTime = Date.now();
        const startTime = requestStartTimeRef.current;
        const totalTime = endTime - startTime;
        const firstTokenLatency = firstTokenTimeRef.current
          ? firstTokenTimeRef.current - startTime
          : totalTime;

        // Extract token counts from the last message metadata
        const lastMessage = messages[messages.length - 1];
        const metadata = lastMessage.metadata as Record<string, unknown> | undefined;

        // Get real token counts from API metadata (DeepSeek returns prompt_tokens, completion_tokens)
        let inputTokens = 0;
        let outputTokens = 0;
        let totalTokens = 0;

        if (metadata?.usage && typeof metadata.usage === 'object') {
          const usage = metadata.usage as Record<string, unknown>;
          // DeepSeek API returns inputTokens (prompt_tokens) and outputTokens (completion_tokens)
          inputTokens = typeof usage.inputTokens === 'number' ? usage.inputTokens : 0;
          outputTokens = typeof usage.outputTokens === 'number' ? usage.outputTokens : 0;
          totalTokens =
            typeof usage.totalTokens === 'number' ? usage.totalTokens : inputTokens + outputTokens;
        } else {
          // Fallback: estimate from text length (only if API doesn't return real data)
          outputTokens =
            lastMessage.parts?.reduce((sum, part) => {
              if (part.type === 'text') {
                return sum + Math.ceil(part.text.length / 4);
              }
              return sum;
            }, 0) || 0;
          inputTokens = Math.ceil(userInputRef.current.length / 4);
          totalTokens = inputTokens + outputTokens;
        }

        // Ensure inputTokens is never 0 - user always sends something
        // If we got 0 from API (shouldn't happen), estimate from user input
        if (inputTokens === 0 && userInputRef.current.length > 0) {
          inputTokens = Math.max(1, Math.ceil(userInputRef.current.length / 4));
        }

        setMetrics({
          firstTokenLatency,
          totalLatency: totalTime,
          inputTokens,
          outputTokens,
          totalTokens,
          tokensPerSecond: outputTokens > 0 ? outputTokens / (totalTime / 1000) : 0,
          averageLatencyPerToken: outputTokens > 0 ? totalTime / outputTokens : 0,
          timestamp: startTime,
          model: config.model,
          provider: config.provider,
        });

        // Reset refs
        requestStartTimeRef.current = null;
        firstTokenTimeRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, status]);

  // Build context for visualization
  const context = {
    systemPrompt: 'You are a helpful AI assistant specialized in context engineering.',
    retrievedDocs: config.enableRAG
      ? [
          { content: 'Sample retrieved document 1', score: 0.95 },
          { content: 'Sample retrieved document 2', score: 0.87 },
        ]
      : [],
    chatHistory: messages
      .slice(-config.memoryConfig.historyLength)
      .map((m) => `${m.role}: ${JSON.stringify(m)}`)
      .join('\n'),
    toolDefinitions: config.enableTools ? 'function search(query: string): string' : '',
    userInput: input,
  };

  return (
    <div className="h-full flex overflow-hidden bg-gray-50">
      {/* Middle Panel - Split vertically */}
      <div className="flex-1 flex flex-col">
        {/* Top: Context Assembly View */}
        <div className="flex-1 border-b border-gray-200 overflow-y-auto">
          <ContextAssemblyView context={context} config={config} />
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
        <EvaluationPanel messages={messages} trace={trace} metrics={metrics} />
      </div>
    </div>
  );
}

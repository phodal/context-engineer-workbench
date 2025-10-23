'use client';

import React, { useMemo, useState } from 'react';
import { getColorForCaptureName } from '@/lib/treesitter-utils';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  captureNames?: string[];
  code?: string;
  language?: string;
}

const QUERY_EXAMPLES: Record<string, string> = {
  'Function Declaration': '(function_declaration name: (identifier) @name)',
  'Variable Declaration': '(variable_declarator name: (identifier) @name)',
  'Function Call': '(call_expression function: (identifier) @function)',
  'String Literal': '(string) @string',
  Comment: '(comment) @comment',
};

export default function QueryEditor({
  value,
  onChange,
  captureNames = [],
  code = '',
  language = 'javascript',
}: QueryEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIInput, setShowAIInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Extract capture names from query text
  const queryCaptureNames = useMemo(() => {
    const matches = value.match(/@\w+/g) || [];
    return [...new Set(matches.map((m) => m.substring(1)))];
  }, [value]);

  // Generate query using AI
  const generateQueryWithAI = async () => {
    if (!aiPrompt.trim() || !code.trim()) {
      alert('Please enter a requirement and ensure code is present');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are a Tree-sitter query expert. Generate a Tree-sitter query for the following requirement.

Language: ${language}

Code:
\`\`\`${language}
${code}
\`\`\`

Requirement: ${aiPrompt}

Important:
1. Always include capture names with @ prefix (e.g., @name, @body, @function)
2. Make sure captures are meaningful and descriptive
3. Return ONLY the Tree-sitter query, no explanation
4. The query should be valid Tree-sitter query syntax`,
            },
          ],
          config: {
            model: 'deepseek-chat',
            temperature: 0.3,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate query');
      }

      // Read the stream response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Parse the streaming response
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:"')) {
            // Extract text from streaming format
            const text = line.substring(3, line.length - 1);
            fullResponse += text;
          }
        }
      }

      // Clean up the response
      const cleanedQuery = fullResponse
        .trim()
        .replace(/^```[\w]*\n?/, '')
        .replace(/\n?```$/, '')
        .trim();

      if (cleanedQuery) {
        onChange(cleanedQuery);
        setAiPrompt('');
        setShowAIInput(false);
      }
    } catch (error) {
      console.error('Error generating query:', error);
      alert('Failed to generate query. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Render highlighted query
  const renderHighlightedQuery = () => {
    if (!value) return null;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const captureRegex = /@(\w+)/g;
    let match;

    while ((match = captureRegex.exec(value)) !== null) {
      const captureName = match[1];
      const color = getColorForCaptureName(
        captureName,
        captureNames.length > 0 ? captureNames : queryCaptureNames,
        false
      );

      // Add text before capture
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>{value.substring(lastIndex, match.index)}</span>
        );
      }

      // Add highlighted capture
      parts.push(
        <span
          key={`capture-${match.index}`}
          style={{
            backgroundColor: color,
            opacity: 0.3,
            borderRadius: '2px',
            fontWeight: 'bold',
          }}
        >
          @{captureName}
        </span>
      );

      lastIndex = captureRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(<span key="text-end">{value.substring(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Query</h2>
        <p className="text-xs text-slate-600 mt-1">Tree-sitter query language</p>
      </div>

      <div className="flex-1 p-4 overflow-hidden flex flex-col relative">
        {/* Highlighted overlay */}
        {queryCaptureNames.length > 0 && (
          <div
            className="absolute top-4 left-4 right-4 bottom-4 pointer-events-none overflow-hidden rounded-lg bg-slate-50 p-4 text-slate-700"
            style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
          >
            {renderHighlightedQuery()}
          </div>
        )}

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="relative flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
          style={{
            backgroundColor: queryCaptureNames.length > 0 ? 'rgba(255, 255, 255, 0.7)' : 'white',
          }}
          placeholder="Enter Tree-sitter query..."
        />
      </div>

      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 space-y-3">
        {/* AI Generation Section */}
        <div>
          <button
            onClick={() => setShowAIInput(!showAIInput)}
            disabled={isGenerating || !code.trim()}
            className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <span>✨</span>
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </button>

          {showAIInput && (
            <div className="mt-2 space-y-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to find in the code (e.g., 'Find all function declarations with their names')"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={isGenerating}
              />
              <div className="flex gap-2">
                <button
                  onClick={generateQueryWithAI}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex-1 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
                <button
                  onClick={() => {
                    setShowAIInput(false);
                    setAiPrompt('');
                  }}
                  disabled={isGenerating}
                  className="flex-1 px-3 py-1 bg-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Examples Section */}
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2">Examples:</p>
          <div className="space-y-1">
            {Object.entries(QUERY_EXAMPLES).map(([label, query]) => (
              <button
                key={label}
                onClick={() => onChange(query)}
                className="block w-full text-left text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
              >
                {label}: <code className="text-slate-600">{query}</code>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

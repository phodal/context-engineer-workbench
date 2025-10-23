'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { EditorView, Decoration } from '@codemirror/view';
import { EditorState, StateField, StateEffect, RangeSet } from '@codemirror/state';
import { getColorForCaptureName, generateExampleQueries } from '@/lib/treesitter-utils';
import type { TreeNode } from '@/lib/treesitter-utils';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  captureNames?: string[];
  code?: string;
  language?: string;
  tree?: TreeNode | null;
}

const DEFAULT_QUERY_EXAMPLES: Record<string, string> = {
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
  tree = null,
}: QueryEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIInput, setShowAIInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Extract capture names from query
  const queryCaptureNames = useMemo(() => {
    const matches = value.match(/@\w+/g) || [];
    return [...new Set(matches.map((m) => m.substring(1)))];
  }, [value]);

  // Create capture name decorations
  const captureDecorations = useMemo(() => {
    const decorations: Array<{ from: number; to: number; color: string }> = [];
    const captureRegex = /@(\w+)/g;
    let match;

    while ((match = captureRegex.exec(value)) !== null) {
      const captureName = match[1];
      const color = getColorForCaptureName(
        captureName,
        captureNames.length > 0 ? captureNames : queryCaptureNames,
        false
      );

      decorations.push({
        from: match.index,
        to: match.index + match[0].length,
        color,
      });
    }

    return decorations;
  }, [value, captureNames, queryCaptureNames]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!containerRef.current) return;

    // Create highlight effect and field
    const highlightEffect =
      StateEffect.define<Array<{ from: number; to: number; color: string }>>();

    const highlightField = StateField.define({
      create() {
        return RangeSet.empty;
      },
      update(decorations, tr) {
        for (const effect of tr.effects) {
          if (effect.is(highlightEffect)) {
            const ranges: Array<{ from: number; to: number; value: Decoration }> = [];
            for (const { from, to, color } of effect.value) {
              ranges.push({
                from,
                to,
                value: Decoration.mark({
                  class: 'cm-highlight',
                  attributes: { style: `color: ${color}; font-weight: bold;` },
                }),
              });
            }
            return RangeSet.of(ranges, true);
          }
        }
        return decorations.map(tr.changes);
      },
      provide: (f) => EditorView.decorations.from(f),
    });

    const extensions = [
      EditorView.theme({
        '.cm-content': { fontSize: '14px', fontFamily: 'monospace', padding: '12px 0' },
        '.cm-gutters': { backgroundColor: '#f5f5f5', borderRight: '1px solid #e0e0e0' },
        '.cm-highlight': { fontWeight: 'bold' },
      }),
      EditorState.tabSize.of(2),
      highlightField,
    ];

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
      dispatch: (tr) => {
        view.update([tr]);
        if (tr.docChanged) {
          onChange(view.state.doc.toString());
        }
      },
    });

    // Apply highlights
    if (captureDecorations.length > 0) {
      view.dispatch({
        effects: highlightEffect.of(captureDecorations),
      });
    }

    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [onChange, value, captureDecorations]);

  // Generate dynamic examples based on tree
  const queryExamples = useMemo(() => {
    if (!tree) {
      return DEFAULT_QUERY_EXAMPLES;
    }

    // Extract node types from tree
    const nodeTypes = new Set<string>();
    const extractTypes = (node: TreeNode | null) => {
      if (!node) return;
      if (node.isNamed && !node.isMissing && !node.isError) {
        nodeTypes.add(node.type);
      }
      if (node.children) {
        node.children.forEach(extractTypes);
      }
    };

    extractTypes(tree);

    // Generate examples based on detected node types
    return generateExampleQueries(nodeTypes, language);
  }, [tree, language]);

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

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-linear-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Query</h2>
        <p className="text-xs text-slate-600 mt-1">Tree-sitter query language</p>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden h"
        style={
          {
            '--cm-content-height': '400px',
          } as React.CSSProperties
        }
      />

      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 space-y-3">
        {/* AI Generation Section */}
        <div>
          <button
            onClick={() => setShowAIInput(!showAIInput)}
            disabled={isGenerating || !code.trim()}
            className="w-full px-3 py-2 bg-linear-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
          <p className="text-xs font-semibold text-slate-700 mb-2">
            Examples: {tree ? '(based on your code)' : '(default)'}
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {Object.entries(queryExamples).map(([label, query]) => (
              <button
                key={label}
                onClick={() => onChange(query)}
                className="block w-full text-left text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded transition-colors truncate"
              >
                {label}: <code className="text-slate-600 truncate">{query}</code>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

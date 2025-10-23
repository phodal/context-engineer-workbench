'use client';

import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import TreeViewer from './TreeViewer';
import QueryEditor from './QueryEditor';
import LanguageSelector from './LanguageSelector';
import {
  parseCode,
  queryTreeWithCode,
  treeToJSON,
  getColorForCaptureName,
  type TreeNode,
} from '@/lib/treesitter-utils';
import type { Highlight } from './CodeEditor';

export default function TreeSitterPlayground() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('function hello() {\n  console.log("Hello, World!");\n}');
  const [query, setQuery] = useState('');
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuery, setShowQuery] = useState(true);
  const [showLog, setShowLog] = useState(true);
  const [highlightedNodeId, setHighlightedNodeId] = useState<number | undefined>();
  const [selectedRange, setSelectedRange] = useState<
    | {
        startRow: number;
        startColumn: number;
        endRow: number;
        endColumn: number;
      }
    | undefined
  >();
  const [captureNames, setCaptureNames] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  // Parse code when it changes
  useEffect(() => {
    const parseCodeAsync = async () => {
      try {
        setIsLoading(true);
        const parsedTree = await parseCode(code, language);
        const treeJson = treeToJSON(parsedTree.rootNode);
        setTree(treeJson);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Parse error');
        setTree(null);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(parseCodeAsync, 500);
    return () => clearTimeout(timer);
  }, [code, language]);

  // Execute query when it changes
  useEffect(() => {
    const executeQuery = async () => {
      if (!query.trim()) {
        setCaptureNames([]);
        setHighlights([]);
        return;
      }

      try {
        setIsLoading(true);
        const results = await queryTreeWithCode(code, query, language);
        setError(null);

        // Extract unique capture names from results
        const names = new Set<string>();
        const highlightsList: Highlight[] = [];

        results.forEach((match) => {
          match.captures.forEach((capture) => {
            names.add(capture.name);

            // Create highlight for each capture
            const color = getColorForCaptureName(capture.name, Array.from(names), false);
            highlightsList.push({
              startRow: capture.startPosition.row,
              startColumn: capture.startPosition.column,
              endRow: capture.endPosition.row,
              endColumn: capture.endPosition.column,
              color,
              captureName: capture.name,
            });
          });
        });

        setCaptureNames(Array.from(names));
        setHighlights(highlightsList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Query error');
        setCaptureNames([]);
        setHighlights([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(executeQuery, 500);
    return () => clearTimeout(timer);
  }, [query, code, language]);

  const handleNodeClick = (node: TreeNode) => {
    if (node.id !== undefined) {
      setHighlightedNodeId(node.id);
    }
    // Set selection range in code editor
    setSelectedRange({
      startRow: node.startPosition.row,
      startColumn: node.startPosition.column,
      endRow: node.endPosition.row,
      endColumn: node.endPosition.column,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">TreeSitter Playground</h1>
          <p className="text-slate-600">Explore syntax trees with Tree-sitter</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-slate-200">
          <div className="flex items-center gap-6">
            <LanguageSelector value={language} onChange={setLanguage} />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLog}
                onChange={(e) => setShowLog(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700">Log</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showQuery}
                onChange={(e) => setShowQuery(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700">Query</span>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Panel - Code Editor */}
          <div className="col-span-2">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              isLoading={isLoading}
              selectedRange={selectedRange}
              highlights={highlights}
            />
          </div>

          {/* Right Panel - Query Editor */}
          <div className="flex flex-col gap-6">
            <QueryEditor
              value={query}
              onChange={setQuery}
              captureNames={captureNames}
              code={code}
              language={language}
              tree={tree}
            />
          </div>
        </div>

        {/* Bottom Panel - Tree Output */}
        <div className="mt-6">
          <TreeViewer
            tree={tree}
            isLoading={isLoading}
            onNodeClick={handleNodeClick}
            highlightedNodeId={highlightedNodeId}
          />
        </div>
      </div>
    </div>
  );
}

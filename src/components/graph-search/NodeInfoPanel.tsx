'use client';

import React, { useState, useEffect } from 'react';
import { CodeDocumentation } from '@/lib/rag/code-documentation-store';

interface NodeInfoPanelProps {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  code: string;
  language: string;
  relatedNodes?: string[];
  onClose?: () => void;
}

export default function NodeInfoPanel({
  nodeId,
  nodeLabel,
  nodeType,
  code,
  language,
  relatedNodes = [],
  onClose,
}: NodeInfoPanelProps) {
  const [documentation, setDocumentation] = useState<CodeDocumentation | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateDocumentation = async () => {
      setDocLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/rag/generate-code-documentation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId,
            nodeLabel,
            nodeType,
            code,
            language,
            relatedNodes,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate documentation');
        }

        const data = await response.json();
        setDocumentation(data.documentation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error generating documentation:', err);
      } finally {
        setDocLoading(false);
      }
    };

    generateDocumentation();
    // Only depend on code and language since cache is based on these
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language]);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200 flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{nodeLabel}</h2>
          <p className="text-xs text-slate-600 mt-1">
            Type: <span className="font-semibold">{nodeType}</span> | Language:{' '}
            <span className="font-semibold">{language}</span>
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-xl font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Loading State */}
        {docLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="ml-3 text-sm text-slate-600">Generating documentation...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-semibold">Error</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Documentation Content */}
        {documentation && !docLoading && (
          <>
            {/* Summary */}
            {documentation.summary && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Summary</h3>
                <p className="text-sm text-slate-700 bg-slate-50 rounded p-3">
                  {documentation.summary}
                </p>
              </div>
            )}

            {/* Documentation */}
            {documentation.documentation && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Documentation</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded p-3">
                  {documentation.documentation}
                </p>
              </div>
            )}

            {/* Parameters */}
            {documentation.parameters && documentation.parameters.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Parameters</h3>
                <div className="space-y-2">
                  {documentation.parameters.map((param, idx) => (
                    <div key={idx} className="bg-slate-50 rounded p-3 text-sm">
                      <p className="font-mono font-semibold text-blue-600">
                        {param.name}: {param.type}
                      </p>
                      <p className="text-slate-700 mt-1">{param.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Return Type */}
            {documentation.returnType && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Returns</h3>
                <div className="bg-slate-50 rounded p-3 text-sm">
                  <p className="font-mono font-semibold text-green-600">
                    {documentation.returnType}
                  </p>
                  {documentation.returnDescription && (
                    <p className="text-slate-700 mt-1">{documentation.returnDescription}</p>
                  )}
                </div>
              </div>
            )}

            {/* Examples */}
            {documentation.examples && documentation.examples.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Examples</h3>
                <div className="space-y-2">
                  {documentation.examples.map((example, idx) => (
                    <pre
                      key={idx}
                      className="bg-slate-900 text-slate-100 rounded p-3 text-xs overflow-x-auto"
                    >
                      {example}
                    </pre>
                  ))}
                </div>
              </div>
            )}

            {/* Related Nodes */}
            {relatedNodes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Related Nodes</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedNodes.map((nodeId) => (
                    <span
                      key={nodeId}
                      className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {nodeId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-slate-500 border-t border-slate-200 pt-4">
              <p>Generated: {new Date(documentation.createdAt).toLocaleString()}</p>
              {documentation.tokensUsed && <p>Tokens used: {documentation.tokensUsed}</p>}
              {documentation.llmModel && <p>Model: {documentation.llmModel}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

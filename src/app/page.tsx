'use client';

import { useState } from 'react';

export default function Home() {
  const [toolResult, setToolResult] = useState<string>('');
  const [retrieverResult, setRetrieverResult] = useState<string>('');
  const [ragResult, setRagResult] = useState<string>('');
  const [ragQuery, setRagQuery] = useState<string>('TypeScript');
  const [loading, setLoading] = useState(false);

  const handleToolDemo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/adapters/tool-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'TypeScript', topK: 2 }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setToolResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setToolResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieverDemo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/adapters/retriever-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'JavaScript', topK: 2 }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setRetrieverResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setRetrieverResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRAGDemo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rag/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragQuery, topK: 3 }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setRagResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setRagResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">LangChain.js 适配器演示</h1>
        <p className="text-slate-300 mb-8">
          展示如何将我们的 Tool 和 Retriever 适配为 LangChain 组件
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tool 适配器演示 */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Tool 适配器</h2>
            <p className="text-slate-300 mb-4">
              将我们的 KeywordSearchTool 适配为 LangChain Tool
            </p>

            <button
              onClick={handleToolDemo}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded mb-4 transition"
            >
              {loading ? '执行中...' : '执行 Tool 演示'}
            </button>

            {toolResult && (
              <div className="bg-slate-900 rounded p-4 border border-slate-600 overflow-auto max-h-96">
                <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words">
                  {toolResult}
                </pre>
              </div>
            )}
          </div>

          {/* Retriever 适配器演示 */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Retriever 适配器</h2>
            <p className="text-slate-300 mb-4">
              将我们的 BM25Retriever 适配为 LangChain Retriever
            </p>

            <button
              onClick={handleRetrieverDemo}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded mb-4 transition"
            >
              {loading ? '执行中...' : '执行 Retriever 演示'}
            </button>

            {retrieverResult && (
              <div className="bg-slate-900 rounded p-4 border border-slate-600 overflow-auto max-h-96">
                <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words">
                  {retrieverResult}
                </pre>
              </div>
            )}
          </div>

          {/* LangChain RAG 演示 */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">LangChain RAG</h2>
            <p className="text-slate-300 mb-4">
              文档检索增强生成 (RAG) 演示
            </p>

            <div className="mb-4">
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                placeholder="输入查询词..."
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleRAGDemo}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded mb-4 transition"
            >
              {loading ? '执行中...' : '执行 RAG 检索'}
            </button>

            {ragResult && (
              <div className="bg-slate-900 rounded p-4 border border-slate-600 overflow-auto max-h-96">
                <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words">
                  {ragResult}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">功能说明</h3>
          <div className="text-slate-300 space-y-3">
            <div>
              <p className="font-semibold text-blue-400">🔧 适配器模式</p>
              <p className="text-sm">✅ 保持我们的抽象，Tool 和 Retriever 的原始实现保持不变</p>
              <p className="text-sm">✅ 通过适配器层与 LangChain.js 生态集成</p>
            </div>
            <div>
              <p className="font-semibold text-green-400">📚 LangChain RAG</p>
              <p className="text-sm">✅ 集成 LangChain 的文档加载和处理能力</p>
              <p className="text-sm">✅ 支持 Markdown、JSON、文本等多种格式</p>
              <p className="text-sm">✅ 自动文档分割和块处理</p>
            </div>
            <div>
              <p className="font-semibold text-purple-400">🚀 完整集成</p>
              <p className="text-sm">✅ 无缝集成原始实现和 LangChain 适配器</p>
              <p className="text-sm">✅ 灵活使用，可同时使用多种检索方式</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';

export default function AdaptersDemoPage() {
  const [toolResult, setToolResult] = useState<string>('');
  const [retrieverResult, setRetrieverResult] = useState<string>('');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">LangChain.js 适配器演示</h1>
        <p className="text-slate-300 mb-8">
          展示如何将我们的 Tool 和 Retriever 适配为 LangChain 组件
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        </div>

        {/* 说明 */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">适配器模式说明</h3>
          <div className="text-slate-300 space-y-2">
            <p>
              ✅ <strong>保持我们的抽象</strong>：Tool 和 Retriever 的原始实现保持不变
            </p>
            <p>
              ✅ <strong>LangChain 适配</strong>：通过适配器层与 LangChain.js 生态集成
            </p>
            <p>
              ✅ <strong>无缝集成</strong>：适配器提供了 LangChain 期望的接口
            </p>
            <p>
              ✅ <strong>灵活使用</strong>：可以同时使用原始实现和 LangChain 适配器
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


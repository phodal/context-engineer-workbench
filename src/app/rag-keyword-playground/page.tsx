'use client';

import React, { useState, useCallback } from 'react';
import QueryRewriteSection from '@/components/rag-playground/QueryRewriteSection';
import KeywordSearchSection from '@/components/rag-playground/KeywordSearchSection';
import TokenCostSection from '@/components/rag-playground/TokenCostSection';
import ExecutionSection from '@/components/rag-playground/ExecutionSection';
import PipelineVisualization from '@/components/rag-playground/PipelineVisualization';
import ReferenceLinks from '@/components/rag-playground/ReferenceLinks';

interface RewriteResult {
  original: string;
  rewritten: string;
  technique: string;
  timestamp: number;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
}

interface TokenCost {
  step: string;
  tokens: number;
  percentage: number;
}

interface ExecutionResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: string;
  error?: string;
}

export default function RAGKeywordPlaygroundPage() {
  const [userQuery, setUserQuery] = useState('');
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [tokenCosts, setTokenCosts] = useState<TokenCost[]>([]);
  const [executionResult, setExecutionResult] = useState<ExecutionResult>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);

  const handleQueryRewrite = useCallback(async () => {
    if (!userQuery.trim()) return;

    setIsLoading(true);
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const rewritten = simulateQueryRewrite(userQuery);
      const result: RewriteResult = {
        original: userQuery,
        rewritten,
        technique: 'HyDE (Hypothetical Document Embeddings)',
        timestamp: Date.now(),
      };

      setRewriteResult(result);

      // Simulate keyword search
      const results = simulateKeywordSearch(rewritten);
      setSearchResults(results);

      // Calculate token costs
      const costs = calculateTokenCosts(userQuery, rewritten, results);
      setTokenCosts(costs);
    } finally {
      setIsLoading(false);
    }
  }, [userQuery]);

  const handleExecute = useCallback(async () => {
    if (!rewriteResult) return;

    setExecutionResult({ status: 'loading' });
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = simulateExecution(rewriteResult.rewritten, searchResults);
      setExecutionResult({ status: 'success', result });
    } catch (error) {
      setExecutionResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [rewriteResult, searchResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            RAG Keyword Search Playground
          </h1>
          <p className="text-slate-600">
            Learn how keyword-based retrieval works in RAG systems
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Pipeline Visualization */}
        <div className="mb-8">
          <PipelineVisualization
            currentStep={
              executionResult.status === 'success'
                ? 'execute'
                : searchResults.length > 0
                  ? 'search'
                  : rewriteResult
                    ? 'rewrite'
                    : 'input'
            }
          />
        </div>

        {/* Reference Links */}
        <div className="mb-8">
          <ReferenceLinks />
        </div>

        {/* Query Rewrite Section */}
        <div className="mb-8">
          <QueryRewriteSection
            userQuery={userQuery}
            onQueryChange={setUserQuery}
            onRewrite={handleQueryRewrite}
            rewriteResult={rewriteResult}
            isLoading={isLoading}
          />
        </div>

        {/* Keyword Search Section */}
        {rewriteResult && (
          <div className="mb-8">
            <KeywordSearchSection searchResults={searchResults} />
          </div>
        )}

        {/* Token Cost Section */}
        {tokenCosts.length > 0 && (
          <div className="mb-8">
            <TokenCostSection tokenCosts={tokenCosts} />
          </div>
        )}

        {/* Execution Section */}
        {rewriteResult && (
          <div className="mb-8">
            <ExecutionSection
              onExecute={handleExecute}
              executionResult={executionResult}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>
    </div>
  );
}

// Helper functions
function simulateQueryRewrite(query: string): string {
  const techniques = [
    `Generate a hypothetical document that would answer: "${query}"`,
    `Expand query with related concepts: "${query}" with semantic variations`,
    `Reformulate as: "What are the key aspects of ${query}?"`,
  ];
  return techniques[Math.floor(Math.random() * techniques.length)];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function simulateKeywordSearch(_query: string): SearchResult[] {
  const mockDocuments = [
    {
      id: '1',
      title: 'Vector Databases for Semantic Search',
      content: 'Vector databases store embeddings and enable semantic similarity search...',
    },
    {
      id: '2',
      title: 'BM25 Algorithm Explained',
      content: 'BM25 is a probabilistic retrieval model that ranks documents by relevance...',
    },
    {
      id: '3',
      title: 'RAG Systems and Information Retrieval',
      content: 'Retrieval-Augmented Generation combines retrieval with language models...',
    },
    {
      id: '4',
      title: 'Embedding Models and Semantic Understanding',
      content: 'Modern embedding models capture semantic meaning of text...',
    },
    {
      id: '5',
      title: 'Hybrid Search: Combining Keyword and Semantic',
      content: 'Hybrid search combines BM25 keyword search with semantic similarity...',
    },
  ];

  return mockDocuments.map((doc, idx) => ({
    ...doc,
    score: Math.max(0.3, 1 - (idx * 0.15 + Math.random() * 0.1)),
  }));
}

function calculateTokenCosts(
  original: string,
  rewritten: string,
  results: SearchResult[]
): TokenCost[] {
  const rewriteTokens = Math.ceil(rewritten.length / 4);
  const searchTokens = Math.ceil(results.reduce((sum, r) => sum + r.content.length, 0) / 4);
  const executionTokens = 150;
  const totalTokens = rewriteTokens + searchTokens + executionTokens;

  return [
    { step: 'Query Rewrite', tokens: rewriteTokens, percentage: (rewriteTokens / totalTokens) * 100 },
    { step: 'Keyword Search', tokens: searchTokens, percentage: (searchTokens / totalTokens) * 100 },
    { step: 'Execution', tokens: executionTokens, percentage: (executionTokens / totalTokens) * 100 },
  ];
}

function simulateExecution(query: string, results: SearchResult[]): string {
  const topResult = results[0];
  return `Based on the rewritten query and retrieved documents, the system found that "${topResult.title}" is the most relevant result. The RAG system would now use this context along with the original query to generate a comprehensive answer using the language model.`;
}


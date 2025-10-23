'use client';

import React, { useState, useCallback } from 'react';
import InteractionPanel from '@/components/rag-playground/InteractionPanel';
import ResultsPanel from '@/components/rag-playground/ResultsPanel';
import PipelineWithPapers from '@/components/rag-playground/PipelineWithPapers';

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
      // Call the rewrite API
      const rewriteResponse = await fetch('/api/rag/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
      });

      if (!rewriteResponse.ok) {
        throw new Error('Failed to rewrite query');
      }

      const rewriteData = await rewriteResponse.json();

      const result: RewriteResult = {
        original: userQuery,
        rewritten: rewriteData.rewritten,
        technique: rewriteData.technique,
        timestamp: rewriteData.timestamp,
      };

      setRewriteResult(result);

      // Call the generate-documents API to create mock data with BM25 scoring
      const generateResponse = await fetch('/api/rag/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: rewriteData.rewritten }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate documents');
      }

      interface GeneratedDocument {
        id: string;
        title: string;
        content: string;
        score: number;
      }

      const generateData = (await generateResponse.json()) as {
        documents: GeneratedDocument[];
        usage?: { promptTokens?: number };
      };

      // Transform generated results to SearchResult format
      const searchResults: SearchResult[] = generateData.documents.map(
        (doc: GeneratedDocument) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          score: doc.score,
        })
      );

      setSearchResults(searchResults);

      // Calculate token costs based on actual usage
      const rewriteTokens = rewriteData.usage?.promptTokens || 100;
      const generateTokens = generateData.usage?.promptTokens || 100;
      const searchTokens = searchResults.reduce(
        (sum: number, r: SearchResult) => sum + (r.content?.length || 0) / 4,
        0
      );

      const costs: TokenCost[] = [
        {
          step: 'Query Rewrite',
          tokens: rewriteTokens,
          percentage: 0,
        },
        {
          step: 'Keyword Search',
          tokens: generateTokens + Math.ceil(searchTokens),
          percentage: 0,
        },
        {
          step: 'Execution',
          tokens: 150,
          percentage: 0,
        },
      ];

      const totalTokens = costs.reduce((sum, c) => sum + c.tokens, 0);
      costs.forEach((c) => {
        c.percentage = totalTokens > 0 ? (c.tokens / totalTokens) * 100 : 0;
      });

      setTokenCosts(costs);
    } catch (error) {
      console.error('Error in query rewrite:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [userQuery]);

  const handleExecute = useCallback(async () => {
    if (!rewriteResult) return;

    setExecutionResult({ status: 'loading' });
    try {
      // Call the execute API
      const executeResponse = await fetch('/api/rag/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          searchResults: searchResults,
        }),
      });

      if (!executeResponse.ok) {
        throw new Error('Failed to execute RAG');
      }

      const executeData = await executeResponse.json();
      setExecutionResult({ status: 'success', result: executeData.result });
    } catch (error) {
      setExecutionResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [rewriteResult, searchResults, userQuery]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">RAG Keyword Search Playground</h1>
          <p className="text-slate-600">Learn how keyword-based retrieval works in RAG systems</p>
        </div>
      </header>

      {/* Main Content - Vertical Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Top: Pipeline with Papers */}
          <PipelineWithPapers
            rewriteResult={rewriteResult}
            searchResultsCount={searchResults.length}
            executionStatus={executionResult.status}
          />

          {/* Middle: Interaction Panel */}
          <InteractionPanel
            userQuery={userQuery}
            onQueryChange={setUserQuery}
            onRewrite={handleQueryRewrite}
            rewriteResult={rewriteResult}
            tokenCosts={tokenCosts}
            isLoading={isLoading}
          />

          {/* Bottom: Results Panel */}
          <ResultsPanel
            rewriteResult={rewriteResult}
            searchResults={searchResults}
            executionResult={executionResult}
            onExecute={handleExecute}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}

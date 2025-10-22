'use client';

import React, { useState, useCallback } from 'react';
import InteractionPanel from '@/components/rag-playground/InteractionPanel';
import ResultsPanel from '@/components/rag-playground/ResultsPanel';
import PipelineWithPapers from '@/components/rag-playground/PipelineWithPapers';

interface VectorEmbedding {
  text: string;
  embedding: number[];
  timestamp: number;
}

interface CandidateDocument {
  id: string;
  title: string;
  content: string;
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

export default function RAGVectorPlaygroundPage() {
  const [userQuery, setUserQuery] = useState('');
  const [candidates, setCandidates] = useState<CandidateDocument[]>([]);
  const [queryEmbedding, setQueryEmbedding] = useState<VectorEmbedding | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [tokenCosts, setTokenCosts] = useState<TokenCost[]>([]);
  const [executionResult, setExecutionResult] = useState<ExecutionResult>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);

  const handleQueryEmbedding = useCallback(async () => {
    if (!userQuery.trim()) return;

    setIsLoading(true);
    try {
      // Step 1: Generate candidate documents using AI
      const candidatesResponse = await fetch('/api/rag/generate-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery }),
      });

      if (!candidatesResponse.ok) {
        throw new Error('Failed to generate candidates');
      }

      const candidatesData = await candidatesResponse.json();
      const candidateDocs: CandidateDocument[] = candidatesData.candidates || [];
      setCandidates(candidateDocs);

      // Step 2: Generate embeddings for query and candidates
      const queryEmbeddingResponse = await fetch('/api/rag/vector-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userQuery }),
      });

      if (!queryEmbeddingResponse.ok) {
        throw new Error('Failed to generate query embedding');
      }

      const queryEmbeddingData = await queryEmbeddingResponse.json();
      const queryEmbedding: VectorEmbedding = {
        text: userQuery,
        embedding: queryEmbeddingData.embedding,
        timestamp: queryEmbeddingData.timestamp,
      };
      setQueryEmbedding(queryEmbedding);

      // Step 3: Generate embeddings for candidate documents
      const candidateTexts = candidateDocs.map(doc => doc.content);
      const candidateEmbeddingsResponse = await fetch('/api/rag/vector-embedding-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: candidateTexts }),
      });

      if (!candidateEmbeddingsResponse.ok) {
        throw new Error('Failed to generate candidate embeddings');
      }

      const candidateEmbeddingsData = await candidateEmbeddingsResponse.json();
      const candidateEmbeddings = candidateEmbeddingsData.embeddings || [];

      // Step 4: Calculate cosine similarity between query and candidates
      const results: SearchResult[] = candidateDocs.map((doc, index) => {
        const similarity = cosineSimilarity(
          queryEmbedding.embedding,
          candidateEmbeddings[index] || []
        );
        return {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          score: similarity,
        };
      });

      // Sort by similarity score
      results.sort((a, b) => b.score - a.score);
      setSearchResults(results);

      // Calculate token costs
      const generateCandidatesTokens = candidatesData.usage?.promptTokens || 100;
      const embeddingTokens = queryEmbeddingData.usage?.promptTokens || 50;
      const candidateEmbeddingTokens = candidateEmbeddingsData.usage?.promptTokens || 100;

      const costs: TokenCost[] = [
        {
          step: 'Generate Candidates',
          tokens: generateCandidatesTokens,
          percentage: 0,
        },
        {
          step: 'Query Embedding',
          tokens: embeddingTokens,
          percentage: 0,
        },
        {
          step: 'Candidate Embeddings',
          tokens: candidateEmbeddingTokens,
          percentage: 0,
        },
        {
          step: 'Cosine Similarity',
          tokens: 50,
          percentage: 0,
        },
      ];

      const totalTokens = costs.reduce((sum, c) => sum + c.tokens, 0);
      costs.forEach(c => {
        c.percentage = totalTokens > 0 ? (c.tokens / totalTokens) * 100 : 0;
      });

      setTokenCosts(costs);
    } catch (error) {
      console.error('Error in vector search:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [userQuery]);

  const handleExecute = useCallback(async () => {
    if (!queryEmbedding) return;

    setExecutionResult({ status: 'loading' });
    try {
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
  }, [queryEmbedding, searchResults, userQuery]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            RAG Vector Search Playground
          </h1>
          <p className="text-slate-600">
            Learn how vector-based semantic search works in RAG systems
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Flow: Query → Generate Candidates → Generate Embeddings → Cosine Similarity
          </p>
        </div>
      </header>

      {/* Main Content - Vertical Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Top: Pipeline with Papers */}
          <PipelineWithPapers
            rewriteResult={queryEmbedding ? { 
              original: queryEmbedding.text, 
              rewritten: `Embedding: [${queryEmbedding.embedding.slice(0, 3).map(v => v.toFixed(3)).join(', ')}...]`,
              technique: 'GLM Embedding-3',
            } : null}
            searchResultsCount={searchResults.length}
            executionStatus={executionResult.status}
          />

          {/* Middle: Interaction Panel */}
          <InteractionPanel
            userQuery={userQuery}
            onQueryChange={setUserQuery}
            onRewrite={handleQueryEmbedding}
            rewriteResult={queryEmbedding ? { 
              original: queryEmbedding.text, 
              rewritten: `Embedding: [${queryEmbedding.embedding.slice(0, 3).map(v => v.toFixed(3)).join(', ')}...]`,
              technique: 'GLM Embedding-3',
              timestamp: Date.now()
            } : null}
            tokenCosts={tokenCosts}
            isLoading={isLoading}
          />

          {/* Candidates Section */}
          {candidates.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Generated Candidates</h2>
                <p className="text-xs text-slate-600 mt-1">AI-generated documents related to your query</p>
              </div>
              <div className="p-6 space-y-4">
                {candidates.map((candidate, idx) => (
                  <div key={candidate.id} className="border border-slate-200 rounded p-4">
                    <h3 className="font-semibold text-slate-900">{idx + 1}. {candidate.title}</h3>
                    <p className="text-sm text-slate-600 mt-2">{candidate.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom: Results Panel */}
          <ResultsPanel
            rewriteResult={queryEmbedding ? { 
              original: queryEmbedding.text, 
              rewritten: `Embedding: [${queryEmbedding.embedding.slice(0, 3).map(v => v.toFixed(3)).join(', ')}...]`,
              technique: 'GLM Embedding-3',
              timestamp: Date.now()
            } : null}
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

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}


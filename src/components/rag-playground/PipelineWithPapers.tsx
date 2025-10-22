'use client';

import React, { useState } from 'react';

interface PaperLink {
  title: string;
  url: string;
  description: string;
}

interface PipelineStep {
  id: string;
  name: string;
  label: string;
  papers: PaperLink[];
  details?: string;
}

interface PipelineWithPapersProps {
  rewriteResult: { original: string; rewritten: string; technique: string } | null;
  searchResultsCount: number;
  executionStatus: 'idle' | 'loading' | 'success' | 'error';
}

// Pipeline steps with associated papers
const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'query',
    name: 'Query',
    label: 'User Input',
    papers: [
      {
        title: 'Information Retrieval Basics',
        url: 'https://en.wikipedia.org/wiki/Information_retrieval',
        description: 'Fundamentals of query processing',
      },
    ],
    details: 'User enters natural language query',
  },
  {
    id: 'rewrite',
    name: 'Rewrite',
    label: 'Query Transformation',
    papers: [
      {
        title: 'HyDE: Hypothetical Document Embeddings',
        url: 'https://arxiv.org/abs/2212.10496',
        description: 'Query expansion via hypothetical documents',
      },
      {
        title: 'Query2Doc: Query Expansion with LLMs',
        url: 'https://arxiv.org/abs/2305.03653',
        description: 'Generating pseudo-documents for retrieval',
      },
    ],
    details: 'Query is rewritten using advanced techniques',
  },
  {
    id: 'search',
    name: 'Search',
    label: 'Keyword Search',
    papers: [
      {
        title: 'BM25: Probabilistic Ranking',
        url: 'https://en.wikipedia.org/wiki/Okapi_BM25',
        description: 'Probabilistic retrieval ranking algorithm',
      },
      {
        title: 'SPLADE: Sparse Lexical Retrieval',
        url: 'https://arxiv.org/abs/2107.05957',
        description: 'Sparse learned dense retrieval',
      },
    ],
    details: 'Documents are ranked using BM25 algorithm',
  },
  {
    id: 'execute',
    name: 'Execute',
    label: 'Generation',
    papers: [
      {
        title: 'RAG: Retrieval-Augmented Generation',
        url: 'https://arxiv.org/abs/2005.11401',
        description: 'Combining retrieval with generation',
      },
      {
        title: 'In-Context Learning',
        url: 'https://arxiv.org/abs/2301.00234',
        description: 'Learning from examples in context',
      },
    ],
    details: 'Final answer is generated using retrieved context',
  },
];

export default function PipelineWithPapers({
  rewriteResult,
  searchResultsCount,
  executionStatus,
}: PipelineWithPapersProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    query: true,
    rewrite: false,
    search: false,
    execute: false,
  });

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const getStepStatus = (stepId: string) => {
    switch (stepId) {
      case 'query':
        return 'complete';
      case 'rewrite':
        return rewriteResult ? 'complete' : 'pending';
      case 'search':
        return searchResultsCount > 0 ? 'complete' : 'pending';
      case 'execute':
        return executionStatus === 'success' ? 'complete' : 'pending';
      default:
        return 'pending';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Pipeline & Papers</h2>
        <p className="text-xs text-slate-600 mt-1">Click on steps to view related papers</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Horizontal Pipeline */}
        <div className="flex items-center justify-between mb-6">
          {PIPELINE_STEPS.map((step, idx) => {
            const status = getStepStatus(step.id);
            const isComplete = status === 'complete';

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors mb-2 ${
                    isComplete
                      ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isComplete ? '✓' : idx + 1}
                </button>
                <p className="text-xs font-semibold text-slate-900 text-center">{step.name}</p>

                {/* Arrow between steps */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="absolute left-1/2 w-8 h-0.5 bg-slate-300 transform translate-x-4 -translate-y-8" />
                )}
              </div>
            );
          })}
        </div>

        {/* Expandable Step Details with Papers */}
        <div className="space-y-3 border-t border-slate-200 pt-4">
          {PIPELINE_STEPS.map((step) => (
            expandedSteps[step.id] && (
              <div key={step.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">{step.label}</h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-900 rounded">
                    {getStepStatus(step.id) === 'complete' ? 'Complete' : 'Pending'}
                  </span>
                </div>

                {step.details && (
                  <p className="text-xs text-slate-700 mb-3">{step.details}</p>
                )}

                {/* Papers for this step */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-900 mb-2">📚 Related Papers:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {step.papers.map((paper) => (
                      <a
                        key={paper.url}
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                      >
                        <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {paper.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">{paper.description}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}


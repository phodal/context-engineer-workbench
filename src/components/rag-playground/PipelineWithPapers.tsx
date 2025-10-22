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
    query: false,
    rewrite: false,
    search: false,
    execute: false,
  });
  const [expandedPapers, setExpandedPapers] = useState<Record<string, boolean>>({
    query: false,
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

  const togglePapers = (stepId: string) => {
    setExpandedPapers((prev) => ({
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
      <div className="bg-linear-to-r from-indigo-50 to-indigo-100 px-4 py-3 border-b border-slate-200">
        <h2 className="text-base font-bold text-slate-900">Pipeline & Papers</h2>
      </div>

      <div className="p-4 space-y-3">
        {/* Horizontal Pipeline - Compact */}
        <div className="flex items-center justify-between gap-1">
          {PIPELINE_STEPS.map((step, idx) => {
            const status = getStepStatus(step.id);
            const isComplete = status === 'complete';

            return (
              <div key={step.id} className="flex flex-col items-center flex-1 min-w-0">
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors mb-1 shrink-0 ${
                    isComplete
                      ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={step.label}
                >
                  {isComplete ? '✓' : idx + 1}
                </button>
                <p className="text-xs font-semibold text-slate-900 text-center truncate">{step.name}</p>

                {/* Arrow between steps */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="absolute left-1/2 w-6 h-0.5 bg-slate-300 transform translate-x-3 -translate-y-6" />
                )}
              </div>
            );
          })}
        </div>

        {/* Expandable Step Details with Papers - Compact */}
        <div className="space-y-2 border-t border-slate-200 pt-3">
          {PIPELINE_STEPS.map((step) => (
            <div key={step.id} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Step Header - Always Visible */}
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-900">{step.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${
                    getStepStatus(step.id) === 'complete'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {getStepStatus(step.id) === 'complete' ? '✓' : '○'}
                  </span>
                </div>
                <span className="text-slate-500 text-xs shrink-0">
                  {expandedSteps[step.id] ? '▼' : '▶'}
                </span>
              </button>

              {/* Expanded Content */}
              {expandedSteps[step.id] && (
                <div className="px-3 py-2 bg-white border-t border-slate-200 space-y-2">
                  {step.details && (
                    <p className="text-xs text-slate-700">{step.details}</p>
                  )}

                  {/* Papers Toggle Button */}
                  <button
                    onClick={() => togglePapers(step.id)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                  >
                    <span>{expandedPapers[step.id] ? '▼' : '▶'}</span>
                    <span>📚 Related Papers ({step.papers.length})</span>
                  </button>

                  {/* Papers List - Expandable */}
                  {expandedPapers[step.id] && (
                    <div className="space-y-1 pl-2 border-l-2 border-indigo-200">
                      {step.papers.map((paper) => (
                        <a
                          key={paper.url}
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-1.5 rounded border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                        >
                          <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                            {paper.title}
                          </p>
                          <p className="text-xs text-slate-600 line-clamp-1">{paper.description}</p>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


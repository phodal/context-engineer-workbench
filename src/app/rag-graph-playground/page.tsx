'use client';

import React, { useState, useCallback } from 'react';
import D3GraphVisualization from '@/components/graph-search/D3GraphVisualization';
import {
  buildCodeGraph,
  colorizeGraph,
  calculateNodeSizesInGraph,
  graphToD3Data,
  GraphData,
} from '@/lib/graph-builder';

interface TokenCost {
  step: string;
  tokens: number;
  percentage: number;
}

const EXAMPLE_CODE = `
// Example: Simple User Management System
// This demonstrates function and class relationships

class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  // Validate email format
  validateEmail() {
    return this.email.includes('@');
  }

  // Get user profile
  getProfile() {
    return {
      name: this.name,
      email: this.email,
      isValid: this.validateEmail(),
    };
  }
}

class UserManager {
  constructor() {
    this.users = [];
  }

  // Add a new user
  addUser(name, email) {
    const user = new User(name, email);
    if (user.validateEmail()) {
      this.users.push(user);
      return true;
    }
    return false;
  }

  // Find user by email
  findUser(email) {
    return this.users.find(u => u.email === email);
  }

  // Get all user profiles
  getAllProfiles() {
    return this.users.map(u => u.getProfile());
  }
}

// Usage example
function initializeSystem() {
  const manager = new UserManager();
  manager.addUser('Alice', 'alice@example.com');
  manager.addUser('Bob', 'bob@example.com');
  return manager.getAllProfiles();
}
`;

export default function RAGGraphPlaygroundPage() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [language, setLanguage] = useState('javascript');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [tokenCosts, setTokenCosts] = useState<TokenCost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuildGraph = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build the graph using Graphology
      const graph = await buildCodeGraph(code, language);

      // Colorize and size nodes
      colorizeGraph(graph);
      calculateNodeSizesInGraph(graph);

      // Convert to D3 data format
      const d3Data = graphToD3Data(graph, language);
      setGraphData(d3Data);

      // Calculate token costs
      const costs: TokenCost[] = [
        {
          step: 'Parse Code',
          tokens: Math.ceil(code.length / 4),
          percentage: 0,
        },
        {
          step: 'Extract Definitions',
          tokens: d3Data.metadata.totalNodes * 10,
          percentage: 0,
        },
        {
          step: 'Extract References',
          tokens: d3Data.metadata.totalEdges * 5,
          percentage: 0,
        },
        {
          step: 'D3 Layout Calculation',
          tokens: 100,
          percentage: 0,
        },
      ];

      const totalTokens = costs.reduce((sum, c) => sum + c.tokens, 0);
      costs.forEach((c) => {
        c.percentage = totalTokens > 0 ? (c.tokens / totalTokens) * 100 : 0;
      });

      setTokenCosts(costs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build graph');
      console.error('Error building graph:', err);
    } finally {
      setIsLoading(false);
    }
  }, [code, language]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">RAG Graph Search Playground</h1>
          <p className="text-slate-600">
            Visualize code relationships using TreeSitter and Graph Analysis
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Flow: Code → Parse with TreeSitter → Extract Definitions & References → Build Graph →
            Visualize
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Code Input Section */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Code Input</h2>
              <p className="text-xs text-slate-600 mt-1">
                Paste your code here to analyze relationships
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="rust">Rust</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Code</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                  rows={12}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleBuildGraph}
                disabled={isLoading || !code.trim()}
                className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Building Graph...
                  </>
                ) : (
                  <>
                    <span>🔗</span>
                    Build Graph
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 font-semibold">Error</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Token Costs */}
          {tokenCosts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Processing Costs</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {tokenCosts.map((cost) => (
                    <div key={cost.step} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{cost.step}</span>
                          <span className="text-sm text-slate-600">{cost.tokens} tokens</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${cost.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-12 text-right">
                        {cost.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Graph Visualization */}
          <D3GraphVisualization data={graphData} isLoading={isLoading} />

          {/* Graph Statistics */}
          {graphData && (
            <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Graph Statistics</h2>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {graphData.metadata.totalNodes}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Nodes (Functions/Classes)</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {graphData.metadata.totalEdges}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Edges (Relationships)</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {graphData.metadata.totalEdges > 0
                      ? (graphData.metadata.totalEdges / graphData.metadata.totalNodes).toFixed(2)
                      : '0'}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">Avg Connections</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

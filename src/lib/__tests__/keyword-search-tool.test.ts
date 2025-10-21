/**
 * KeywordSearchTool 测试
 */

import { KeywordSearchTool } from '../tools/keyword-search-tool';
import { DocumentChunk } from '../rag/bm25-retriever';

describe('KeywordSearchTool', () => {
  let tool: KeywordSearchTool;
  let testDocuments: DocumentChunk[];

  beforeEach(() => {
    tool = new KeywordSearchTool({
      defaultTopK: 3,
      maxTopK: 20,
    });

    testDocuments = [
      {
        id: 'doc1',
        content: 'Python is a popular programming language for data science and machine learning.',
        metadata: {
          source: 'guide.md',
          chunkIndex: 0,
        },
      },
      {
        id: 'doc2',
        content: 'JavaScript is widely used for web development and frontend applications.',
        metadata: {
          source: 'guide.md',
          chunkIndex: 1,
        },
      },
      {
        id: 'doc3',
        content: 'TypeScript adds static typing to JavaScript for better code quality.',
        metadata: {
          source: 'guide.md',
          chunkIndex: 2,
        },
      },
      {
        id: 'doc4',
        content: 'Go is a compiled language designed for concurrent programming and system tools.',
        metadata: {
          source: 'guide.md',
          chunkIndex: 3,
        },
      },
    ];
  });

  describe('Tool Definition', () => {
    it('should have correct tool name', () => {
      expect(tool.getName()).toBe('keyword_search');
    });

    it('should have correct tool description', () => {
      const desc = tool.getDescription();
      expect(desc).toContain('BM25');
      expect(desc).toContain('keyword');
    });

    it('should have correct parameters schema', () => {
      const params = tool.getParameters();
      expect(params.required).toContain('query');
      expect(params.properties.query).toBeDefined();
      expect(params.properties.topK).toBeDefined();
    });
  });

  describe('Document Management', () => {
    it('should add documents', () => {
      tool.addDocuments(testDocuments);
      expect(tool.getDocumentCount()).toBe(4);
    });

    it('should clear documents', () => {
      tool.addDocuments(testDocuments);
      expect(tool.getDocumentCount()).toBe(4);
      tool.clearDocuments();
      expect(tool.getDocumentCount()).toBe(0);
    });
  });

  describe('Search Execution', () => {
    beforeEach(() => {
      tool.addDocuments(testDocuments);
    });

    it('should execute search with valid query', async () => {
      const result = await tool.call({ query: 'Python programming' });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.results).toBeDefined();
    });

    it('should return results with correct structure', async () => {
      const result = await tool.call({ query: 'JavaScript' });
      expect(result.success).toBe(true);
      expect(result.data.results).toBeInstanceOf(Array);
      expect(result.data.results[0]).toHaveProperty('id');
      expect(result.data.results[0]).toHaveProperty('content');
      expect(result.data.results[0]).toHaveProperty('score');
      expect(result.data.results[0]).toHaveProperty('rank');
    });

    it('should respect topK parameter', async () => {
      const result = await tool.call({ query: 'programming', topK: 2 });
      expect(result.success).toBe(true);
      expect(result.data.results.length).toBeLessThanOrEqual(2);
    });

    it('should use default topK when not specified', async () => {
      const result = await tool.call({ query: 'language' });
      expect(result.success).toBe(true);
      expect(result.data.results.length).toBeLessThanOrEqual(3);
    });

    it('should limit topK to maxTopK', async () => {
      const result = await tool.call({ query: 'programming', topK: 100 });
      expect(result.success).toBe(true);
      expect(result.data.results.length).toBeLessThanOrEqual(20);
    });

    it('should include metadata in results', async () => {
      const result = await tool.call({ query: 'Python' });
      expect(result.success).toBe(true);
      if (result.data.results.length > 0) {
        expect(result.data.results[0].metadata).toBeDefined();
        expect(result.data.results[0].metadata.source).toBe('guide.md');
      }
    });
  });

  describe('Parameter Validation', () => {
    it('should fail without query parameter', async () => {
      const result = await tool.call({});
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail with non-string query', async () => {
      const result = await tool.call({ query: 123 });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail with non-number topK', async () => {
      const result = await tool.call({ query: 'test', topK: 'invalid' });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Search Results Quality', () => {
    beforeEach(() => {
      tool.addDocuments(testDocuments);
    });

    it('should return relevant results for specific query', async () => {
      const result = await tool.call({ query: 'Python data science' });
      expect(result.success).toBe(true);
      expect(result.data.results.length).toBeGreaterThan(0);
      // First result should be about Python
      expect(result.data.results[0].content.toLowerCase()).toContain('python');
    });

    it('should rank results by relevance score', async () => {
      const result = await tool.call({ query: 'JavaScript web', topK: 3 });
      expect(result.success).toBe(true);
      if (result.data.results.length > 1) {
        expect(result.data.results[0].score).toBeGreaterThanOrEqual(result.data.results[1].score);
      }
    });

    it('should handle multi-word queries', async () => {
      const result = await tool.call({ query: 'static typing code quality' });
      expect(result.success).toBe(true);
      expect(result.data.results.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty document set', async () => {
      const result = await tool.call({ query: 'test' });
      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(0);
    });

    it('should handle query with special characters', async () => {
      tool.addDocuments(testDocuments);
      const result = await tool.call({ query: 'C++ & C#' });
      expect(result.success).toBe(true);
    });

    it('should handle very long query', async () => {
      tool.addDocuments(testDocuments);
      const longQuery = 'programming language for data science machine learning artificial intelligence';
      const result = await tool.call({ query: longQuery });
      expect(result.success).toBe(true);
    });
  });

  describe('Execution Metadata', () => {
    beforeEach(() => {
      tool.addDocuments(testDocuments);
    });

    it('should include execution time', async () => {
      const result = await tool.call({ query: 'Python' });
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should include metadata with query info', async () => {
      const result = await tool.call({ query: 'JavaScript', topK: 2 });
      expect(result.metadata).toBeDefined();
      expect(result.metadata.query).toBe('JavaScript');
      expect(result.metadata.topK).toBe(2);
      expect(result.metadata.documentCount).toBe(4);
    });

    it('should include retriever name in results', async () => {
      const result = await tool.call({ query: 'Python' });
      expect(result.data.retrieverName).toBe('bm25');
    });
  });
});


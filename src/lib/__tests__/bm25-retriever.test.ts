/**
 * BM25 检索器测试
 */

import { BM25Retriever, DocumentChunk } from '../rag/bm25-retriever';

describe('BM25Retriever', () => {
  let retriever: BM25Retriever;
  let testDocuments: DocumentChunk[];

  beforeEach(() => {
    retriever = new BM25Retriever();

    testDocuments = [
      {
        id: 'doc1',
        content: 'Machine learning is a subset of artificial intelligence that focuses on data analysis.',
        metadata: {
          source: 'test.md',
          chunkIndex: 0,
        },
      },
      {
        id: 'doc2',
        content: 'Deep learning uses neural networks with multiple layers to process complex patterns.',
        metadata: {
          source: 'test.md',
          chunkIndex: 1,
        },
      },
      {
        id: 'doc3',
        content: 'Natural language processing enables computers to understand human language.',
        metadata: {
          source: 'test.md',
          chunkIndex: 2,
        },
      },
      {
        id: 'doc4',
        content: 'Computer vision allows machines to interpret and analyze visual information from images.',
        metadata: {
          source: 'test.md',
          chunkIndex: 3,
        },
      },
    ];
  });

  describe('Document Management', () => {
    it('should add documents to the retriever', () => {
      retriever.addDocuments(testDocuments);
      expect(retriever.getDocumentCount()).toBe(4);
    });

    it('should return correct document count', () => {
      expect(retriever.getDocumentCount()).toBe(0);
      retriever.addDocuments(testDocuments.slice(0, 2));
      expect(retriever.getDocumentCount()).toBe(2);
    });

    it('should get all documents', () => {
      retriever.addDocuments(testDocuments);
      const docs = retriever.getDocuments();
      expect(docs).toHaveLength(4);
      expect(docs[0].id).toBe('doc1');
    });

    it('should clear all documents', () => {
      retriever.addDocuments(testDocuments);
      expect(retriever.getDocumentCount()).toBe(4);
      retriever.clearDocuments();
      expect(retriever.getDocumentCount()).toBe(0);
    });
  });

  describe('Retrieval', () => {
    beforeEach(() => {
      retriever.addDocuments(testDocuments);
    });

    it('should retrieve documents for a query', async () => {
      const result = await retriever.retrieve('machine learning', 2);
      expect(result.chunks).toHaveLength(2);
      expect(result.query).toBe('machine learning');
      expect(result.retrieverName).toBe('bm25');
    });

    it('should return results with scores and ranks', async () => {
      const result = await retriever.retrieve('neural networks', 2);
      expect(result.chunks[0].score).toBeGreaterThan(0);
      expect(result.chunks[0].rank).toBe(1);
      if (result.chunks.length > 1) {
        expect(result.chunks[1].rank).toBe(2);
      }
    });

    it('should respect topK parameter', async () => {
      const result = await retriever.retrieve('learning', 2);
      expect(result.chunks.length).toBeLessThanOrEqual(2);
    });

    it('should return empty results for empty query', async () => {
      const result = await retriever.retrieve('', 3);
      expect(result.chunks).toHaveLength(0);
    });

    it('should return empty results when no documents match', async () => {
      const result = await retriever.retrieve('xyz123nonexistent', 3);
      expect(result.chunks.length).toBeLessThanOrEqual(0);
    });

    it('should measure execution time', async () => {
      const result = await retriever.retrieve('machine learning', 3);
      expect(result.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('should return results sorted by score', async () => {
      const result = await retriever.retrieve('learning', 3);
      for (let i = 1; i < result.chunks.length; i++) {
        expect(result.chunks[i - 1].score).toBeGreaterThanOrEqual(result.chunks[i].score);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle retrieval with no documents', async () => {
      const result = await retriever.retrieve('test query', 3);
      expect(result.chunks).toHaveLength(0);
    });

    it('should handle topK larger than document count', async () => {
      retriever.addDocuments(testDocuments);
      const result = await retriever.retrieve('learning', 100);
      expect(result.chunks.length).toBeLessThanOrEqual(testDocuments.length);
    });

    it('should handle topK of 0', async () => {
      retriever.addDocuments(testDocuments);
      const result = await retriever.retrieve('learning', 0);
      expect(result.chunks).toHaveLength(0);
    });

    it('should handle special characters in query', async () => {
      retriever.addDocuments(testDocuments);
      const result = await retriever.retrieve('machine & learning!', 3);
      expect(result.query).toBe('machine & learning!');
    });
  });

  describe('Multiple Retrievals', () => {
    it('should handle multiple sequential retrievals', async () => {
      retriever.addDocuments(testDocuments);

      const result1 = await retriever.retrieve('machine learning', 2);
      const result2 = await retriever.retrieve('neural networks', 2);
      const result3 = await retriever.retrieve('language', 2);

      expect(result1.chunks.length).toBeGreaterThan(0);
      expect(result2.chunks.length).toBeGreaterThan(0);
      expect(result3.chunks.length).toBeGreaterThan(0);
    });

    it('should maintain document integrity across retrievals', async () => {
      retriever.addDocuments(testDocuments);

      const result1 = await retriever.retrieve('learning', 2);
      const result2 = await retriever.retrieve('learning', 2);

      expect(result1.chunks[0].chunk.id).toBe(result2.chunks[0].chunk.id);
    });
  });
});


/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-assign-module-variable */
/**
 * RAG 模块测试
 */

import { RAGModule, createRAGModule } from '../rag/rag-module';
import { DocumentChunk } from '../rag/bm25-retriever';

describe('RAGModule', () => {
  let ragModule: RAGModule;
  let testDocuments: DocumentChunk[];

  beforeEach(() => {
    ragModule = new RAGModule({
      enableKeywordSearch: true,
    });

    testDocuments = [
      {
        id: 'doc1',
        content: 'React is a JavaScript library for building user interfaces with components.',
        metadata: {
          source: 'docs.md',
          chunkIndex: 0,
        },
      },
      {
        id: 'doc2',
        content: 'Vue is a progressive framework for building interactive web applications.',
        metadata: {
          source: 'docs.md',
          chunkIndex: 1,
        },
      },
      {
        id: 'doc3',
        content: 'Angular is a full-featured framework for building dynamic web applications.',
        metadata: {
          source: 'docs.md',
          chunkIndex: 2,
        },
      },
    ];
  });

  describe('Module Initialization', () => {
    it('should initialize with default config', () => {
      const module = new RAGModule();
      expect(module).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const module = new RAGModule({
        enableKeywordSearch: true,
        keywordSearchConfig: {
          defaultTopK: 5,
          maxTopK: 30,
        },
      });
      expect(module).toBeDefined();
    });

    it('should create module using factory function', () => {
      const module = createRAGModule();
      expect(module).toBeDefined();
    });
  });

  describe('Document Management', () => {
    it('should add documents', () => {
      ragModule.addDocuments(testDocuments);
      expect(ragModule.getDocumentCount()).toBe(3);
    });

    it('should get all documents', () => {
      ragModule.addDocuments(testDocuments);
      const docs = ragModule.getDocuments();
      expect(docs).toHaveLength(3);
      expect(docs[0].id).toBe('doc1');
    });

    it('should clear documents', () => {
      ragModule.addDocuments(testDocuments);
      expect(ragModule.getDocumentCount()).toBe(3);
      ragModule.clearDocuments();
      expect(ragModule.getDocumentCount()).toBe(0);
    });

    it('should handle multiple document additions', () => {
      ragModule.addDocuments(testDocuments.slice(0, 1));
      expect(ragModule.getDocumentCount()).toBe(1);
      ragModule.addDocuments(testDocuments.slice(1));
      expect(ragModule.getDocumentCount()).toBe(3);
    });
  });

  describe('Tool Management', () => {
    it('should list available tools', () => {
      const tools = ragModule.listTools();
      expect(tools).toContain('keyword_search');
    });

    it('should get tool definitions', () => {
      const defs = ragModule.getAvailableTools();
      expect(defs.length).toBeGreaterThan(0);
      expect(defs[0].name).toBe('keyword_search');
    });

    it('should get specific tool', () => {
      const tool = ragModule.getTool('keyword_search');
      expect(tool).toBeDefined();
      expect(tool?.getName()).toBe('keyword_search');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = ragModule.getTool('non_existent');
      expect(tool).toBeUndefined();
    });

    it('should get keyword search tool', () => {
      const tool = ragModule.getKeywordSearchTool();
      expect(tool).toBeDefined();
      expect(tool?.getName()).toBe('keyword_search');
    });
  });

  describe('Tool Execution', () => {
    beforeEach(() => {
      ragModule.addDocuments(testDocuments);
    });

    it('should execute keyword search tool', async () => {
      const result = await ragModule.executeTool('keyword_search', {
        query: 'React components',
      });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should fail when executing non-existent tool', async () => {
      const result = await ragModule.executeTool('non_existent', {});
      expect(result.success).toBe(false);
    });

    it('should pass parameters correctly to tool', async () => {
      const result = await ragModule.executeTool('keyword_search', {
        query: 'framework',
        topK: 2,
      });
      expect(result.success).toBe(true);
      expect(result.data.results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Integration', () => {
    it('should integrate document management with tools', async () => {
      ragModule.addDocuments(testDocuments);

      const result = await ragModule.executeTool('keyword_search', {
        query: 'React',
      });

      expect(result.success).toBe(true);
      expect(result.data.results.length).toBeGreaterThan(0);
      expect(result.data.results[0].content).toContain('React');
    });

    it('should handle document updates', async () => {
      ragModule.addDocuments(testDocuments.slice(0, 1));

      let result = await ragModule.executeTool('keyword_search', {
        query: 'Vue framework',
      });
      // First document is about React, so Vue should not match
      expect(result.data.results.length).toBe(0);

      ragModule.addDocuments(testDocuments.slice(1));

      result = await ragModule.executeTool('keyword_search', {
        query: 'Vue framework',
      });
      // Now Vue document is added, should find it
      expect(result.data.results.length).toBeGreaterThan(0);
    });

    it('should clear documents from all tools', async () => {
      ragModule.addDocuments(testDocuments);

      let result = await ragModule.executeTool('keyword_search', {
        query: 'React',
      });
      expect(result.data.results.length).toBeGreaterThan(0);

      ragModule.clearDocuments();

      result = await ragModule.executeTool('keyword_search', {
        query: 'React',
      });
      expect(result.data.results.length).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should disable keyword search when configured', () => {
      const module = new RAGModule({
        enableKeywordSearch: false,
      });
      expect(module.getKeywordSearchTool()).toBeNull();
    });

    it('should pass config to keyword search tool', () => {
      const module = new RAGModule({
        enableKeywordSearch: true,
        keywordSearchConfig: {
          defaultTopK: 5,
          maxTopK: 30,
        },
      });
      expect(module.getKeywordSearchTool()).toBeDefined();
    });
  });

  describe('Tool Registry Access', () => {
    it('should provide access to tool registry', () => {
      const registry = ragModule.getToolRegistry();
      expect(registry).toBeDefined();
      expect(registry.listTools()).toContain('keyword_search');
    });

    it('should allow direct registry operations', () => {
      const registry = ragModule.getToolRegistry();
      const defs = registry.getAllDefinitions();
      expect(defs.length).toBeGreaterThan(0);
    });
  });
});


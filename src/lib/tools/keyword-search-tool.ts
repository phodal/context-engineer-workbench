/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 关键词搜索工具
 * 基于 BM25 算法的关键词检索工具
 */

import { Tool, ToolDefinition, ToolExecutionResult } from './base';
import { BM25Retriever, DocumentChunk, RetrievalResult } from '../rag/bm25-retriever';

/**
 * KeywordSearchTool 配置
 */
export interface KeywordSearchToolConfig {
  defaultTopK?: number;
  maxTopK?: number;
}

/**
 * 关键词搜索工具
 * 使用 BM25 算法进行关键词检索
 */
export class KeywordSearchTool extends Tool {
  private retriever: BM25Retriever;
  private config: KeywordSearchToolConfig;

  constructor(config: KeywordSearchToolConfig = {}) {
    const definition: ToolDefinition = {
      name: 'keyword_search',
      description:
        'Performs keyword-based search using BM25 algorithm. Use for finding documents with specific terms or keywords.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query containing keywords to find',
          },
          topK: {
            type: 'number',
            description: 'Number of top results to return (default: 3, max: 20)',
            default: 3,
          },
        },
        required: ['query'],
      },
    };

    super(definition);
    this.retriever = new BM25Retriever();
    this.config = {
      defaultTopK: 3,
      maxTopK: 20,
      ...config,
    };
  }

  /**
   * 添加文档到索引
   */
  addDocuments(documents: DocumentChunk[]): void {
    this.retriever.addDocuments(documents);
  }

  /**
   * 清空文档索引
   */
  clearDocuments(): void {
    this.retriever.clearDocuments();
  }

  /**
   * 获取文档数量
   */
  getDocumentCount(): number {
    return this.retriever.getDocumentCount();
  }

  /**
   * 执行关键词搜索
   */
  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const query = params.query as string;
    let topK = params.topK as number | undefined;

    // 使用默认值或限制 topK
    if (!topK) {
      topK = this.config.defaultTopK || 3;
    } else if (topK > (this.config.maxTopK || 20)) {
      topK = this.config.maxTopK || 20;
    }

    try {
      const result: RetrievalResult = await this.retriever.retrieve(query, topK);

      return {
        success: true,
        data: {
          query: result.query,
          results: result.chunks.map((item) => ({
            id: item.chunk.id,
            content: item.chunk.content,
            metadata: item.chunk.metadata,
            score: item.score,
            rank: item.rank,
          })),
          totalResults: result.chunks.length,
          retrieverName: result.retrieverName,
          executionTime: result.totalTime,
        },
        executionTime: Date.now() - startTime,
        metadata: {
          query,
          topK,
          documentCount: this.retriever.getDocumentCount(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during keyword search',
        executionTime: Date.now() - startTime,
      };
    }
  }
}

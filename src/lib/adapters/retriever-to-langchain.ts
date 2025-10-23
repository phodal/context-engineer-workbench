import { BaseRetriever } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { BM25Retriever } from '../rag/bm25-retriever';

/**
 * 将我们的 BM25Retriever 适配为 LangChain BaseRetriever
 * 保持我们的抽象，让 LangChain.js 适配我们的实现
 */
export class BM25RetrieverAdapter extends BaseRetriever {
  lc_namespace = ['context_engineer', 'retrievers'];

  private bm25Retriever: BM25Retriever;
  private topK: number;

  constructor(bm25Retriever: BM25Retriever, topK: number = 3) {
    super();
    this.bm25Retriever = bm25Retriever;
    this.topK = topK;
  }

  async _getRelevantDocuments(query: string): Promise<Document[]> {
    const result = await this.bm25Retriever.retrieve(query, this.topK);

    return result.chunks.map(
      (item) =>
        new Document({
          pageContent: item.chunk.content,
          metadata: {
            ...item.chunk.metadata,
            score: item.score,
            rank: item.rank,
            id: item.chunk.id,
          },
        })
    );
  }

  /**
   * 获取原始的 BM25Retriever 对象
   */
  getOriginalRetriever(): BM25Retriever {
    return this.bm25Retriever;
  }

  /**
   * 获取检索结果（包含评分信息）
   */
  async retrieveWithScores(query: string) {
    return this.bm25Retriever.retrieve(query, this.topK);
  }
}

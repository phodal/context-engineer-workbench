/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * BM25 算法实现的关键词检索
 * 自实现的 BM25 算法
 */

/**
 * 简单的 BM25 算法实现
 */
class BM25 {
  private documents: string[] = [];
  private docFreq: Map<string, number>[] = [];
  private avgDocLength: number = 0;
  private docLengths: number[] = [];
  private k1: number = 1.5;
  private b: number = 0.75;
  private idf: Map<string, number> = new Map();

  constructor(documents: string[]) {
    this.documents = documents;
    this.buildIndex();
  }

  private buildIndex(): void {
    const N = this.documents.length;
    let totalLength = 0;

    // 计算文档频率和文档长度
    for (const doc of this.documents) {
      const tokens = this.tokenize(doc);
      this.docLengths.push(tokens.length);
      totalLength += tokens.length;

      const freq = new Map<string, number>();
      for (const token of tokens) {
        freq.set(token, (freq.get(token) || 0) + 1);
      }
      this.docFreq.push(freq);
    }

    this.avgDocLength = totalLength / N;

    // 计算 IDF
    const docFreqCount = new Map<string, number>();
    for (const freq of this.docFreq) {
      for (const token of freq.keys()) {
        docFreqCount.set(token, (docFreqCount.get(token) || 0) + 1);
      }
    }

    for (const [token, count] of docFreqCount) {
      this.idf.set(token, Math.log((N - count + 0.5) / (count + 0.5) + 1));
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  search(query: string): number[] {
    const tokens = this.tokenize(query);
    const scores: number[] = new Array(this.documents.length).fill(0);

    for (const token of tokens) {
      const idf = this.idf.get(token) || 0;

      for (let i = 0; i < this.documents.length; i++) {
        const freq = this.docFreq[i].get(token) || 0;
        const docLength = this.docLengths[i];

        const numerator = freq * (this.k1 + 1);
        const denominator =
          freq +
          this.k1 *
            (1 -
              this.b +
              this.b * (docLength / this.avgDocLength));

        scores[i] += idf * (numerator / denominator);
      }
    }

    return scores;
  }
}

/**
 * 文档块接口
 */
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    chunkIndex: number;
    pageNumber?: number;
    [key: string]: any;
  };
  embedding?: number[];
}

/**
 * 检索结果项
 */
export interface RetrievalResultItem {
  chunk: DocumentChunk;
  score: number;
  rank: number;
}

/**
 * 检索结果
 */
export interface RetrievalResult {
  chunks: RetrievalResultItem[];
  query: string;
  retrieverName: string;
  totalTime: number;
}

/**
 * BM25 检索器
 * 使用 BM25 算法进行关键词检索
 */
export class BM25Retriever {
  private documents: DocumentChunk[] = [];
  private bm25: BM25 | null = null;
  private documentTexts: string[] = [];

  /**
   * 添加文档到索引
   */
  addDocuments(docs: DocumentChunk[]): void {
    this.documents.push(...docs);
    this.rebuildIndex();
  }

  /**
   * 清空所有文档
   */
  clearDocuments(): void {
    this.documents = [];
    this.documentTexts = [];
    this.bm25 = null;
  }

  /**
   * 重建 BM25 索引
   */
  private rebuildIndex(): void {
    // 提取文档文本
    this.documentTexts = this.documents.map(doc => doc.content);

    // 创建 BM25 实例
    this.bm25 = new BM25(this.documentTexts);
  }

  /**
   * 执行检索
   */
  async retrieve(query: string, topK: number = 3): Promise<RetrievalResult> {
    const startTime = Date.now();

    if (!this.bm25 || this.documents.length === 0 || !query.trim()) {
      return {
        chunks: [],
        query,
        retrieverName: 'bm25',
        totalTime: Date.now() - startTime,
      };
    }

    try {
      // 使用 BM25 进行检索
      const scores = this.bm25.search(query);

      // 按分数排序并取前 topK，只返回分数大于 0 的结果
      const results = scores
        .map((score, index) => ({
          index,
          score,
        }))
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map((result, rank) => ({
          chunk: this.documents[result.index],
          score: result.score,
          rank: rank + 1,
        }));

      return {
        chunks: results,
        query,
        retrieverName: 'bm25',
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('BM25 retrieval error:', error);
      return {
        chunks: [],
        query,
        retrieverName: 'bm25',
        totalTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 获取文档数量
   */
  getDocumentCount(): number {
    return this.documents.length;
  }

  /**
   * 获取所有文档
   */
  getDocuments(): DocumentChunk[] {
    return [...this.documents];
  }
}


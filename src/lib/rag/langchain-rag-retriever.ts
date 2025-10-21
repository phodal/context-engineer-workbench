import { BaseRetriever } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";
import { BM25Retriever } from "./bm25-retriever";
import { LangChainDocumentRAG, LoadedDocument } from "./document-loader";

/**
 * LangChain RAG 检索器
 * 结合 LangChain 的文档处理和我们的 BM25 检索
 */
export class LangChainRAGRetriever extends BaseRetriever {
  lc_namespace = ["context_engineer", "retrievers"];
  private documentRAG: LangChainDocumentRAG;
  private bm25Retriever: BM25Retriever;
  private topK: number;

  constructor(topK: number = 3) {
    super();
    this.documentRAG = new LangChainDocumentRAG();
    this.bm25Retriever = new BM25Retriever();
    this.topK = topK;
  }

  /**
   * 添加文档
   */
  async addDocuments(documents: LoadedDocument[]): Promise<void> {
    this.documentRAG.addDocuments(documents);
    const chunks = await this.documentRAG.processAll();
    this.bm25Retriever.addDocuments(chunks);
  }

  /**
   * 从 Markdown 添加文档
   */
  async addMarkdownDocuments(
    markdownContents: Array<{ content: string; source: string; title?: string }>
  ): Promise<void> {
    const documents = markdownContents.map((doc) =>
      ({
        content: doc.content,
        metadata: {
          source: doc.source,
          title: doc.title || doc.source,
        },
      })
    );
    await this.addDocuments(documents);
  }

  /**
   * 从文本数组添加文档
   */
  async addTextDocuments(texts: string[], source: string): Promise<void> {
    const documents = texts.map((text, index) => ({
      content: text,
      metadata: {
        source,
        title: `${source}-${index}`,
      },
    }));
    await this.addDocuments(documents);
  }

  /**
   * 实现 LangChain BaseRetriever 的抽象方法
   */
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
   * 获取统计信息
   */
  getStats() {
    return this.documentRAG.getStats();
  }

  /**
   * 清空所有文档
   */
  clear(): void {
    this.documentRAG.clear();
    this.bm25Retriever = new BM25Retriever();
  }
}

/**
 * 便捷函数 - 创建 LangChain RAG 检索器
 */
export async function createLangChainRAGRetriever(
  documents: LoadedDocument[],
  topK: number = 3
): Promise<LangChainRAGRetriever> {
  const retriever = new LangChainRAGRetriever(topK);
  await retriever.addDocuments(documents);
  return retriever;
}

/**
 * 便捷函数 - 从 Markdown 创建 RAG 检索器
 */
export async function createRAGFromMarkdown(
  markdownDocs: Array<{ content: string; source: string; title?: string }>,
  topK: number = 3
): Promise<LangChainRAGRetriever> {
  const retriever = new LangChainRAGRetriever(topK);
  await retriever.addMarkdownDocuments(markdownDocs);
  return retriever;
}


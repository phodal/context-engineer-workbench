/* eslint-disable @typescript-eslint/no-explicit-any */
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { DocumentChunk } from "./bm25-retriever";

/**
 * 文档加载器 - 支持多种格式
 */
export interface LoadedDocument {
  content: string;
  metadata: {
    source: string;
    title?: string;
    url?: string;
    [key: string]: any;
  };
}

/**
 * 文档处理器 - 将文档分割成块
 */
export class DocumentProcessor {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(
    chunkSize: number = 1000,
    chunkOverlap: number = 200
  ) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ["\n\n", "\n", " ", ""],
    });
  }

  /**
   * 处理文档 - 分割成块
   */
  async processDocuments(documents: LoadedDocument[]): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    let globalChunkIndex = 0;

    for (const doc of documents) {
      const texts = await this.splitter.splitText(doc.content);

      texts.forEach((text, index) => {
        chunks.push({
          id: `${doc.metadata.source}-chunk-${index}`,
          content: text,
          metadata: {
            source: doc.metadata.source,
            chunkIndex: globalChunkIndex,
            pageNumber: index,
            title: doc.metadata.title,
            url: doc.metadata.url,
          },
        });
        globalChunkIndex++;
      });
    }

    return chunks;
  }

  /**
   * 从 Markdown 加载文档
   */
  static fromMarkdown(content: string, source: string, title?: string): LoadedDocument {
    return {
      content,
      metadata: {
        source,
        title: title || source,
      },
    };
  }

  /**
   * 从 JSON 加载文档
   */
  static fromJSON(data: any, source: string): LoadedDocument[] {
    if (Array.isArray(data)) {
      return data.map((item, index) => ({
        content: typeof item === "string" ? item : JSON.stringify(item),
        metadata: {
          source,
          title: `${source}-${index}`,
        },
      }));
    }

    return [
      {
        content: JSON.stringify(data),
        metadata: {
          source,
          title: source,
        },
      },
    ];
  }

  /**
   * 从文本数组加载文档
   */
  static fromTexts(texts: string[], source: string): LoadedDocument[] {
    return texts.map((text, index) => ({
      content: text,
      metadata: {
        source,
        title: `${source}-${index}`,
      },
    }));
  }
}

/**
 * LangChain 文档 RAG 工具
 * 集成 LangChain 的文档加载和处理能力
 */
export class LangChainDocumentRAG {
  private processor: DocumentProcessor;
  private documents: LoadedDocument[] = [];
  private chunks: DocumentChunk[] = [];

  constructor(chunkSize?: number, chunkOverlap?: number) {
    this.processor = new DocumentProcessor(chunkSize, chunkOverlap);
  }

  /**
   * 添加文档
   */
  addDocuments(documents: LoadedDocument[]): void {
    this.documents.push(...documents);
  }

  /**
   * 处理所有文档
   */
  async processAll(): Promise<DocumentChunk[]> {
    this.chunks = await this.processor.processDocuments(this.documents);
    return this.chunks;
  }

  /**
   * 获取处理后的块
   */
  getChunks(): DocumentChunk[] {
    return this.chunks;
  }

  /**
   * 清空文档
   */
  clear(): void {
    this.documents = [];
    this.chunks = [];
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      documentCount: this.documents.length,
      chunkCount: this.chunks.length,
      totalContent: this.chunks.reduce((sum, chunk) => sum + chunk.content.length, 0),
    };
  }
}


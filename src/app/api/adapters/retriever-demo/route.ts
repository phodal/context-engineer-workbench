import { NextRequest, NextResponse } from 'next/server';
import { BM25RetrieverAdapter } from '@/lib/adapters';
import { BM25Retriever } from '@/lib/rag/bm25-retriever';

export async function POST(request: NextRequest) {
  try {
    const { query, topK } = await request.json();

    // 创建检索器
    const bm25Retriever = new BM25Retriever();
    bm25Retriever.addDocuments([
      {
        id: 'doc1',
        content: 'TypeScript 是一个编程语言',
        metadata: { source: 'docs', chunkIndex: 0 },
      },
      {
        id: 'doc2',
        content: 'JavaScript 运行在浏览器中',
        metadata: { source: 'docs', chunkIndex: 1 },
      },
      {
        id: 'doc3',
        content: 'LangChain 是一个 AI 应用框架',
        metadata: { source: 'docs', chunkIndex: 2 },
      },
    ]);

    // 适配为 LangChain Retriever
    const langchainRetriever = new BM25RetrieverAdapter(bm25Retriever, topK || 2);

    // 执行
    const documents = await langchainRetriever.invoke(query || 'JavaScript');

    // 格式化结果
    const formattedDocs = documents.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));

    return NextResponse.json({
      success: true,
      documents: formattedDocs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


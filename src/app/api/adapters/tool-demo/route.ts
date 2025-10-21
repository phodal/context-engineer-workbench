import { NextRequest, NextResponse } from 'next/server';
import { ToolToLangChainAdapter } from '@/lib/adapters';
import { KeywordSearchTool } from '@/lib/tools/keyword-search-tool';

export async function POST(request: NextRequest) {
  try {
    const { query, topK } = await request.json();

    // 创建工具
    const keywordSearchTool = new KeywordSearchTool();
    keywordSearchTool.addDocuments([
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

    // 适配为 LangChain Tool
    const langchainTool = new ToolToLangChainAdapter(keywordSearchTool);

    // 执行
    const result = await langchainTool.invoke({
      query: query || 'TypeScript',
      topK: topK || 2,
    });

    return NextResponse.json({
      success: true,
      result: typeof result === 'string' ? JSON.parse(result) : result,
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


import { NextRequest, NextResponse } from "next/server";
import { LangChainRAGRetriever } from "@/lib/rag/langchain-rag-retriever";

// 全局 RAG 检索器实例
let ragRetriever: LangChainRAGRetriever | null = null;

/**
 * 初始化 RAG 检索器
 */
function initializeRAG() {
  if (!ragRetriever) {
    ragRetriever = new LangChainRAGRetriever(3);

    // 添加示例文档
    const exampleDocs = [
      {
        content: "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing to the language.",
        metadata: { source: "typescript-docs", title: "TypeScript Introduction" },
      },
      {
        content: "JavaScript is a versatile programming language used for web development, server-side programming with Node.js, and more.",
        metadata: { source: "javascript-docs", title: "JavaScript Overview" },
      },
      {
        content: "React is a JavaScript library for building user interfaces with reusable components. It uses a virtual DOM for efficient rendering.",
        metadata: { source: "react-docs", title: "React Framework" },
      },
      {
        content: "LangChain is a framework for developing applications powered by language models. It provides tools for chains, agents, and memory.",
        metadata: { source: "langchain-docs", title: "LangChain Framework" },
      },
      {
        content: "RAG (Retrieval-Augmented Generation) combines document retrieval with language model generation for more accurate responses.",
        metadata: { source: "rag-docs", title: "RAG Concept" },
      },
    ];

    ragRetriever.addDocuments(exampleDocs);
  }

  return ragRetriever;
}

/**
 * POST /api/rag/retrieve
 * 执行 RAG 检索
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, topK = 3 } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query parameter is required and must be a string" },
        { status: 400 }
      );
    }

    const retriever = initializeRAG();

    // 执行检索
    const results = await retriever.invoke(query);

    // 限制返回的结果数
    const limitedResults = results.slice(0, topK);

    return NextResponse.json({
      success: true,
      query,
      resultCount: limitedResults.length,
      results: limitedResults.map((doc, index) => ({
        rank: index + 1,
        content: doc.pageContent,
        metadata: doc.metadata,
        score: doc.metadata.score,
      })),
      stats: retriever.getStats(),
    });
  } catch (error) {
    console.error("RAG retrieval error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rag/retrieve
 * 获取 RAG 统计信息
 */
export async function GET() {
  try {
    const retriever = initializeRAG();
    const stats = retriever.getStats();

    return NextResponse.json({
      success: true,
      stats,
      message: "RAG retriever is ready",
    });
  } catch (error) {
    console.error("RAG stats error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


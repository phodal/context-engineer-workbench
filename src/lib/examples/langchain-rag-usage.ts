import { LangChainRAGRetriever, createRAGFromMarkdown } from "../rag/langchain-rag-retriever";

/**
 * 示例 1: 基础 RAG 检索
 */
export async function example1_BasicRAGRetrieval() {
  console.log("=== 示例 1: 基础 RAG 检索 ===\n");

  const retriever = new LangChainRAGRetriever(3);

  // 添加文档
  const documents = [
    {
      content: "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.",
      metadata: { source: "typescript-docs", title: "What is TypeScript?" },
    },
    {
      content: "JavaScript is a versatile language used for web development, server-side programming, and more.",
      metadata: { source: "javascript-docs", title: "What is JavaScript?" },
    },
    {
      content: "React is a JavaScript library for building user interfaces with reusable components.",
      metadata: { source: "react-docs", title: "What is React?" },
    },
  ];

  await retriever.addDocuments(documents);

  // 执行检索
  const results = await retriever.invoke("TypeScript");

  console.log("查询: TypeScript");
  console.log(`找到 ${results.length} 个相关文档\n`);

  results.forEach((doc, index) => {
    console.log(`结果 ${index + 1}:`);
    console.log(`内容: ${doc.pageContent.substring(0, 100)}...`);
    console.log(`评分: ${doc.metadata.score}`);
    console.log(`排名: ${doc.metadata.rank}\n`);
  });
}

/**
 * 示例 2: 从 Markdown 创建 RAG
 */
export async function example2_MarkdownRAG() {
  console.log("=== 示例 2: 从 Markdown 创建 RAG ===\n");

  const markdownDocs = [
    {
      content: `# LangChain 指南

LangChain 是一个框架，用于开发由大型语言模型 (LLM) 驱动的应用程序。

## 核心概念

- **Chains**: 将多个组件连接在一起
- **Agents**: 使用工具来完成任务
- **Memory**: 保存对话历史`,
      source: "langchain-guide",
      title: "LangChain 完整指南",
    },
    {
      content: `# RAG 系统

检索增强生成 (RAG) 是一种结合检索和生成的技术。

## 工作流程

1. 检索相关文档
2. 将文档传递给 LLM
3. LLM 生成答案`,
      source: "rag-guide",
      title: "RAG 系统指南",
    },
  ];

  const retriever = await createRAGFromMarkdown(markdownDocs, 2);

  // 执行检索
  const results = await retriever.invoke("RAG");

  console.log("查询: RAG");
  console.log(`找到 ${results.length} 个相关文档\n`);

  results.forEach((doc, index) => {
    console.log(`结果 ${index + 1}:`);
    console.log(`内容: ${doc.pageContent.substring(0, 80)}...`);
    console.log(`来源: ${doc.metadata.source}\n`);
  });
}

/**
 * 示例 3: 多查询检索
 */
export async function example3_MultiQueryRetrieval() {
  console.log("=== 示例 3: 多查询检索 ===\n");

  const retriever = new LangChainRAGRetriever(2);

  const documents = [
    {
      content: "Python is a high-level programming language known for its simplicity and readability.",
      metadata: { source: "python-docs", title: "Python" },
    },
    {
      content: "Go is a compiled language designed for concurrent programming and system development.",
      metadata: { source: "go-docs", title: "Go" },
    },
    {
      content: "Rust is a systems programming language that guarantees memory safety.",
      metadata: { source: "rust-docs", title: "Rust" },
    },
  ];

  await retriever.addDocuments(documents);

  const queries = ["Python", "Go", "Rust"];

  for (const query of queries) {
    const results = await retriever.invoke(query);
    console.log(`查询: "${query}"`);
    console.log(`结果数: ${results.length}`);
    if (results.length > 0) {
      console.log(`最相关: ${results[0].pageContent.substring(0, 60)}...`);
    }
    console.log();
  }
}

/**
 * 示例 4: 获取统计信息
 */
export async function example4_Statistics() {
  console.log("=== 示例 4: 获取统计信息 ===\n");

  const retriever = new LangChainRAGRetriever(3);

  const documents = [
    {
      content: "Document 1 content. ".repeat(20),
      metadata: { source: "docs", title: "Doc1" },
    },
    {
      content: "Document 2 content. ".repeat(20),
      metadata: { source: "docs", title: "Doc2" },
    },
  ];

  await retriever.addDocuments(documents);

  const stats = retriever.getStats();

  console.log("统计信息:");
  console.log(`- 文档数: ${stats.documentCount}`);
  console.log(`- 块数: ${stats.chunkCount}`);
  console.log(`- 总内容大小: ${stats.totalContent} 字符\n`);
}

/**
 * 示例 5: 清空和重新加载
 */
export async function example5_ClearAndReload() {
  console.log("=== 示例 5: 清空和重新加载 ===\n");

  const retriever = new LangChainRAGRetriever(2);

  // 第一批文档
  const docs1 = [
    {
      content: "First batch of documents",
      metadata: { source: "batch1", title: "Batch 1" },
    },
  ];

  await retriever.addDocuments(docs1);
  let stats = retriever.getStats();
  console.log(`加载第一批后: ${stats.chunkCount} 个块`);

  // 清空
  retriever.clear();
  stats = retriever.getStats();
  console.log(`清空后: ${stats.chunkCount} 个块`);

  // 第二批文档
  const docs2 = [
    {
      content: "Second batch of documents",
      metadata: { source: "batch2", title: "Batch 2" },
    },
  ];

  await retriever.addDocuments(docs2);
  stats = retriever.getStats();
  console.log(`加载第二批后: ${stats.chunkCount} 个块\n`);
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  try {
    await example1_BasicRAGRetrieval();
    console.log("\n" + "=".repeat(50) + "\n");

    await example2_MarkdownRAG();
    console.log("\n" + "=".repeat(50) + "\n");

    await example3_MultiQueryRetrieval();
    console.log("\n" + "=".repeat(50) + "\n");

    await example4_Statistics();
    console.log("\n" + "=".repeat(50) + "\n");

    await example5_ClearAndReload();
  } catch (error) {
    console.error("执行示例时出错:", error);
  }
}


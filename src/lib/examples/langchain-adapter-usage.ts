/**
 * LangChain.js 适配器使用示例
 * 展示如何将我们的 Tool 和 Retriever 适配为 LangChain 组件
 */

import { ToolToLangChainAdapter, BM25RetrieverAdapter } from "../adapters";
import { KeywordSearchTool } from "../tools/keyword-search-tool";
import { BM25Retriever } from "../rag/bm25-retriever";

/**
 * 示例 1: 将我们的 Tool 适配为 LangChain Tool
 */
export async function example1_ToolAdapter() {
  console.log("=== 示例 1: Tool 适配器 ===\n");

  // 创建工具
  const keywordSearchTool = new KeywordSearchTool();
  keywordSearchTool.addDocuments([
    {
      id: "doc1",
      content: "TypeScript 是一个编程语言",
      metadata: { source: "docs", chunkIndex: 0 },
    },
    {
      id: "doc2",
      content: "JavaScript 运行在浏览器中",
      metadata: { source: "docs", chunkIndex: 1 },
    },
  ]);

  // 适配为 LangChain Tool
  const langchainTool = new ToolToLangChainAdapter(keywordSearchTool);

  console.log("Tool 名称:", langchainTool.name);
  console.log("Tool 描述:", langchainTool.description);
  console.log("Tool Schema:", langchainTool.schema);

  // 使用 LangChain Tool
  const result = await langchainTool.invoke({
    query: "TypeScript",
    topK: 3,
  });

  console.log("\n执行结果:", result);

  // 获取执行元数据
  const resultWithMetadata = await langchainTool.executeWithMetadata({
    query: "TypeScript",
    topK: 3,
  });

  console.log("\n执行时间:", resultWithMetadata.executionTime, "ms");
  console.log("成功:", resultWithMetadata.success);
}

/**
 * 示例 2: 将我们的 Retriever 适配为 LangChain Retriever
 */
export async function example2_RetrieverAdapter() {
  console.log("\n=== 示例 2: Retriever 适配器 ===\n");

  // 创建 BM25 检索器
  const bm25Retriever = new BM25Retriever();
  bm25Retriever.addDocuments([
    {
      id: "doc1",
      content: "TypeScript 是一个编程语言",
      metadata: { source: "docs", chunkIndex: 0 },
    },
    {
      id: "doc2",
      content: "JavaScript 运行在浏览器中",
      metadata: { source: "docs", chunkIndex: 1 },
    },
    {
      id: "doc3",
      content: "Python 用于数据科学",
      metadata: { source: "docs", chunkIndex: 2 },
    },
  ]);

  // 适配为 LangChain Retriever
  const langchainRetriever = new BM25RetrieverAdapter(bm25Retriever, 2);

  console.log("Retriever 命名空间:", langchainRetriever.lc_namespace);

  // 使用 LangChain Retriever
  const documents = await langchainRetriever.invoke("TypeScript");

  console.log("\n检索到的文档数:", documents.length);
  documents.forEach((doc, index) => {
    console.log(`\n文档 ${index + 1}:`);
    console.log("  内容:", doc.pageContent);
    console.log("  评分:", doc.metadata.score);
    console.log("  排名:", doc.metadata.rank);
  });
}

/**
 * 示例 3: 在 LangChain Agent 中使用适配器
 */
export async function example3_WithLangChainAgent() {
  console.log("\n=== 示例 3: 与 LangChain Agent 集成 ===\n");

  // 创建工具
  const keywordSearchTool = new KeywordSearchTool();
  keywordSearchTool.addDocuments([
    {
      id: "doc1",
      content: "LangChain 是一个 AI 应用框架",
      metadata: { source: "docs", chunkIndex: 0 },
    },
  ]);

  const langchainTool = new ToolToLangChainAdapter(keywordSearchTool);

  // 创建检索器
  const bm25Retriever = new BM25Retriever();
  bm25Retriever.addDocuments([
    {
      id: "doc1",
      content: "LangChain 是一个 AI 应用框架",
      metadata: { source: "docs", chunkIndex: 0 },
    },
  ]);

  const langchainRetriever = new BM25RetrieverAdapter(bm25Retriever, 3);

  console.log("工具已准备好用于 LangChain Agent:");
  console.log("- Tool:", langchainTool.name);
  console.log("- Retriever:", langchainRetriever.lc_namespace.join("/"));

  // 这里可以将 langchainTool 和 langchainRetriever 传递给 LangChain Agent
  // 例如: agent.tools = [langchainTool];
  // 或: chain.retriever = langchainRetriever;
}

/**
 * 示例 4: 混合使用原始实现和 LangChain 适配器
 */
export async function example4_HybridUsage() {
  console.log("\n=== 示例 4: 混合使用 ===\n");

  // 创建工具
  const keywordSearchTool = new KeywordSearchTool();
  keywordSearchTool.addDocuments([
    {
      id: "doc1",
      content: "适配器模式允许我们保持原始设计",
      metadata: { source: "docs", chunkIndex: 0 },
    },
  ]);

  const langchainTool = new ToolToLangChainAdapter(keywordSearchTool);

  // 使用原始工具
  console.log("使用原始工具:");
  const originalResult = await keywordSearchTool.call({
    query: "适配器",
    topK: 3,
  });
  console.log("执行时间:", originalResult.executionTime, "ms");

  // 使用 LangChain 适配器
  console.log("\n使用 LangChain 适配器:");
  const langchainResult = await langchainTool.invoke({
    query: "适配器",
    topK: 3,
  });
  console.log("结果:", langchainResult);

  // 获取原始工具
  console.log("\n获取原始工具:");
  const retrieved = langchainTool.getOriginalTool();
  console.log("是同一个工具:", retrieved === keywordSearchTool);
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  try {
    await example1_ToolAdapter();
    await example2_RetrieverAdapter();
    await example3_WithLangChainAgent();
    await example4_HybridUsage();
    console.log("\n✅ 所有示例执行完成！");
  } catch (error) {
    console.error("❌ 示例执行出错:", error);
  }
}


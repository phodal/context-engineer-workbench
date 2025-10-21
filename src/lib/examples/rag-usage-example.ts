/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RAG 模块使用示例
 * 展示如何使用 Tool 抽象、BM25 检索器和 KeywordSearchTool
 */

import {
  createRAGModule,
  DocumentChunk,
  KeywordSearchTool,
  BM25Retriever,
  Tool,
  ToolRegistry,
  ToolDefinition,
} from '../index';

/**
 * 示例 1: 基础 BM25 检索
 */
export async function example1_basicBM25Retrieval() {
  console.log('=== 示例 1: 基础 BM25 检索 ===\n');

  const retriever = new BM25Retriever();

  const documents: DocumentChunk[] = [
    {
      id: 'doc1',
      content: 'Python is a popular programming language for data science and machine learning.',
      metadata: { source: 'guide.md', chunkIndex: 0 },
    },
    {
      id: 'doc2',
      content: 'JavaScript is widely used for web development and frontend applications.',
      metadata: { source: 'guide.md', chunkIndex: 1 },
    },
    {
      id: 'doc3',
      content: 'TypeScript adds static typing to JavaScript for better code quality.',
      metadata: { source: 'guide.md', chunkIndex: 2 },
    },
  ];

  retriever.addDocuments(documents);

  const result = await retriever.retrieve('Python machine learning', 2);
  console.log('查询: "Python machine learning"');
  console.log('结果数量:', result.chunks.length);
  result.chunks.forEach(item => {
    console.log(`- [${item.rank}] ${item.chunk.id} (分数: ${item.score.toFixed(2)})`);
    console.log(`  内容: ${item.chunk.content.substring(0, 60)}...`);
  });
  console.log();
}

/**
 * 示例 2: 使用 KeywordSearchTool
 */
export async function example2_keywordSearchTool() {
  console.log('=== 示例 2: 使用 KeywordSearchTool ===\n');

  const tool = new KeywordSearchTool({
    defaultTopK: 3,
    maxTopK: 20,
  });

  const documents: DocumentChunk[] = [
    {
      id: 'doc1',
      content: 'React is a JavaScript library for building user interfaces with components.',
      metadata: { source: 'docs.md', chunkIndex: 0 },
    },
    {
      id: 'doc2',
      content: 'Vue is a progressive framework for building interactive web applications.',
      metadata: { source: 'docs.md', chunkIndex: 1 },
    },
    {
      id: 'doc3',
      content: 'Angular is a full-featured framework for building dynamic web applications.',
      metadata: { source: 'docs.md', chunkIndex: 2 },
    },
  ];

  tool.addDocuments(documents);

  // 执行搜索
  const result = await tool.call({
    query: 'JavaScript framework',
    topK: 2,
  });

  console.log('工具名称:', tool.getName());
  console.log('查询: "JavaScript framework"');
  console.log('执行成功:', result.success);
  console.log('执行时间:', result.executionTime, 'ms');
  console.log('结果数量:', result.data?.results?.length || 0);

  result.data?.results?.forEach((item: any) => {
    console.log(`- [${item.rank}] ${item.id} (分数: ${item.score.toFixed(2)})`);
  });
  console.log();
}

/**
 * 示例 3: 使用 RAG 模块
 */
export async function example3_ragModule() {
  console.log('=== 示例 3: 使用 RAG 模块 ===\n');

  const ragModule = createRAGModule({
    enableKeywordSearch: true,
    keywordSearchConfig: {
      defaultTopK: 3,
      maxTopK: 20,
    },
  });

  const documents: DocumentChunk[] = [
    {
      id: 'doc1',
      content: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine.',
      metadata: { source: 'nodejs.md', chunkIndex: 0 },
    },
    {
      id: 'doc2',
      content: 'Express is a minimal and flexible Node.js web application framework.',
      metadata: { source: 'nodejs.md', chunkIndex: 1 },
    },
    {
      id: 'doc3',
      content: 'Next.js is a React framework for production with built-in optimization.',
      metadata: { source: 'nodejs.md', chunkIndex: 2 },
    },
  ];

  ragModule.addDocuments(documents);

  // 列出可用工具
  console.log('可用工具:', ragModule.listTools());

  // 获取工具定义
  const toolDefs = ragModule.getAvailableTools();
  console.log('工具定义数量:', toolDefs.length);
  toolDefs.forEach(def => {
    console.log(`- ${def.name}: ${def.description}`);
  });

  // 执行工具
  const result = await ragModule.executeTool('keyword_search', {
    query: 'Node.js framework',
    topK: 2,
  });

  console.log('\n执行 keyword_search 工具:');
  console.log('查询: "Node.js framework"');
  console.log('结果数量:', result.data?.results?.length || 0);
  result.data?.results?.forEach((item: any) => {
    console.log(`- ${item.id}: ${item.content.substring(0, 50)}...`);
  });
  console.log();
}

/**
 * 示例 4: 创建自定义工具
 */
export async function example4_customTool() {
  console.log('=== 示例 4: 创建自定义工具 ===\n');

  // 创建自定义工具
  class CounterTool extends Tool {
    async execute(params: Record<string, any>) {
      const text = params.text as string;
      const wordCount = text.split(/\s+/).length;
      const charCount = text.length;

      return {
        success: true,
        data: {
          wordCount,
          charCount,
          averageWordLength: (charCount / wordCount).toFixed(2),
        },
        executionTime: 0,
      };
    }
  }

  const definition: ToolDefinition = {
    name: 'text_counter',
    description: 'Counts words and characters in text',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to analyze',
        },
      },
      required: ['text'],
    },
  };

  const tool = new CounterTool(definition);

  // 注册工具
  const registry = new ToolRegistry();
  registry.register(tool);

  // 执行工具
  const result = await registry.executeTool('text_counter', {
    text: 'This is a sample text for analysis',
  });

  console.log('工具名称:', tool.getName());
  console.log('执行结果:', result.data);
  console.log();
}

/**
 * 示例 5: 工具参数验证
 */
export async function example5_parameterValidation() {
  console.log('=== 示例 5: 工具参数验证 ===\n');

  const tool = new KeywordSearchTool();

  // 有效参数
  console.log('测试 1: 有效参数');
  const result1 = await tool.call({ query: 'test' });
  console.log('成功:', result1.success);

  // 缺少必需参数
  console.log('\n测试 2: 缺少必需参数');
  const result2 = await tool.call({});
  console.log('成功:', result2.success);
  console.log('错误:', result2.error);

  // 参数类型错误
  console.log('\n测试 3: 参数类型错误');
  const result3 = await tool.call({ query: 123 });
  console.log('成功:', result3.success);
  console.log('错误:', result3.error);

  console.log();
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  try {
    await example1_basicBM25Retrieval();
    await example2_keywordSearchTool();
    await example3_ragModule();
    await example4_customTool();
    await example5_parameterValidation();

    console.log('=== 所有示例执行完成 ===');
  } catch (error) {
    console.error('执行示例时出错:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples();
}


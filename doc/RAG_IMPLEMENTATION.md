# RAG 模块实现指南

## 概述

本文档介绍 Context Engineer Workbench 中 RAG（检索增强生成）模块的实现，包括 Tool 抽象、BM25 关键词检索和 KeywordSearchTool。

## 核心组件

### 1. Tool 抽象基类 (`src/lib/tools/base.ts`)

所有工具都继承自 `Tool` 基类，提供统一的接口和参数验证。

**主要特性：**
- 工具定义和元数据管理
- JSON Schema 参数验证
- 统一的执行接口
- 工具注册表

**使用示例：**

```typescript
import { Tool, ToolDefinition, ToolRegistry } from '@/lib';

// 创建自定义工具
class MyCustomTool extends Tool {
  async execute(params: Record<string, any>) {
    // 实现工具逻辑
    return {
      success: true,
      data: { /* 结果 */ },
    };
  }
}

// 注册工具
const registry = new ToolRegistry();
const tool = new MyCustomTool({
  name: 'my_tool',
  description: 'My custom tool',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Query string' },
    },
    required: ['query'],
  },
});

registry.register(tool);

// 执行工具
const result = await registry.executeTool('my_tool', { query: 'test' });
```

### 2. BM25 检索器 (`src/lib/rag/bm25-retriever.ts`)

实现了 BM25 算法的关键词检索引擎。

**主要特性：**
- 自实现的 BM25 算法
- 文档索引和查询
- 相关性评分
- 支持批量文档添加

**使用示例：**

```typescript
import { BM25Retriever, DocumentChunk } from '@/lib';

// 创建检索器
const retriever = new BM25Retriever();

// 添加文档
const documents: DocumentChunk[] = [
  {
    id: 'doc1',
    content: 'Machine learning is a subset of artificial intelligence.',
    metadata: {
      source: 'guide.md',
      chunkIndex: 0,
    },
  },
  // ... 更多文档
];

retriever.addDocuments(documents);

// 执行检索
const result = await retriever.retrieve('machine learning', 3);
console.log(result.chunks); // 返回前 3 个相关文档
```

### 3. KeywordSearchTool (`src/lib/tools/keyword-search-tool.ts`)

将 BM25 检索器包装成 Tool，对外提供统一接口。

**主要特性：**
- 基于 BM25 的关键词搜索
- 参数验证和错误处理
- 执行时间追踪
- 元数据包含

**使用示例：**

```typescript
import { KeywordSearchTool, DocumentChunk } from '@/lib';

// 创建工具
const tool = new KeywordSearchTool({
  defaultTopK: 3,
  maxTopK: 20,
});

// 添加文档
const documents: DocumentChunk[] = [
  // ... 文档列表
];
tool.addDocuments(documents);

// 执行搜索
const result = await tool.call({
  query: 'machine learning',
  topK: 5,
});

if (result.success) {
  console.log(result.data.results); // 搜索结果
  console.log(result.metadata); // 执行元数据
}
```

### 4. RAG 模块 (`src/lib/rag/rag-module.ts`)

管理文档和检索工具的集成。

**主要特性：**
- 文档生命周期管理
- 工具注册和执行
- 统一的检索接口
- 可配置的工具集

**使用示例：**

```typescript
import { createRAGModule, DocumentChunk } from '@/lib';

// 创建 RAG 模块
const ragModule = createRAGModule({
  enableKeywordSearch: true,
  keywordSearchConfig: {
    defaultTopK: 3,
    maxTopK: 20,
  },
});

// 添加文档
const documents: DocumentChunk[] = [
  // ... 文档列表
];
ragModule.addDocuments(documents);

// 列出可用工具
const tools = ragModule.listTools(); // ['keyword_search']

// 执行工具
const result = await ragModule.executeTool('keyword_search', {
  query: 'machine learning',
  topK: 3,
});

// 获取工具定义（用于 LLM）
const toolDefinitions = ragModule.getAvailableTools();
```

## 架构设计

### 工具抽象层次

```
┌─────────────────────────────────────┐
│      RAG Module                     │
│  (文档管理 + 工具集成)              │
├─────────────────────────────────────┤
│      Tool Registry                  │
│  (工具注册和执行)                   │
├─────────────────────────────────────┤
│      KeywordSearchTool              │
│  (BM25 关键词搜索)                  │
├─────────────────────────────────────┤
│      BM25Retriever                  │
│  (BM25 算法实现)                    │
├─────────────────────────────────────┤
│      Tool (Abstract Base)           │
│  (工具基类和接口)                   │
└─────────────────────────────────────┘
```

## BM25 算法说明

BM25（Best Matching 25）是一种用于信息检索的排名函数。

**算法参数：**
- `k1 = 1.5`：控制词频饱和度
- `b = 0.75`：控制文档长度的影响

**评分公式：**

```
score(D, Q) = Σ IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D| / avgdl))
```

其中：
- `D`：文档
- `Q`：查询
- `qi`：查询中的第 i 个词
- `f(qi, D)`：词 qi 在文档 D 中的频率
- `|D|`：文档长度
- `avgdl`：平均文档长度
- `IDF(qi)`：词 qi 的逆文档频率

## 测试

所有组件都有完整的单元测试覆盖。

**运行测试：**

```bash
# 运行所有测试
npm test

# 监视模式
npm test:watch

# 生成覆盖率报告
npm test:coverage
```

**测试文件位置：**
- `src/lib/__tests__/tool-base.test.ts` - Tool 基类测试
- `src/lib/__tests__/bm25-retriever.test.ts` - BM25 检索器测试
- `src/lib/__tests__/keyword-search-tool.test.ts` - KeywordSearchTool 测试
- `src/lib/__tests__/rag-module.test.ts` - RAG 模块测试

## 集成到应用

### 后端 API 集成

```typescript
// app/api/rag/search/route.ts
import { createRAGModule } from '@/lib';

const ragModule = createRAGModule();

export async function POST(req: Request) {
  const { query, topK } = await req.json();

  const result = await ragModule.executeTool('keyword_search', {
    query,
    topK: topK || 3,
  });

  return Response.json(result);
}
```

### 前端集成

```typescript
// 在 React 组件中使用
const [results, setResults] = useState([]);

const handleSearch = async (query: string) => {
  const response = await fetch('/api/rag/search', {
    method: 'POST',
    body: JSON.stringify({ query, topK: 5 }),
  });

  const result = await response.json();
  setResults(result.data.results);
};
```

## 扩展指南

### 添加新的检索工具

1. 创建新的 Tool 子类：

```typescript
import { Tool, ToolDefinition, ToolExecutionResult } from '@/lib';

class SemanticSearchTool extends Tool {
  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    // 实现语义搜索逻辑
    return {
      success: true,
      data: { /* 结果 */ },
    };
  }
}
```

2. 在 RAG 模块中注册：

```typescript
const semanticTool = new SemanticSearchTool({
  name: 'semantic_search',
  description: 'Semantic search using embeddings',
  parameters: { /* ... */ },
});

ragModule.getToolRegistry().register(semanticTool);
```

## 性能考虑

- **文档索引**：BM25 索引在添加文档时构建，O(n*m) 复杂度（n=文档数，m=平均词数）
- **查询**：查询时间 O(n*k)（n=文档数，k=查询词数）
- **内存**：所有文档和索引存储在内存中

## 下一步

- [ ] 实现语义搜索工具（使用向量嵌入）
- [ ] 实现混合搜索（结合关键词和语义）
- [ ] 添加持久化存储支持
- [ ] 实现父文档检索
- [ ] 添加自查询检索


# LangChain.js 适配器实现

## 核心设计理念

**保持我们的抽象，让 LangChain.js 适配我们的实现**

通过适配器模式，我们的 Tool 和 Retriever 实现保持不变，同时获得 LangChain.js 生态的支持。

## 关键代码

### 1. ToolToLangChainAdapter

```typescript
export class ToolToLangChainAdapter extends StructuredTool {
  private ourTool: Tool;
  name: string;
  description: string;
  schema: z.ZodSchema;

  constructor(ourTool: Tool) {
    const schema = jsonSchemaToZod(ourTool.getParameters());
    super();
    this.ourTool = ourTool;
    this.name = ourTool.getName();
    this.description = ourTool.getDescription();
    this.schema = schema;
  }

  async _call(input: Record<string, any>): Promise<string> {
    const result = await this.ourTool.call(input);
    return JSON.stringify(result.data || result);
  }

  getOriginalTool(): Tool {
    return this.ourTool;
  }

  async executeWithMetadata(params: Record<string, any>): Promise<ToolExecutionResult> {
    return this.ourTool.call(params);
  }
}
```

**关键特性：**
- 继承 LangChain 的 `StructuredTool`
- 将我们的 JSON Schema 转换为 Zod Schema
- 提供 `getOriginalTool()` 访问原始实现
- 提供 `executeWithMetadata()` 获取完整的执行结果

### 2. BM25RetrieverAdapter

```typescript
export class BM25RetrieverAdapter extends BaseRetriever {
  lc_namespace = ["context_engineer", "retrievers"];
  private bm25Retriever: BM25Retriever;
  private topK: number;

  async _getRelevantDocuments(query: string): Promise<Document[]> {
    const result = await this.bm25Retriever.retrieve(query, this.topK);
    return result.chunks.map((item) =>
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
}
```

**关键特性：**
- 继承 LangChain 的 `BaseRetriever`
- 自动转换 DocumentChunk 为 LangChain Document
- 保留评分和排名信息
- 支持 `invoke()` 方法

### 3. JSON Schema 到 Zod Schema 转换

```typescript
function jsonSchemaToZod(schema: any): z.ZodSchema {
  const properties: Record<string, z.ZodSchema> = {};

  for (const [key, prop] of Object.entries(schema.properties)) {
    let zodSchema: z.ZodSchema;

    switch (prop.type) {
      case "string": zodSchema = z.string(); break;
      case "number": zodSchema = z.number(); break;
      case "integer": zodSchema = z.number().int(); break;
      case "boolean": zodSchema = z.boolean(); break;
      case "array": zodSchema = z.array(z.any()); break;
      case "object": zodSchema = z.record(z.any()); break;
      default: zodSchema = z.any();
    }

    if (!schema.required?.includes(key)) {
      zodSchema = zodSchema.optional();
    }

    properties[key] = zodSchema;
  }

  return z.object(properties);
}
```

## 使用示例

### 适配 Tool

```typescript
const keywordSearchTool = new KeywordSearchTool();
keywordSearchTool.addDocuments([
  {
    id: "doc1",
    content: "TypeScript 是一个编程语言",
    metadata: { source: "docs", chunkIndex: 0 },
  },
]);

const langchainTool = new ToolToLangChainAdapter(keywordSearchTool);
const result = await langchainTool.invoke({
  query: "TypeScript",
  topK: 3,
});
```

### 适配 Retriever

```typescript
const bm25Retriever = new BM25Retriever();
bm25Retriever.addDocuments([...]);

const langchainRetriever = new BM25RetrieverAdapter(bm25Retriever, 2);
const documents = await langchainRetriever.invoke("JavaScript");
```

## 文件结构

```
src/lib/
├── adapters/
│   ├── __tests__/
│   │   ├── tool-to-langchain.test.ts (13 tests)
│   │   └── retriever-to-langchain.test.ts (10 tests)
│   ├── tool-to-langchain.ts
│   ├── retriever-to-langchain.ts
│   └── index.ts
├── tools/
│   ├── base.ts (Tool 抽象基类)
│   └── keyword-search-tool.ts
├── rag/
│   ├── bm25-retriever.ts
│   └── rag-module.ts
└── examples/
    └── langchain-adapter-usage.ts

src/app/
├── api/adapters/
│   ├── tool-demo/route.ts
│   └── retriever-demo/route.ts
├── layout.tsx
├── globals.css
└── page.tsx (UI 演示)
```

## 测试覆盖

- ✅ 13 个 Tool 适配器测试
- ✅ 10 个 Retriever 适配器测试
- ✅ 所有 91 个测试通过

## 优势

1. **保持设计理念** - 我们的抽象不变
2. **获得生态支持** - 使用 LangChain 的工具和集成
3. **无缝集成** - 适配器提供标准接口
4. **灵活使用** - 可同时使用原始和适配版本
5. **完整测试** - 100% 测试覆盖

## 下一步

- [ ] 引入 LangChain 文档 RAG 功能
- [ ] 实现 Memory Module
- [ ] 实现 Tool Use Module
- [ ] 集成 LangChain Agent


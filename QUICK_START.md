# 快速开始指南

## 🚀 5 分钟快速开始

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 打开浏览器
访问 http://localhost:3001

### 3. 查看演示
- **Tool 适配器** - 点击"执行 Tool 演示"
- **Retriever 适配器** - 点击"执行 Retriever 演示"
- **LangChain RAG** - 输入查询词，点击"执行 RAG 检索"

## 📚 核心概念

### 适配器模式
将我们的实现适配为 LangChain 接口，保持原有设计不变。

```typescript
// 我们的实现
const tool = new KeywordSearchTool();

// 适配为 LangChain
const langchainTool = new ToolToLangChainAdapter(tool);

// 使用 LangChain 接口
await langchainTool.invoke({ query: "TypeScript" });
```

### 文档 RAG
检索增强生成 - 从文档中检索相关内容。

```typescript
// 创建 RAG 检索器
const retriever = new LangChainRAGRetriever(3);

// 添加文档
await retriever.addDocuments([
  {
    content: "TypeScript is a typed superset of JavaScript.",
    metadata: { source: "docs", title: "TypeScript" },
  },
]);

// 执行检索
const results = await retriever.invoke("TypeScript");
```

## 🔧 常见任务

### 任务 1: 使用 Tool 适配器

```typescript
import { ToolToLangChainAdapter } from "@/lib/adapters";
import { KeywordSearchTool } from "@/lib/tools";

// 创建工具
const tool = new KeywordSearchTool();
tool.addDocuments([
  {
    id: "doc1",
    content: "TypeScript documentation",
    metadata: { source: "docs", chunkIndex: 0 },
  },
]);

// 适配为 LangChain
const langchainTool = new ToolToLangChainAdapter(tool);

// 使用
const result = await langchainTool.invoke({
  query: "TypeScript",
  topK: 3,
});

console.log(result);
```

### 任务 2: 使用 Retriever 适配器

```typescript
import { BM25RetrieverAdapter } from "@/lib/adapters";
import { BM25Retriever } from "@/lib/rag";

// 创建检索器
const retriever = new BM25Retriever();
retriever.addDocuments([...]);

// 适配为 LangChain
const langchainRetriever = new BM25RetrieverAdapter(retriever, 3);

// 使用
const documents = await langchainRetriever.invoke("search query");
```

### 任务 3: 使用 RAG 检索器

```typescript
import { LangChainRAGRetriever } from "@/lib/rag";

// 创建 RAG 检索器
const retriever = new LangChainRAGRetriever(3);

// 添加 Markdown 文档
await retriever.addMarkdownDocuments([
  {
    content: "# Guide\n\nContent here",
    source: "guide",
    title: "My Guide",
  },
]);

// 执行检索
const results = await retriever.invoke("guide");

// 处理结果
results.forEach((doc) => {
  console.log(doc.pageContent);
  console.log(doc.metadata.score);
});
```

### 任务 4: 调用 API

```typescript
// 调用 RAG API
const response = await fetch("/api/rag/retrieve", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "TypeScript",
    topK: 3,
  }),
});

const data = await response.json();
console.log(data.results);
```

## 📖 文档

- **ADAPTER_IMPLEMENTATION.md** - 适配器详细说明
- **LANGCHAIN_RAG_IMPLEMENTATION.md** - RAG 详细说明
- **IMPLEMENTATION_COMPLETE.md** - 项目完成总结

## 🧪 测试

### 运行所有测试
```bash
npm run test
```

### 运行特定测试
```bash
npm run test -- src/lib/adapters/__tests__/tool-to-langchain.test.ts
npm run test -- src/lib/rag/__tests__/langchain-rag.test.ts
```

### 查看测试覆盖
```bash
npm run test -- --coverage
```

## 🏗️ 构建

### 开发构建
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 启动生产服务器
```bash
npm run start
```

## 📁 项目结构

```
src/lib/
├── adapters/          # 适配器实现
├── rag/              # RAG 实现
├── tools/            # 工具实现
└── examples/         # 使用示例

src/app/
├── api/              # API 路由
└── page.tsx          # UI 演示
```

## 🔗 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/adapters/tool-demo` | POST | Tool 适配器演示 |
| `/api/adapters/retriever-demo` | POST | Retriever 适配器演示 |
| `/api/rag/retrieve` | POST | RAG 检索 |
| `/api/rag/retrieve` | GET | RAG 统计信息 |

## 💡 提示

1. **查看示例** - 在 `src/lib/examples/` 中查看完整示例
2. **查看测试** - 在 `src/lib/__tests__/` 中查看测试用例
3. **查看 UI** - 在 `src/app/page.tsx` 中查看 UI 实现
4. **查看 API** - 在 `src/app/api/` 中查看 API 实现

## ❓ 常见问题

**Q: 如何添加自己的文档？**
A: 使用 `retriever.addDocuments()` 或 `retriever.addMarkdownDocuments()`

**Q: 如何改变检索结果数量？**
A: 创建检索器时指定 `topK` 参数

**Q: 如何获取执行时间？**
A: 使用 `executeWithMetadata()` 方法获取完整的执行结果

**Q: 支持哪些文档格式？**
A: Markdown、JSON、纯文本，以及自定义格式

## 🎯 下一步

1. 阅读 `IMPLEMENTATION_COMPLETE.md` 了解完整功能
2. 查看 `src/lib/examples/` 中的示例代码
3. 在 UI 上尝试不同的查询
4. 修改代码并运行测试

---

**需要帮助？** 查看详细文档或查看示例代码！


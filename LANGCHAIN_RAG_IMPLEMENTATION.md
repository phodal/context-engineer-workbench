# LangChain 文档 RAG 实现

## 核心功能

集成 LangChain 的文档加载、处理和检索能力，实现完整的 RAG (Retrieval-Augmented Generation) 系统。

## 关键代码

### 1. DocumentProcessor - 文档处理

```typescript
export class DocumentProcessor {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ["\n\n", "\n", " ", ""],
    });
  }

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
}
```

**特性：**
- 使用 LangChain 的 RecursiveCharacterTextSplitter
- 支持自定义块大小和重叠
- 自动生成块索引和元数据

### 2. LangChainRAGRetriever - RAG 检索器

```typescript
export class LangChainRAGRetriever extends BaseRetriever {
  lc_namespace = ["context_engineer", "retrievers"];
  private documentRAG: LangChainDocumentRAG;
  private bm25Retriever: BM25Retriever;
  private topK: number;

  async addDocuments(documents: LoadedDocument[]): Promise<void> {
    this.documentRAG.addDocuments(documents);
    const chunks = await this.documentRAG.processAll();
    this.bm25Retriever.addDocuments(chunks);
  }

  async _getRelevantDocuments(query: string): Promise<Document[]> {
    const result = await this.bm25Retriever.retrieve(query, this.topK);
    return result.chunks.map(
      (item) =>
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

**特性：**
- 继承 LangChain BaseRetriever
- 集成 DocumentProcessor 和 BM25Retriever
- 支持多种文档格式
- 返回标准 LangChain Document 对象

### 3. 支持的文档格式

```typescript
// Markdown 文档
const markdownDocs = [
  {
    content: "# Title\n\nContent here",
    source: "markdown-guide",
    title: "Guide",
  },
];
const retriever = await createRAGFromMarkdown(markdownDocs);

// 文本数组
const texts = ["Document 1", "Document 2"];
await retriever.addTextDocuments(texts, "source");

// JSON 数据
const jsonData = { key: "value" };
const docs = DocumentProcessor.fromJSON(jsonData, "source");
```

## API 路由

### POST /api/rag/retrieve

执行 RAG 检索查询。

**请求：**
```json
{
  "query": "TypeScript",
  "topK": 3
}
```

**响应：**
```json
{
  "success": true,
  "query": "TypeScript",
  "resultCount": 3,
  "results": [
    {
      "rank": 1,
      "content": "TypeScript is a typed superset of JavaScript...",
      "metadata": {
        "source": "typescript-docs",
        "score": 1.087,
        "rank": 1
      }
    }
  ],
  "stats": {
    "documentCount": 5,
    "chunkCount": 12,
    "totalContent": 5432
  }
}
```

### GET /api/rag/retrieve

获取 RAG 统计信息。

## 文件结构

```
src/lib/rag/
├── __tests__/
│   └── langchain-rag.test.ts (8 tests)
├── document-loader.ts (DocumentProcessor)
├── langchain-rag-retriever.ts (LangChainRAGRetriever)
├── bm25-retriever.ts (BM25 检索)
└── rag-module.ts (RAG 模块)

src/app/
├── api/rag/
│   └── retrieve/route.ts (API 路由)
└── page.tsx (UI 演示)

src/lib/examples/
└── langchain-rag-usage.ts (5 个使用示例)
```

## 测试覆盖

- ✅ 8 个 RAG 测试全部通过
- ✅ 99 个总测试全部通过
- ✅ 文档添加和检索
- ✅ Markdown 处理
- ✅ 元数据保留
- ✅ topK 参数
- ✅ 清空操作

## 使用示例

### 基础使用

```typescript
const retriever = new LangChainRAGRetriever(3);

const documents = [
  {
    content: "TypeScript is a typed superset of JavaScript.",
    metadata: { source: "docs", title: "TypeScript" },
  },
];

await retriever.addDocuments(documents);
const results = await retriever.invoke("TypeScript");

results.forEach((doc) => {
  console.log(doc.pageContent);
  console.log(doc.metadata.score);
});
```

### 从 Markdown 创建

```typescript
const retriever = await createRAGFromMarkdown([
  {
    content: "# Guide\n\nContent",
    source: "guide",
    title: "My Guide",
  },
]);

const results = await retriever.invoke("guide");
```

## 优势

1. **完整集成** - 结合 LangChain 和我们的实现
2. **多格式支持** - Markdown、JSON、文本
3. **自动处理** - 文档分割、块生成、元数据
4. **标准接口** - 与 LangChain 生态兼容
5. **高效检索** - 使用 BM25 算法
6. **完整测试** - 99 个测试全部通过

## 下一步

- [ ] 添加向量存储支持
- [ ] 实现语义搜索
- [ ] 集成 LLM 生成
- [ ] 添加缓存机制
- [ ] 支持更多文档格式


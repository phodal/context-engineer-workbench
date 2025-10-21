# Context Engineer Workbench - 三大模块设计文档

## 概述

本文档详细设计 RAG Module、Memory Module 和 Tool Use Module 的架构、API 接口和实现策略。设计基于 PRD 需求、现有 Vercel AI SDK 集成和 LangChain.js 最佳实践。

---

## 1. RAG Module（检索增强生成模块）- “检索器即工具”架构

### 1.1 核心理念：检索器即工具 (Retriever-as-a-Tool)

我们将 RAG 的核心能力——“检索”，从一个单一的、可配置的模块，重塑为一个由多个独立、可组合的 **“检索工具”** 构成的工具集。每个工具代表一种特定的检索策略。这种设计使得上层应用（如 Agent）可以根据任务需求，动态选择最合适的检索工具，甚至组合使用它们。

这种模式的优势：
- **模块化与可扩展性**：每种检索算法（语义、关键词、父文档等）都是一个独立的工具，方便单独实现、测试和优化。未来增加新的检索策略只需增加一个新工具。
- **灵活性与组合性**：Agent 可以根据用户查询的意图，自主选择调用 `semantic_search` 还是 `self_query_search`。也可以通过 `ensemble_retriever` 将多个检索结果合并，实现更复杂的检索逻辑。
- **教学友好**：学员可以清晰地看到不同检索策略的输入、输出和应用场景，从实践中理解其差异和优势，符合“为学员练习设计”的初衷。
- **可观测性**：每次工具调用都是一个独立的、可追踪的事件，便于观察和调试检索过程。

### 1.2 架构设计

新的架构将 RAG Module 拆分为 **Indexing Pipeline**（负责文档处理和索引构建）和 **Retrieval Toolkit**（提供一组检索工具）。

```
┌─────────────────────────────────────────────────────────┐
│                    RAG Module                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐      ┌─────────────────────────┐   │
│  │ Indexing Pipeline│      │    Retrieval Toolkit    │   │
│  │ (Offline Process)│      │   (Tools for Agents)    │   │
│  ├──────────────────┤      ├─────────────────────────┤   │
│  │ - Document Loader│      │ - semantic_search       │   │
│  │ - Text Splitter  │      │ - keyword_search        │   │
│  │ - Embedding Model│      │ - hybrid_search         │   │
│  │ - Vector Store   │      │ - parent_document_search│   │
│  └──────────────────┘      │ - self_query_search     │   │
│         │                  │ - ensemble_retriever    │   │
│         └──────────────────┼─────────────────────────┘   │
│                            │                             │
│                            ↓                             │
│  ┌──────────────────────────────────────────────────┐    │
│  │                   Agent Executor                   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1.3 核心工具（Tool）定义

我们将提供一系列符合 LangChain.js `Tool` 规范的检索器。

```typescript
import { Tool } from "langchain/tools";

// 1. 基础语义搜索工具
const semanticSearchTool = new Tool({
  name: "semantic_search",
  description: "Performs semantic search on the vector store. Use for finding conceptually similar documents.",
  func: async (query: string, topK: number = 3) => { /* ... */ },
});

// 2. 关键词搜索工具 (BM25/TF-IDF)
const keywordSearchTool = new Tool({
  name: "keyword_search",
  description: "Performs keyword-based search. Use for finding documents with specific terms or keywords.",
  func: async (query: string, topK: number = 3) => { /* ... */ },
});

// 3. 混合搜索工具
const hybridSearchTool = new Tool({
  name: "hybrid_search",
  description: "Combines semantic and keyword search results for balanced relevance. Good for general queries.",
  func: async (query: string, topK: number = 3) => { /* ... */ },
});

// 4. 父文档检索工具
const parentDocumentSearchTool = new Tool({
  name: "parent_document_search",
  description: "Retrieves smaller, more precise chunks first, then returns their larger parent documents for better context. Useful when details are needed but full context is important.",
  func: async (query: string, topK: number = 3) => { /* ... */ },
});

// 5. 自查询检索工具
const selfQuerySearchTool = new Tool({
  name: "self_query_search",
  description: "Parses the user's query to extract both the search query and metadata filters. Use when the query contains constraints like dates, sources, or categories (e.g., 'recent documents about AI').",
  func: async (queryWithFilters: string) => { /* ... */ },
});
```

### 1.4 核心接口定义

文档处理和检索结果的接口保持不变，但配置接口将演变为工具级的参数。

```typescript
// 文档块接口 (保持不变)
interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    chunkIndex: number;
    pageNumber?: number;
    // ... other metadata for self-querying
  };
  embedding?: number[];
}

// 检索结果接口 (保持不变)
interface RetrievalResult {
  chunks: Array<{
    chunk: DocumentChunk;
    score: number;
    rank: number;
  }>;
  query: string;
  retrieverName: string; // 标明由哪个工具产生
  totalTime: number;
}
```

### 1.5 实现策略

**第一阶段（MVP）**：
- **Indexing**：使用 LangChain.js 的 `RecursiveCharacterTextSplitter`、OpenAI Embeddings 和内存向量存储 `MemoryVectorStore`。
- **Tools**:
  - 实现 `semantic_search` 工具作为基础。
  - 包装 `ParentDocumentRetriever` 来快速实现 `parent_document_search` 工具。
  - 提供一个简单的 `keyword_search` 模拟（如基于 `String.includes()`），用于教学演示。

**第二阶段**：
- **Indexing**：支持 PDF、Markdown 等多种格式；集成 Chroma/Pinecone 等持久化向量数据库。
- **Tools**:
  - 实现真正的 `keyword_search`（如集成 `flexsearch` 或 `tantivy-node`）。
  - 实现 `hybrid_search`，融合语义和关键词搜索结果。
  - 基于 LangChain.js 的 `SelfQueryRetriever` 实现 `self_query_search` 工具。

**关键依赖**：
```json
{
  "@langchain/core": "^0.3.x",
  "@langchain/textsplitters": "^0.1.x",
  "langchain": "^0.3.x"
}
```

---

## 2. Memory Module（记忆管理模块）

### 2.1 核心职责

- **短期记忆**：管理聊天历史（当前对话）
- **长期记忆**：存储用户画像和持久化信息
- **记忆检索**：根据上下文注入相关记忆
- **记忆压缩**：处理上下文窗口限制

### 2.2 架构设计

```
┌──────────────────────────────────────────────────────┐
│              Memory Module                            │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────┐      ┌──────────────────────┐  │
│  │ Chat History    │      │ User Profile Store   │  │
│  │ (Short-term)    │      │ (Long-term)          │  │
│  │                 │      │                      │  │
│  │ - Messages      │      │ - User Preferences   │  │
│  │ - Timestamps    │      │ - Order History      │  │
│  │ - Metadata      │      │ - Custom Attributes  │  │
│  └────────┬────────┘      └──────────┬───────────┘  │
│           │                          │               │
│           └──────────┬───────────────┘               │
│                      ↓                               │
│         ┌─────────────────────────────┐             │
│         │  Memory Injection Engine    │             │
│         │  - Context Window Manager   │             │
│         │  - Summarization Strategy   │             │
│         │  - Relevance Scoring        │             │
│         └─────────────────────────────┘             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### 2.3 核心接口定义

```typescript
// 记忆配置
interface MemoryConfig {
  enableChatHistory: boolean;
  historyLength: number;           // 保留消息数 (default: 10)
  enableUserProfile: boolean;
  compressionStrategy: 'none' | 'summarize' | 'sliding_window';
  maxContextTokens: number;        // 最大上下文令牌数
}

// 聊天消息
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// 用户画像
interface UserProfile {
  userId: string;
  attributes: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

// 记忆检索结果
interface MemoryRetrievalResult {
  chatHistory: ChatMessage[];
  userProfile: UserProfile | null;
  relevantMemories: Array<{
    type: 'chat' | 'profile';
    content: string;
    relevanceScore: number;
  }>;
}
```

### 2.4 实现策略

**第一阶段（MVP）**：
- 内存中存储聊天历史
- 简单的滑动窗口策略
- 用户画像的键值存储
- 基于消息数量的截断

**第二阶段**：
- 集成 LangChain.js 的 `BufferMemory` / `ConversationSummaryMemory`
- 实现令牌计数和动态截断
- 支持持久化存储（数据库）
- 添加记忆相关性评分

**关键依赖**：
```json
{
  "@langchain/core": "^0.3.x",
  "js-tiktoken": "^1.x"
}
```

---

## 3. Tool Use Module（工具使用模块）

### 3.1 核心职责

- **工具定义**：管理工具的元数据和参数模式
- **工具调用**：解析 LLM 的工具调用请求
- **工具执行**：执行工具并返回结果
- **模拟工具**：支持测试环境下的工具模拟

### 3.2 架构设计

```
┌────────────────────────────────────────────────────┐
│           Tool Use Module                          │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │      Tool Registry & Definition              │ │
│  │  - Tool Metadata                             │ │
│  │  - Parameter Schema (JSON Schema)            │ │
│  │  - Tool Descriptions                         │ │
│  └──────────────────────────────────────────────┘ │
│                      ↓                             │
│  ┌──────────────────────────────────────────────┐ │
│  │    Tool Call Parser                          │ │
│  │  - Extract tool name & params from LLM      │ │
│  │  - Validate against schema                  │ │
│  │  - Handle errors                            │ │
│  └──────────────────────────────────────────────┘ │
│                      ↓                             │
│  ┌──────────────────────────────────────────────┐ │
│  │    Tool Executor                             │ │
│  │  - Execute real tools                       │ │
│  │  - Mock tools (for testing)                 │ │
│  │  - Error handling & retry                   │ │
│  └──────────────────────────────────────────────┘ │
│                      ↓                             │
│  ┌──────────────────────────────────────────────┐ │
│  │    Tool Result Formatter                     │ │
│  │  - Format output for LLM                    │ │
│  │  - Trace & logging                          │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 3.3 核心接口定义

```typescript
// 工具定义
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  handler?: (params: Record<string, any>) => Promise<any>;
  mockResponse?: Record<string, any>;
}

// 工具调用请求
interface ToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  timestamp: number;
}

// 工具执行结果
interface ToolExecutionResult {
  toolCall: ToolCall;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  isMocked: boolean;
}

// 工具配置
interface ToolConfig {
  enabled: boolean;
  tools: ToolDefinition[];
  mockMode: boolean;  // 测试模式
  timeout: number;    // 执行超时
}
```

### 3.4 实现策略

**第一阶段（MVP）**：
- 工具定义和注册系统
- 基于 JSON Schema 的参数验证
- 模拟工具响应（用于演示）
- 简单的工具调用追踪

**第二阶段**：
- 集成 LangChain.js 的 `Tool` 和 `StructuredTool`
- 支持真实 API 调用
- 实现工具调用重试机制
- 添加工具权限控制

**关键依赖**：
```json
{
  "@langchain/core": "^0.3.x",
  "zod": "^3.x"
}
```

---

## 4. 集成策略

### 4.1 后端 API 设计

```typescript
// POST /api/rag/upload
// 上传文档

// POST /api/rag/retrieve
// 检索相关文档

// POST /api/memory/get
// 获取记忆

// POST /api/memory/update
// 更新用户画像

// POST /api/tools/execute
// 执行工具

// POST /api/chat
// 完整的聊天流程（整合三个模块）
```

### 4.2 前端集成点

- **ConfigPanel**：配置三个模块的参数
- **ContextAssemblyView**：可视化显示检索文档、记忆注入、工具定义
- **EvaluationPanel**：显示追踪信息（检索分数、工具调用、记忆使用）

### 4.3 数据流

```
用户输入
  ↓
[Memory] 检索相关记忆 → 注入系统提示
  ↓
[RAG] 检索相关文档 → 增强上下文
  ↓
[LLM] 生成响应 + 工具调用
  ↓
[Tool] 执行工具 → 获取结果
  ↓
[LLM] 合成最终答案
  ↓
[Memory] 保存对话历史
```

---

## 5. 优先级和时间表

| 阶段 | 模块 | 功能 | 预计时间 |
|------|------|------|---------|
| MVP | RAG | 文档上传、分块、检索 | 1-2周 |
| MVP | Memory | 聊天历史、用户画像 | 1周 |
| MVP | Tool | 工具定义、模拟执行 | 1周 |
| V1 | RAG | 混合搜索、重排 | 1-2周 |
| V1 | Memory | 持久化、压缩 | 1周 |
| V1 | Tool | 真实 API 调用 | 1-2周 |

---

## 6. 关键考虑事项

1. **上下文窗口管理**：三个模块都需要考虑令牌限制
2. **可观测性**：每个模块都需要详细的追踪和日志
3. **错误处理**：优雅降级和用户友好的错误提示
4. **性能**：缓存、异步处理、流式响应
5. **安全性**：工具调用权限、数据隐私

---

## 7. 参考资源

- LangChain.js RAG 教程：https://js.langchain.com/docs/tutorials/rag/
- Vercel AI SDK：https://ai-sdk.dev/
- PRD 第 2-4 部分：详细的技术规范


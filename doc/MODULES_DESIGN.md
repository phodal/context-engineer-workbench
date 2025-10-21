# Context Engineer Workbench - 三大模块设计文档

## 概述

本文档详细设计 RAG Module、Memory Module 和 Tool Use Module 的架构、API 接口和实现策略。设计基于 PRD 需求、现有 Vercel AI SDK 集成和 LangChain.js 最佳实践。

---

## 1. RAG Module（检索增强生成模块）

### 1.1 核心职责

- **文档管理**：上传、解析、分块、嵌入文档
- **向量存储**：管理向量数据库（初期使用内存存储，后期支持 Pinecone/Chroma）
- **检索引擎**：支持语义、关键词、混合搜索
- **可视化追踪**：显示检索过程、相似度分数、文档块

### 1.2 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    RAG Module                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Document   │  │   Embedding  │  │ Vector Store │  │
│  │   Processor  │→ │   Service    │→ │  (Memory)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ↑                                      ↓         │
│    Upload/Parse              Similarity Search         │
│    Chunking                   Metadata Filter          │
│    Splitting                  Ranking                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Retrieval Pipeline                       │  │
│  │  - Query Embedding                              │  │
│  │  - Similarity Search (top_k)                    │  │
│  │  - Threshold Filtering                          │  │
│  │  - Result Ranking & Reranking                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1.3 核心接口定义

```typescript
// RAG 配置接口
interface RAGConfig {
  enabled: boolean;
  chunkSize: number;           // 文档分块大小 (default: 500)
  chunkOverlap: number;        // 分块重叠 (default: 50)
  topK: number;                // 检索结果数量 (default: 3)
  similarityThreshold: number; // 相似度阈值 (default: 0.7)
  searchMode: 'semantic' | 'keyword' | 'hybrid';
  embeddingModel: string;      // 嵌入模型 (default: 'text-embedding-3-small')
}

// 文档块接口
interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    chunkIndex: number;
    pageNumber?: number;
  };
  embedding?: number[];
}

// 检索结果接口
interface RetrievalResult {
  chunks: Array<{
    chunk: DocumentChunk;
    score: number;
    rank: number;
  }>;
  query: string;
  totalTime: number;
  embeddingTime: number;
  searchTime: number;
}
```

### 1.4 实现策略

**第一阶段（MVP）**：
- 使用 LangChain.js 的 `RecursiveCharacterTextSplitter`
- 集成 OpenAI Embeddings（支持 DeepSeek 兼容接口）
- 内存向量存储（`MemoryVectorStore`）
- 基础相似度搜索

**第二阶段**：
- 支持多种文档格式（PDF、Markdown、HTML）
- 集成 Pinecone/Chroma 持久化存储
- 实现混合搜索（BM25 + 语义）
- 添加重排（Reranking）功能

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


# Context Engineer's Workbench - Setup Guide

## 已完成的集成

✅ **Vercel AI SDK** - 已集成用于流式聊天
✅ **DeepSeek API** - 已配置为默认 LLM 提供商
✅ **环境变量** - API Key 已安全存储在 `.env.local`
✅ **UI 组件** - 四面板布局已实现

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

API Key 已经配置在 `.env.local` 文件中：

```
DEEPSEEK_API_KEY=sk-19c63faaa36d4bb99368f3991e5fc6fc
```

⚠️ **重要**: `.env.local` 文件已在 `.gitignore` 中，不会被提交到代码库。

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 功能说明

### 1. 配置中心（左侧面板）
- **LLM 提供商**: DeepSeek（默认）、OpenAI、Anthropic、Google
- **模型选择**: deepseek-chat、deepseek-coder
- **参数调整**: Temperature (0-2)、Max Tokens (100-4000)
- **模块开关**:
  - RAG 模块：配置检索增强生成
  - Memory 模块：配置聊天历史管理
  - Tool 模块：配置工具使用

### 2. 上下文组装视图（中间上方）
- 实时显示上下文构建过程
- Token 使用统计
- 成本估算
- 彩色编码的上下文块：
  - 🔵 蓝色：System Prompt
  - 🟢 绿色：Retrieved Documents
  - 🟣 紫色：Chat History
  - 🟠 橙色：Tool Definitions
  - 🔴 红色：User Input

### 3. 聊天交互面板（中间下方）
- 实时流式响应
- 消息历史记录
- 支持 Shift+Enter 换行
- 字符计数器

### 4. 评估面板（右侧）
- 执行追踪
- 性能指标
- Token 使用统计

## API 路由

### POST /api/chat

聊天 API 端点，支持流式响应。

**请求体**:
```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "config": {
    "model": "deepseek-chat",
    "temperature": 0.7,
    "maxTokens": 2000,
    "enableRAG": false,
    "enableMemory": false,
    "enableTools": false
  }
}
```

**响应**: 流式文本响应

## 技术栈

- **框架**: Next.js 15.5.6 with App Router
- **AI SDK**: Vercel AI SDK (@ai-sdk/react, @ai-sdk/openai)
- **样式**: Tailwind CSS 4
- **语言**: TypeScript 5
- **LLM**: DeepSeek API (OpenAI 兼容)

## 下一步

1. ✅ 基础聊天功能已实现
2. 🔄 可以添加实际的 RAG 功能
3. 🔄 可以添加真实的工具调用
4. 🔄 可以添加更详细的追踪和分析

## 注意事项

- DeepSeek API 使用 OpenAI 兼容的接口
- API Key 存储在本地环境变量中，不会被提交到 Git
- 流式响应已启用，提供更好的用户体验
- 所有配置都是响应式的，修改后立即生效

## 故障排除

### 如果遇到模块未找到错误

```bash
rm -rf node_modules package-lock.json
npm install
```

### 如果 API 调用失败

检查 `.env.local` 文件中的 API Key 是否正确。

### 如果页面无法加载

确保开发服务器正在运行：
```bash
npm run dev
```

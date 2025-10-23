/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RAG 模块
 * 管理文档索引和检索工具
 */

import { Tool, ToolRegistry, ToolDefinition } from '../tools/base';
import { KeywordSearchTool } from '../tools/keyword-search-tool';
import { DocumentChunk } from './bm25-retriever';

/**
 * RAG 模块配置
 */
export interface RAGModuleConfig {
  enableKeywordSearch?: boolean;
  keywordSearchConfig?: {
    defaultTopK?: number;
    maxTopK?: number;
  };
}

/**
 * RAG 模块
 * 负责文档管理和检索工具的集成
 */
export class RAGModule {
  private toolRegistry: ToolRegistry;
  private documents: DocumentChunk[] = [];
  private keywordSearchTool: KeywordSearchTool | null = null;
  private config: RAGModuleConfig;

  constructor(config: RAGModuleConfig = {}) {
    this.config = {
      enableKeywordSearch: true,
      ...config,
    };

    this.toolRegistry = new ToolRegistry();
    this.initializeTools();
  }

  /**
   * 初始化工具
   */
  private initializeTools(): void {
    // 初始化关键词搜索工具
    if (this.config.enableKeywordSearch) {
      this.keywordSearchTool = new KeywordSearchTool(this.config.keywordSearchConfig);
      this.toolRegistry.register(this.keywordSearchTool);
    }
  }

  /**
   * 添加文档
   */
  addDocuments(documents: DocumentChunk[]): void {
    this.documents.push(...documents);

    // 更新所有工具的文档索引
    if (this.keywordSearchTool) {
      this.keywordSearchTool.addDocuments(documents);
    }
  }

  /**
   * 清空文档
   */
  clearDocuments(): void {
    this.documents = [];

    if (this.keywordSearchTool) {
      this.keywordSearchTool.clearDocuments();
    }
  }

  /**
   * 获取文档数量
   */
  getDocumentCount(): number {
    return this.documents.length;
  }

  /**
   * 获取所有文档
   */
  getDocuments(): DocumentChunk[] {
    return [...this.documents];
  }

  /**
   * 获取工具注册表
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * 获取所有可用的工具定义
   */
  getAvailableTools(): ToolDefinition[] {
    return this.toolRegistry.getAllDefinitions();
  }

  /**
   * 执行工具
   */
  async executeTool(toolName: string, params: Record<string, any>): Promise<any> {
    return this.toolRegistry.executeTool(toolName, params);
  }

  /**
   * 列出所有可用的工具
   */
  listTools(): string[] {
    return this.toolRegistry.listTools();
  }

  /**
   * 获取特定工具
   */
  getTool(name: string): Tool | undefined {
    return this.toolRegistry.getTool(name);
  }

  /**
   * 获取关键词搜索工具
   */
  getKeywordSearchTool(): KeywordSearchTool | null {
    return this.keywordSearchTool;
  }
}

/**
 * 创建 RAG 模块实例
 */
export function createRAGModule(config?: RAGModuleConfig): RAGModule {
  return new RAGModule(config);
}

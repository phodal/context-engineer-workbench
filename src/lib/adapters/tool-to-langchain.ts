/* eslint-disable @typescript-eslint/no-explicit-any */
import { StructuredTool } from "@langchain/core/tools";
import { Tool, ToolExecutionResult } from "../tools/base";
import { z } from "zod";

/**
 * 将我们的 Tool 适配为 LangChain Tool
 * 保持我们的抽象，让 LangChain.js 适配我们的实现
 */
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
    try {
      const result = await this.ourTool.call(input);
      return JSON.stringify(result.data || result);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取原始的 Tool 对象
   */
  getOriginalTool(): Tool {
    return this.ourTool;
  }

  /**
   * 获取执行结果（包含元数据）
   */
  async executeWithMetadata(params: Record<string, any>): Promise<ToolExecutionResult> {
    return this.ourTool.call(params);
  }
}

/**
 * 将 JSON Schema 转换为 Zod Schema
 */
function jsonSchemaToZod(schema: any): z.ZodSchema {
  if (!schema || !schema.properties) {
    return z.record(z.any());
  }

  const properties: Record<string, z.ZodSchema> = {};

  for (const [key, prop] of Object.entries(schema.properties)) {
    const propSchema = prop as any;
    let zodSchema: z.ZodSchema;

    switch (propSchema.type) {
      case "string":
        zodSchema = z.string();
        break;
      case "number":
        zodSchema = z.number();
        break;
      case "integer":
        zodSchema = z.number().int();
        break;
      case "boolean":
        zodSchema = z.boolean();
        break;
      case "array":
        zodSchema = z.array(z.any());
        break;
      case "object":
        zodSchema = z.record(z.any());
        break;
      default:
        zodSchema = z.any();
    }

    // 处理 required 字段
    if (!schema.required?.includes(key)) {
      zodSchema = zodSchema.optional();
    }

    properties[key] = zodSchema;
  }

  return z.object(properties);
}


/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tool 抽象基类
 * 定义所有工具的基本接口和方法
 */

/**
 * 工具参数的 JSON Schema 定义
 */
export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description: string;
    enum?: string[];
    default?: any;
  }>;
  required: string[];
}

/**
 * 工具定义接口
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
}

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

/**
 * Tool 抽象基类
 * 所有具体的工具都应该继承这个类
 */
export abstract class Tool {
  protected name: string;
  protected description: string;
  protected parameters: ToolParameterSchema;

  constructor(definition: ToolDefinition) {
    this.name = definition.name;
    this.description = definition.description;
    this.parameters = definition.parameters;
  }

  /**
   * 获取工具定义
   */
  getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
    };
  }

  /**
   * 获取工具名称
   */
  getName(): string {
    return this.name;
  }

  /**
   * 获取工具描述
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * 获取工具参数模式
   */
  getParameters(): ToolParameterSchema {
    return this.parameters;
  }

  /**
   * 验证参数
   */
  validateParameters(params: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查必需参数
    for (const required of this.parameters.required) {
      if (!(required in params)) {
        errors.push(`Missing required parameter: ${required}`);
      }
    }

    // 检查参数类型
    for (const [key, value] of Object.entries(params)) {
      if (key in this.parameters.properties) {
        const schema = this.parameters.properties[key];
        const actualType = typeof value;
        
        if (schema.type === 'number' && actualType !== 'number') {
          errors.push(`Parameter ${key} should be a number, got ${actualType}`);
        } else if (schema.type === 'string' && actualType !== 'string') {
          errors.push(`Parameter ${key} should be a string, got ${actualType}`);
        } else if (schema.type === 'array' && !Array.isArray(value)) {
          errors.push(`Parameter ${key} should be an array, got ${actualType}`);
        }

        // 检查枚举值
        if (schema.enum && !schema.enum.includes(value)) {
          errors.push(`Parameter ${key} must be one of: ${schema.enum.join(', ')}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 执行工具（抽象方法，由子类实现）
   */
  abstract execute(params: Record<string, any>): Promise<ToolExecutionResult>;

  /**
   * 调用工具的公共方法
   */
  async call(params: Record<string, any>): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    // 验证参数
    const validation = this.validateParameters(params);
    if (!validation.valid) {
      return {
        success: false,
        error: `Parameter validation failed: ${validation.errors.join('; ')}`,
        executionTime: Date.now() - startTime,
      };
    }

    try {
      const result = await this.execute(params);
      result.executionTime = Date.now() - startTime;
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
      };
    }
  }
}

/**
 * 工具注册表
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * 注册工具
   */
  register(tool: Tool): void {
    this.tools.set(tool.getName(), tool);
  }

  /**
   * 获取工具
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具定义
   */
  getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => tool.getDefinition());
  }

  /**
   * 执行工具
   */
  async executeTool(name: string, params: Record<string, any>): Promise<ToolExecutionResult> {
    const tool = this.getTool(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${name}`,
        executionTime: 0,
      };
    }

    return tool.call(params);
  }

  /**
   * 列出所有工具名称
   */
  listTools(): string[] {
    return Array.from(this.tools.keys());
  }
}


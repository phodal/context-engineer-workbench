/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tool 基类测试
 */

import { Tool, ToolDefinition, ToolRegistry } from '../tools/base';

/**
 * 测试用的具体 Tool 实现
 */
class TestTool extends Tool {
  async execute(params: Record<string, any>) {
    return {
      success: true,
      data: {
        input: params.query,
        result: `Processed: ${params.query}`,
      },
    };
  }
}

describe('Tool Base Class', () => {
  let tool: TestTool;

  beforeEach(() => {
    const definition: ToolDefinition = {
      name: 'test_tool',
      description: 'A test tool for unit testing',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The query string',
          },
          limit: {
            type: 'number',
            description: 'Result limit',
            default: 10,
          },
        },
        required: ['query'],
      },
    };

    tool = new TestTool(definition);
  });

  describe('Tool Definition', () => {
    it('should return correct tool definition', () => {
      const def = tool.getDefinition();
      expect(def.name).toBe('test_tool');
      expect(def.description).toBe('A test tool for unit testing');
    });

    it('should return correct tool name', () => {
      expect(tool.getName()).toBe('test_tool');
    });

    it('should return correct tool description', () => {
      expect(tool.getDescription()).toBe('A test tool for unit testing');
    });

    it('should return correct parameters schema', () => {
      const params = tool.getParameters();
      expect(params.required).toContain('query');
      expect(params.properties.query.type).toBe('string');
    });
  });

  describe('Parameter Validation', () => {
    it('should validate required parameters', () => {
      const validation = tool.validateParameters({});
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required parameter: query');
    });

    it('should accept valid parameters', () => {
      const validation = tool.validateParameters({ query: 'test' });
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate parameter types', () => {
      const validation = tool.validateParameters({ query: 123 });
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('should be a string'))).toBe(true);
    });

    it('should validate enum values', () => {
      const enumDef: ToolDefinition = {
        name: 'enum_tool',
        description: 'Tool with enum parameter',
        parameters: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              description: 'Mode selection',
              enum: ['fast', 'accurate', 'balanced'],
            },
          },
          required: ['mode'],
        },
      };

      const enumTool = new TestTool(enumDef);
      const validation = enumTool.validateParameters({ mode: 'invalid' });
      expect(validation.valid).toBe(false);
    });
  });

  describe('Tool Execution', () => {
    it('should execute tool with valid parameters', async () => {
      const result = await tool.call({ query: 'test query' });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.result).toBe('Processed: test query');
    });

    it('should fail with invalid parameters', async () => {
      const result = await tool.call({});
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should measure execution time', async () => {
      const result = await tool.call({ query: 'test' });
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Tool Registry', () => {
  let registry: ToolRegistry;
  let tool1: TestTool;
  let tool2: TestTool;

  beforeEach(() => {
    registry = new ToolRegistry();

    const def1: ToolDefinition = {
      name: 'tool_1',
      description: 'First test tool',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Query' },
        },
        required: ['query'],
      },
    };

    const def2: ToolDefinition = {
      name: 'tool_2',
      description: 'Second test tool',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Query' },
        },
        required: ['query'],
      },
    };

    tool1 = new TestTool(def1);
    tool2 = new TestTool(def2);
  });

  it('should register tools', () => {
    registry.register(tool1);
    expect(registry.getTool('tool_1')).toBe(tool1);
  });

  it('should list all tools', () => {
    registry.register(tool1);
    registry.register(tool2);
    const tools = registry.listTools();
    expect(tools).toContain('tool_1');
    expect(tools).toContain('tool_2');
  });

  it('should get all tool definitions', () => {
    registry.register(tool1);
    registry.register(tool2);
    const defs = registry.getAllDefinitions();
    expect(defs).toHaveLength(2);
  });

  it('should execute registered tool', async () => {
    registry.register(tool1);
    const result = await registry.executeTool('tool_1', { query: 'test' });
    expect(result.success).toBe(true);
  });

  it('should fail when executing non-existent tool', async () => {
    const result = await registry.executeTool('non_existent', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Tool not found');
  });
});


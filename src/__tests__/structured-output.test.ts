/**
 * Tests for structured output detection and parsing
 */

import {
  extractStructuredOutput,
  extractAllStructuredOutputs,
  formatStructuredOutput,
} from '@/lib/structured-output';

describe('Structured Output Detection and Parsing', () => {
  describe('JSON Detection and Parsing', () => {
    it('should detect and parse simple JSON object', () => {
      const text = 'Here is the result: {"name": "John", "age": 30}';
      const output = extractStructuredOutput(text);
      
      expect(output).not.toBeNull();
      expect(output?.type).toBe('json');
      expect(output?.isValid).toBe(true);
      expect(output?.parsed).toEqual({ name: 'John', age: 30 });
    });

    it('should detect and parse JSON array', () => {
      const text = 'The items are: [1, 2, 3, 4, 5]';
      const output = extractStructuredOutput(text);
      
      expect(output).not.toBeNull();
      expect(output?.type).toBe('json');
      expect(output?.isValid).toBe(true);
      expect(output?.parsed).toEqual([1, 2, 3, 4, 5]);
    });

    it('should detect nested JSON', () => {
      const text = 'Result: {"user": {"name": "Alice", "email": "alice@example.com"}}';
      const output = extractStructuredOutput(text);

      expect(output).not.toBeNull();
      expect(output?.type).toBe('json');
      expect(output?.isValid).toBe(true);
      expect(output?.parsed).toEqual({
        user: { name: 'Alice', email: 'alice@example.com' }
      });
    });

    it('should detect JSON from markdown code block', () => {
      const text = `Here's the result:
\`\`\`json
{
    "user": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "age": 30,
        "isActive": true
    }
}
\`\`\``;
      const output = extractStructuredOutput(text);

      expect(output).not.toBeNull();
      expect(output?.type).toBe('json');
      expect(output?.isValid).toBe(true);
      expect(output?.parsed).toEqual({
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          age: 30,
          isActive: true
        }
      });
    });

    it('should handle invalid JSON gracefully', () => {
      const text = 'This is invalid: {invalid json}';
      const output = extractStructuredOutput(text);

      // Should detect the JSON structure but mark it as invalid
      expect(output).not.toBeNull();
      expect(output?.type).toBe('json');
      expect(output?.isValid).toBe(false);
      expect(output?.error).toBeDefined();
    });
  });

  describe('XML Detection and Parsing', () => {
    it('should detect and parse simple XML', () => {
      const text = 'Here is XML: <root><name>John</name></root>';
      const output = extractStructuredOutput(text);
      
      expect(output).not.toBeNull();
      expect(output?.type).toBe('xml');
      expect(output?.isValid).toBe(true);
    });

    it('should handle XML with attributes', () => {
      const text = '<person id="1"><name>Alice</name></person>';
      const output = extractStructuredOutput(text);
      
      expect(output).not.toBeNull();
      expect(output?.type).toBe('xml');
      expect(output?.isValid).toBe(true);
    });
  });

  describe('Multiple Outputs', () => {
    it('should extract all JSON objects from text', () => {
      const text = 'First: {"a": 1} and second: {"b": 2}';
      const outputs = extractAllStructuredOutputs(text);
      
      expect(outputs.length).toBeGreaterThanOrEqual(1);
      expect(outputs[0].type).toBe('json');
      expect(outputs[0].isValid).toBe(true);
    });

    it('should return empty array for text without structured output', () => {
      const text = 'This is just plain text without any JSON or XML';
      const outputs = extractAllStructuredOutputs(text);
      
      expect(outputs).toEqual([]);
    });
  });

  describe('Formatting', () => {
    it('should format JSON output with proper indentation', () => {
      const text = '{"name":"John","age":30}';
      const output = extractStructuredOutput(text);
      
      if (output) {
        const formatted = formatStructuredOutput(output);
        expect(formatted).toContain('name');
        expect(formatted).toContain('John');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input', () => {
      const output = extractStructuredOutput(null as unknown as string);
      expect(output).toBeNull();
    });

    it('should handle empty string', () => {
      const output = extractStructuredOutput('');
      expect(output).toBeNull();
    });

    it('should handle text with only whitespace', () => {
      const output = extractStructuredOutput('   \n\t  ');
      expect(output).toBeNull();
    });

    it('should prioritize JSON over XML when both present', () => {
      const text = '{"key": "value"} and <root>text</root>';
      const output = extractStructuredOutput(text);
      
      expect(output?.type).toBe('json');
    });
  });

  describe('Real-world Examples', () => {
    it('should parse API response format', () => {
      const text = `The API returned: {
        "status": "success",
        "data": {
          "id": 123,
          "name": "Product",
          "price": 99.99
        }
      }`;
      const output = extractStructuredOutput(text);
      
      expect(output).not.toBeNull();
      expect(output?.type).toBe('json');
      expect(output?.isValid).toBe(true);
    });

    it('should parse structured data with special characters', () => {
      const text = '{"message": "Hello \\"World\\"", "emoji": "😀"}';
      const output = extractStructuredOutput(text);
      
      expect(output).not.toBeNull();
      expect(output?.type).toBe('json');
    });
  });
});


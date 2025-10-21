/**
 * Structured Output Detection and Parsing
 * 
 * Detects and parses JSON/XML structured outputs from AI responses
 * Based on patterns from LangChain, LlamaIndex, and Spring AI
 */

export interface StructuredOutput {
  type: 'json' | 'xml';
  raw: string;
  parsed: unknown;
  isValid: boolean;
  error?: string;
}

/**
 * Extract JSON/XML from markdown code blocks
 */
function extractFromMarkdownBlock(text: string): string | null {
  // Match markdown code blocks: ```json ... ``` or ```xml ... ``` or ``` ... ```
  const markdownBlockRegex = /```(?:json|xml|)?\s*\n([\s\S]*?)\n```/;
  const match = text.match(markdownBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

/**
 * Detect if text contains JSON structure
 */
function detectJSON(text: string): string | null {
  // First, try to extract from markdown code block
  const markdownContent = extractFromMarkdownBlock(text);
  if (markdownContent) {
    // Try to parse the markdown content as JSON
    try {
      JSON.parse(markdownContent);
      return markdownContent;
    } catch {
      // Not valid JSON in markdown block, continue
    }
  }

  // Then, look for raw JSON object or array
  let i = 0;
  while (i < text.length) {
    const char = text[i];

    if (char === '{' || char === '[') {
      const startChar = char;
      const endChar = char === '{' ? '}' : ']';
      let depth = 1;
      let j = i + 1;
      let inString = false;
      let escapeNext = false;

      // Find matching closing bracket
      while (j < text.length && depth > 0) {
        const c = text[j];

        if (escapeNext) {
          escapeNext = false;
          j++;
          continue;
        }

        if (c === '\\') {
          escapeNext = true;
          j++;
          continue;
        }

        if (c === '"' && !escapeNext) {
          inString = !inString;
        }

        if (!inString) {
          if (c === startChar) {
            depth++;
          } else if (c === endChar) {
            depth--;
          }
        }

        j++;
      }

      // If we found a complete JSON structure
      if (depth === 0) {
        return text.substring(i, j);
      }
    }

    i++;
  }

  return null;
}

/**
 * Detect if text contains XML structure
 */
function detectXML(text: string): { start: number; end: number } | null {
  // Look for XML tag patterns
  const xmlMatch = text.match(/<[^>]+>[\s\S]*?<\/[^>]+>/);
  
  if (xmlMatch) {
    return {
      start: text.indexOf(xmlMatch[0]),
      end: text.indexOf(xmlMatch[0]) + xmlMatch[0].length
    };
  }
  
  return null;
}

/**
 * Parse JSON safely
 */
function parseJSON(text: string): { parsed: unknown; isValid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(text);
    return { parsed, isValid: true };
  } catch (error) {
    return {
      parsed: null,
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Parse XML safely (basic parsing)
 */
function parseXML(text: string): { parsed: unknown; isValid: boolean; error?: string } {
  try {
    // Check if DOMParser is available (browser environment)
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        return {
          parsed: null,
          isValid: false,
          error: 'Invalid XML'
        };
      }

      // Convert XML to JSON-like structure
      const parsed = xmlToJson(xmlDoc.documentElement);
      return { parsed, isValid: true };
    } else {
      // Fallback: simple XML structure extraction for Node.js
      // Just return the raw XML as a string representation
      return {
        parsed: { raw: text },
        isValid: true
      };
    }
  } catch (error) {
    return {
      parsed: null,
      isValid: false,
      error: error instanceof Error ? error.message : 'XML parsing failed'
    };
  }
}

/**
 * Convert XML element to JSON-like object
 */
function xmlToJson(element: Element): unknown {
  const result: Record<string, unknown> = {};
  
  // Add attributes
  if (element.attributes.length > 0) {
    result['@attributes'] = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      (result['@attributes'] as Record<string, string>)[attr.name] = attr.value;
    }
  }
  
  // Add child elements
  const children: Record<string, unknown[]> = {};
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    const childJson = xmlToJson(child);
    
    if (!children[child.tagName]) {
      children[child.tagName] = [];
    }
    children[child.tagName].push(childJson);
  }
  
  // Add text content
  if (element.children.length === 0 && element.textContent?.trim()) {
    return element.textContent.trim();
  }
  
  Object.assign(result, children);
  return result;
}

/**
 * Extract structured output from text
 * Returns the first valid JSON or XML found
 */
export function extractStructuredOutput(text: string): StructuredOutput | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Try JSON first
  const jsonText = detectJSON(text);
  if (jsonText) {
    const { parsed, isValid, error } = parseJSON(jsonText);

    if (isValid) {
      return {
        type: 'json',
        raw: jsonText,
        parsed,
        isValid: true
      };
    } else {
      return {
        type: 'json',
        raw: jsonText,
        parsed,
        isValid: false,
        error
      };
    }
  }

  // Try XML
  const xmlMatch = detectXML(text);
  if (xmlMatch) {
    const xmlText = text.substring(xmlMatch.start, xmlMatch.end);
    const { parsed, isValid, error } = parseXML(xmlText);

    if (isValid) {
      return {
        type: 'xml',
        raw: xmlText,
        parsed,
        isValid: true
      };
    } else {
      return {
        type: 'xml',
        raw: xmlText,
        parsed,
        isValid: false,
        error
      };
    }
  }

  return null;
}

/**
 * Find all valid JSON objects/arrays in text
 */
function findAllJSON(text: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();

  // First, extract from markdown code blocks
  const markdownBlockRegex = /```(?:json|xml|)?\s*\n([\s\S]*?)\n```/g;
  let markdownMatch;
  while ((markdownMatch = markdownBlockRegex.exec(text)) !== null) {
    const content = markdownMatch[1].trim();
    // Try to parse as JSON
    try {
      JSON.parse(content);
      if (!seen.has(content)) {
        results.push(content);
        seen.add(content);
      }
    } catch {
      // Not valid JSON, skip
    }
  }

  // Then, look for raw JSON objects/arrays
  let i = 0;
  while (i < text.length) {
    const char = text[i];

    // Look for start of JSON object or array
    if (char === '{' || char === '[') {
      const startChar = char;
      const endChar = char === '{' ? '}' : ']';
      let depth = 1;
      let j = i + 1;
      let inString = false;
      let escapeNext = false;

      // Find matching closing bracket
      while (j < text.length && depth > 0) {
        const c = text[j];

        if (escapeNext) {
          escapeNext = false;
          j++;
          continue;
        }

        if (c === '\\') {
          escapeNext = true;
          j++;
          continue;
        }

        if (c === '"' && !escapeNext) {
          inString = !inString;
        }

        if (!inString) {
          if (c === startChar) {
            depth++;
          } else if (c === endChar) {
            depth--;
          }
        }

        j++;
      }

      // If we found a complete JSON structure
      if (depth === 0) {
        const jsonStr = text.substring(i, j);
        if (!seen.has(jsonStr)) {
          results.push(jsonStr);
          seen.add(jsonStr);
        }
        i = j;
        continue;
      }
    }

    i++;
  }

  return results;
}

/**
 * Extract all structured outputs from text
 */
export function extractAllStructuredOutputs(text: string): StructuredOutput[] {
  const outputs: StructuredOutput[] = [];

  if (!text || typeof text !== 'string') {
    return outputs;
  }

  // Find all JSON objects/arrays using bracket matching and markdown blocks
  const jsonStrings = findAllJSON(text);

  for (const jsonStr of jsonStrings) {
    const { parsed, isValid, error } = parseJSON(jsonStr);
    outputs.push({
      type: 'json',
      raw: jsonStr,
      parsed,
      isValid,
      error
    });
  }

  // Find all XML elements (from markdown blocks and raw XML)
  const xmlMarkdownRegex = /```(?:xml)\s*\n([\s\S]*?)\n```/g;
  let xmlMarkdownMatch;
  while ((xmlMarkdownMatch = xmlMarkdownRegex.exec(text)) !== null) {
    const xmlStr = xmlMarkdownMatch[1].trim();
    const { parsed, isValid, error } = parseXML(xmlStr);
    outputs.push({
      type: 'xml',
      raw: xmlStr,
      parsed,
      isValid,
      error
    });
  }

  // Find raw XML elements
  const xmlRegex = /<[^>]+>[\s\S]*?<\/[^>]+>/g;
  let xmlMatch;
  while ((xmlMatch = xmlRegex.exec(text)) !== null) {
    const { parsed, isValid, error } = parseXML(xmlMatch[0]);
    outputs.push({
      type: 'xml',
      raw: xmlMatch[0],
      parsed,
      isValid,
      error
    });
  }

  return outputs;
}

/**
 * Format structured output for display
 */
export function formatStructuredOutput(output: StructuredOutput): string {
  if (output.type === 'json') {
    return JSON.stringify(output.parsed, null, 2);
  } else {
    return output.raw;
  }
}


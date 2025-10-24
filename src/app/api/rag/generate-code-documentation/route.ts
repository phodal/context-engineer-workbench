/**
 * POST /api/rag/generate-code-documentation
 * Generate documentation for code nodes using LLM
 * Results are cached in RxDB to improve performance
 */

import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { NextRequest, NextResponse } from 'next/server';
import { saveDocumentation, getDocumentationById } from '@/lib/rag/code-documentation-store';
import crypto from 'crypto';

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

interface DocumentationRequest {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  code: string;
  language: string;
  relatedNodes?: string[];
}

/**
 * Generate a unique ID for documentation based on code content
 */
function generateDocumentationId(code: string, language: string): string {
  const hash = crypto.createHash('sha256').update(`${code}:${language}`).digest('hex');
  return `doc_${hash.substring(0, 16)}`;
}

/**
 * Generate documentation prompt based on node type
 */
function buildDocumentationPrompt(
  nodeLabel: string,
  nodeType: string,
  code: string,
  language: string
): string {
  const typeDescriptions: Record<string, string> = {
    class: 'a class definition',
    function: 'a function definition',
    method: 'a method definition',
    interface: 'an interface definition',
    type: 'a type definition',
    enum: 'an enum definition',
  };

  const typeDesc = typeDescriptions[nodeType] || 'a code element';

  return `Analyze the following ${typeDesc} in ${language} and generate comprehensive documentation.

Code:
\`\`\`${language}
${code}
\`\`\`

Please provide a JSON response with the following structure:
{
  "summary": "A brief one-line summary of what this ${nodeType} does",
  "documentation": "Detailed documentation explaining the purpose, behavior, and usage",
  "parameters": [
    {
      "name": "parameter name",
      "type": "parameter type",
      "description": "parameter description"
    }
  ],
  "returnType": "return type if applicable",
  "returnDescription": "description of what is returned",
  "examples": [
    "Example usage code snippet 1",
    "Example usage code snippet 2"
  ],
  "notes": "Any important notes or caveats"
}

Focus on:
1. Clear, concise explanations
2. Practical examples
3. Important edge cases or limitations
4. Best practices for using this ${nodeType}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DocumentationRequest;
    const { nodeId, nodeLabel, nodeType, code, language, relatedNodes = [] } = body;

    if (!nodeId || !nodeLabel || !nodeType || !code || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: nodeId, nodeLabel, nodeType, code, language' },
        { status: 400 }
      );
    }

    // Generate documentation ID
    const docId = generateDocumentationId(code, language);

    // Check if documentation already exists in cache
    const cached = await getDocumentationById(docId);
    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        documentation: cached,
        timestamp: Date.now(),
      });
    }

    // Generate documentation using LLM
    const prompt = buildDocumentationPrompt(nodeLabel, nodeType, code, language);

    const { text, usage } = await generateText({
      model: deepseek('deepseek-chat'),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    // Parse the response
    let parsedDoc;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedDoc = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError);
      parsedDoc = {
        summary: nodeLabel,
        documentation: text,
        examples: [],
      };
    }

    // Create documentation object
    const documentation = {
      id: docId,
      nodeId,
      nodeLabel,
      nodeType,
      code,
      language,
      documentation: parsedDoc.documentation || text,
      summary: parsedDoc.summary || nodeLabel,
      parameters: parsedDoc.parameters || [],
      returnType: parsedDoc.returnType,
      returnDescription: parsedDoc.returnDescription,
      examples: parsedDoc.examples || [],
      relatedNodes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      llmModel: 'deepseek-chat',
      tokensUsed: usage?.totalTokens || 0,
    };

    // Save to RxDB cache
    await saveDocumentation(documentation);

    return NextResponse.json({
      success: true,
      cached: false,
      documentation,
      usage,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Documentation generation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { NextRequest, NextResponse } from 'next/server';

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

interface CandidateDocument {
  id: string;
  title: string;
  content: string;
}

/**
 * POST /api/rag/generate-candidates
 * Generate candidate documents related to the query using AI
 * These candidates will be used for vector embedding and similarity search
 */
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Use AI to generate candidate documents related to the query
    const result = await streamText({
      model: deepseek('deepseek-chat'),
      messages: [
        {
          role: 'user',
          content: `Generate 5 candidate documents related to the query: "${query}"

Each document should be a realistic paragraph (3-4 sentences) that could be relevant to the query.
Format your response as a JSON array with this structure:
[
  {
    "title": "Document Title",
    "content": "Document content here..."
  },
  ...
]

Make sure the documents are diverse and cover different aspects of the query topic.`,
        },
      ],
      temperature: 0.7,
    });

    // Get the full text response
    const fullText = await result.text;

    // Parse the JSON response
    const jsonMatch = fullText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse candidate documents response');
    }

    interface ParsedDocument {
      title: string;
      content: string;
    }

    const documents: ParsedDocument[] = JSON.parse(jsonMatch[0]);

    // Add IDs to documents
    const candidateDocuments: CandidateDocument[] = documents.map((doc, idx) => ({
      id: `candidate-${idx}`,
      title: doc.title,
      content: doc.content,
    }));

    return NextResponse.json({
      success: true,
      query,
      candidates: candidateDocuments,
      count: candidateDocuments.length,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Generate candidates error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

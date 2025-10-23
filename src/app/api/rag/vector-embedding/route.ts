import { NextRequest, NextResponse } from 'next/server';
import { generateSingleEmbedding } from '@/lib/rag/batch-embedding-generator';

/**
 * POST /api/rag/vector-embedding
 * Generate vector embedding for text using GLM embedding-3 model
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Generate embedding using batch generator
    const embedding = await generateSingleEmbedding(text);

    return NextResponse.json({
      success: true,
      text,
      embedding,
      model: 'embedding-3',
      timestamp: Date.now(),
      usage: {
        promptTokens: Math.ceil(text.length / 4),
        totalTokens: Math.ceil(text.length / 4),
      },
    });
  } catch (error) {
    console.error('Vector embedding error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

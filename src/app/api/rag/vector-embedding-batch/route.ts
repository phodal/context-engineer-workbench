import { NextRequest, NextResponse } from 'next/server';
import { generateBatchEmbeddings } from '@/lib/rag/batch-embedding-generator';

/**
 * POST /api/rag/vector-embedding-batch
 * Generate embeddings for multiple texts using GLM API
 */
export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json();

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'texts array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Generate embeddings for all texts
    const embeddingResults = await generateBatchEmbeddings(texts);

    // Extract just the embeddings
    const embeddings = embeddingResults.map(result => result.embedding);

    return NextResponse.json({
      success: true,
      count: embeddings.length,
      embeddings,
      model: 'embedding-3',
      timestamp: Date.now(),
      usage: {
        promptTokens: texts.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0),
      },
    });
  } catch (error) {
    console.error('Batch embedding error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


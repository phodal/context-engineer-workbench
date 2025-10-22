import { NextRequest, NextResponse } from 'next/server';
import { initializeVectorStore, vectorSearch } from '@/lib/rag/vector-store';

/**
 * POST /api/rag/vector-search
 * Perform vector search using cosine similarity
 */
export async function POST(request: NextRequest) {
  try {
    const { embedding, topK = 5 } = await request.json();

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json(
        { error: 'Embedding parameter is required and must be an array' },
        { status: 400 }
      );
    }

    // Ensure vector store is initialized
    await initializeVectorStore();

    // Perform vector search
    const results = await vectorSearch(embedding, topK);

    // Transform results to include similarity scores
    const searchResults = results.map((doc, index) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      score: calculateSimilarity(embedding, doc.embedding),
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      resultCount: searchResults.length,
      results: searchResults,
      topK,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Vector search error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}


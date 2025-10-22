import { NextResponse } from 'next/server';
import { initializeVectorStore, getVectorStore } from '@/lib/rag/vector-store';
import { generateMockDocuments } from '@/lib/rag/mock-data-generator';
import { generateBatchEmbeddings } from '@/lib/rag/batch-embedding-generator';

let initialized = false;

/**
 * POST /api/rag/vector-store-init
 * Initialize the vector store with sample documents and their embeddings
 */
export async function POST() {
  try {
    if (!initialized) {
      // Generate mock documents
      const mockDocs = generateMockDocuments();

      // Extract texts for embedding generation
      const texts = mockDocs.map(doc => doc.content);

      // Generate embeddings using GLM API
      const embeddingResults = await generateBatchEmbeddings(texts);

      // Combine documents with their embeddings
      const docsWithEmbeddings = mockDocs.map((doc, index) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        embedding: embeddingResults[index]?.embedding || [],
        createdAt: Date.now(),
      }));

      // Initialize vector store with documents and embeddings
      await initializeVectorStore(docsWithEmbeddings);
      initialized = true;
    }

    return NextResponse.json({
      success: true,
      message: 'Vector store initialized successfully with GLM embeddings',
      initialized: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Vector store initialization error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rag/vector-store-init
 * Check if vector store is initialized
 */
export async function GET() {
  try {
    const store = getVectorStore();

    return NextResponse.json({
      success: true,
      initialized: store !== null,
      message: store ? 'Vector store is initialized' : 'Vector store is not initialized',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Vector store status error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


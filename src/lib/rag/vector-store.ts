import { createRxDatabase, RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';

interface VectorDocument {
  id: string;
  title: string;
  content: string;
  embedding: number[];
  createdAt: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface VectorCollectionMethods {
  // Add custom methods if needed
}

type VectorCollection = RxCollection<VectorDocument, VectorCollectionMethods>;

interface VectorDatabaseCollections {
  vectors: VectorCollection;
}

let db: RxDatabase<VectorDatabaseCollections> | null = null;

/**
 * Initialize RXDB vector store
 */
export async function initializeVectorStore(docsWithEmbeddings?: VectorDocument[]) {
  if (db) {
    return db;
  }

  try {
    // Create database with memory storage
    db = await createRxDatabase<VectorDatabaseCollections>({
      name: 'vector_store',
      storage: getRxStorageMemory(),
    });

    // Create vectors collection
    await db.addCollections({
      vectors: {
        schema: {
          version: 0,
          type: 'object',
          primaryKey: 'id',
          properties: {
            id: {
              type: 'string',
              maxLength: 100,
            },
            title: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            embedding: {
              type: 'array',
              items: {
                type: 'number',
              },
            },
            createdAt: {
              type: 'number',
            },
          },
          required: ['id', 'title', 'content', 'embedding', 'createdAt'],
        },
      },
    });

    // Add sample documents with embeddings if provided
    if (docsWithEmbeddings && docsWithEmbeddings.length > 0) {
      await addSampleDocuments(docsWithEmbeddings);
    }

    return db;
  } catch (error) {
    console.error('Failed to initialize vector store:', error);
    throw error;
  }
}

/**
 * Add sample documents to the vector store
 * Note: This function will be called with pre-generated embeddings from GLM API
 */
async function addSampleDocuments(docsWithEmbeddings: VectorDocument[]) {
  if (!db) return;

  const collection = db.collections.vectors;

  for (const doc of docsWithEmbeddings) {
    try {
      await collection.insert(doc);
    } catch (error) {
      // Document might already exist
      console.log(`Document ${doc.id} already exists or error:`, error);
    }
  }
}



/**
 * Search for similar documents using cosine similarity
 */
export async function vectorSearch(
  queryEmbedding: number[],
  topK: number = 5
): Promise<VectorDocument[]> {
  if (!db) {
    throw new Error('Vector store not initialized');
  }

  const collection = db.collections.vectors;
  const allDocs = await collection.find().exec();

  // Calculate similarity scores
  const scored = allDocs.map(doc => ({
    doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  // Sort by score and return top K
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.doc);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
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

/**
 * Get database instance
 */
export function getVectorStore(): RxDatabase<VectorDatabaseCollections> | null {
  return db;
}


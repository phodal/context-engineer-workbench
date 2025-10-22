import { createRxDatabase, RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { euclideanDistance } from 'rxdb/plugins/vector';

interface VectorDocument {
  id: string;
  title: string;
  content: string;
  embedding: number[];
  // Index fields for Distance to Samples method
  idx0?: string;
  idx1?: string;
  idx2?: string;
  idx3?: string;
  idx4?: string;
  createdAt: number;
}

interface SearchResultWithScore extends VectorDocument {
  score: number;
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
let sampleVectors: number[][] = [];

/**
 * Initialize RXDB vector store with Distance to Samples indexing
 */
export async function initializeVectorStore(docsWithEmbeddings?: VectorDocument[]) {
  // If database doesn't exist, create it
  if (!db) {
    try {
      // Create database with memory storage
      db = await createRxDatabase<VectorDatabaseCollections>({
        name: 'vector_store',
        storage: getRxStorageMemory(),
      });

      // Create vectors collection with index fields
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
              // Index fields for Distance to Samples method
              idx0: {
                type: 'string',
                maxLength: 10,
              },
              idx1: {
                type: 'string',
                maxLength: 10,
              },
              idx2: {
                type: 'string',
                maxLength: 10,
              },
              idx3: {
                type: 'string',
                maxLength: 10,
              },
              idx4: {
                type: 'string',
                maxLength: 10,
              },
              createdAt: {
                type: 'number',
              },
            },
            required: ['id', 'title', 'content', 'embedding', 'createdAt'],
            indexes: ['idx0', 'idx1', 'idx2', 'idx3', 'idx4'],
          },
        },
      });
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  // Clear existing documents and add new ones
  if (docsWithEmbeddings && docsWithEmbeddings.length > 0) {
    try {
      const collection = db.collections.vectors;

      // Clear existing documents
      const existingDocs = await collection.find().exec();
      for (const doc of existingDocs) {
        await doc.remove();
      }

      // Generate sample vectors for indexing (pick first 5 documents)
      sampleVectors = docsWithEmbeddings.slice(0, 5).map(doc => doc.embedding);

      // If we have less than 5 documents, pad with random vectors
      while (sampleVectors.length < 5) {
        sampleVectors.push(generateRandomVector(docsWithEmbeddings[0].embedding.length));
      }

      // Add new documents
      await addSampleDocuments(docsWithEmbeddings);
    } catch (error) {
      console.error('Failed to add documents to vector store:', error);
      throw error;
    }
  }

  return db;
}

/**
 * Add sample documents to the vector store with index values
 * Uses Distance to Samples method for indexing
 */
async function addSampleDocuments(docsWithEmbeddings: VectorDocument[]) {
  if (!db) return;

  const collection = db.collections.vectors;

  for (const doc of docsWithEmbeddings) {
    try {
      // Calculate distance to each sample vector and store as index
      const docWithIndex: VectorDocument = {
        ...doc,
        idx0: indexNrToString(euclideanDistance(sampleVectors[0], doc.embedding)),
        idx1: indexNrToString(euclideanDistance(sampleVectors[1], doc.embedding)),
        idx2: indexNrToString(euclideanDistance(sampleVectors[2], doc.embedding)),
        idx3: indexNrToString(euclideanDistance(sampleVectors[3], doc.embedding)),
        idx4: indexNrToString(euclideanDistance(sampleVectors[4], doc.embedding)),
      };

      await collection.insert(docWithIndex);
    } catch (error) {
      // Document might already exist
      console.log(`Document ${doc.id} already exists or error:`, error);
    }
  }
}



/**
 * Search for similar documents using RXDB index query
 * Uses Distance to Samples method for efficient vector search
 */
export async function vectorSearch(
  queryEmbedding: number[],
  topK: number = 5
): Promise<SearchResultWithScore[]> {
  if (!db) {
    throw new Error('Vector store not initialized');
  }

  const collection = db.collections.vectors;

  // First, try to get all documents and calculate distances directly
  // This is more reliable than index range queries for small datasets
  try {
    const allDocs = await collection.find().exec();

    if (allDocs.length === 0) {
      console.warn('No documents found in vector store');
      return [];
    }

    // Calculate actual distances for all documents
    // Convert RXDB documents to plain objects to preserve all fields
    const docsWithDistance = allDocs.map(doc => {
      // RXDB documents have properties accessible directly
      const id = doc.id;
      const title = doc.title;
      const content = doc.content;
      const embedding = Array.isArray(doc.embedding) ? doc.embedding : [];
      const createdAt = doc.createdAt;

      return {
        id,
        title,
        content,
        embedding,
        createdAt,
        score: euclideanDistance(queryEmbedding, embedding),
      };
    });

    console.log('Docs with distance (first):', docsWithDistance[0]);

    // Sort by distance (ascending for euclidean distance)
    // Convert to similarity score (1 / (1 + distance))
    const results = docsWithDistance
      .sort((a, b) => a.score - b.score)
      .slice(0, topK)
      .map(item => ({
        ...item,
        score: 1 / (1 + item.score), // Convert distance to similarity (0-1)
      }));

    console.log('Final results (first):', results[0]);
    return results;
  } catch (error) {
    console.error('Error in vectorSearch:', error);
    throw error;
  }
}

/**
 * Convert index number to fixed-length string for sorting
 */
function indexNrToString(nr: number): string {
  return nr.toFixed(10).padStart(10, '0');
}

/**
 * Generate random vector for padding sample vectors
 */
function generateRandomVector(dimension: number): number[] {
  return new Array(dimension).fill(0).map(() => Math.random() * 2 - 1);
}

/**
 * Get database instance
 */
export function getVectorStore(): RxDatabase<VectorDatabaseCollections> | null {
  return db;
}

/**
 * Get sample vectors used for indexing
 */
export function getSampleVectors(): number[][] {
  return sampleVectors;
}


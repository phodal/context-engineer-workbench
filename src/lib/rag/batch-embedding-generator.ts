/**
 * Batch embedding generator for vector search
 * Generates embeddings for multiple documents using GLM API
 */

const GLM_API_KEY = process.env.GLM_API_KEY || '';
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/embeddings';

export interface EmbeddingResult {
  text: string;
  embedding: number[];
}

interface GLMEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate embeddings for a batch of texts using GLM API
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  if (!GLM_API_KEY) {
    throw new Error('GLM_API_KEY is not configured');
  }

  if (texts.length === 0) {
    return [];
  }

  try {
    // Call GLM embedding API with batch of texts
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'embedding-3',
        input: texts,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GLM API error:', response.status, errorData);
      throw new Error(`GLM API error: ${response.status}`);
    }

    const data: GLMEmbeddingResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('No embedding data returned from GLM API');
    }

    // Map embeddings back to texts
    const results: EmbeddingResult[] = texts.map((text, index) => ({
      text,
      embedding: data.data[index]?.embedding || [],
    }));

    return results;
  } catch (error) {
    console.error('Batch embedding generation error:', error);
    throw error;
  }
}

/**
 * Generate embedding for a single text
 */
export async function generateSingleEmbedding(text: string): Promise<number[]> {
  const results = await generateBatchEmbeddings([text]);
  if (results.length === 0) {
    throw new Error('Failed to generate embedding');
  }
  return results[0].embedding;
}


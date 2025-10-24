/**
 * Code Documentation Store - In-memory cache for LLM-generated code documentation
 * Caches LLM results to improve performance and reduce API calls
 */

export interface CodeDocumentation {
  id: string; // Unique identifier (hash of code + language)
  nodeId: string; // Graph node ID
  nodeLabel: string; // Node name (class/function name)
  nodeType: string; // Type: 'class', 'function', 'method', etc.
  code: string; // Source code snippet
  language: string; // Programming language
  documentation: string; // LLM-generated documentation
  summary: string; // Brief summary
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  returnType?: string;
  returnDescription?: string;
  examples?: string[];
  relatedNodes?: string[]; // IDs of related nodes
  createdAt: number;
  updatedAt: number;
  llmModel?: string; // Which LLM model was used
  tokensUsed?: number; // Token count for cost tracking
}

// In-memory cache for storing documentation
const documentationCache = new Map<string, CodeDocumentation>();

/**
 * Save documentation to cache
 */
export async function saveDocumentation(doc: CodeDocumentation): Promise<void> {
  try {
    documentationCache.set(doc.id, doc);
  } catch (error) {
    console.error('Failed to save documentation:', error);
    throw error;
  }
}

/**
 * Get documentation by node ID
 */
export async function getDocumentationByNodeId(nodeId: string): Promise<CodeDocumentation | null> {
  try {
    for (const doc of documentationCache.values()) {
      if (doc.nodeId === nodeId) {
        return doc;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get documentation:', error);
    return null;
  }
}

/**
 * Get documentation by ID
 */
export async function getDocumentationById(id: string): Promise<CodeDocumentation | null> {
  try {
    const doc = documentationCache.get(id);
    return doc || null;
  } catch (error) {
    console.error('Failed to get documentation by ID:', error);
    return null;
  }
}

/**
 * Get all documentation for a language
 */
export async function getDocumentationByLanguage(language: string): Promise<CodeDocumentation[]> {
  try {
    const docs: CodeDocumentation[] = [];
    for (const doc of documentationCache.values()) {
      if (doc.language === language) {
        docs.push(doc);
      }
    }
    return docs;
  } catch (error) {
    console.error('Failed to get documentation by language:', error);
    return [];
  }
}

/**
 * Delete documentation by ID
 */
export async function deleteDocumentation(id: string): Promise<void> {
  try {
    documentationCache.delete(id);
  } catch (error) {
    console.error('Failed to delete documentation:', error);
    throw error;
  }
}

/**
 * Clear all documentation
 */
export async function clearAllDocumentation(): Promise<void> {
  try {
    documentationCache.clear();
  } catch (error) {
    console.error('Failed to clear documentation:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalDocuments: number;
  languages: string[];
  totalTokensUsed: number;
}> {
  try {
    const languages = new Set<string>();
    let totalTokensUsed = 0;

    for (const doc of documentationCache.values()) {
      languages.add(doc.language);
      totalTokensUsed += doc.tokensUsed || 0;
    }

    return {
      totalDocuments: documentationCache.size,
      languages: Array.from(languages),
      totalTokensUsed,
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      totalDocuments: 0,
      languages: [],
      totalTokensUsed: 0,
    };
  }
}

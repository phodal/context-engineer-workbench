import { LangChainRAGRetriever, createRAGFromMarkdown } from '../langchain-rag-retriever';
import { DocumentProcessor } from '../document-loader';

describe('LangChain RAG Retriever', () => {
  let retriever: LangChainRAGRetriever;

  beforeEach(() => {
    retriever = new LangChainRAGRetriever(2);
  });

  test('should add documents and retrieve them', async () => {
    const documents = [
      {
        content: 'TypeScript is a programming language that builds on JavaScript.',
        metadata: { source: 'docs', title: 'TypeScript Intro' },
      },
      {
        content: 'JavaScript is a versatile language used for web development.',
        metadata: { source: 'docs', title: 'JavaScript Intro' },
      },
    ];

    await retriever.addDocuments(documents);
    const stats = retriever.getStats();

    expect(stats.documentCount).toBe(2);
    expect(stats.chunkCount).toBeGreaterThan(0);
  });

  test('should retrieve relevant documents', async () => {
    const documents = [
      {
        content: 'TypeScript adds static typing to JavaScript.',
        metadata: { source: 'docs', title: 'TypeScript' },
      },
      {
        content: 'React is a JavaScript library for building UIs.',
        metadata: { source: 'docs', title: 'React' },
      },
      {
        content: 'Python is used for data science and machine learning.',
        metadata: { source: 'docs', title: 'Python' },
      },
    ];

    await retriever.addDocuments(documents);
    const results = await retriever.invoke('TypeScript');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].pageContent).toContain('TypeScript');
  });

  test('should include metadata in results', async () => {
    const documents = [
      {
        content: 'LangChain is a framework for developing applications with LLMs.',
        metadata: { source: 'docs', title: 'LangChain', url: 'https://langchain.com' },
      },
    ];

    await retriever.addDocuments(documents);
    const results = await retriever.invoke('LangChain');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].metadata).toHaveProperty('source');
    expect(results[0].metadata).toHaveProperty('score');
    expect(results[0].metadata).toHaveProperty('rank');
  });

  test('should handle markdown documents', async () => {
    const markdownDocs = [
      {
        content: '# TypeScript Guide\n\nTypeScript is a typed superset of JavaScript.',
        source: 'typescript-guide',
        title: 'TypeScript Guide',
      },
      {
        content: '# JavaScript Basics\n\nJavaScript is the language of the web.',
        source: 'js-basics',
        title: 'JavaScript Basics',
      },
    ];

    const ragRetriever = await createRAGFromMarkdown(markdownDocs, 2);
    const results = await ragRetriever.invoke('TypeScript');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].pageContent).toContain('TypeScript');
  });

  test('should respect topK parameter', async () => {
    const documents = [
      {
        content: 'Document 1 about TypeScript',
        metadata: { source: 'docs', title: 'Doc1' },
      },
      {
        content: 'Document 2 about TypeScript',
        metadata: { source: 'docs', title: 'Doc2' },
      },
      {
        content: 'Document 3 about TypeScript',
        metadata: { source: 'docs', title: 'Doc3' },
      },
    ];

    const topKRetriever = new LangChainRAGRetriever(1);
    await topKRetriever.addDocuments(documents);
    const results = await topKRetriever.invoke('TypeScript');

    expect(results.length).toBeLessThanOrEqual(1);
  });

  test('should clear documents', async () => {
    const documents = [
      {
        content: 'Test document',
        metadata: { source: 'docs', title: 'Test' },
      },
    ];

    await retriever.addDocuments(documents);
    let stats = retriever.getStats();
    expect(stats.chunkCount).toBeGreaterThan(0);

    retriever.clear();
    stats = retriever.getStats();
    expect(stats.documentCount).toBe(0);
    expect(stats.chunkCount).toBe(0);
  });

  test('should process documents with DocumentProcessor', async () => {
    const processor = new DocumentProcessor(500, 100);
    const documents = [
      {
        content: 'This is a long document. '.repeat(50),
        metadata: { source: 'docs', title: 'Long Doc' },
      },
    ];

    const chunks = await processor.processDocuments(documents);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].metadata.chunkIndex).toBe(0);
  });

  test('should handle empty queries gracefully', async () => {
    const documents = [
      {
        content: 'Sample document content',
        metadata: { source: 'docs', title: 'Sample' },
      },
    ];

    await retriever.addDocuments(documents);
    const results = await retriever.invoke('');

    expect(Array.isArray(results)).toBe(true);
  });
});

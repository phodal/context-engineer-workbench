/* eslint-disable @next/next/no-assign-module-variable */
import { BM25RetrieverAdapter } from "../retriever-to-langchain";
import { BM25Retriever } from "../../rag/bm25-retriever";
import { Document } from "@langchain/core/documents";

describe("BM25RetrieverAdapter", () => {
  let adapter: BM25RetrieverAdapter;
  let bm25Retriever: BM25Retriever;

  beforeEach(() => {
    bm25Retriever = new BM25Retriever();

    // 添加测试文档
    bm25Retriever.addDocuments([
      {
        id: "doc1",
        content: "TypeScript is a programming language",
        metadata: { source: "test" },
      },
      {
        id: "doc2",
        content: "JavaScript runs in the browser",
        metadata: { source: "test" },
      },
      {
        id: "doc3",
        content: "Python is used for data science",
        metadata: { source: "test" },
      },
    ]);

    adapter = new BM25RetrieverAdapter(bm25Retriever, 2);
  });

  it("should adapt BM25Retriever to LangChain Retriever", () => {
    expect(adapter).toBeDefined();
    expect(adapter.lc_namespace).toEqual(["context_engineer", "retrievers"]);
  });

  it("should retrieve documents as LangChain Document objects", async () => {
    const documents = await adapter.invoke("TypeScript");

    expect(documents).toBeInstanceOf(Array);
    expect(documents.length).toBeGreaterThan(0);
    expect(documents[0]).toBeInstanceOf(Document);
    expect(documents[0].pageContent).toBeDefined();
    expect(documents[0].metadata).toBeDefined();
  });

  it("should include score and rank in metadata", async () => {
    const documents = await adapter.invoke("JavaScript");

    expect(documents.length).toBeGreaterThan(0);
    const firstDoc = documents[0];
    expect(firstDoc.metadata.score).toBeDefined();
    expect(firstDoc.metadata.rank).toBeDefined();
    expect(typeof firstDoc.metadata.score).toBe("number");
    expect(typeof firstDoc.metadata.rank).toBe("number");
  });

  it("should respect topK parameter", async () => {
    const documents = await adapter.invoke("programming");

    expect(documents.length).toBeLessThanOrEqual(2);
  });

  it("should get original retriever", () => {
    const originalRetriever = adapter.getOriginalRetriever();
    expect(originalRetriever).toBe(bm25Retriever);
  });

  it("should retrieve with scores", async () => {
    const result = await adapter.retrieveWithScores("TypeScript");

    expect(result).toBeDefined();
    expect(result.chunks).toBeInstanceOf(Array);
    expect(result.chunks[0].score).toBeDefined();
    expect(result.chunks[0].rank).toBeDefined();
  });

  it("should work with invoke method", async () => {
    const documents = await adapter.invoke("JavaScript");

    expect(documents).toBeInstanceOf(Array);
    expect(documents.length).toBeGreaterThan(0);
    expect(documents[0]).toBeInstanceOf(Document);
  });
});


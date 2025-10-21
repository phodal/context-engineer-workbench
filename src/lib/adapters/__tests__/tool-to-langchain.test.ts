/* eslint-disable @next/next/no-assign-module-variable */
import { ToolToLangChainAdapter } from "../tool-to-langchain";
import { KeywordSearchTool } from "../../tools/keyword-search-tool";
import { RAGModule } from "../../rag/rag-module";

describe("ToolToLangChainAdapter", () => {
  let adapter: ToolToLangChainAdapter;
  let keywordSearchTool: KeywordSearchTool;
  let ragModule: RAGModule;

  beforeEach(() => {
    ragModule = new RAGModule();
    ragModule.addDocuments([
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
    ]);

    keywordSearchTool = new KeywordSearchTool();
    keywordSearchTool.addDocuments([
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
    ]);
    adapter = new ToolToLangChainAdapter(keywordSearchTool);
  });

  it("should adapt our tool to LangChain tool", () => {
    expect(adapter.lc_namespace).toBeDefined();
    expect(adapter.schema).toBeDefined();
  });

  it("should execute tool through adapter", async () => {
    const result = await adapter.invoke({
      query: "TypeScript",
      topK: 3,
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");

    const parsed = JSON.parse(result);
    expect(parsed).toBeDefined();
  });

  it("should handle JSON string input", async () => {
    const result = await adapter._call(
      JSON.stringify({
        query: "JavaScript",
        topK: 2,
      })
    );

    expect(result).toBeDefined();
    const parsed = JSON.parse(result);
    expect(parsed).toBeDefined();
  });

  it("should get original tool", () => {
    const originalTool = adapter.getOriginalTool();
    expect(originalTool).toBe(keywordSearchTool);
  });

  it("should execute with metadata", async () => {
    const result = await adapter.executeWithMetadata({
      query: "TypeScript",
      topK: 3,
    });

    expect(result.success).toBe(true);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
  });

  it("should handle errors gracefully", async () => {
    const result = await adapter._call("invalid json");
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBeDefined();
  });
});


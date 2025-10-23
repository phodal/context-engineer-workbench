/**
 * Graph Builder Tests
 * Tests for code graph construction using TreeSitter and Graphology
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from '@jest/globals';
import {
  buildCodeGraph,
  colorizeGraph,
  calculateNodeSizesInGraph,
  graphToD3Data,
  NodeAttributes,
  EdgeAttributes,
} from '@/lib/graph-builder';

describe('Graph Builder', () => {
  describe('buildCodeGraph', () => {
    it('should build a graph from JavaScript code', async () => {
      const code = `
        function greet(name) {
          return "Hello, " + name;
        }
        
        class User {
          constructor(name) {
            this.name = name;
          }
          
          sayHello() {
            return greet(this.name);
          }
        }
      `;

      const graph = await buildCodeGraph(code, 'javascript');

      expect(graph).toBeDefined();
      expect(graph.nodes().length).toBeGreaterThan(0);
    });

    it('should extract function definitions', async () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
        
        function multiply(a, b) {
          return a * b;
        }
      `;

      const graph = await buildCodeGraph(code, 'javascript');
      const nodes = graph.nodes();

      expect(nodes.length).toBeGreaterThanOrEqual(2);
      expect(nodes.some((n) => graph.getNodeAttributes(n).label.includes('add'))).toBe(true);
      expect(nodes.some((n) => graph.getNodeAttributes(n).label.includes('multiply'))).toBe(true);
    });

    it('should extract class definitions', async () => {
      const code = `
        class Animal {
          speak() {
            console.log("sound");
          }
        }
        
        class Dog extends Animal {
          bark() {
            console.log("woof");
          }
        }
      `;

      const graph = await buildCodeGraph(code, 'javascript');
      const nodes = graph.nodes();

      expect(nodes.length).toBeGreaterThanOrEqual(2);
      expect(nodes.some((n) => graph.getNodeAttributes(n).label.includes('Animal'))).toBe(true);
      expect(nodes.some((n) => graph.getNodeAttributes(n).label.includes('Dog'))).toBe(true);
    });

    it('should handle empty code', async () => {
      const code = '';
      const graph = await buildCodeGraph(code, 'javascript');

      expect(graph).toBeDefined();
      expect(graph.nodes().length).toBe(0);
    });
  });

  describe('colorizeGraph', () => {
    it('should assign colors to nodes based on type', async () => {
      const code = `
        function test() {}
        class TestClass {}
      `;

      const graph = await buildCodeGraph(code, 'javascript');
      colorizeGraph(graph);

      const nodes = graph.nodes();
      nodes.forEach((nodeId) => {
        const attrs = graph.getNodeAttributes(nodeId);
        expect(attrs.color).toBeDefined();
        expect(typeof attrs.color).toBe('string');
      });
    });

    it('should use default color for unknown types', async () => {
      const code = `function test() {}`;
      const graph = await buildCodeGraph(code, 'javascript');
      colorizeGraph(graph);

      const nodes = graph.nodes();
      nodes.forEach((nodeId) => {
        const attrs = graph.getNodeAttributes(nodeId);
        expect(attrs.color).toBeDefined();
      });
    });
  });

  describe('calculateNodeSizesInGraph', () => {
    it('should calculate node sizes based on degree', async () => {
      const code = `
        function a() {}
        function b() {}
        function c() {}
      `;

      const graph = await buildCodeGraph(code, 'javascript');
      calculateNodeSizesInGraph(graph);

      const nodes = graph.nodes();
      nodes.forEach((nodeId) => {
        const attrs = graph.getNodeAttributes(nodeId);
        expect(attrs.size).toBeDefined();
        expect(typeof attrs.size).toBe('number');
        expect(attrs.size).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe('graphToD3Data', () => {
    it('should convert graph to D3 data format', async () => {
      const code = `
        function greet(name) {
          return "Hello, " + name;
        }
      `;

      const graph = await buildCodeGraph(code, 'javascript');
      colorizeGraph(graph);
      calculateNodeSizesInGraph(graph);

      const d3Data = graphToD3Data(graph, 'javascript');

      expect(d3Data).toBeDefined();
      expect(d3Data.nodes).toBeDefined();
      expect(Array.isArray(d3Data.nodes)).toBe(true);
      expect(d3Data.edges).toBeDefined();
      expect(Array.isArray(d3Data.edges)).toBe(true);
      expect(d3Data.metadata).toBeDefined();
      expect(d3Data.metadata.language).toBe('javascript');
      expect(d3Data.metadata.totalNodes).toBeGreaterThanOrEqual(0);
      expect(d3Data.metadata.totalEdges).toBeGreaterThanOrEqual(0);
    });

    it('should include node attributes in D3 data', async () => {
      const code = `function test() {}`;
      const graph = await buildCodeGraph(code, 'javascript');
      colorizeGraph(graph);
      calculateNodeSizesInGraph(graph);

      const d3Data = graphToD3Data(graph, 'javascript');

      d3Data.nodes.forEach((node) => {
        expect(node.id).toBeDefined();
        expect(node.label).toBeDefined();
        expect(node.type).toBeDefined();
        expect(node.color).toBeDefined();
        expect(node.size).toBeDefined();
      });
    });

    it('should include edge attributes in D3 data', async () => {
      const code = `
        function a() {}
        function b() { a(); }
      `;

      const graph = await buildCodeGraph(code, 'javascript');
      const d3Data = graphToD3Data(graph, 'javascript');

      d3Data.edges.forEach((edge) => {
        expect(edge.source).toBeDefined();
        expect(edge.target).toBeDefined();
        expect(edge.type).toBeDefined();
      });
    });
  });

  describe('TypeScript support', () => {
    it('should handle TypeScript code', async () => {
      const code = `
        interface User {
          name: string;
          email: string;
        }
        
        class UserManager {
          getUser(id: number): User {
            return { name: 'John', email: 'john@example.com' };
          }
        }
      `;

      const graph = await buildCodeGraph(code, 'typescript');

      expect(graph).toBeDefined();
      expect(graph.nodes().length).toBeGreaterThan(0);
    });
  });

  describe('Python support', () => {
    it('should handle Python code', async () => {
      const code = `
        def greet(name):
            return f"Hello, {name}"
        
        class User:
            def __init__(self, name):
                self.name = name
            
            def say_hello(self):
                return greet(self.name)
      `;

      const graph = await buildCodeGraph(code, 'python');

      expect(graph).toBeDefined();
      expect(graph.nodes().length).toBeGreaterThan(0);
    });
  });
});

'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData } from '@/lib/graph-builder';
import { HierarchicalNode, graphDataToHierarchy } from '@/lib/hierarchical-graph';

interface D3GraphVisualizationProps {
  data: GraphData | null;
  isLoading?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onSingleClick?: (event: MouseEvent, node: any) => void;
  onDoubleClick?: (event: MouseEvent, node: any) => void;
}

interface D3Node extends d3.HierarchyRectangularNode<HierarchicalNode> {
  target?: {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  };
}

/**
 * D3.js Zoomable Icicle visualization component
 * Renders hierarchical code structure with interactive zoom and drill-down
 */
export default function D3GraphVisualization({
  data,
  isLoading = false,
  onNodeClick,
  onSingleClick = () => {},
  onDoubleClick = () => {},
}: D3GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Clear previous visualization
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth || 928;
    const height = 1200;

    // Convert flat graph data to hierarchical structure
    const hierarchyData = graphDataToHierarchy(data);

    // Create color scale
    const childrenCount = hierarchyData.children?.length ?? 0;
    // eslint-disable-next-line prettier/prettier
    const color = d3.scaleOrdinal(
      d3.quantize(d3.interpolateRainbow, childrenCount + 1 || 1),
    );

    // Create hierarchy
    const hierarchy = d3
      .hierarchy(hierarchyData)
      .sum((d) => (d.children ? d.children.length : 1))
      .sort((a, b) => b.height - a.height || (b.value ?? 0) - (a.value ?? 0));

    // Create partition layout
    const root = d3
      .partition<HierarchicalNode>()
      .size([height, (hierarchy.height + 1) * (width / 3)])(hierarchy);

    // Create SVG
    const svg = d3
      .create('svg')
      .attr('viewBox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height)
      .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

    // Create cell groups
    const cell = svg
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', (d: D3Node) => `translate(${d.y0},${d.x0})`);

    // Add rectangles
    const rect = cell
      .append('rect')
      .attr('width', (d: D3Node) => d.y1 - d.y0 - 1)
      .attr('height', (d: D3Node) => rectHeight(d))
      .attr('fill-opacity', 0.6)
      .attr('fill', (d: D3Node) => {
        if (!d.depth) return '#ccc';
        let parent = d;
        while (parent.depth > 1) parent = parent.parent!;
        return color(parent.data.name);
      })
      .style('cursor', 'pointer')
      .on('click', function (event: MouseEvent, d: D3Node) {
        onSingleClick(event, d);
        handleDoubleClick(event, d);
      })
      .on('dblclick', function (event: MouseEvent, d: D3Node) {
        onDoubleClick(event, d);
        handleDoubleClick(event, d);
      });

    // Add text labels
    const text = cell
      .append('text')
      .style('user-select', 'none')
      .attr('pointer-events', 'none')
      .attr('x', 4)
      .attr('y', 13)
      .attr('fill-opacity', (d: D3Node) => +labelVisible(d));

    text.append('tspan').text((d: D3Node) => d.data.name);

    // Add titles (tooltips)
    cell.append('title').text((d: D3Node) =>
      d
        .ancestors()
        .map((d) => d.data.name)
        .reverse()
        .join('/')
    );

    let focus = root;

    function handleDoubleClick(event: MouseEvent, p: D3Node) {
      focus = focus === p ? (p = p.parent ?? root) : p;

      root.each((d: D3Node) => {
        d.target = {
          x0: ((d.x0 - p.x0) / (p.x1 - p.x0)) * height,
          x1: ((d.x1 - p.x0) / (p.x1 - p.x0)) * height,
          y0: d.y0 - p.y0,
          y1: d.y1 - p.y0,
        };
      });

      const t = cell
        .transition()
        .duration(750)
        .attr('transform', (d: D3Node) => `translate(${d.target!.y0},${d.target!.x0})`);

      rect.transition(t).attr('height', (d: D3Node) => rectHeight(d.target!));
      text.transition(t).attr('fill-opacity', (d: D3Node) => +labelVisible(d.target!));
    }

    function rectHeight(d: any) {
      return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
    }

    function labelVisible(d: any) {
      return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
    }

    containerRef.current?.appendChild(svg.node() as any);

    return () => {
      // Cleanup
    };
  }, [data, onNodeClick, onSingleClick, onDoubleClick]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600">Building graph...</p>
        </div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No graph data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-linear-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Code Hierarchy (D3.js Icicle)</h2>
        <p className="text-xs text-slate-600 mt-1">
          Nodes: {data.metadata.totalNodes} | Edges: {data.metadata.totalEdges} | Double-click to
          zoom
        </p>
      </div>
      <div
        ref={containerRef}
        className="w-full overflow-auto"
        style={{ minHeight: '1200px', background: '#fafafa' }}
      />
    </div>
  );
}

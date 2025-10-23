'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData } from '@/lib/graph-builder';

interface D3GraphVisualizationProps {
  data: GraphData | null;
  isLoading?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onNodeSelect?: (nodeId: string, metadata?: Record<string, unknown>) => void;
  onSingleClick?: (event: MouseEvent, node: any) => void;
  onDoubleClick?: (event: MouseEvent, node: any) => void;
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  color?: string;
  size?: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: D3Node | string;
  target: D3Node | string;
  type: string;
}

/**
 * D3.js Force-Directed Graph visualization component
 * Renders code relationships as an interactive force-directed graph with nodes and edges
 */
export default function D3GraphVisualization({
  data,
  isLoading = false,
  onNodeClick,
  onNodeSelect,
  onSingleClick = () => {},
  onDoubleClick = () => {},
}: D3GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const selectedNodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Clear previous visualization
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth || 928;
    const height = 600;

    // Prepare nodes and links for D3
    const nodes: D3Node[] = data.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      color: node.color || '#6b7280',
      size: node.size || 10,
    }));

    const links: D3Link[] = data.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
    }));

    // Create SVG
    const svg = d3
      .create('svg')
      .attr('viewBox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height)
      .attr('style', 'max-width: 100%; height: auto; font: 12px sans-serif;');

    svgRef.current = svg.node() as SVGSVGElement;

    // Add marker definitions for arrows
    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 25)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3, 0 6')
      .attr('fill', '#999');

    // Add zoom behavior
    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

    svg.call(zoom as any);

    // Create force simulation
    const simulation = d3
      .forceSimulation<D3Node>(nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Link>(links)
          .id((d) => d.id)
          .distance(100)
          .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => (d.size || 10) + 5)
      );

    // Draw links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)')
      .attr('class', 'graph-link');

    // Draw nodes
    const node = g
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d) => d.size || 10)
      .attr('fill', (d) => d.color || '#6b7280')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'graph-node')
      .style('cursor', 'pointer')
      .on('click', function (event: MouseEvent, d: D3Node) {
        // Update selected node
        selectedNodeRef.current = d.id;

        // Remove previous selection highlight
        node.attr('stroke', '#fff').attr('stroke-width', 2);

        // Highlight selected node
        d3.select(this).attr('stroke', '#ff6b6b').attr('stroke-width', 4);

        onSingleClick(event, d);
        if (onNodeClick) {
          onNodeClick(d.id);
        }

        // Call onNodeSelect with metadata
        if (onNodeSelect) {
          onNodeSelect(d.id, {
            label: d.label,
            type: d.type,
            color: d.color,
            size: d.size,
          });
        }
      })
      .on('dblclick', function (event: MouseEvent, d: D3Node) {
        onDoubleClick(event, d);
      });

    // Add drag behavior
    node.call(
      d3
        .drag<SVGCircleElement, D3Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any
    );

    // Add labels
    const labels = g
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '11px')
      .attr('fill', '#333')
      .attr('pointer-events', 'none')
      .text((d) => d.label);

    // Add titles (tooltips)
    node.append('title').text((d) => `${d.label} (${d.type})`);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as D3Node).x || 0)
        .attr('y1', (d) => (d.source as D3Node).y || 0)
        .attr('x2', (d) => (d.target as D3Node).x || 0)
        .attr('y2', (d) => (d.target as D3Node).y || 0);

      node.attr('cx', (d) => d.x || 0).attr('cy', (d) => d.y || 0);

      labels.attr('x', (d) => d.x || 0).attr('y', (d) => d.y || 0);
    });

    function dragstarted(event: any, d: D3Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: D3Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: D3Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    containerRef.current?.appendChild(svg.node() as any);

    return () => {
      simulation.stop();
    };
  }, [data, onNodeClick, onNodeSelect, onSingleClick, onDoubleClick]);

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
        <h2 className="text-lg font-bold text-slate-900">
          Code Relationship Graph (D3.js Force-Directed)
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Nodes: {data.metadata.totalNodes} | Edges: {data.metadata.totalEdges} | Drag to move |
          Scroll to zoom
        </p>
      </div>
      <div
        ref={containerRef}
        className="w-full overflow-auto"
        style={{ minHeight: '600px', background: '#fafafa' }}
      />
    </div>
  );
}

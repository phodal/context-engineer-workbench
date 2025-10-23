'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData } from '@/lib/graph-builder';

interface D3GraphVisualizationProps {
  data: GraphData | null;
  isLoading?: boolean;
  onNodeClick?: (nodeId: string) => void;
}

/**
 * D3.js-based graph visualization component
 * Renders code relationship graphs with force-directed layout
 */
export default function D3GraphVisualization({
  data,
  isLoading = false,
  onNodeClick,
}: D3GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Clear previous visualization
    if (svgRef.current) {
      svgRef.current.remove();
    }

    const width = containerRef.current.clientWidth || 1000;
    const height = 600;

    // Create SVG
    const svg = d3
      .create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto; border: 1px solid #e5e7eb;');

    // Create force simulation
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force(
        'link',
        d3
          .forceLink(data.edges as any)
          .id((d: any) => d.id)
          .distance(100)
          .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => (d.size || 10) + 5)
      );

    // Create links
    const links = svg
      .append('g')
      .selectAll('line')
      .data(data.edges)
      .join('line')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    // Create nodes
    const nodes = svg
      .append('g')
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', (d) => d.size || 10)
      .attr('fill', (d) => d.color || '#3b82f6')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_event, d: any) => {
        onNodeClick?.(d.id);
      })
      .call(drag(simulation) as any);

    // Create labels
    const labels = svg
      .append('g')
      .selectAll('text')
      .data(data.nodes)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('font-size', '11px')
      .attr('fill', '#1f2937')
      .attr('pointer-events', 'none')
      .text((d) => d.label);

    // Add tooltips
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', '#1f2937')
      .style('color', '#ffffff')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '1000');

    nodes
      .on('mouseover', (_event, d: any) => {
        tooltip.style('opacity', 1).html(`<strong>${d.label}</strong><br/>Type: ${d.type}`);
      })
      .on('mousemove', (event) => {
        tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodes.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      labels.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    // Drag behavior
    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    }

    containerRef.current?.appendChild(svg.node() as any);
    svgRef.current = svg.node() as SVGSVGElement;

    return () => {
      tooltip.remove();
    };
  }, [data, onNodeClick]);

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
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Code Relationship Graph (D3.js)</h2>
        <p className="text-xs text-slate-600 mt-1">
          Nodes: {data.metadata.totalNodes} | Edges: {data.metadata.totalEdges}
        </p>
      </div>
      <div
        ref={containerRef}
        className="w-full"
        style={{ minHeight: '600px', background: '#fafafa' }}
      />
    </div>
  );
}

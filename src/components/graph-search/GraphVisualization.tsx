'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CodeGraph } from '@/lib/graph-builder';

interface GraphVisualizationProps {
  graph: CodeGraph | null;
  isLoading?: boolean;
}

/**
 * Simple Canvas-based Graph Visualization
 * Renders nodes and edges using force-directed layout simulation
 */
export default function GraphVisualization({ graph, isLoading = false }: GraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const animationRef = useRef<number | null>(null);

  // Simple force-directed layout simulation
  useEffect(() => {
    if (!graph || graph.nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Initialize positions randomly
    const newPositions = new Map<string, { x: number; y: number }>();
    graph.nodes.forEach((node) => {
      newPositions.set(node.id, {
        x: Math.random() * width,
        y: Math.random() * height,
      });
    });

    // Simple physics simulation
    const velocities = new Map<string, { vx: number; vy: number }>();
    graph.nodes.forEach((node) => {
      velocities.set(node.id, { vx: 0, vy: 0 });
    });

    const simulate = () => {
      const k = 50; // Spring constant
      const c = 0.5; // Damping
      const repulsion = 1000; // Repulsion force

      // Apply forces
      graph.nodes.forEach((node) => {
        let fx = 0;
        let fy = 0;

        // Repulsion from other nodes
        graph.nodes.forEach((other) => {
          if (node.id === other.id) return;

          const pos1 = newPositions.get(node.id)!;
          const pos2 = newPositions.get(other.id)!;

          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = repulsion / (dist * dist);
          fx += (force * dx) / dist;
          fy += (force * dy) / dist;
        });

        // Attraction to connected nodes
        graph.edges.forEach((edge) => {
          if (edge.source === node.id || edge.target === node.id) {
            const other = edge.source === node.id ? edge.target : edge.source;
            const pos1 = newPositions.get(node.id)!;
            const pos2 = newPositions.get(other)!;

            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            const force = (k * dist) / 100;
            fx += (force * dx) / dist;
            fy += (force * dy) / dist;
          }
        });

        // Center attraction
        const pos = newPositions.get(node.id)!;
        const centerDx = width / 2 - pos.x;
        const centerDy = height / 2 - pos.y;
        fx += centerDx * 0.01;
        fy += centerDy * 0.01;

        // Update velocity
        const vel = velocities.get(node.id)!;
        vel.vx = (vel.vx + fx) * c;
        vel.vy = (vel.vy + fy) * c;

        // Update position
        pos.x += vel.vx;
        pos.y += vel.vy;

        // Boundary conditions
        pos.x = Math.max(30, Math.min(width - 30, pos.x));
        pos.y = Math.max(30, Math.min(height - 30, pos.y));
      });

      setPositions(new Map(newPositions));
    };

    // Run simulation steps
    let steps = 0;
    const runSimulation = () => {
      if (steps < 100) {
        simulate();
        steps++;
        animationRef.current = requestAnimationFrame(runSimulation);
      }
    };

    runSimulation();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graph]);

  // Draw graph on canvas
  useEffect(() => {
    if (!graph || positions.size === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    graph.edges.forEach((edge) => {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);

      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    graph.nodes.forEach((node) => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const size = node.size || 10;
      ctx.fillStyle = node.color || '#3b82f6';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Draw label
      ctx.fillStyle = '#000000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, pos.x, pos.y);
    });
  }, [graph, positions]);

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

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No graph data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Code Relationship Graph</h2>
        <p className="text-xs text-slate-600 mt-1">
          Nodes: {graph.metadata.totalNodes} | Edges: {graph.metadata.totalEdges}
        </p>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full border-t border-slate-200"
        style={{ display: 'block' }}
      />
    </div>
  );
}

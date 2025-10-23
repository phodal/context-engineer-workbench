'use client';

import React, { useRef, useEffect, useMemo } from 'react';

export interface Highlight {
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
  color: string;
  captureName?: string;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  isLoading: boolean;
  selectedRange?: {
    startRow: number;
    startColumn: number;
    endRow: number;
    endColumn: number;
  };
  highlights?: Highlight[];
}

export default function CodeEditor({
  value,
  onChange,
  language,
  isLoading,
  selectedRange,
  highlights = [],
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle selection when selectedRange changes
  useEffect(() => {
    if (selectedRange && textareaRef.current) {
      // Convert row/column to character index
      const positionToIndex = (row: number, column: number): number => {
        const lines = value.split('\n');
        let index = 0;
        for (let i = 0; i < row && i < lines.length; i++) {
          index += lines[i].length + 1; // +1 for newline
        }
        index += column;
        return index;
      };

      const startIndex = positionToIndex(selectedRange.startRow, selectedRange.startColumn);
      const endIndex = positionToIndex(selectedRange.endRow, selectedRange.endColumn);

      // Set selection
      textareaRef.current.setSelectionRange(startIndex, endIndex);
      textareaRef.current.focus();

      // Scroll into view
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedRange, value]);

  // Build highlighted lines
  const highlightedLines = useMemo(() => {
    const lines = value.split('\n');
    const lineHighlights: Map<
      number,
      Array<{ start: number; end: number; color: string }>
    > = new Map();

    highlights.forEach((hl) => {
      for (let row = hl.startRow; row <= hl.endRow; row++) {
        if (!lineHighlights.has(row)) {
          lineHighlights.set(row, []);
        }

        const line = lines[row] || '';
        const start = row === hl.startRow ? hl.startColumn : 0;
        const end = row === hl.endRow ? hl.endColumn : line.length;

        lineHighlights.get(row)!.push({ start, end, color: hl.color });
      }
    });

    return lineHighlights;
  }, [value, highlights]);

  // Render highlighted code
  const renderHighlightedCode = () => {
    const lines = value.split('\n');
    return lines.map((line, rowIdx) => {
      const lineHls = highlightedLines.get(rowIdx) || [];

      if (lineHls.length === 0) {
        return (
          <div key={rowIdx} className="font-mono text-sm">
            {line || '\n'}
          </div>
        );
      }

      // Sort highlights by start position
      lineHls.sort((a, b) => a.start - b.start);

      const parts: React.ReactNode[] = [];
      let lastEnd = 0;

      lineHls.forEach((hl, idx) => {
        if (hl.start > lastEnd) {
          parts.push(<span key={`text-${idx}`}>{line.substring(lastEnd, hl.start)}</span>);
        }

        parts.push(
          <span
            key={`hl-${idx}`}
            style={{
              backgroundColor: hl.color,
              opacity: 0.3,
              borderRadius: '2px',
            }}
          >
            {line.substring(hl.start, hl.end)}
          </span>
        );

        lastEnd = hl.end;
      });

      if (lastEnd < line.length) {
        parts.push(<span key="text-end">{line.substring(lastEnd)}</span>);
      }

      return (
        <div key={rowIdx} className="font-mono text-sm">
          {parts}
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Code</h2>
        <p className="text-xs text-slate-600 mt-1">Language: {language}</p>
      </div>

      <div className="p-4 relative">
        {/* Highlighted overlay */}
        {highlights.length > 0 && (
          <div
            ref={containerRef}
            className="absolute top-4 left-4 right-4 bottom-4 pointer-events-none overflow-hidden rounded-lg bg-slate-50 p-4 text-slate-700"
            style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
          >
            {renderHighlightedCode()}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className="relative w-full h-96 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm bg-white"
          style={{
            backgroundColor: highlights.length > 0 ? 'rgba(255, 255, 255, 0.7)' : 'white',
          }}
          placeholder="Enter code here..."
        />
      </div>
    </div>
  );
}

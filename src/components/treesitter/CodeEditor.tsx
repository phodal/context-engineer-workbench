'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { EditorView, Decoration } from '@codemirror/view';
import { EditorState, StateField, StateEffect, RangeSet } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { sql } from '@codemirror/lang-sql';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';

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

const getLanguageExtension = (lang: string) => {
  switch (lang) {
    case 'javascript':
    case 'typescript':
      return javascript({ typescript: lang === 'typescript' });
    case 'python':
      return python();
    case 'java':
      return java();
    case 'cpp':
    case 'c':
      return cpp();
    case 'html':
      return html();
    case 'css':
      return css();
    case 'json':
      return json();
    case 'xml':
      return xml();
    case 'sql':
      return sql();
    case 'rust':
      return rust();
    case 'go':
      return go();
    default:
      return javascript();
  }
};

export default function CodeEditor({
  value,
  onChange,
  language,
  highlights = [],
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);

  // Create highlight decorations
  const highlightDecorations = useMemo(() => {
    const decorations: Array<{ from: number; to: number; color: string }> = [];

    highlights.forEach((hl) => {
      const lines = value.split('\n');
      let from = 0;

      // Calculate character position for start
      for (let i = 0; i < hl.startRow; i++) {
        from += (lines[i]?.length || 0) + 1; // +1 for newline
      }
      from += hl.startColumn;

      // Calculate character position for end
      let to = from;
      for (let i = hl.startRow; i < hl.endRow; i++) {
        to += (lines[i]?.length || 0) + 1;
      }
      to += hl.endColumn - hl.startColumn;

      decorations.push({ from, to, color: hl.color });
    });

    return decorations;
  }, [highlights, value]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!containerRef.current) return;

    // Create highlight effect and field
    const highlightEffect =
      StateEffect.define<Array<{ from: number; to: number; color: string }>>();

    const highlightField = StateField.define({
      create() {
        return RangeSet.empty;
      },
      update(decorations, tr) {
        for (const effect of tr.effects) {
          if (effect.is(highlightEffect)) {
            const ranges: Array<{ from: number; to: number; value: Decoration }> = [];
            for (const { from, to, color } of effect.value) {
              ranges.push({
                from,
                to,
                value: Decoration.mark({
                  class: 'cm-highlight',
                  attributes: { style: `color: ${color}; font-weight: bold;` },
                }),
              });
            }
            return RangeSet.of(ranges, true);
          }
        }
        return decorations.map(tr.changes);
      },
      provide: (f) => EditorView.decorations.from(f),
    });

    const extensions = [
      EditorView.theme({
        '.cm-content': { fontSize: '14px', fontFamily: 'monospace', padding: '12px 0' },
        '.cm-gutters': { backgroundColor: '#f5f5f5', borderRight: '1px solid #e0e0e0' },
        '.cm-highlight': { fontWeight: 'bold' },
      }),
      EditorState.tabSize.of(2),
      getLanguageExtension(language),
      highlightField,
    ];

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
      dispatch: (tr) => {
        view.update([tr]);
        if (tr.docChanged) {
          onChange(view.state.doc.toString());
        }
      },
    });

    // Apply highlights
    if (highlightDecorations.length > 0) {
      view.dispatch({
        effects: highlightEffect.of(highlightDecorations),
      });
    }

    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [language, onChange, value, highlightDecorations]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-linear-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Code</h2>
        <p className="text-xs text-slate-600 mt-1">Language: {language}</p>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={
          {
            '--cm-content-height': '400px',
          } as React.CSSProperties
        }
      />
    </div>
  );
}

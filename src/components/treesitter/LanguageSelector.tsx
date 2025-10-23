'use client';

import React from 'react';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

const LANGUAGES = [
  { value: 'bash', label: 'Bash' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'lua', label: 'Lua' },
  { value: 'php', label: 'PHP' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'swift', label: 'Swift' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'tsx', label: 'TypeScript React' },
];

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="text-sm font-medium text-slate-700">
        Language:
      </label>
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}

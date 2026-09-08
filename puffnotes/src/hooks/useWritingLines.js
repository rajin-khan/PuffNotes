import { useState } from 'react';

export const WRITING_LINES_STORAGE_KEY = 'puffnotes_writingLines_v1';
export const DEFAULT_WRITING_LINES = false;

export function readWritingLines(storage = localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(WRITING_LINES_STORAGE_KEY) || 'false');
    return typeof saved === 'boolean' ? saved : Boolean(saved.enabled);
  } catch {
    return DEFAULT_WRITING_LINES;
  }
}

export default function useWritingLines() {
  const [writingLines, setWritingLines] = useState(readWritingLines);
  const updateWritingLines = (enabled) => setWritingLines(() => {
    localStorage.setItem(WRITING_LINES_STORAGE_KEY, JSON.stringify(enabled));
    return enabled;
  });
  return [writingLines, updateWritingLines];
}

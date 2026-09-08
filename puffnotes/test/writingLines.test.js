import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_WRITING_LINES, readWritingLines, WRITING_LINES_STORAGE_KEY } from '../src/hooks/useWritingLines.js';

test('writing lines stay off by default', () => {
  const storage = { getItem: () => null };
  assert.deepEqual(readWritingLines(storage), DEFAULT_WRITING_LINES);
});

test('writing line preferences are shared and survive invalid storage', () => {
  assert.equal(readWritingLines({ getItem: key => key === WRITING_LINES_STORAGE_KEY ? 'true' : null }), true);
  assert.equal(readWritingLines({ getItem: () => '{"enabled":true,"spacing":32}' }), true);
  assert.deepEqual(readWritingLines({ getItem: () => '{broken' }), DEFAULT_WRITING_LINES);
});

test('the rules, typed rows, and textarea scrolling use the same spacing', async () => {
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(css, /line-height: 26px/);
  assert.match(css, /var\(--ruled-line-height\) - var\(--ruled-line-width\)/);
  assert.match(css, /background-attachment: local/);

  for (const editor of ['OfflineApp', 'OnlineApp']) {
    const source = await readFile(new URL(`../src/components/${editor}.jsx`, import.meta.url), 'utf8');
    assert.match(source, /writingLines \? 'ruled-writing-surface'/);
  }
});

test('the toggle uses the same visual behavior as the adjacent preview control', async () => {
  const source = await readFile(new URL('../src/components/WritingLinesControl.jsx', import.meta.url), 'utf8');
  assert.match(source, /opacity-60 hover:opacity-100 transition p-1 flex-shrink-0/);
  assert.match(source, /THEMES\.GALAXY \? 'text-\[#8b9dc3\] hover:text-\[#e8eaf6\]' : 'text-gray-500 hover:text-gray-800'/);
  assert.match(source, /whileHover=\{\{ scale: 1\.1 \}\}/);
  assert.match(source, /whileTap=\{\{ scale: 0\.95 \}\}/);
  assert.doesNotMatch(source, /value \? 'text-/);
});

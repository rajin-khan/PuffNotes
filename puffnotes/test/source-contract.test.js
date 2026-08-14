import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('landing copy and version remain unchanged', async () => {
  const source = await readSource('src/components/LandingPage.jsx');
  for (const expected of [
    'Your quiet place.',
    'Works anywhere.',
    'Desktop & Chromium Browsers only.',
    'Stable 2.1.0',
    'Themes have landed! Request newer ones',
  ]) {
    assert.ok(source.includes(expected), `missing landing contract: ${expected}`);
  }
});

test('both editors retain their current storage and shortcut contracts', async () => {
  const [offline, online] = await Promise.all([
    readSource('src/components/OfflineApp.jsx'),
    readSource('src/components/OnlineApp.jsx'),
  ]);

  for (const source of [offline, online]) {
    assert.ok(source.includes("'puffnotes_groqUserApiKey_v1'"));
    assert.ok(source.includes("e.key === 'Enter'"));
    assert.ok(source.includes("e.key.toLowerCase() === 'p'"));
    assert.ok(source.includes("e.key.toLowerCase() === 'e'"));
    assert.ok(source.includes("e.key.toLowerCase() === 'k'"));
    assert.ok(source.includes("e.key.toLowerCase() === 's'"));
    assert.ok(source.includes("e.key.toLowerCase() === 'o'"));
    assert.ok(source.includes("e.key === '/'"));
  }
});

test('both tucked editors remain connected to the viewport while peeking', async () => {
  const [offline, online] = await Promise.all([
    readSource('src/components/OfflineApp.jsx'),
    readSource('src/components/OnlineApp.jsx'),
  ]);

  for (const source of [offline, online]) {
    assert.ok(source.includes('data-puffnotes-theme={currentTheme}'));
    assert.ok(source.includes("after:top-full after:left-0 after:right-0 after:h-1 after:bg-inherit"));
    assert.ok(source.includes('whileHover={{ y: -2'));
  }

  const styles = await readSource('src/index.css');
  assert.ok(styles.includes('overscroll-behavior-y: none'));
  assert.ok(styles.includes('html:has([data-puffnotes-theme="warm"])'));
  assert.ok(styles.includes('html:has([data-puffnotes-theme="galaxy"])'));
});

test('PDF export retains its page, render, and error contracts', async () => {
  const source = await readSource('src/lib/exportNoteToPdf.jsx');
  for (const expected of [
    "orientation: 'p'",
    "unit: 'mm'",
    "format: 'a4'",
    "floatPrecision: 'smart'",
    'const margin = 18',
    'const headerTopMargin = 15',
    'scale: 3',
    'imageTimeout: 15000',
    "pdf.addImage(",
    "'FAST'",
    "pdf.save(filename)",
    "Failed to export PDF.",
  ]) {
    assert.ok(source.includes(expected), `missing PDF contract: ${expected}`);
  }
});

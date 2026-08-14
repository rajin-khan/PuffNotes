import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  THEMES,
  THEME_ORDER,
  getNextTheme,
  getPreviousTheme,
  getStoredTheme,
  getThemeColors,
  getThemeVideos,
  isValidTheme,
  setStoredTheme,
} from '../src/lib/themeManager.js';

test('theme media mappings remain unchanged', () => {
  assert.deepEqual(getThemeVideos(THEMES.WARM), [
    { src: '/puff.mp4', type: 'video/mp4' },
    { src: '/puff.webm', type: 'video/webm' },
  ]);
  assert.deepEqual(getThemeVideos(THEMES.GALAXY), [
    { src: '/galaxy.webm', type: 'video/webm' },
    { src: '/galaxy.mp4', type: 'video/mp4' },
  ]);
});

test('Komorebi uses its optimized video fallbacks with the hardware-friendly MP4 first', async () => {
  assert.deepEqual(getThemeVideos(THEMES.KOMOREBI), [
    { src: '/komorebi.mp4', type: 'video/mp4' },
    { src: '/komorebi.webm', type: 'video/webm' },
  ]);

  const [mp4, webm] = await Promise.all([
    fs.stat(new URL('../public/komorebi.mp4', import.meta.url)),
    fs.stat(new URL('../public/komorebi.webm', import.meta.url)),
  ]);
  assert.ok(mp4.size > 0);
  assert.ok(webm.size > 0);
  assert.ok(mp4.size < 6_000_000);
  assert.ok(webm.size < 6_000_000);
});

test('Komorebi media is 1080p, 30fps, and audio-free when ffprobe is available', (context) => {
  const ffprobeCheck = spawnSync('ffprobe', ['-version'], { encoding: 'utf8' });
  if (ffprobeCheck.error?.code === 'ENOENT') {
    context.skip('ffprobe is not installed in this environment');
    return;
  }
  assert.equal(ffprobeCheck.status, 0);

  const media = [
    { codec: 'h264', path: new URL('../public/komorebi.mp4', import.meta.url) },
    { codec: 'vp9', path: new URL('../public/komorebi.webm', import.meta.url) },
  ];

  for (const asset of media) {
    const probe = spawnSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'stream=codec_name,codec_type,width,height,r_frame_rate',
      '-of', 'json',
      fileURLToPath(asset.path),
    ], { encoding: 'utf8' });
    assert.equal(probe.status, 0, probe.stderr);
    const { streams } = JSON.parse(probe.stdout);
    assert.equal(streams.length, 1);
    assert.deepEqual(streams[0], {
      codec_name: asset.codec,
      codec_type: 'video',
      width: 1920,
      height: 1080,
      r_frame_rate: '30/1',
    });
  }
});

test('theme colors retain the current visual contract', () => {
  assert.equal(getThemeColors(THEMES.WARM).background.main, '#fdf6ec');
  assert.equal(getThemeColors(THEMES.WARM).accent.primary, '#9a8c73');
  assert.equal(getThemeColors(THEMES.GALAXY).background.main, '#0a0e27');
  assert.equal(getThemeColors(THEMES.GALAXY).accent.primary, '#9b59b6');
  assert.equal(getThemeColors(THEMES.KOMOREBI).background.main, '#071c20');
  assert.equal(getThemeColors(THEMES.KOMOREBI).background.panel, '#352820');
  assert.equal(getThemeColors(THEMES.KOMOREBI).text.primary, '#f4ebd7');
  assert.equal(getThemeColors(THEMES.KOMOREBI).accent.primary, '#b7cd9b');
});

test('three-theme navigation is circular and preserves the established Warm to Galaxy direction', () => {
  assert.deepEqual(THEME_ORDER, [THEMES.WARM, THEMES.GALAXY, THEMES.KOMOREBI]);
  assert.equal(getNextTheme(THEMES.WARM), THEMES.GALAXY);
  assert.equal(getNextTheme(THEMES.GALAXY), THEMES.KOMOREBI);
  assert.equal(getNextTheme(THEMES.KOMOREBI), THEMES.WARM);
  assert.equal(getPreviousTheme(THEMES.WARM), THEMES.KOMOREBI);
  assert.equal(getPreviousTheme(THEMES.KOMOREBI), THEMES.GALAXY);
  assert.equal(getPreviousTheme(THEMES.GALAXY), THEMES.WARM);
  assert.equal(getNextTheme('unknown'), THEMES.WARM);
  assert.equal(getPreviousTheme('unknown'), THEMES.WARM);
});

test('all themes round-trip with the existing storage key and invalid values fail safely', () => {
  const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalWarn = console.warn;
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  });

  try {
    console.warn = () => {};
    for (const theme of THEME_ORDER) {
      assert.equal(isValidTheme(theme), true);
      setStoredTheme(theme);
      assert.equal(values.get('puffnotes_theme_v1'), theme);
      assert.equal(getStoredTheme(), theme);
    }

    values.set('puffnotes_theme_v1', 'not-a-theme');
    assert.equal(getStoredTheme(), THEMES.WARM);

    values.set('puffnotes_theme_v1', THEMES.GALAXY);
    setStoredTheme('not-a-theme');
    assert.equal(values.get('puffnotes_theme_v1'), THEMES.GALAXY);
  } finally {
    console.warn = originalWarn;
    if (!originalLocalStorage) {
      delete globalThis.localStorage;
    } else {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    }
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { THEMES, getThemeColors, getThemeVideos } from '../src/lib/themeManager.js';

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

test('theme colors retain the current visual contract', () => {
  assert.equal(getThemeColors(THEMES.WARM).background.main, '#fdf6ec');
  assert.equal(getThemeColors(THEMES.WARM).accent.primary, '#9a8c73');
  assert.equal(getThemeColors(THEMES.GALAXY).background.main, '#0a0e27');
  assert.equal(getThemeColors(THEMES.GALAXY).accent.primary, '#9b59b6');
});

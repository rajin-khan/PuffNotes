import assert from 'node:assert/strict';
import test from 'node:test';
import { isMobileDevice, isPhoneDevice, supportsOfflineMode } from '../src/lib/deviceSupport.js';

test('mobile detection covers phones, Android, and touch-based iPads', () => {
  assert.equal(isMobileDevice({ userAgent: 'Mozilla/5.0 (iPhone)', mobile: false, maxTouchPoints: 5 }), true);
  assert.equal(isMobileDevice({ userAgent: 'Mozilla/5.0 (Linux; Android 15)', mobile: false, maxTouchPoints: 5 }), true);
  assert.equal(isMobileDevice({ userAgent: 'Mozilla/5.0 (Macintosh)', mobile: false, maxTouchPoints: 5 }), true);
  assert.equal(isMobileDevice({ userAgent: 'Mozilla/5.0 (Macintosh)', mobile: false, maxTouchPoints: 0 }), false);
});

test('drawing is blocked on phones but remains available on tablets', () => {
  assert.equal(isPhoneDevice({ userAgent: 'Mozilla/5.0 (iPhone)', mobile: true }), true);
  assert.equal(isPhoneDevice({ userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit Mobile', mobile: true }), true);
  assert.equal(isPhoneDevice({ userAgent: 'Mozilla/5.0 (iPad)', mobile: false }), false);
  assert.equal(isPhoneDevice({ userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel Tablet)', mobile: false }), false);
  assert.equal(isPhoneDevice({ userAgent: 'Mozilla/5.0 (Macintosh)', mobile: false }), false);
});

test('offline mode requires both a desktop device and directory picker support', () => {
  assert.equal(supportsOfflineMode({ mobile: false, hasDirectoryPicker: true }), true);
  assert.equal(supportsOfflineMode({ mobile: true, hasDirectoryPicker: true }), false);
  assert.equal(supportsOfflineMode({ mobile: false, hasDirectoryPicker: false }), false);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { findWhitespacePageBreak, isInkFreeRow } from '../src/lib/pdfPagination.js';

test('page breaks move upward into the nearest whitespace run', () => {
  const blankRows = new Set([87, 88, 89, 90, 91, 92, 93, 94]);
  const pageEnd = findWhitespacePageBreak({
    idealEndY: 100,
    minimumEndY: 70,
    minimumBlankRows: 6,
    isBlankRow: (row) => blankRows.has(row),
  });

  assert.equal(pageEnd, 92);
});

test('page breaks retain the full page height when no safe gap exists', () => {
  const pageEnd = findWhitespacePageBreak({
    idealEndY: 100,
    minimumEndY: 70,
    minimumBlankRows: 6,
    isBlankRow: () => false,
  });

  assert.equal(pageEnd, 100);
});

test('ink detection works across differently colored page surfaces', () => {
  const foregroundColors = [{ red: 232, green: 234, blue: 246 }];
  const data = new Uint8ClampedArray([
    10, 14, 39, 255,
    45, 53, 97, 255,
    232, 234, 246, 255,
    45, 53, 97, 255,
  ]);

  assert.equal(isInkFreeRow({ data, foregroundColors, row: 0, width: 2 }), true);
  assert.equal(isInkFreeRow({ data, foregroundColors, row: 1, width: 2 }), false);
});

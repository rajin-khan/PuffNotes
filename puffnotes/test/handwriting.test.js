import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HANDWRITING_COLORS,
  HANDWRITING_WIDTHS,
  createHandwritingDocument,
  eraseHandwritingAt,
  hasHandwriting,
  nonEmptyHandwritingPages,
  normalizeHandwritingDocument,
} from '../src/lib/handwriting.js';

test('handwriting documents always contain a usable page', () => {
  const empty = createHandwritingDocument();
  assert.equal(empty.version, 1);
  assert.equal(empty.pages.length, 1);
  assert.equal(hasHandwriting(empty), false);
  assert.deepEqual(nonEmptyHandwritingPages(empty), []);
});

test('stored strokes are validated and coordinates are kept on the page', () => {
  const document = normalizeHandwritingDocument({
    pages: [{
      id: 'page-1',
      strokes: [
        { color: HANDWRITING_COLORS[0], width: HANDWRITING_WIDTHS[0], points: [{ x: -2, y: 4, pressure: 2 }] },
        { color: '#unexpected', width: 99, points: [{ x: 0.5, y: 0.5 }] },
      ],
    }],
  });
  assert.equal(document.pages[0].strokes.length, 1);
  assert.deepEqual(document.pages[0].strokes[0].points[0], { x: 0, y: 1, pressure: 1 });
  assert.equal(hasHandwriting(document), true);
  assert.equal(nonEmptyHandwritingPages(document).length, 1);
});

test('invalid handwriting data opens as a blank document', () => {
  assert.equal(normalizeHandwritingDocument(null).pages.length, 1);
  assert.equal(normalizeHandwritingDocument({ pages: [] }).pages.length, 1);
});

test('eraser cuts only the touched section of a stroke', () => {
  const stroke = {
    color: HANDWRITING_COLORS[0],
    width: HANDWRITING_WIDTHS[1],
    points: [
      { x: 0.1, y: 0.5, pressure: 0.5 },
      { x: 0.9, y: 0.5, pressure: 0.5 },
    ],
  };
  const result = eraseHandwritingAt([stroke], { x: 0.5, y: 0.5 }, 0.08);
  assert.equal(result.length, 2);
  assert.ok(result[0].points.at(-1).x < 0.5);
  assert.ok(result[1].points[0].x > 0.5);
});

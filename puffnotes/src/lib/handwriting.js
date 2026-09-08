export const HANDWRITING_VERSION = 1;
export const HANDWRITING_PAGE_RATIO = 210 / 297;
export const HANDWRITING_COLORS = ['#252422', '#315b8a', '#9a4038'];
export const HANDWRITING_WIDTHS = [2, 4, 7];
export const ERASER_SIZES = [8, 28, 64];

const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export function createHandwritingPage() {
  return { id: makeId(), strokes: [] };
}

export function createHandwritingDocument() {
  return { version: HANDWRITING_VERSION, pages: [createHandwritingPage()] };
}

export function normalizeHandwritingDocument(value) {
  if (!value || !Array.isArray(value.pages)) return createHandwritingDocument();
  const pages = value.pages.map((page) => ({
    id: typeof page?.id === 'string' ? page.id : makeId(),
    strokes: Array.isArray(page?.strokes) ? page.strokes.filter((stroke) => (
      HANDWRITING_COLORS.includes(stroke?.color)
      && HANDWRITING_WIDTHS.includes(stroke?.width)
      && Array.isArray(stroke?.points)
      && stroke.points.length > 0
    )).map((stroke) => ({
      color: stroke.color,
      width: stroke.width,
      points: stroke.points.map((point) => ({
        x: Math.min(1, Math.max(0, Number(point.x) || 0)),
        y: Math.min(1, Math.max(0, Number(point.y) || 0)),
        pressure: Math.min(1, Math.max(0.1, Number(point.pressure) || 0.5)),
      })),
    })) : [],
  }));
  return { version: HANDWRITING_VERSION, pages: pages.length ? pages : [createHandwritingPage()] };
}

export const hasHandwriting = (document) => Boolean(
  document?.pages?.some((page) => page.strokes?.length),
);

export const nonEmptyHandwritingPages = (document) => (
  document?.pages?.filter((page) => page.strokes?.length) || []
);

export function eraseHandwritingAt(strokes, center, radius) {
  return strokes.flatMap((stroke) => {
    const sampled = stroke.points.flatMap((point, index) => {
      if (!index) return [point];
      const previous = stroke.points[index - 1];
      const distance = Math.hypot(point.x - previous.x, (point.y - previous.y) / HANDWRITING_PAGE_RATIO);
      const steps = Math.max(1, Math.ceil(distance / Math.max(radius / 2, 0.002)));
      return Array.from({ length: steps }, (_, step) => {
        const amount = (step + 1) / steps;
        return {
          x: previous.x + (point.x - previous.x) * amount,
          y: previous.y + (point.y - previous.y) * amount,
          pressure: previous.pressure + (point.pressure - previous.pressure) * amount,
        };
      });
    });
    const parts = [];
    let current = [];
    sampled.forEach((point) => {
      const erased = Math.hypot(point.x - center.x, (point.y - center.y) / HANDWRITING_PAGE_RATIO) <= radius;
      if (erased) {
        if (current.length) parts.push(current);
        current = [];
      } else current.push(point);
    });
    if (current.length) parts.push(current);
    return parts.map((points) => ({ ...stroke, points }));
  });
}

export function handwritingPaperColor(theme) {
  if (theme === 'galaxy') return '#f5f7ff';
  if (theme === 'komorebi') return '#f8f6ed';
  return '#fdfbf7';
}

export function handwritingRuleColor(theme) {
  if (theme === 'galaxy') return 'rgba(139, 157, 195, 0.22)';
  if (theme === 'komorebi') return 'rgba(104, 85, 65, 0.18)';
  return 'rgba(104, 91, 72, 0.16)';
}

export function drawHandwritingPage(context, page, {
  height,
  showLines = false,
  theme = 'warm',
  transparent = false,
  width,
}) {
  context.clearRect(0, 0, width, height);
  if (!transparent) {
    context.fillStyle = handwritingPaperColor(theme);
    context.fillRect(0, 0, width, height);
  }

  if (showLines) {
    context.strokeStyle = handwritingRuleColor(theme);
    context.lineWidth = 1;
    for (let y = height * 0.09; y < height; y += height * 0.035) {
      context.beginPath();
      context.moveTo(0, Math.round(y) + 0.5);
      context.lineTo(width, Math.round(y) + 0.5);
      context.stroke();
    }
  }

  for (const stroke of page?.strokes || []) {
    if (!stroke.points.length) continue;
    context.strokeStyle = stroke.color;
    context.fillStyle = stroke.color;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (stroke.points.length === 1) {
      const point = stroke.points[0];
      context.beginPath();
      context.arc(point.x * width, point.y * height, stroke.width / 2, 0, Math.PI * 2);
      context.fill();
      continue;
    }

    for (let index = 1; index < stroke.points.length; index += 1) {
      const from = stroke.points[index - 1];
      const to = stroke.points[index];
      context.lineWidth = stroke.width * (0.65 + to.pressure * 0.7);
      context.beginPath();
      context.moveTo(from.x * width, from.y * height);
      context.lineTo(to.x * width, to.y * height);
      context.stroke();
    }
  }
}

export function handwritingPageDataUrl(page, { showLines, theme, width = 1240 }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(width / HANDWRITING_PAGE_RATIO);
  drawHandwritingPage(canvas.getContext('2d'), page, {
    height: canvas.height,
    showLines,
    theme,
    width: canvas.width,
  });
  return canvas.toDataURL('image/png');
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Eraser, Hand, Minus, PenLine, Plus, Redo2, SlidersHorizontal, Trash2, Undo2, X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  HANDWRITING_COLORS,
  HANDWRITING_PAGE_RATIO,
  HANDWRITING_WIDTHS,
  ERASER_SIZES,
  createHandwritingPage,
  drawHandwritingPage,
  eraseHandwritingAt,
} from '../lib/handwriting';
import { THEMES } from '../lib/themeManager';

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export default function HandwritingEditor({ document, onChange, showLines, theme }) {
  const canvasRefs = useRef([]);
  const pageRefs = useRef([]);
  const scrollRef = useRef(null);
  const drawingRef = useRef(null);
  const pagesRef = useRef(document.pages);
  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState(HANDWRITING_COLORS[0]);
  const [penWidth, setPenWidth] = useState(HANDWRITING_WIDTHS[1]);
  const [eraserSize, setEraserSize] = useState(ERASER_SIZES[1]);
  const [eraserCursor, setEraserCursor] = useState({ pageIndex: 0, x: 0, y: 0, visible: false });
  const [zoom, setZoom] = useState(1);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pageSize, setPageSize] = useState({ width: 600, height: 849 });
  const shouldReduceMotion = useReducedMotion();
  const page = document.pages[pageIndex] || document.pages[0];

  useEffect(() => {
    pagesRef.current = document.pages;
  }, [document.pages]);

  useEffect(() => {
    setPageIndex((current) => Math.min(current, document.pages.length - 1));
  }, [document.pages.length]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return undefined;
    const updateSize = () => {
      const available = Math.max(240, scroll.clientWidth);
      const baseWidth = Math.min(794, available);
      setPageSize({ width: baseWidth * zoom, height: (baseWidth * zoom) / HANDWRITING_PAGE_RATIO });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(scroll);
    return () => observer.disconnect();
  }, [zoom]);

  useEffect(() => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    document.pages.forEach((item, index) => {
      const canvas = canvasRefs.current[index];
      if (!canvas) return;
      canvas.width = Math.round(pageSize.width * pixelRatio);
      canvas.height = Math.round(pageSize.height * pixelRatio);
      canvas.style.width = `${pageSize.width}px`;
      canvas.style.height = `${pageSize.height}px`;
      const context = canvas.getContext('2d');
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawHandwritingPage(context, item, {
        height: pageSize.height,
        showLines,
        theme,
        transparent: true,
        width: pageSize.width,
      });
    });
  }, [document.pages, pageSize, showLines, theme]);

  const updatePage = useCallback((strokes, targetIndex = pageIndex) => {
    const pages = pagesRef.current.map((item, index) => index === targetIndex ? { ...item, strokes } : item);
    pagesRef.current = pages;
    onChange({
      ...document,
      pages,
    });
  }, [document, onChange, pageIndex]);

  const pointFromEvent = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
      pressure: event.pressure > 0 ? event.pressure : 0.5,
    };
  };

  const updateEraserCursor = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setEraserCursor({
      pageIndex: Number(event.currentTarget.dataset.pageIndex),
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      visible: tool === 'eraser',
    });
  };

  const eraseAt = (point, targetIndex) => {
    const currentStrokes = pagesRef.current[targetIndex]?.strokes || [];
    const next = eraseHandwritingAt(currentStrokes, point, eraserSize / 2 / pageSize.width);
    updatePage(next, targetIndex);
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    updateEraserCursor(event);
    const targetIndex = Number(event.currentTarget.dataset.pageIndex);
    if (targetIndex !== pageIndex) {
      undoRef.current = [];
      redoRef.current = [];
    }
    setPageIndex(targetIndex);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (tool === 'pan') {
      drawingRef.current = {
        panning: true,
        clientX: event.clientX,
        clientY: event.clientY,
        scrollLeft: scrollRef.current.scrollLeft,
        scrollTop: scrollRef.current.scrollTop,
      };
      return;
    }
    const base = pagesRef.current[targetIndex]?.strokes || [];
    undoRef.current.push(base);
    redoRef.current = [];
    const point = pointFromEvent(event);
    if (tool === 'eraser') {
      drawingRef.current = { erasing: true, pageIndex: targetIndex };
      eraseAt(point, targetIndex);
      return;
    }
    const stroke = { color, width: penWidth, points: [point] };
    drawingRef.current = { base, pageIndex: targetIndex, stroke };
    updatePage([...base, stroke], targetIndex);
  };

  const handlePointerMove = (event) => {
    updateEraserCursor(event);
    if (!drawingRef.current) return;
    event.preventDefault();
    if (drawingRef.current.panning) {
      scrollRef.current.scrollLeft = drawingRef.current.scrollLeft - (event.clientX - drawingRef.current.clientX);
      scrollRef.current.scrollTop = drawingRef.current.scrollTop - (event.clientY - drawingRef.current.clientY);
      return;
    }
    const point = pointFromEvent(event);
    if (drawingRef.current.erasing) {
      eraseAt(point, drawingRef.current.pageIndex);
      return;
    }
    const nextStroke = {
      ...drawingRef.current.stroke,
      points: [...drawingRef.current.stroke.points, point],
    };
    drawingRef.current = { ...drawingRef.current, stroke: nextStroke };
    updatePage([...drawingRef.current.base, nextStroke], drawingRef.current.pageIndex);
  };

  const stopDrawing = (event) => {
    if (drawingRef.current && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drawingRef.current = null;
  };

  const undo = () => {
    const previous = undoRef.current.pop();
    if (!previous) return;
    redoRef.current.push(pagesRef.current[pageIndex]?.strokes || []);
    updatePage(previous);
  };

  const redo = () => {
    const next = redoRef.current.pop();
    if (!next) return;
    undoRef.current.push(pagesRef.current[pageIndex]?.strokes || []);
    updatePage(next);
  };

  const goToPage = (index) => {
    const nextIndex = clamp(index, 0, pagesRef.current.length - 1);
    setPageIndex(nextIndex);
    undoRef.current = [];
    redoRef.current = [];
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
        top: pageRefs.current[nextIndex]?.offsetTop || 0,
      });
    });
  };

  const addPage = () => {
    const pages = [...pagesRef.current, createHandwritingPage()];
    pagesRef.current = pages;
    onChange({ ...document, pages });
    goToPage(pages.length - 1);
    undoRef.current = [];
    redoRef.current = [];
  };

  const removePage = () => {
    if (document.pages.length === 1) {
      if (!page.strokes.length || window.confirm('Clear this handwriting page?')) updatePage([]);
      return;
    }
    if (page.strokes.length && !window.confirm(`Delete handwriting page ${pageIndex + 1}?`)) return;
    const pages = document.pages.filter((_, index) => index !== pageIndex);
    pagesRef.current = pages;
    onChange({ ...document, pages });
    setPageIndex((current) => Math.max(0, current - 1));
    undoRef.current = [];
    redoRef.current = [];
  };

  const paletteColor = theme === THEMES.GALAXY
    ? 'border-[#6471a4] bg-[#18204e] text-[#eef1ff]'
    : theme === THEMES.KOMOREBI
      ? 'border-[#8d7357] bg-[#493a2e] text-[#fff4df]'
      : 'border-[#cbbda9] bg-[#fffaf2] text-[#443b32]';
  const buttonColor = theme === THEMES.GALAXY
    ? 'text-[#c9d1f2] hover:bg-[#303a73] hover:text-white'
    : theme === THEMES.KOMOREBI
      ? 'text-[#f2e4cc] hover:bg-[#624f3e] hover:text-white'
      : 'text-[#62574b] hover:bg-[#eee5d8] hover:text-[#211d19]';
  const selectedColor = theme === THEMES.GALAXY
    ? '!bg-[#eef1ff] !text-[#18204e]'
    : theme === THEMES.KOMOREBI
      ? '!bg-[#fff4df] !text-[#493a2e]'
      : '!bg-[#443b32] !text-[#fffaf2]';
  const iconButton = `grid h-7 w-7 shrink-0 place-items-center rounded-full transition-[background-color,color,opacity,scale] duration-150 active:scale-96 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${buttonColor}`;

  const renderPalette = (onClose) => (
    <>
      {onClose && <button type="button" onClick={onClose} className={iconButton} aria-label="Hide handwriting tools"><X size={16} aria-hidden="true" /></button>}
      <button
        type="button"
        onClick={() => setTool(tool === 'pen' ? 'pan' : 'pen')}
        aria-pressed={tool === 'pan'}
        aria-label={tool === 'pen' ? 'Switch to move canvas' : 'Switch to draw'}
        title={tool === 'pen' ? 'Switch to move canvas' : 'Switch to draw'}
        className={`${iconButton} relative ${tool !== 'eraser' ? selectedColor : ''}`}
      >
        <PenLine className={`absolute transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${tool === 'pen' ? 'scale-25 opacity-0 blur-[4px]' : 'scale-100 opacity-100 blur-0'}`} size={16} aria-hidden="true" />
        <Hand className={`absolute transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${tool === 'pen' ? 'scale-100 opacity-100 blur-0' : 'scale-25 opacity-0 blur-[4px]'}`} size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={() => setTool('eraser')} aria-pressed={tool === 'eraser'} className={`${iconButton} ${tool === 'eraser' ? selectedColor : ''}`} title="Eraser" aria-label="Eraser"><Eraser size={16} aria-hidden="true" /></button>
      <span className="my-0.5 h-px w-5 bg-current opacity-25" aria-hidden="true" />
      {HANDWRITING_COLORS.map((ink) => (
        <button key={ink} type="button" onClick={() => { setColor(ink); setTool('pen'); }} aria-label={`Ink ${ink}`} aria-pressed={color === ink && tool === 'pen'} className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          <span className={`h-4 w-4 rounded-full border border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] ${color === ink && tool === 'pen' ? 'ring-2 ring-current ring-offset-2 ring-offset-transparent' : ''}`} style={{ backgroundColor: ink }} aria-hidden="true" />
        </button>
      ))}
      <label className="flex h-14 w-8 items-center justify-center" title={tool === 'eraser' ? 'Eraser size' : 'Pen thickness'}>
        <span className="sr-only">{tool === 'eraser' ? 'Eraser size' : 'Pen thickness'}</span>
        <input
          type="range"
          min="0"
          max="2"
          step="1"
          value={tool === 'eraser' ? ERASER_SIZES.indexOf(eraserSize) : HANDWRITING_WIDTHS.indexOf(penWidth)}
          onChange={(event) => {
            const index = Number(event.target.value);
            if (tool === 'eraser') setEraserSize(ERASER_SIZES[index]);
            else setPenWidth(HANDWRITING_WIDTHS[index]);
          }}
          className="h-12 w-5 rotate-180 accent-current [writing-mode:vertical-lr]"
          aria-label={tool === 'eraser' ? 'Eraser size' : 'Pen thickness'}
        />
      </label>
      <span className="my-0.5 h-px w-5 bg-current opacity-25" aria-hidden="true" />
      <button type="button" onClick={undo} disabled={!undoRef.current.length} className={`${iconButton} disabled:opacity-25`} title="Undo handwriting" aria-label="Undo handwriting"><Undo2 size={16} aria-hidden="true" /></button>
      <button type="button" onClick={redo} disabled={!redoRef.current.length} className={`${iconButton} disabled:opacity-25`} title="Redo handwriting" aria-label="Redo handwriting"><Redo2 size={16} aria-hidden="true" /></button>
      <button type="button" onClick={() => setZoom((value) => clamp(value - 0.25, 0.5, 2))} disabled={zoom <= 0.5} className={`${iconButton} disabled:opacity-25`} title="Zoom out" aria-label="Zoom out"><Minus size={16} aria-hidden="true" /></button>
      <output className="w-10 text-center font-mono text-[10px] tabular-nums" aria-live="polite">{Math.round(zoom * 100)}%</output>
      <button type="button" onClick={() => setZoom((value) => clamp(value + 0.25, 0.5, 2))} disabled={zoom >= 2} className={`${iconButton} disabled:opacity-25`} title="Zoom in" aria-label="Zoom in"><Plus size={16} aria-hidden="true" /></button>
      <span className="my-0.5 h-px w-5 bg-current opacity-25" aria-hidden="true" />
      <button type="button" onClick={() => goToPage(pageIndex - 1)} disabled={pageIndex === 0} className={`${iconButton} disabled:opacity-25`} aria-label="Previous handwriting page"><ChevronLeft size={16} aria-hidden="true" /></button>
      <span className="font-mono text-[10px] tabular-nums" aria-live="polite">{pageIndex + 1}/{document.pages.length}</span>
      <button type="button" onClick={() => goToPage(pageIndex + 1)} disabled={pageIndex === document.pages.length - 1} className={`${iconButton} disabled:opacity-25`} aria-label="Next handwriting page"><ChevronRight size={16} aria-hidden="true" /></button>
      <button type="button" onClick={addPage} className={iconButton} title="Add handwriting page" aria-label="Add handwriting page"><Plus size={16} aria-hidden="true" /></button>
      <button type="button" onClick={removePage} className={`${iconButton} hover:text-[#b42318]`} title={document.pages.length === 1 ? 'Clear handwriting page' : 'Delete handwriting page'} aria-label={document.pages.length === 1 ? 'Clear handwriting page' : 'Delete handwriting page'}><Trash2 size={16} aria-hidden="true" /></button>
    </>
  );

  const mobileButton = `${iconButton} h-9 w-9 min-[24rem]:h-10 min-[24rem]:w-10`;
  const renderMobilePalette = () => (
    <>
      <div className="flex items-center justify-between gap-1">
        <button type="button" onClick={() => setPaletteOpen(false)} className={mobileButton} aria-label="Hide handwriting tools"><X size={17} aria-hidden="true" /></button>
        <button
          type="button"
          onClick={() => setTool(tool === 'pen' ? 'pan' : 'pen')}
          aria-pressed={tool === 'pan'}
          aria-label={tool === 'pen' ? 'Switch to move canvas' : 'Switch to draw'}
          className={`${mobileButton} relative ${tool !== 'eraser' ? selectedColor : ''}`}
        >
          <PenLine className={`absolute transition-[opacity,scale,filter] duration-200 ${tool === 'pen' ? 'scale-25 opacity-0 blur-[4px]' : 'scale-100 opacity-100 blur-0'}`} size={17} aria-hidden="true" />
          <Hand className={`absolute transition-[opacity,scale,filter] duration-200 ${tool === 'pen' ? 'scale-100 opacity-100 blur-0' : 'scale-25 opacity-0 blur-[4px]'}`} size={17} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setTool('eraser')} aria-pressed={tool === 'eraser'} className={`${mobileButton} ${tool === 'eraser' ? selectedColor : ''}`} aria-label="Eraser"><Eraser size={17} aria-hidden="true" /></button>
        {HANDWRITING_COLORS.map((ink) => (
          <button key={ink} type="button" onClick={() => { setColor(ink); setTool('pen'); }} aria-label={`Ink ${ink}`} aria-pressed={color === ink && tool === 'pen'} className="grid h-10 w-10 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            <span className={`h-5 w-5 rounded-full border border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] ${color === ink && tool === 'pen' ? 'ring-2 ring-current ring-offset-2 ring-offset-transparent' : ''}`} style={{ backgroundColor: ink }} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 border-y border-current/15 py-1">
        <label className="flex min-w-0 flex-1 items-center gap-2 px-1">
          <span className="text-[11px] opacity-75">{tool === 'eraser' ? 'Eraser' : 'Pen'}</span>
          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={tool === 'eraser' ? ERASER_SIZES.indexOf(eraserSize) : HANDWRITING_WIDTHS.indexOf(penWidth)}
            onChange={(event) => {
              const index = Number(event.target.value);
              if (tool === 'eraser') setEraserSize(ERASER_SIZES[index]);
              else setPenWidth(HANDWRITING_WIDTHS[index]);
            }}
            className="h-10 min-w-0 flex-1 accent-current"
            aria-label={tool === 'eraser' ? 'Eraser size' : 'Pen thickness'}
          />
        </label>
        <button type="button" onClick={undo} disabled={!undoRef.current.length} className={`${mobileButton} disabled:opacity-25`} aria-label="Undo handwriting"><Undo2 size={17} aria-hidden="true" /></button>
        <button type="button" onClick={redo} disabled={!redoRef.current.length} className={`${mobileButton} disabled:opacity-25`} aria-label="Redo handwriting"><Redo2 size={17} aria-hidden="true" /></button>
      </div>
      <div className="flex items-center justify-between gap-0.5">
        <button type="button" onClick={() => setZoom((value) => clamp(value - 0.25, 0.5, 2))} disabled={zoom <= 0.5} className={`${mobileButton} disabled:opacity-25`} aria-label="Zoom out"><Minus size={17} aria-hidden="true" /></button>
        <output className="w-10 text-center font-mono text-[11px] tabular-nums" aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button type="button" onClick={() => setZoom((value) => clamp(value + 0.25, 0.5, 2))} disabled={zoom >= 2} className={`${mobileButton} disabled:opacity-25`} aria-label="Zoom in"><Plus size={17} aria-hidden="true" /></button>
        <button type="button" onClick={() => goToPage(pageIndex - 1)} disabled={pageIndex === 0} className={`${mobileButton} disabled:opacity-25`} aria-label="Previous handwriting page"><ChevronLeft size={17} aria-hidden="true" /></button>
        <span className="font-mono text-[11px] tabular-nums" aria-live="polite">{pageIndex + 1}/{document.pages.length}</span>
        <button type="button" onClick={() => goToPage(pageIndex + 1)} disabled={pageIndex === document.pages.length - 1} className={`${mobileButton} disabled:opacity-25`} aria-label="Next handwriting page"><ChevronRight size={17} aria-hidden="true" /></button>
        <button type="button" onClick={addPage} className={mobileButton} aria-label="Add handwriting page"><Plus size={17} aria-hidden="true" /></button>
        <button type="button" onClick={removePage} className={`${mobileButton} hover:text-[#b42318]`} aria-label={document.pages.length === 1 ? 'Clear handwriting page' : 'Delete handwriting page'}><Trash2 size={17} aria-hidden="true" /></button>
      </div>
    </>
  );

  return (
    <div className="relative flex h-full min-h-0 flex-1" data-handwriting-editor>
      <div ref={scrollRef} className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
        {document.pages.map((item, index) => (
          <div key={item.id}>
            {index > 0 && document.pages.length > 1 && <div className="my-6 border-t border-dashed border-current opacity-25" aria-hidden="true" />}
            <div ref={(element) => { pageRefs.current[index] = element; }} className="relative mx-auto" style={{ width: pageSize.width, height: pageSize.height }}>
              <canvas
                ref={(element) => { canvasRefs.current[index] = element; }}
                data-page-index={index}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onPointerLeave={() => setEraserCursor((cursor) => ({ ...cursor, visible: false }))}
                className={`block touch-none ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : tool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'}`}
                aria-label={`Handwriting page ${index + 1} of ${document.pages.length}`}
              />
              {!item.strokes.length && (
                <span className={`pointer-events-none absolute inset-0 grid place-items-center font-serif text-sm italic ${theme === THEMES.GALAXY ? 'text-[#59627f]' : theme === THEMES.KOMOREBI ? 'text-[#776858]' : 'text-[#85796b]'}`} aria-hidden="true">
                  draw here
                </span>
              )}
              <span className="pointer-events-none absolute left-0 top-0 rounded-full border border-[#252422]/70 bg-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.55)] transition-opacity duration-75" style={{ width: eraserSize, height: eraserSize, opacity: eraserCursor.visible && eraserCursor.pageIndex === index ? 1 : 0, transform: `translate(${eraserCursor.x - eraserSize / 2}px, ${eraserCursor.y - eraserSize / 2}px)` }} aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>
      <aside className={`absolute start-full top-1/2 ms-10 hidden max-h-[calc(100%-0.5rem)] w-12 -translate-y-1/2 flex-col items-center overflow-x-hidden overflow-y-auto rounded-full border px-1.5 py-2 shadow-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[60rem]:flex ${paletteColor}`} aria-label="Handwriting tools">
        {renderPalette()}
      </aside>
      <button type="button" onClick={() => setPaletteOpen(true)} className={`absolute bottom-1 end-1 z-20 grid h-9 w-9 place-items-center rounded-full border opacity-70 shadow-sm transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 min-[60rem]:hidden ${paletteColor}`} aria-label="Show handwriting tools" aria-expanded={paletteOpen}><SlidersHorizontal size={15} aria-hidden="true" /></button>
      <AnimatePresence initial={false}>
        {paletteOpen && (
          <motion.aside
            className={`absolute inset-x-2 bottom-2 z-30 overflow-hidden rounded-2xl border px-2 py-1.5 shadow-xl min-[60rem]:hidden ${paletteColor}`}
            aria-label="Handwriting tools"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {renderMobilePalette()}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

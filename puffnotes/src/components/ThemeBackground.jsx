import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  THEMES,
  getThemeColors,
  getThemeVideos,
  isValidTheme,
} from '../lib/themeManager';

const DEFAULT_CROSSFADE_DURATION = 650;
const CROSSFADE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

const normalizeTheme = (theme) => (isValidTheme(theme) ? theme : THEMES.WARM);

function VideoLayer({
  layer,
  isFailed,
  opacity,
  paused,
  shouldReduceMotion,
  transitionDuration,
  videoClassName,
  onError,
  onReady,
  onVideoNode,
}) {
  const videoRef = useRef(null);
  const visibleOpacity = isFailed || !layer.ready ? 0 : opacity;

  useEffect(() => {
    onVideoNode(layer.id, videoRef.current);
    return () => onVideoNode(layer.id, null);
  }, [layer.id, onVideoNode]);

  const handleReady = () => {
    onReady(layer.id);

    if (!paused && !shouldReduceMotion && videoRef.current) {
      videoRef.current.play().catch(() => {
        // A visible fallback remains in place if the browser blocks playback.
      });
    }
  };

  return (
    <video
      ref={videoRef}
      data-theme-video-layer={layer.role}
      data-theme-key={layer.theme}
      data-theme-video-ready={layer.ready ? 'true' : 'false'}
      data-theme-video-failed={isFailed ? 'true' : 'false'}
      autoPlay={!paused && !shouldReduceMotion}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      className={`absolute inset-0 h-full w-full object-cover ${videoClassName}`.trim()}
      style={{
        opacity: visibleOpacity,
        transitionProperty: 'opacity',
        transitionDuration: `${transitionDuration}ms`,
        transitionTimingFunction: CROSSFADE_EASING,
        willChange: transitionDuration > 0 ? 'opacity' : 'auto',
      }}
      onLoadedData={handleReady}
      onCanPlay={handleReady}
      onError={() => onError(layer.id, layer.theme)}
    >
      {getThemeVideos(layer.theme).map((source) => (
        <source key={source.src} src={source.src} type={source.type} />
      ))}
      Your browser does not support the video tag.
    </video>
  );
}

/**
 * A full-bleed theme video that keeps the current frame visible until the next
 * theme has media ready. Only the outgoing and incoming videos coexist, and the
 * outgoing decoder is explicitly released when the opacity-only fade finishes.
 */
export default function ThemeBackground({
  theme = THEMES.WARM,
  paused = false,
  className = 'absolute inset-0',
  videoClassName = '',
  crossfadeDuration = DEFAULT_CROSSFADE_DURATION,
  onVideoError,
}) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const requestedTheme = normalizeTheme(theme);
  const nextLayerId = useRef(1);
  const initialTheme = useRef(requestedTheme);
  const videoNodes = useRef(new Map());
  const readyLayerIds = useRef(new Set());
  const failedLayerIds = useRef(new Set());
  const activeLayerRef = useRef({ id: 0, theme: initialTheme.current });
  const incomingLayerRef = useRef(null);
  const latestRequestedTheme = useRef(requestedTheme);
  const revealFrame = useRef(null);
  const completionTimer = useRef(null);

  const [activeLayer, setActiveLayer] = useState(activeLayerRef.current);
  const [incomingLayer, setIncomingLayer] = useState(null);
  const [isIncomingVisible, setIsIncomingVisible] = useState(false);
  const [, renderMediaState] = useState(0);

  // Update synchronously so a stale media event cannot reveal an obsolete
  // target between render and the effect that replaces its layer.
  latestRequestedTheme.current = requestedTheme;

  const effectiveDuration = shouldReduceMotion
    ? 0
    : Math.min(700, Math.max(600, crossfadeDuration));

  const clearTransitionSchedule = useCallback(() => {
    if (revealFrame.current !== null) {
      cancelAnimationFrame(revealFrame.current);
      revealFrame.current = null;
    }
    if (completionTimer.current !== null) {
      clearTimeout(completionTimer.current);
      completionTimer.current = null;
    }
  }, []);

  const releaseVideo = useCallback((layerId) => {
    const video = videoNodes.current.get(layerId);
    if (!video) return;

    video.pause();
    video.removeAttribute('src');
    video.querySelectorAll('source').forEach((source) => source.removeAttribute('src'));
    video.load();
    videoNodes.current.delete(layerId);
  }, []);

  const onVideoNode = useCallback((layerId, node) => {
    if (node) {
      videoNodes.current.set(layerId, node);
      return;
    }

    const previousNode = videoNodes.current.get(layerId);
    previousNode?.pause();
    videoNodes.current.delete(layerId);
  }, []);

  const completeTransition = useCallback((incomingId) => {
    const incoming = incomingLayerRef.current;
    if (
      !incoming
      || incoming.id !== incomingId
      || incoming.theme !== latestRequestedTheme.current
    ) return;

    const outgoingId = activeLayerRef.current.id;
    activeLayerRef.current = incoming;
    incomingLayerRef.current = null;
    setActiveLayer(incoming);
    setIncomingLayer(null);
    setIsIncomingVisible(false);
    releaseVideo(outgoingId);
  }, [releaseVideo]);

  const revealIncoming = useCallback((incomingId) => {
    const incoming = incomingLayerRef.current;
    if (
      !incoming
      || incoming.id !== incomingId
      || incoming.theme !== latestRequestedTheme.current
    ) return;

    clearTransitionSchedule();

    if (effectiveDuration === 0) {
      completeTransition(incomingId);
      return;
    }

    revealFrame.current = requestAnimationFrame(() => {
      const latestIncoming = incomingLayerRef.current;
      if (!latestIncoming || latestIncoming.id !== incomingId) return;

      setIsIncomingVisible(true);
      completionTimer.current = setTimeout(() => {
        completionTimer.current = null;
        completeTransition(incomingId);
      }, effectiveDuration);
    });
  }, [clearTransitionSchedule, completeTransition, effectiveDuration]);

  const handleVideoReady = useCallback((layerId) => {
    if (readyLayerIds.current.has(layerId)) return;

    readyLayerIds.current.add(layerId);
    renderMediaState((version) => version + 1);

    if (incomingLayerRef.current?.id === layerId) {
      revealIncoming(layerId);
    }
  }, [revealIncoming]);

  const handleVideoError = useCallback((layerId, failedTheme) => {
    if (!failedLayerIds.current.has(layerId)) {
      failedLayerIds.current.add(layerId);
      renderMediaState((version) => version + 1);
      onVideoError?.(failedTheme);
    }

    if (incomingLayerRef.current?.id === layerId) {
      // Fade the outgoing video to the requested theme's solid fallback.
      revealIncoming(layerId);
    }
  }, [onVideoError, revealIncoming]);

  useEffect(() => {
    const active = activeLayerRef.current;
    const incoming = incomingLayerRef.current;

    if (requestedTheme === active.theme) {
      if (incoming) {
        clearTransitionSchedule();
        releaseVideo(incoming.id);
        incomingLayerRef.current = null;
        setIncomingLayer(null);
        setIsIncomingVisible(false);
      }
      return;
    }

    if (incoming?.theme === requestedTheme) return;

    clearTransitionSchedule();
    if (incoming) releaseVideo(incoming.id);

    const nextLayer = {
      id: nextLayerId.current,
      theme: requestedTheme,
    };
    nextLayerId.current += 1;
    incomingLayerRef.current = nextLayer;
    setIncomingLayer(nextLayer);
    setIsIncomingVisible(false);
  }, [clearTransitionSchedule, releaseVideo, requestedTheme]);

  useEffect(() => {
    const mustPause = paused || shouldReduceMotion;
    videoNodes.current.forEach((video) => {
      if (mustPause) {
        video.pause();
      } else {
        video.play().catch(() => {
          // The theme fallback remains visible if autoplay is unavailable.
        });
      }
    });
  }, [activeLayer.id, incomingLayer?.id, paused, shouldReduceMotion]);

  useEffect(() => () => {
    clearTransitionSchedule();
    videoNodes.current.forEach((video) => video.pause());
    videoNodes.current.clear();
  }, [clearTransitionSchedule]);

  const fallbackTheme = isIncomingVisible
    ? latestRequestedTheme.current
    : activeLayer.theme;
  const fallbackColor = getThemeColors(fallbackTheme).background.main;
  const transitionState = incomingLayer
    ? isIncomingVisible
      ? 'crossfading'
      : 'loading'
    : 'idle';
  const layers = [
    { ...activeLayer, role: 'active', ready: readyLayerIds.current.has(activeLayer.id) },
    incomingLayer && {
      ...incomingLayer,
      role: 'incoming',
      ready: readyLayerIds.current.has(incomingLayer.id),
    },
  ].filter(Boolean);

  return (
    <div
      data-theme-background={requestedTheme}
      data-theme-transition-state={transitionState}
      data-theme-motion={shouldReduceMotion ? 'reduced' : 'full'}
      className={`pointer-events-none overflow-hidden ${className}`.trim()}
      style={{ backgroundColor: fallbackColor }}
      aria-hidden="true"
    >
      {layers.map((layer) => {
        const isActive = layer.id === activeLayer.id;
        const opacity = isActive
          ? isIncomingVisible ? 0 : 1
          : isIncomingVisible ? 1 : 0;

        return (
          <VideoLayer
            key={layer.id}
            layer={layer}
            isFailed={failedLayerIds.current.has(layer.id)}
            opacity={opacity}
            paused={paused}
            shouldReduceMotion={shouldReduceMotion}
            transitionDuration={effectiveDuration}
            videoClassName={videoClassName}
            onError={handleVideoError}
            onReady={handleVideoReady}
            onVideoNode={onVideoNode}
          />
        );
      })}
    </div>
  );
}

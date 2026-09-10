import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const readSource = (path) => fs.readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const assertIncludesAll = (source, expectedValues, label) => {
  for (const expected of expectedValues) {
    assert.ok(source.includes(expected), `missing ${label}: ${expected}`);
  }
};

test('landing copy and current version remain unchanged', async () => {
  const source = await readSource('src/components/LandingPage.jsx');
  for (const expected of [
    'Your quiet place.',
    'Works anywhere.',
    'Desktop & Chromium Browsers only.',
    'Stable 2.2.0',
    'Handwritten Notes are here! Draw away <3',
  ]) {
    assert.ok(source.includes(expected), `missing landing contract: ${expected}`);
  }
});

test('landing motion preserves the session intro and redraws the chooser underline', async () => {
  const [launcher, marketing] = await Promise.all([
    readSource('src/components/LandingPage.jsx'),
    readSource('src/components/MarketingLanding.jsx'),
  ]);

  assertIncludesAll(marketing, [
    "sessionStorage.getItem('puffnotes_intro_seen')",
    "sessionStorage.setItem('puffnotes_intro_seen', 'true')",
    'aria-label="Puffnotes is loading"',
    'initial={{ scaleX: 0, opacity: 0 }}',
    '<ThemeBackground theme={theme} />',
  ], 'homepage intro contract');
  assertIncludesAll(launcher, [
    'origin-center bg-[#f5f5dc]/30',
    'initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0 }}',
    'variants={viewVariants}',
  ], 'launcher motion contract');
});

test('offline notes start autosaving as soon as a folder is selected', async () => {
  const source = await readSource('src/components/OfflineApp.jsx');

  assert.ok(!source.includes('latest.isFirstSave || !latest.folderHandle'));
  assertIncludesAll(source, [
    'if (!latest.folderHandle || !latest.noteName.trim() || latest.showBeautifyControls) return;',
    'setIsFirstSave(false);',
    '[deletingNote, folderHandle, handwriting, isFirstSave, note, noteName]',
  ], 'first offline autosave contract');
  assert.ok(!source.includes('Save Note (Cmd/Ctrl + S)'), 'the first-save prompt must stay hidden');
  assert.ok(!source.includes('title="Save Note"'), 'the first-save toolbar button must stay hidden');
});

test('settings keeps the public theme request link', async () => {
  const source = await readSource('src/components/SettingsModal.jsx');
  assertIncludesAll(source, [
    'https://github.com/rajin-khan/PuffNotes/discussions/1',
    'Request another Puffnotes theme',
  ], 'theme request contract');
});

test('every visible Rajin Khan credit uses the self-hosted handwritten font', async () => {
  const paths = [
    'src/components/LandingPage.jsx',
    'src/components/SettingsModal.jsx',
    'src/components/MarketingLanding.jsx',
  ];
  const sources = await Promise.all(paths.map(readSource));

  for (const [index, source] of sources.entries()) {
    const mentions = [...source.matchAll(/Rajin Khan/g)];
    assert.equal(mentions.length, 1, `unexpected visible-name count in ${paths[index]}`);

    const contextBeforeName = source.slice(Math.max(0, mentions[0].index - 320), mentions[0].index);
    assert.ok(
      contextBeforeName.includes('font-creator-signature'),
      `Rajin Khan is missing the handwritten class in ${paths[index]}`,
    );
  }

  const styles = await readSource('src/index.css');
  assertIncludesAll(styles, [
    'font-family: "La Belle Aurore"',
    'url("/la-belle-aurore-latin.woff2") format("woff2")',
    '.font-creator-signature',
  ], 'creator signature font contract');

  const font = await fs.readFile(new URL('../public/la-belle-aurore-latin.woff2', import.meta.url));
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
});

test('landing restores the saved theme through the shared background without hardcoded media', async () => {
  const source = await readSource('src/components/LandingPage.jsx');

  assertIncludesAll(source, [
    "import { getStoredTheme } from '../lib/themeManager'",
    "import ThemeBackground from './ThemeBackground'",
    'useState(() => getStoredTheme())',
    '<ThemeBackground theme={homeTheme} />',
    'data-puffnotes-theme={homeTheme}',
    'data-landing-theme={homeTheme}',
    'data-app-stage="landing"',
    'data-landing-content',
  ], 'persisted landing theme contract');

  assert.doesNotMatch(source, /<source\b/, 'LandingPage must delegate video sources to ThemeBackground');
  assert.doesNotMatch(
    source,
    /\/(?:puff|galaxy|komorebi)\.(?:mp4|webm)/,
    'LandingPage must not hardcode a particular theme asset',
  );
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
  assert.ok(styles.includes('html:has([data-puffnotes-theme="komorebi"])'));
});

test('every theme keeps the note page subtly translucent without glass effects', async () => {
  const [offline, online, komorebiStyles] = await Promise.all([
    readSource('src/components/OfflineApp.jsx'),
    readSource('src/components/OnlineApp.jsx'),
    readSource('src/styles/komorebiTheme.css'),
  ]);

  for (const source of [offline, online]) {
    for (const pageColor of [
      'bg-white/95',
      'bg-[#fdfbf7]/95',
      'bg-[#0f1642]/95',
      'bg-[#0d1235]/95',
    ]) {
      assert.ok(source.includes(pageColor), `missing translucent note page: ${pageColor}`);
    }
  }

  assert.ok(komorebiStyles.includes('rgb(53 40 32 / 95%)'));
  assert.ok(komorebiStyles.includes('rgb(59 45 36 / 95%)'));
  assert.ok(!komorebiStyles.includes('backdrop-filter'));
});

test('both editors delegate theme media and pause it behind every covering modal', async () => {
  const editorPaths = [
    'src/components/OfflineApp.jsx',
    'src/components/OnlineApp.jsx',
  ];
  const sources = await Promise.all(editorPaths.map(readSource));

  for (const [index, source] of sources.entries()) {
    const backgroundTag = source.match(/<ThemeBackground[\s\S]*?\/>/)?.[0] ?? '';
    const coveringExpression = source.match(/const hasCoveringModal\s*=\s*([^;]+);/)?.[1] ?? '';

    assert.ok(source.includes("import ThemeBackground from './ThemeBackground'"), `missing shared background import: ${editorPaths[index]}`);
    assert.ok(backgroundTag.includes('theme={currentTheme}'), `ThemeBackground does not receive the active theme: ${editorPaths[index]}`);
    assert.ok(backgroundTag.includes('paused={hasCoveringModal}'), `ThemeBackground does not pause behind modals: ${editorPaths[index]}`);

    for (const modalState of [
      'showSettingsModal',
      'showShortcutsModal',
      'showOnboarding',
      'showFileModal',
    ]) {
      assert.ok(coveringExpression.includes(modalState), `${modalState} is missing from hasCoveringModal: ${editorPaths[index]}`);
    }

    assert.ok(source.includes('hasCoveringModal ? `blur-sm'), `covering modals must share the Help background treatment: ${editorPaths[index]}`);
  }
});

test('ThemeBackground keeps a readiness-gated two-layer crossfade and cleans up decoders', async () => {
  const source = await readSource('src/components/ThemeBackground.jsx');

  assertIncludesAll(source, [
    'const DEFAULT_CROSSFADE_DURATION = 650',
    "const CROSSFADE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'",
    'Math.min(700, Math.max(600, crossfadeDuration))',
    'data-theme-video-layer={layer.role}',
    'data-theme-video-ready={layer.ready',
    'data-theme-transition-state={transitionState}',
    "? 'crossfading'",
    ": 'loading'",
    'onLoadedData={handleReady}',
    'onCanPlay={handleReady}',
    'const visibleOpacity = isFailed || !layer.ready ? 0 : opacity',
    'readyLayerIds.current.add(layerId)',
    'revealIncoming(layerId)',
  ], 'readiness-gated crossfade contract');

  const layerList = source.match(/const layers\s*=\s*\[([\s\S]*?)\]\.filter\(Boolean\);/)?.[1] ?? '';
  assert.ok(layerList.includes('activeLayer'), 'the visible layer must remain mounted while the target loads');
  assert.ok(layerList.includes('incomingLayer &&'), 'the only optional layer must be the incoming target');
  assert.equal(
    (source.match(/<VideoLayer\b/g) ?? []).length,
    1,
    'ThemeBackground must render one VideoLayer mapping site so runtime state is capped at active + incoming',
  );

  assertIncludesAll(source, [
    'latestRequestedTheme.current = requestedTheme',
    'incoming.theme !== latestRequestedTheme.current',
    'if (incoming?.theme === requestedTheme) return',
    'if (incoming) releaseVideo(incoming.id)',
  ], 'stale-target protection');
  assert.ok(
    (source.match(/incoming\.theme !== latestRequestedTheme\.current/g) ?? []).length >= 2,
    'both reveal and completion must reject stale theme targets',
  );

  assertIncludesAll(source, [
    'video.pause()',
    "video.removeAttribute('src')",
    "source.removeAttribute('src')",
    'video.load()',
    'videoNodes.current.delete(layerId)',
    'releaseVideo(outgoingId)',
  ], 'video decoder cleanup');
});

test('ThemeBackground collapses motion and playback for reduced-motion users', async () => {
  const source = await readSource('src/components/ThemeBackground.jsx');

  assertIncludesAll(source, [
    "import { useReducedMotion } from 'framer-motion'",
    'const shouldReduceMotion = Boolean(useReducedMotion())',
    'shouldReduceMotion\n    ? 0',
    'autoPlay={!paused && !shouldReduceMotion}',
    'const mustPause = paused || shouldReduceMotion',
    "data-theme-motion={shouldReduceMotion ? 'reduced' : 'full'}",
  ], 'reduced theme-motion contract');
});

test('the launcher and editor stages retain motion inside route-owned screens', async () => {
  const [app, landing, offline, online] = await Promise.all([
    readSource('src/App.jsx'),
    readSource('src/components/LandingPage.jsx'),
    readSource('src/components/OfflineApp.jsx'),
    readSource('src/components/OnlineApp.jsx'),
  ]);

  assertIncludesAll(app, [
    '<AnimatePresence mode="wait" initial={false}>',
    'key={location.pathname}',
    'path="/app"',
    'path="/app/offline"',
    'path="/app/online"',
  ], 'route-owned application transition');
  assertIncludesAll(landing, [
    'data-app-stage="landing"',
    'data-landing-content',
    'exit={{ opacity: 0 }}',
    'shouldReduceMotion ? 0 : 0.42',
  ], 'landing exit hooks');

  for (const [name, source] of [['offline', offline], ['online', online]]) {
    assertIncludesAll(source, [
      'data-app-stage="editor"',
      'data-app-controls="utility"',
      'data-app-controls="toolbar"',
      'data-app-controls="help"',
      'data-note-page-stage',
      "initial={shouldReduceMotion ? false : { y: '100%' }}",
      'delay: shouldReduceMotion ? 0 : 0.18',
      'delay: shouldReduceMotion ? 0 : 0.22',
      'delay: shouldReduceMotion ? 0 : 0.26',
    ], `${name} unlock entry hooks`);
  }
});

test('all application modals share the Help motion, backdrop, exit presence, and body portal', async () => {
  const [modalMotion, settings, shortcuts, onboarding, offline, online] = await Promise.all([
    readSource('src/components/ModalMotion.jsx'),
    readSource('src/components/SettingsModal.jsx'),
    readSource('src/components/KeyboardShortcutsModal.jsx'),
    readSource('src/components/OnboardingModal.jsx'),
    readSource('src/components/OfflineApp.jsx'),
    readSource('src/components/OnlineApp.jsx'),
  ]);

  assertIncludesAll(modalMotion, [
    "import { createPortal } from 'react-dom'",
    'const MODAL_EASE = [0.22, 1, 0.36, 1]',
    'const transition = { duration: 0.4, ease: MODAL_EASE }',
    'className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"',
    'initial: { opacity: 0 }',
    'animate: { opacity: 1 }',
    'exit: { opacity: 0 }',
    'initial: { scale: 0.9, opacity: 0 }',
    'animate: { scale: 1, opacity: 1 }',
    'exit: { scale: 0.9, opacity: 0 }',
    'return createPortal(',
    'document.body',
    '<AnimatePresence>',
    '{isOpen && <ModalFrame {...frameProps} />}',
  ], 'shared modal motion');

  for (const [name, source] of [['Settings', settings], ['Keyboard shortcuts', shortcuts]]) {
    assert.ok(source.includes("import { ModalPresence } from './ModalMotion'"), `${name} modal does not import ModalPresence`);
    assert.ok(source.includes('<ModalPresence'), `${name} modal does not use ModalPresence`);
    assert.ok(!source.includes('if (!isOpen) return null'), `${name} modal bypasses its shared closing animation`);
  }

  assert.ok(onboarding.includes("import { ModalFrame } from './ModalMotion'"));
  assert.ok(onboarding.includes('<ModalFrame'), 'Help/onboarding must use the same shared frame as every other modal');

  for (const [name, source] of [['Offline file picker', offline], ['Online file picker', online]]) {
    assert.ok(source.includes("import { ModalPresence } from './ModalMotion'"), `${name} does not import ModalPresence`);
    assert.ok(source.includes('<ModalPresence'), `${name} does not use ModalPresence`);
    assert.ok(source.includes('isOpen={showFileModal'), `${name} is not controlled by the file-modal state`);
  }
});

test('Settings theme colors ease with the background crossfade', async () => {
  const styles = await readSource('src/index.css');

  assertIncludesAll(styles, [
    '[data-modal-kind="settings"][data-modal-panel]',
    'transition-property: color, background-color, border-color',
    'transition-duration: 500ms',
    'transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1)',
    '@media (prefers-reduced-motion: reduce)',
  ], 'Settings palette transition');
});

test('app motion surfaces remain flat and never add glass effects', async () => {
  const paths = [
    'src/components/ThemeBackground.jsx',
    'src/components/ModalMotion.jsx',
    'src/components/LandingPage.jsx',
    'src/components/OfflineApp.jsx',
    'src/components/OnlineApp.jsx',
    'src/components/SettingsModal.jsx',
    'src/components/KeyboardShortcutsModal.jsx',
    'src/components/OnboardingModal.jsx',
    'src/styles/komorebiTheme.css',
    'src/index.css',
  ];
  const sources = await Promise.all(paths.map(readSource));

  for (const [index, source] of sources.entries()) {
    assert.doesNotMatch(source, /backdrop-(?:filter|blur)|glassmorphism/i, `glass effect added to ${paths[index]}`);
  }
});

test('Komorebi is integrated across every themed application surface', async () => {
  const paths = [
    'src/components/OfflineApp.jsx',
    'src/components/OnlineApp.jsx',
    'src/components/ThemeSwitcher.jsx',
    'src/components/SettingsModal.jsx',
    'src/components/MarkdownPreview.jsx',
    'src/components/KeyboardShortcutsModal.jsx',
    'src/components/OnboardingModal.jsx',
    'src/components/OnlineSetupModal.jsx',
    'src/lib/exportNoteToPdf.jsx',
  ];
  const sources = await Promise.all(paths.map(readSource));

  for (const [index, source] of sources.entries()) {
    assert.ok(source.includes('THEMES.KOMOREBI'), `missing Komorebi branch: ${paths[index]}`);
  }

  for (const source of sources.slice(0, 2)) {
    assert.ok(source.includes('komorebi-toolbar'));
    assert.ok(source.includes('komorebi-editor-tab'));
    assert.ok(source.includes('komorebi-editor-surface'));
  }

  const styles = await readSource('src/styles/komorebiTheme.css');
  assert.ok(styles.includes('[data-puffnotes-theme="komorebi"]'));
  assert.ok(styles.includes('--komorebi-paper: #352820'));
  assert.ok(styles.includes('.komorebi-editor-surface'));
  assert.ok(!styles.includes('backdrop-filter'));
  assert.ok(!styles.includes('gradient('));
  for (const selector of ['blockquote', 'code:not(pre > code)', 'pre', 'th', 'td']) {
    assert.ok(styles.includes(`.puffnotes-markdown ${selector}`));
  }

  for (const source of sources.slice(0, 2)) {
    assert.ok(source.includes('useReducedMotion'));
    assert.ok(source.includes('ThemeBackground'));
    assert.ok(source.includes('paused={hasCoveringModal}'));
    assert.ok(!source.includes('komorebi-video-veil'));
  }

  const themeBackground = await readSource('src/components/ThemeBackground.jsx');
  assert.ok(themeBackground.includes('video.pause()'));
  assert.ok(themeBackground.includes("video.removeAttribute('src')"));

  const settings = sources[3];
  assert.ok(settings.includes('data-theme-preview'));
  assert.ok(settings.includes('video.pause()'));

  for (const source of sources) {
    assert.ok(!source.includes('backdrop-blur'));
  }

  const pdf = sources.at(-1);
  assert.ok(pdf.includes("isKomorebiTheme ? '#352820'"));
  assert.ok(pdf.includes("tempContainer.dataset.puffnotesTheme = currentTheme"));
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
    'findWhitespacePageBreak({',
    'minimumBlankRows: 6',
    "pdf.addImage(",
    "'FAST'",
    "pdf.save(filename)",
    "Failed to export PDF.",
  ]) {
    assert.ok(source.includes(expected), `missing PDF contract: ${expected}`);
  }
});

test('Welcome styles use normal CSS without leaking framework props into the DOM', async () => {
  const [marketing, shortcuts, styles] = await Promise.all([
    readSource('src/components/MarketingLanding.jsx'),
    readSource('src/components/KeyboardShortcutsModal.jsx'),
    readSource('src/index.css'),
  ]);

  assert.doesNotMatch(marketing, /<style\s+jsx(?:\s+global)?/);
  assert.doesNotMatch(shortcuts, /<style\s+jsx(?:\s+global)?/);
  assert.ok(styles.includes('scroll-behavior: smooth'));
});

test('public pages expose crawl, canonical, social, and app metadata', async () => {
  const [index, app, pageMetadata, robots, sitemap, manifestSource] = await Promise.all([
    readSource('index.html'),
    readSource('src/App.jsx'),
    readSource('src/components/PageMetadata.jsx'),
    readSource('public/robots.txt'),
    readSource('public/sitemap.xml'),
    readSource('public/site.webmanifest'),
  ]);

  assertIncludesAll(index, [
    '<meta\n      name="description"',
    'name="robots"',
    '<link rel="canonical" href="https://puff-notes.vercel.app/" />',
    '<meta property="og:site_name" content="Puffnotes" />',
    '<meta property="og:image:alt" content="Puffnotes, your quiet place to write" />',
    '<meta name="twitter:image:alt" content="Puffnotes, your quiet place to write" />',
    '<script type="application/ld+json">',
    '"@type": "WebApplication"',
    '<link rel="manifest" href="/site.webmanifest" />',
  ], 'static SEO metadata');

  assert.ok(
    index.includes('https://puff-notes.vercel.app/puffnotes-og-v2.png'),
    'the approved social image must remain wired to every social card',
  );
  assert.equal(
    index.match(/https:\/\/puff-notes\.vercel\.app\/puffnotes-og-v2\.png/g)?.length,
    3,
    'Open Graph, secure Open Graph, and Twitter cards must share the approved image',
  );
  assert.ok(index.includes('<meta property="og:image:width" content="1200" />'));
  assert.ok(index.includes('<meta property="og:image:height" content="630" />'));
  assert.ok(app.includes('<PageMetadata />'));
  assertIncludesAll(pageMetadata, [
    "'/app'",
    "title: 'Puffnotes | Write messily. Keep it beautifully.'",
    "title: 'Open Puffnotes'",
    "pathname.startsWith('/app')",
    "'noindex, nofollow'",
    'link[rel="canonical"]',
    'meta[property="og:url"]',
  ], 'route metadata');

  assert.ok(robots.includes('Sitemap: https://puff-notes.vercel.app/sitemap.xml'));
  assert.ok(sitemap.includes('<loc>https://puff-notes.vercel.app/</loc>'));
  assert.ok(!sitemap.includes('/welcome'), 'the legacy redirect must not be indexed');
  assert.ok(!sitemap.includes('/app'), 'private app routes must not be indexed');

  const manifest = JSON.parse(manifestSource);
  assert.equal(manifest.name, 'Puffnotes');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.icons.length, 2);
});

test('Firebase and PDF engines stay out of the initial application bundle', async () => {
  const [app, offline, online, firebaseClient] = await Promise.all([
    readSource('src/App.jsx'),
    readSource('src/components/OfflineApp.jsx'),
    readSource('src/components/OnlineApp.jsx'),
    readSource('src/lib/firebase.js'),
  ]);

  assert.ok(app.includes("import('./lib/firebase')"));
  assert.doesNotMatch(app, /from ['"]firebase\//);
  assert.doesNotMatch(app, /from ['"]\.\/lib\/firebase['"]/);
  assert.doesNotMatch(firebaseClient, /firebase\/firestore|getFirestore/);

  for (const source of [offline, online]) {
    assert.ok(source.includes("await import('../lib/exportNoteToPdf')"));
    assert.doesNotMatch(source, /from ['"]\.\.\/lib\/exportNoteToPdf['"]/);
  }
});

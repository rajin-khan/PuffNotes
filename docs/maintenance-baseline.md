# PuffNotes maintenance baseline

Recorded: 2026-08-15

## Reproduce locally

From `puffnotes/`, use pnpm only:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm run verify:lockfile-age
pnpm run audit:osv
pnpm run verify
```

`verify` runs the Node characterization tests, ESLint, and the production Vite
build. The age gate checks the exact pnpm lock and rejects any version published
less than seven days ago. The OSV audit is report-only and never changes the
dependency graph.

## Verified state

- 466 exact package versions are locked; all pass the seven-day age gate.
- 32 characterization tests pass.
- ESLint exits successfully with zero errors and zero warnings. Editor callbacks
  are stable, and offline autosave retains its original note/name-only trigger
  while reading the latest save context.
- The production Vite build succeeds. Firebase and PDF export are on-demand
  chunks; the initial JavaScript chunk fell from about 493 KB to 191 KB gzip.
- The OSV report contains zero matches, down from the original 96 matches across
  22 packages. Three compatible overrides enforce the seven-day rule for
  fast-moving Browserslist data packages.
- `html2pdf.js` is removed. jsPDF, Vite/PostCSS, React Router, and Firebase were
  upgraded separately, with the full verification command passing after every
  step.
- Browser smoke tests cover `/welcome`, history navigation, unknown-route
  fallback, and Firebase app-shell initialization. No production data was
  written and no external sign-in was triggered.
- Welcome and shortcut styling use normal CSS and no longer pass `jsx` or
  `global` attributes into the DOM.
- Local browser replay matched the saved landing and populated-editor
  accessibility DOM exactly. Onboarding matched after ignoring the expected
  focus marker on the clicked control. Video backgrounds make screenshot hashes
  non-deterministic frame-to-frame.
- A live request through the exact PuffNotes Groq helper succeeded on 2026-08-12
  using `llama-3.3-70b-versatile`. No credential or generated content was
  printed or stored.

## Safe internal consolidation

Online and offline editors now share the previously duplicated AI workflow and
PDF implementation. Prompts, model, API endpoint, state-transition order,
visible error messages, filename rules, PDF dimensions, colors, and rendering
settings are covered by source/behavior characterization tests.

The two editor shells, autosave implementations, file backends, keyboard effect
closures, and rendered markup remain separate. Consolidating those in this pass
would create unnecessary behavior risk under the frozen-app constraint.

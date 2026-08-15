# PuffNotes dependency advisory triage

Scan date: 2026-08-15

This report describes the exact `pnpm-lock.yaml` graph after the controlled
dependency cleanup. Reproduce the scan with `pnpm run audit:osv`.

OSV now reports no advisory matches across 466 locked packages. The original
baseline contained 96 matches across 22 packages; the first direct-dependency
upgrade pass reduced that to 39 matches across 15 packages.

## Completed direct cleanup

| Package | Before | After | Verification |
| --- | ---: | ---: | --- |
| `html2pdf.js` | 0.10.3 | removed | Confirmed unused in source; full verification and production build remain green. |
| `google-auth-library` | 10.3.0 | removed | Confirmed unused; PuffNotes authentication is implemented by Firebase Auth. |
| `jspdf` | 3.0.1 | 4.2.1 | PDF contracts pass and a real browser-exported PDF rendered successfully. |
| `vite` | 6.3.4 | 6.4.3 | Production output builds with the existing compatible React and Tailwind plugins. |
| `postcss` | 8.5.3 | 8.5.26 | Generated CSS remains stable. |
| `react-router-dom` | 7.9.4 | 7.18.2 | `/welcome`, browser Back, and the unknown-route redirect were exercised in a browser. |
| `firebase` | 12.3.0 | 12.17.1 | The app initializes without browser console errors; no authentication or production write was performed. |
| `eslint` / `@eslint/js` | 9.25.1 | 9.39.5 | Lint completes with zero errors and zero warnings. |

## Transitive resolution

The remaining Babel, ESLint, Firebase, Markdown, glob/parser, protobuf, Rollup,
WebSocket, and YAML findings all had patched versions permitted by their parent
packages' existing version ranges. pnpm refreshed those exact transitive paths,
and no advisory package was promoted to a direct dependency.

Three narrowly scoped pnpm overrides keep Browserslist data packages on the
newest releases old enough for the repository's seven-day rule. They remain
within their parent ranges and are unrelated to the advisory fixes. Every final
locked version passes `pnpm run verify:lockfile-age`.

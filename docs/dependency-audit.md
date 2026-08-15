# PuffNotes dependency advisory triage

Scan date: 2026-08-15

This report describes the exact `pnpm-lock.yaml` graph after the controlled
dependency cleanup. Reproduce the scan with `pnpm run audit:osv`.

The scan found 39 advisory matches across 15 of 473 locked packages, down from
96 matches across 22 packages. No remaining match is a direct dependency. A
match is not automatically an exploitable PuffNotes vulnerability: the affected
API and the way PuffNotes supplies its input both matter.

## Completed controlled upgrades

| Package | Before | After | Verification |
| --- | ---: | ---: | --- |
| `html2pdf.js` | 0.10.3 | removed | Confirmed unused in source; full verification and production build remain green. |
| `jspdf` | 3.0.1 | 4.2.1 | PDF contracts pass and a real in-memory PDF was generated successfully. |
| `vite` | 6.3.4 | 6.4.3 | Production output builds with the existing compatible React and Tailwind plugins. |
| `postcss` | 8.5.3 | 8.5.26 | Generated CSS size is unchanged. |
| `react-router-dom` | 7.9.4 | 7.18.2 | `/welcome`, browser Back, and the unknown-route redirect were exercised in a browser. |
| `firebase` | 12.3.0 | 12.17.1 | The app initializes without browser console errors; no authentication or production write was performed. |

## Remaining transitive groups

| Package/path | Locked | Matches | PuffNotes exposure | Decision |
| --- | ---: | ---: | --- | --- |
| `protobufjs` via Firebase | 7.5.4 | 12 | PuffNotes does not directly parse attacker-supplied protobuf schemas or invoke protobuf code generation. | Continue taking fixes through tested Firebase releases; do not force an internal override. |
| Build-tool transitives including Babel, ESLint, Rollup, glob parsers, and YAML parsers | various | 20 | Primarily local build/lint inputs controlled by the repository. | Resolve through compatible parent-package upgrades rather than ad-hoc overrides. |
| Firebase transitives including gRPC, JWS, and WebSocket packages | various | 5 | The reported lower-level APIs are not called directly by PuffNotes. | Track upstream Firebase updates and preserve authentication/Drive behavior when upgrading. |
| Markdown transitive `mdast-util-to-hast` | 13.2.0 | 1 | Markdown is rendered through React Markdown; PuffNotes does not enable raw HTML. | Upgrade through the Markdown stack when a compatible fixed chain is available. |
| `@protobufjs/utf8` | 1.1.0 | 1 | Indirect protobuf helper; not called by PuffNotes. | Resolve through Firebase/protobufjs upstream releases. |

The report intentionally does not claim that advisory count equals reachable
risk. It records the remaining ownership paths and avoids overrides that could
split Firebase or build-tool dependency graphs.

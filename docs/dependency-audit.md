# PuffNotes dependency advisory triage

Scan date: 2026-08-12

This is a read-only triage of the exact `pnpm-lock.yaml` graph. No package was
upgraded or removed because the current maintenance contract forbids visual or
behavioral changes. Reproduce the scan with `pnpm run audit:osv`.

The scan found 96 advisory matches across 22 of 472 locked packages. A match is
not automatically an exploitable PuffNotes vulnerability: the affected API and
the way PuffNotes supplies its input both matter.

## Direct dependencies requiring a later controlled upgrade

| Package | Locked | Matches | PuffNotes exposure | Frozen-pass decision |
| --- | ---: | ---: | --- | --- |
| `jspdf` | 3.0.1 | 11 | Active in browser PDF export, but PuffNotes feeds locally rendered PNG data and does not use the reported `addJS`, AcroForm, remote-file, GIF/BMP, metadata, or `html()` attack surfaces. | Keep now; test an upgrade to at least 4.2.1 later with byte/layout PDF regression coverage. |
| `html2pdf.js` | 0.10.3 | 1 | No source import or runtime use was found. It also adds another `jspdf`/`dompurify` path. | Remove in a later dependency-only change after confirming no external consumer relies on the manifest. |
| `vite` | 6.3.4 | 7 | Development server/build tooling only; it is not shipped as application runtime code. The advisories concern dev-server access and filesystem handling. | Keep now; test a move to a fixed supported release, at least 6.4.3, with build and browser parity checks. |
| `postcss` | 8.5.3 | 4 | Build-time only, processing repository-controlled CSS rather than user input. | Keep now; test at least 8.5.23 and compare generated CSS and screenshots. |

## Important transitive groups

| Package/path | Locked | Matches | PuffNotes exposure | Frozen-pass decision |
| --- | ---: | ---: | --- | --- |
| `dompurify` via `jspdf` and unused `html2pdf.js` | 3.2.5 | 19 | PDF-related transitive code. PuffNotes does not call jsPDF's HTML renderer, so the vulnerable sanitizer paths are not part of the current export flow. | Re-evaluate with the jsPDF upgrade and removal of `html2pdf.js`; do not force a transitive override. |
| `react-router` via `react-router-dom` | 7.9.4 | 13 | PuffNotes uses browser routing with hard-coded local paths. It does not use SSR, RSC, server actions, or attacker-provided redirect destinations implicated by most matches. | Upgrade later to at least 7.18.0 with route/refresh tests. |
| `protobufjs` via Firebase Firestore's gRPC tooling | 7.5.4 | 12 | Transitive Firebase path. PuffNotes does not directly parse attacker-supplied protobuf schemas or call protobuf code-generation APIs. | Take the fix through a tested Firebase upgrade; do not override Firebase's internal graph. |
| Remaining build and Firebase transitives | various | 29 | Predominantly build tooling or APIs PuffNotes does not call directly. | Keep the complete OSV output reproducible and resolve through parent-package upgrades, not ad-hoc overrides. |

## Priorities after the visual/behavior freeze

1. Remove the confirmed-unused `html2pdf.js` dependency.
2. Characterize PDF output, then upgrade `jspdf` and its sanitizer chain.
3. Upgrade Vite/PostCSS in isolation and compare built assets and browser captures.
4. Upgrade `react-router-dom` with route tests.
5. Upgrade Firebase as a separate change with authenticated Firestore smoke tests.

The report intentionally does not claim that advisory count equals reachable
risk. It records why each major group is or is not exposed by the current code,
and it avoids dependency changes that could violate the app-freeze constraint.

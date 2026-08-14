# PuffNotes maintenance baseline

Recorded: 2026-08-12

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

- 472 exact package versions are locked; all passed the seven-day age gate.
- 11 characterization tests pass.
- ESLint exits successfully with zero errors. Fifteen existing exhaustive-hook
  warnings remain intentionally unchanged because altering callback/dependency
  behavior could affect autosave and keyboard shortcuts.
- The production Vite build succeeds. Its main JavaScript chunk remains large
  enough to trigger Vite's existing chunk-size warning.
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

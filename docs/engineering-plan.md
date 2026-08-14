# PuffNotes engineering plan

## Current constraint

The deployed PuffNotes v2.1 experience is the behavioral and visual contract.
Maintenance work must not alter the rendered interface, copy, flows, storage
formats, keyboard shortcuts, AI prompt/model/request, PDF output, or online and
offline behavior unless a later task explicitly authorizes that change.

## Immediate maintenance

1. Establish a reproducible pnpm build, lint, test, audit, and smoke-check
   baseline.
2. Triage dependency advisories against the exact locked dependency graph.
3. Reduce duplicated editor, AI, and PDF internals while preserving the current
   public behavior.

## Explicitly deferred

The following work is recorded for later and is not part of the current
maintenance pass:

1. Recover and preserve the deleted `dev` branch history and the March 2026
   stash on dedicated branches.
2. Rotate and move the shared Groq credential behind a server-side endpoint,
   then add rate limiting, limits, timeouts, and model fallback.
3. Decide the product scope and priority of canvas notes, Pair AI, OCR,
   dictation, attachments, and other roadmap features.

Do not apply or drop the existing stash as part of routine maintenance.

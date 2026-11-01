# Documentation Index

This folder contains all project documentation for `mero-patro`.

## Recommended reading order

For new contributors or integrators, this sequence gives the fastest path to understanding:

1. [`index.md`](./index.md)
   Website landing page and entry point for developers evaluating the package.
2. [`guide/getting-started.md`](./guide/getting-started.md)
   First-install flow, smoke tests, common mistakes, and production checklist.
3. [`guide/limits-and-guarantees.md`](./guide/limits-and-guarantees.md)
   Supported ranges, caveats, trust boundaries, and what applications must still handle.
4. [`guide/validation-and-trust.md`](./guide/validation-and-trust.md)
   CI gates, integrity checks, provenance policy, and release hygiene.
5. [`api/reference/README.md`](./api/reference/README.md)
   Generated API signatures and exported types.

## Available Documents

- [`PROJECT-ANALYSIS.md`](./PROJECT-ANALYSIS.md)  
  Comprehensive architecture, health, testing, and accuracy analysis.

- [`TESTING-GUIDE.md`](./TESTING-GUIDE.md)  
  How to run HTML/CLI tests and automated Vitest suites.

- [`CREDITS.md`](./CREDITS.md)  
  Project authorship and data sources.

- [`PLAN.md`](./PLAN.md)
  Active project plan — phase-by-phase task tracker with status for every item.

- [`project.md`](./project.md)
  Original package planning and technical direction document.

- [`index.md`](./index.md)  
  VitePress docs homepage for guides and API reference.

- [`guide/playground.md`](./guide/playground.md)  
  Entry page for the interactive web playground.

- [`guide/developer-journey.md`](./guide/developer-journey.md)
  End-to-end developer workflow and internal logic walkthrough.

- [`guide/limits-and-guarantees.md`](./guide/limits-and-guarantees.md)
  Clear statement of supported ranges, runtime guarantees, caveats, and scope boundaries.

## Docs site commands

```bash
# Package watcher only (no web URL output)
pnpm run dev

# Recommended web dev command (prints URL)
pnpm run site:dev

pnpm run docs:api
pnpm run build
pnpm run docs:sync-playground-assets
pnpm run docs:dev
pnpm run docs:build
pnpm run docs:preview
```

The live interactive explorer is served from `docs/public/playground/index.html` and available at `/playground/` in the docs site.
It depends on bundled package assets under `docs/public/dist/` (synced from root `dist/`).

## Documentation goals

The docs set is intended to help three audiences:

- Package consumers who need copy-paste integration guidance.
- Maintainers who need trust, data, and release workflows.
- Reviewers who need a clear statement of package guarantees and known limits.


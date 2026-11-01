# Security Policy

## Scope

This repository publishes `mero-patro`, a developer-facing TypeScript package for Bikram Sambat date conversion, panchang lookup, and event resolution.

This package is primarily a computation and data package. It does not provide authentication, user accounts, network services, or a hosted SaaS environment. As a result, the security model here is different from a web application.

For this project, "security" includes:

- supply-chain and release integrity,
- malicious or accidental tampering with generated calendar data,
- cross-request contamination caused by global state or cache mistakes,
- unsafe runtime behavior that could affect downstream consumers,
- trust-impacting correctness bugs when the package is used in sensitive workflows.

## Supported Versions

Security fixes are expected to be applied to the latest released version.

| Version | Supported |
|---|---|
| Latest release | Yes |
| Older releases | No guarantee |
| Unreleased branches/forks | No |

If you depend on this package in production, prefer upgrading to the latest release rather than expecting backports.

## Reporting a Vulnerability

If you believe you have found a security issue, please report it privately to the maintainers before opening a public issue.

Include as much of the following as possible:

- package version,
- affected API or file,
- proof of concept or reproduction steps,
- impact assessment,
- whether the issue affects runtime behavior, release trust, or data integrity,
- whether the issue is already exploitable by downstream consumers.

If a private reporting channel is available for your project, use that. If not, establish one before the first public production release. At minimum, maintainers should provide a dedicated security contact email or private issue/reporting path.

## What Counts as a Security Issue Here

Examples of issues that should be reported under this policy:

- arbitrary code execution,
- malicious package publish or release-process compromise,
- dependency or lockfile tampering that bypasses trust checks,
- cache-key or global-state bugs that can leak or mix results across callers,
- filesystem, command, or network behavior that exceeds the documented trust model,
- generated data manipulation that bypasses validation/integrity protections,
- vulnerabilities in dependencies that materially affect package consumers.

Examples of issues that may also qualify when impact is high:

- incorrect event or holiday output caused by ambiguous logic in sensitive workflows,
- cross-tenant behavior caused by mutable module-level state,
- undocumented runtime side effects that can corrupt caller expectations.

## What Usually Does Not Count as a Security Issue

These are still important, but they are generally handled as quality or product issues unless there is a clear security impact:

- unsupported-year requests returning `null` or `RangeError`,
- expected differences with third-party calendar sites,
- normal package limitations documented in the guides,
- feature requests,
- purely cosmetic documentation problems.

## Security Model

The package currently aims to follow these principles:

- No runtime scraping of third-party calendar websites during normal package use.
- Offline-first validation for routine development and CI.
- Deterministic generated-data integrity checks via manifest verification.
- Explicit provenance and usage-policy checks for curated festival and holiday datasets.
- UTC-safe date conversion behavior.
- Root-package public API with typed exports.

This package does **not** claim to be a legal or religious authority. Consumers must still apply their own business review for high-stakes use cases such as payroll, public-holiday compliance, or ritual scheduling.

## Current Security-Relevant Risks to Watch

Maintainers should pay special attention to:

- module-level mutable state,
- cache keys that omit behavior-affecting inputs,
- release integrity and npm publishing controls,
- dependency drift and lockfile hygiene,
- data-source provenance gaps,
- docs/examples that encourage unsafe or misleading usage.

## Recommended Maintainer Release Checklist

Before publishing a release, run:

```bash
pnpm typecheck
pnpm test
pnpm validate:panchang
pnpm legal:check
pnpm deps:check
pnpm trust:check
pnpm audit --prod
pnpm build
pnpm docs:build
```

If the release changes generated panchang data, also run:

```bash
pnpm trust:refresh-manifest
pnpm validate:cross -- --year 2082 --no-horizons
```

## Guidance for Consumers

If you use this package in production:

- pin versions explicitly,
- review release notes before upgrading,
- keep smoke tests for your most business-critical dates,
- treat event and holiday output as domain data, not as immutable legal truth,
- layer your own input validation, monitoring, and risk controls on top.

## Disclosure Expectations

When a report is confirmed:

1. Acknowledge the report privately.
2. Reproduce and assess impact.
3. Prepare a fix and regression test where possible.
4. Release the fix in the latest supported version.
5. Publish a clear advisory or release note if consumers need to take action.

## Security Improvements Worth Adding

The repository already has a solid trust foundation, but maintainers should consider adding:

- npm publish provenance,
- an SBOM for releases,
- a dedicated private reporting channel,
- periodic dependency review beyond automated audit output,
- stronger isolation around mutable runtime state.

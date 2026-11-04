# Security Policy

## Reporting

Email the maintainer directly, or open a GitHub security advisory
(**Security → Advisories → New draft security advisory**). Do **not** open a
public issue for anything exploitable.

## Scope

- Authentication changes (better-auth config bundles in `packages/core/src/auth/**` + the Vite middleware in `packages/frontend/vite.config.ts`)
- Credential handling (`.env*`, `*.p8` key material, anything OAuth)
- Anything in `packages/core` dealing with approvals, budgets, or the evidence vault

## Hard requirements for any auth-adjacent change

1. `AUTH_SECRET` must come from env outside local dev (dev fallback value exists and will be flagged in review).
2. Un-configured social providers must remain **unregistered** — the current design refuses with provider-not-found instead of partially working.
3. `.env*` and `*.p8` are git-ignored; never weaken that.
4. Client secrets are tested via `.env.local` only, never shared in chat or docs.

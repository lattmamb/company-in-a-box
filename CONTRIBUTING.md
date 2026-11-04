# Contributing

## Workflow

1. Branch from `main`: `git checkout -b feat/short-name`.
2. Change the smallest thing that fully fixes/extends the task; skip scope you weren't asked for.
3. Before finishing:
   ```bash
   pnpm typecheck
   pnpm test
   pnpm auth:build   # only if you touched packages/core/src/auth/**
   ```
4. Run-only lint changes don't create obligations; breaking types or data always need tests alongside the fix.
5. Commit messages: one clear line in the imperative ("fix google provider button gating"), no housekeeping noise.

## Rules

- Secrets/config: never in source, never in commits — `.env.local` is the single dev credential sink (git-ignored).
- Don't expand public interfaces unless the change requires it; cross-package imports go through `@company-in-a-box/<pkg>`.
- The auth bundle is prebuilt — see [docs/developer.md](docs/developer.md) before touching auth.
- Bug fixes address the root cause in shared code, not the symptom at one call site.

## Agent-assisted contributions

AI coding agents follow [AGENTS.md](AGENTS.md). Human reviewers: check that the agent rebuilt the auth bundle when auth sources changed, and that reported verification (exit codes, endpoints hit) is real.

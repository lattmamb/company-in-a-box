# Developer documentation

## Prerequisites

- Node 22+ (`node -v`)
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.0.0 --activate`, or `npm i -g pnpm@9`)

## Setup

```bash
pnpm install          # installs the pnpm workspace
pnpm dev              # turbo dev: frontend on http://localhost:5173,
                      # backend packages watch their own entrypoints
pnpm typecheck && pnpm test
```

### Local database

SQLite via libSQL. Set `DATABASE_URL` (+ `DATABASE_AUTH_TOKEN` for Turso) in
`packages/frontend/.env.local`; unset, dev falls back to a local SQLite file.
Schema pushes: `pnpm db:push`. Browse: `pnpm db:studio`.

## Auth module internals (the one non-obvious part)

`better-auth` lives in `packages/core/src/auth/index.ts`, but in dev it is
served through a **Vite middleware mounted at `/api/auth/*`** in
`packages/frontend/vite.config.ts`, which imports a **prebuilt esbuild bundle**:

```
packages/core/src/auth/index.ts
  ── pnpm auth:build ──► packages/core/dist/auth-handler.mjs
  ── imported by vite.config.ts middleware (with .env.local vars injected)
```

Consequences:

- **Any change under `packages/core/src/auth/**` requires `pnpm auth:build`** or
  the dev server keeps running stale auth code.
- Better-auth's effective base URL = `AUTH_BASE_URL` (default
  `http://localhost:5173`) + default basePath `/api/auth`. Therefore Google's
  authorized redirect URI must be exactly
  `http://localhost:5173/api/auth/callback/google` — see
  [packages/frontend/docs/oauth-setup.md](../packages/frontend/docs/oauth-setup.md).
- The middleware serves `/api/auth/*` before Vite proxies `/api` → `:3100`, so
  auth routes never hit the backend proxy.
- `GET /api/auth/config` gates provider buttons on the login/register pages;
  the pages hide buttons for unconfigured providers on purpose.

## Environment variables

See [AGENTS.md § Environment variables](../AGENTS.md#environment-variables-all-optional-safe)
for the full table. The short version: put anything secret in
`packages/frontend/.env.local` (git-ignored) — nothing else stores secrets.

## Testing & linting

- `pnpm test` — vitest per package (`packages/<pkg>/tests`)
- `pnpm lint` / `pnpm format` — oxlint / oxfmt workspace-wide

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `[better-auth] handler failed to load` in Vite log | stale/missing `packages/core/dist/auth-handler.mjs` | `pnpm auth:build` |
| Google button missing on `/login` | credentials not seen by the handler | check `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in `.env.local`, restart Vite, hit `/api/auth/config` |
| Provider button 404s | provider endpoints hit without credentials | by design — buttons should be hidden by the config gate |

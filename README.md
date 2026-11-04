# Company in a Box (CIAB)

**Unified agent platform — one application, one process, one codebase.**

Company in a Box merges org control, agent runtime, model gateway, memory, skills, taxonomy, and a member-facing frontend into a single local-first TypeScript monorepo (Node 22+, pnpm, Turborepo). No microservices, no Docker compose.

## Quick start

```bash
pnpm install
pnpm dev            # turbo dev across packages (frontend on http://localhost:5173)
pnpm typecheck      # tsc across the workspace
pnpm test           # vitest across the workspace
pnpm auth:build     # rebuild the better-auth esbuild bundle (packages/core/dist/auth-handler.mjs)
```

Email sign-in works out of the box (SQLite + better-auth). Google / Apple providers activate automatically once their credentials exist in `packages/frontend/.env.local` — see [packages/frontend/docs/oauth-setup.md](packages/frontend/docs/oauth-setup.md).

## Monorepo layout

| Package | Role |
|---|---|
| `packages/core` | Org control plane: agents, tasks, budgets, approvals + better-auth |
| `packages/runtime` | Agent execution engine (sessions, channels, tools, model routing) |
| `packages/gateway` | Model gateway (provider routing, fallbacks) |
| `packages/memory` | Knowledge layer: memory store, embeddings; optional memory proxy |
| `packages/a2a` | Agent-to-agent delegation bus |
| `packages/frontend` | React (Vite) member face, backend auth middleware for dev |
| `packages/skills` | Skill catalog + skill evolution |
| `packages/taxonomy` | Topic/dependency taxonomy — reasoning bedrock |
| `packages/intelligence` | Search, geospatial, design tooling |
| `packages/cli` | CLI entry |
| `packages/dev` | Dev workflow utilities |

Full stack description and layer mapping: [ARCHITECTURE.md](ARCHITECTURE.md).
Developer setup, environment variables, and auth internals: [docs/developer.md](docs/developer.md).

## Key docs

- [ARCHITECTURE.md](ARCHITECTURE.md) — design, merged layers, stack diagram
- [docs/developer.md](docs/developer.md) — getting set up as a developer/agent
- [packages/frontend/docs/oauth-setup.md](packages/frontend/docs/oauth-setup.md) — Google/Apple sign-in configuration
- [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md)

## License

MIT — see [LICENSE](LICENSE).

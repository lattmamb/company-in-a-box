# Company in a Box — Unified Architecture

**Single application. One codebase. All capabilities merged.**

---

## Core Philosophy

**One application. One process. One database. One API. One frontend.**

No microservices. No Docker compose. No separate services. Everything runs in a single Node.js process with embedded SQLite (libSQL) for local-first operation, with optional PostgreSQL for multi-user deployments.

---

## Layer Mapping (Merged)

| Original Repo | Capability | Merged Into |
|---------------|------------|-------------|
| **os-taxonomy** | 1,930 topics, 4,102 deps, 8 curricula | `packages/taxonomy` — mandatory reasoning bedrock |
| **Paperclip** | Org control, agents, tasks, budgets, approvals, evidence vault, finance packets | `packages/core` — org control plane |
| **OpenClaw** | Agent runtime, sessions, channels, tools, MCP, model routing | `packages/runtime` — agent execution engine |
| **OpenClaw A2A** | Agent-to-agent protocol | `packages/a2a` — agent delegation bus |
| **OmniRoute** | 353 providers, auto-fallback, combo routing | `packages/gateway` — model gateway |
| **OpenViking** | Memory, knowledge graph, embeddings | `packages/memory` — knowledge layer |
| **Headroom** | Memory proxy, Qdrant, Neo4j | `packages/memory/proxy` — memory proxy |
| **SkillClaw** | Skill evolution, claw adapters | `packages/skills/evolution` — skill evolution |
| **ECC** | 261 skills, hooks, rules | `packages/skills/catalog` — baseline skills |
| **Agency Agents** | 282 agents, 18 divisions | `packages/agents/roles` — specialist roles |
| **UnityLink OS** | Finance, fleet, evidence, control-plane bridge | `packages/domain/unitylink` — domain app |
| **Aether Ride** | Member app, booking, dashboard | `packages/frontend` — member face |
| **The Factory** | Worktree workflow, release automation | `packages/dev/worktree` — dev workflow |
| **SkillClaw** | Skill evolution, claw adapters | `packages/skills/evolution` |
| **Agent-Reach** | 14-platform search | `packages/intelligence/search` |
| **emilkowalski/skills** | Design engineering | `packages/frontend/design-system` |
| **open-saas** | Auth, billing, admin | `packages/core/auth`, `packages/core/billing` |
| **gods-eye-view** | 3D geospatial | `packages/intelligence/geospatial` |
| **design-extract** | Design extraction | `packages/intelligence/design-extract` |
| **rea** | Reverse engineering | `packages/intelligence/reverse-eng` |
| **opencli** | CLI registry | `packages/cli/registry` |

---

## Unified Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPANY IN A BOX                            │
│  Single Node.js Process (TypeScript, ESM, Node 22+)            │
├─────────────────────────────────────────────────────────────────┤
│  CLI                    │  REST API              │  WebSocket   │
│  (commander)            │  (Hono + OpenAPI)      │  (ws)        │
├─────────────────────────────────────────────────────────────────┤
│                        CORE SERVICES                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Org     │ │  Agent   │ │  Model   │ │  Memory  │          │
│  │  Control │ │  Runtime │ │  Gateway │ │  Layer   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                        DOMAIN LAYER                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │  Finance     │ │  Fleet       │ │  Evidence    │           │
│  │  (NOI/DSCR)  │ │  (VIN/Book)  │ │  (Vault)     │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                 │
│  libSQL (SQLite) — embedded, local-first, syncable to Postgres │
│  Vector: libSQL + sqlite-vec (FTS5 + RRF) — no external deps   │
│  Graph: libSQL + recursive CTEs — no Neo4j needed              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Package Structure (Monorepo)

```
company-in-a-box/
├── packages/
│   ├── core/                    # Org control plane (Paperclip merged)
│   │   ├── src/
│   │   │   ├── org/             # Companies, members, roles, budgets
│   │   │   ├── agents/          # Agent registry, provisioning, lifecycle
│   │   │   ├── tasks/           # Issues, tasks, pipelines, approvals
│   │   │   ├── evidence/        # Evidence vault, citations, audit export
│   │   │   ├── finance/         # Packets, NOI, DSCR, UCC-1, payments
│   │   │   ├── approvals/       # Human gates, audit trails
│   │   │   └── auth/            # Better Auth, API keys, JWT
│   │   └── package.json
│   │
│   ├── runtime/                 # Agent execution engine (OpenClaw merged)
│   │   ├── src/
│   │   │   ├── session/         # Session management, persistence
│   │   │   ├── channel/         # Telegram, Kimi, API, WebSocket
│   │   │   ├── tool/            # Tool registry, execution, sandbox
│   │   │   ├── skill/           # Skill loading, execution
│   │   │   ├── model/           # Provider routing, fallback
│   │   │   └── cron/            # Heartbeat, scheduled runs
│   │   └── package.json
│   │
│   ├── gateway/                 # Model gateway (OmniRoute merged)
│   │   ├── src/
│   │   │   ├── router/          # Combo routing, auto-fallback
│   │   │   ├── executor/        # Provider executors, translation
│   │   │   ├── cache/           # Response caching, semantic cache
│   │   │   ├── resilience/      # Circuit breaker, cooldown, lockout
│   │   │   └── billing/         # Cost tracking, budgets
│   │   └── package.json
│   │
│   ├── memory/                  # Knowledge layer (OpenViking + Headroom)
│   │   ├── src/
│   │   │   ├── vector/          # libSQL + sqlite-vec, embeddings
│   │   │   ├── graph/           # Recursive CTEs, relationships
│   │   │   ├── proxy/           # Memory proxy (Headroom merged)
│   │   │   ├── wiki/            # LLM Wiki (ingest, query, lint)
│   │   │   └── embeddings/      # Local embeddings (qwen3-embedding)
│   │   └── package.json
│   │
│   ├── skills/                  # Skills system (ECC + SkillClaw + Agency)
│   │   ├── catalog/             # Baseline skills (ECC 261 skills)
│   │   │   ├── engineering/
│   │   │   ├── security/
│   │   │   ├── testing/
│   │   │   └── ...
│   │   ├── evolution/           # Skill evolution (SkillClaw merged)
│   │   │   ├── capture/         # Session capture, summarization
│   │   │   ├── evolution/       # 3-stage pipeline (summarize→aggregate→execute)
│   │   │   ├── validation/      # Skill verifier, client validation
│   │   │   └── adapters/        # Claw adapters (OpenClaw, Hermes, Codex, etc.)
│   │   ├── roles/               # Specialist roles (Agency Agents 282)
│   │   │   ├── engineering/
│   │   │   ├── research/
│   │   │   ├── finance/
│   │   │   ├── security/
│   │   │   └── ...
│   │   └── package.json
│   │
│   ├── a2a/                     # Agent-to-agent protocol (OpenClaw A2A)
│   │   ├── src/
│   │   │   ├── protocol/        # JSON-RPC 2.0, task delegation
│   │   │   ├── skills/          # A2A skills (routing, quota, discovery)
│   │   │   └── server/          # A2A server
│   │   └── package.json
│   │
│   ├── intelligence/            # Intelligence layer
│   │   ├── search/              # Agent-Reach (14 platforms)
│   │   ├── geospatial/          # gods-eye-view (3D tiles, Cesium)
│   │   ├── design-extract/      # Design extraction (Figma, Chrome)
│   │   ├── reverse-eng/         # rea (reverse engineering)
│   │   └── package.json
│   │
│   ├── frontend/                # Unified frontend (Aether Ride + UnityLink)
│   │   ├── src/
│   │   │   ├── app/             # React 19, TanStack Router, TanStack Query
│   │   │   ├── components/      # shadcn/ui + emilkowalski skills
│   │   │   ├── design-system/   # Tokens, emilkowalski skills
│   │   │   ├── pages/           # Dashboard, booking, chat, finance
│   │   │   ├── contexts/        # Unity, Booking, Auth
│   │   │   └── hooks/           # Custom hooks
│   │   └── package.json
│   │
│   ├── dev/                     # Dev workflow (The Factory)
│   │   ├── worktree/            # Worktree workflow, PR automation
│   │   ├── release/             # Release automation
│   │   ├── sync/                # Submodule sync
│   │   └── package.json
│   │
│   ├── cli/                     # Unified CLI
│   │   ├── src/
│   │   │   ├── commands/        # commander.js commands
│   │   │   ├── registry/        # opencli registry
│   │   │   └── registry/        # Skill/agent registry
│   │   └── package.json
│   │
│   └── taxonomy/                # OS Taxonomy (mandatory bedrock)
│       ├── data/                # 1,930 topics, 4,102 deps, 8 curricula
│       ├── src/
│       │   ├── graph/           # Prerequisite graph, traversal
│       │   ├── verification/    # Baseline Team Gate (5 gates)
│       │   └── curricula/       # 8 curricula mappings
│       └── package.json
│
├── apps/
│   ├── cli/                     # CLI entry point
│   ├── api/                     # API server entry point
│   └── web/                     # Frontend entry point (Vite + React)
│
├── turbo.json                   # Turborepo config
├── package.json                 # Root package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

---

## Key Integration Points

### 1. Taxonomy Gate (Mandatory)
Every agent provisioning runs through `packages/taxonomy/src/verification.ts`:
- Gate 1: Taxonomy Load
- Gate 2: Prerequisite Trace
- Gate 3: Gap Analysis
- Gate 4: Ordered Answer Construction
- Gate 5: Validation Check

### 2. Agent Provisioning Flow
```
User Request → Paperclip Org → Taxonomy Gate → Runtime Provision → Skill Installation → A2A Registration → Ready
```

### 3. Model Request Flow
```
Agent Request → Runtime → Gateway Router → Combo Strategy → Provider Executor → Translation → Response
```

### 4. Skill Evolution Loop
```
Session Capture → Summarize → Aggregate by Skill → Evolve/Create → Verify → Validate → Publish
```

### 5. Memory Layer
```
Session → Vector (sqlite-vec) + Graph (recursive CTE) → Wiki Ingest → Query → Export
```

---

## Technology Choices

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Node 22+ (ESM) | Native TypeScript, no Bun dependency |
| Database | libSQL (SQLite) | Embedded, local-first, syncable to Postgres |
| Vector | libSQL + sqlite-vec | No external Qdrant/Neo4j needed |
| Graph | Recursive CTEs | No Neo4j needed |
| API | Hono + OpenAPI | Fast, typed, OpenAPI generation |
| CLI | commander.js | Standard, typed |
| Frontend | React 19 + TanStack Router/Query | Modern, typed, performant |
| UI | shadcn/ui + emilkowalski skills | Accessible, animated, design-engineered |
| Styling | Tailwind CSS v4 | Modern, fast |
| Build | Turborepo + Vite | Fast, incremental |
| Testing | Vitest + Node test runner | Fast, parallel |
| Linting | Oxlint + Oxfmt | Fast, strict |

---

## Deployment Modes

| Mode | Description | Use Case |
|-------|-------------|----------|
| **Local** | Single binary, embedded libSQL, no external deps | Personal, pilot |
| **Server** | PostgreSQL + libSQL sync, multi-user | Team, production |
| **Desktop** | Tauri wrapper, native menus, tray | Power users |

---

## Migration Strategy

1. **Phase 1**: Create monorepo structure, copy shared types/constants from Paperclip
2. **Phase 2**: Implement core org control (companies, agents, tasks)
3. **Phase 3**: Implement agent runtime (sessions, channels, tools)
4. **Phase 4**: Implement model gateway (router, executors, resilience)
5. **Phase 4**: Implement memory layer (vector + graph + wiki)
6. **Phase 5**: Implement skills system (catalog + evolution + roles)
7. **Phase 6**: Implement A2A protocol
8. **Phase 7**: Implement domain apps (finance, fleet, evidence)
9. **Phase 8**: Implement frontend (chat, dashboard, booking)
10. **Phase 9**: Implement CLI, dev workflow
11. **Phase 10**: Taxonomy gate enforcement, testing, docs

---

## Acceptance Criteria (MVP)

- [ ] Single `pnpm dev` starts API + Web + CLI
- [ ] `cib org create` → creates company with embedded libSQL
- [ ] `cib agent hire` → provisions agent, runs taxonomy gate, installs skills
- [ ] `cib task create` → creates issue, assigns agent, runs pipeline
- [ ] `cib chat "book a vehicle"` → routes to Chief of Staff → books via fleet → returns task card with evidence link
- [ ] `cib finance noi` → computes NOI/DSCR from live data, returns evidence packet
- [ ] `cib skill evolve` → runs evolution cycle, publishes verified skills
- [ ] `cib memory query "last booking"` → returns cited answer from vector+graph
- [ ] Frontend: Chat surface + Dashboard + Booking flow + Finance view
- [ ] All tests pass: `pnpm test` (unit + integration)
- [ ] TypeScript strict: `pnpm typecheck` passes
- [ ] Lint: `pnpm lint` passes

---

## License Strategy

| Component | License | Strategy |
|-----------|---------|----------|
| Core | MIT | Open source |
| Taxonomy | ODbL 1.0 / CC BY-SA 4.0 | Keep separate, vendor frozen copy |
| Skills | MIT | Open source |
| Frontend | MIT | Open source |
| Intelligence | MIT | Open source |

---

**This is the single source of truth. All implementation follows this architecture.**
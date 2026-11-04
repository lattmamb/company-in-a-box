# Paperclip Parity Matrix

CIAB implements every configurable feature and functioning element of
[Paperclip](https://github.com/paperclipai/paperclip). The authoritative
reference surface is the Paperclip REST API as consumed by
[`paperclip-mcp`](https://github.com/wizarck/paperclip-mcp) (its README
documents the full tool surface). CIAB exposes the same endpoints on
`http://localhost:3100/api`, so a Paperclip MCP client works by pointing
`PAPERCLIP_BASE_URL` at it.

Status legend: ✅ implemented and tested · ➖ not part of Paperclip's API surface (CIAB extra)

## Issues (tasks)

| Paperclip endpoint | CIAB route | Status |
|---|---|---|
| `GET /companies/{id}/issues?status=&assigneeAgentId=&projectId=&label=&limit=` | same | ✅ |
| `POST /companies/{id}/issues` (title, description, assigneeAgentId, projectId, parentIssueId, priority) | same | ✅ |
| `GET /issues/{id}` (UUID **or** human identifier like `TSK-42`) | same | ✅ |
| `PATCH /issues/{id}` (partial update) | same | ✅ |
| `DELETE /issues/{id}` | same | ✅ |
| `POST /issues/{id}/checkout` — atomic claim; 409 if another agent owns it | same | ✅ |
| `POST /issues/{id}/release` — unassign + revert to `todo` | same | ✅ |
| `POST /issues/{id}/comments` (body, reopen) | same | ✅ |

Checkout semantics match Paperclip: single atomic UPDATE guarded on
`assignee_agent_id IS NULL OR = caller`, closed issues (`done`/`cancelled`)
cannot be checked out, and the execution lock columns
(`executionLockedAt`, `executionAgentNameKey`) are stamped.

Priority mapping: Paperclip's `urgent` is accepted as a first-class value.

## Agents

| Paperclip endpoint | CIAB route | Status |
|---|---|---|
| `GET /agents/me` (caller from API key) | same | ✅ |
| `GET /agents/{id}` | same | ✅ |
| `POST /agents/{id}/heartbeat/invoke` — immediate work cycle | same | ✅ |
| — | `GET /companies/{id}/agents` (list/filter) | ➖ CIAB extra |

Auth is Paperclip-style Agent API keys: `Authorization: Bearer cib_…`
(SHA-256-hashed at rest, prefix-indexed, revocable, expiring — see
`agent_api_keys` table). The key resolves the calling agent and implicitly
scopes every company route.

## Goals

| Paperclip endpoint | CIAB route | Status |
|---|---|---|
| `GET /companies/{id}/goals` | same | ✅ |
| `POST /companies/{id}/goals` (title, description) | same | ✅ |
| `PATCH /goals/{id}` (title, description) | same | ✅ (adds `status`: active/achieved/archived) |

## Approvals

| Paperclip endpoint | CIAB route | Status |
|---|---|---|
| `GET /companies/{id}/approvals?status=pending\|approved\|rejected\|revision_requested` | same (also `blocked`, `expired`) | ✅ |
| `POST /approvals/{id}/approve` (comment) | same | ✅ |
| `POST /approvals/{id}/reject` (comment) | same | ✅ |
| `POST /approvals/{id}/request-revision` (comment required) | same | ✅ |

Decisions are single-shot: only a `pending` request can be decided; the
second decision attempt returns 409.

## Monitoring

| Paperclip endpoint | CIAB route | Status |
|---|---|---|
| `GET /companies/{id}/costs/summary` — spend, tokens, per-agent breakdown, remaining budget | same | ✅ |
| `GET /companies/{id}/dashboard` — agent count, open/in-progress/blocked/stale issues, recent activity, period cost | same | ✅ |
| `GET /companies/{id}/activity?agentId=&limit=` — audit trail | same | ✅ |
| — | `POST /companies/{id}/costs` (record usage) | ➖ CIAB extra (gateway + runtime report here) |

## CIAB extensions beyond the Paperclip surface

These exist in Paperclip's product but are not in the MCP tool surface, or are
CIAB-specific domains; both are served by the same API:

- **Evidence vault** — content-addressed (sha256) evidence items with status
  lifecycle, sources, and citations: `GET/POST /companies/{id}/evidence`,
  `GET/PATCH /evidence/{id}`.
- **Finance packets** — versioned, hash-chained documents (NOI, DSCR, UCC-1,
  payment schedules): `GET/POST /companies/{id}/finance-packets`,
  `GET /finance-packets/{id}`, `POST /finance-packets/{id}/versions`,
  `PATCH /finance-packets/{id}`.
- **Audit events** — immutable decision-grade log separate from activity
  (`audit_events` table, written by all services).
- **Org & fleet** — companies, members/invites, agent provisioning with
  taxonomy gate verification, pause/resume/terminate, budgets per agent.

## Mapping to Paperclip concepts without a direct endpoint

| Paperclip concept | CIAB implementation |
|---|---|
| Agent heartbeats/schedules | `agents.runtimeConfig.heartbeat.intervalMs` + `lastHeartbeatAt`; invoke endpoint for manual cycles |
| Agent permissions | `agents.permissions` (canApproveTasks, canManageFinance, …) |
| Cost budgets | `agents.budgetMonthlyCents` + `cost_entries` aggregation → `remainingBudgetCents` |
| Issue labels | `issues.labels` (JSON array, filterable via `?label=`) |
| Subtasks | `issues.parentId` via `parentIssueId` on create |

## Verification

- `pnpm typecheck` — all 9 packages green.
- `pnpm --filter @company-in-a-box/core test` — 23 tests covering checkout
  atomicity/conflict, release ownership, reopen-on-comment, approval
  single-decision, revision-comment requirement, evidence dedup by sha256,
  packet version hash-chaining, cost summary math, dashboard, activity filters.
- Live smoke: server booted on :3100, seeded company/agent/key, and every
  endpoint above exercised with curl (checkout → comment → heartbeat → goal →
  approval approve → cost record → summary → dashboard → release).

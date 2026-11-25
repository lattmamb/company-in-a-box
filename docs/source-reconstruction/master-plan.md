# Company in a Box: Source Reconstruction Master Plan

## Mission
Reconstruct a new, unified, original developer harness and agent ecosystem for UnityLink OS by examining each selected source repository, deriving a repository-specific developer specification from evidence, extracting reusable capabilities and design principles, and implementing those capabilities as coherent modules in Company in a Box.

The target is not a copy-and-paste aggregation or a set of competing agents. The target is one governed ecosystem with a common execution model, contracts, state, tools, permissions, testing, and traceable outcomes.

## Status and evidence boundary
- This document is the initial plan, not proof that all repositories have been audited or implemented.
- Source repositories must be inspected individually. README claims are hypotheses until checked against source, tests, manifests, configuration, and behavior.
- No source project is considered reproduced, installed, executed, or validated until the relevant evidence and test results are recorded.
- Upstream licenses, notices, attribution, dependencies, and incompatible design assumptions must be tracked before code reuse.

## Reconstruction method

For every source repository, complete these gates in order:

1. **Inventory and identity**: confirm canonical repository, owner, upstream/fork relationship, default branch, license, commit SHA, status, language/runtime, top-level tree.
2. **Repository archaeology**: inspect README and maintainer instructions, manifests, source, tests, workflows, examples, configs, docs, entrypoints, and relevant history. Follow actual source paths, not README-only descriptions.
3. **Capability decomposition**: enumerate features, workflows, components, interfaces, data models, dependencies, events, permissions, persistence, side effects, failure modes, and test coverage.
4. **Repository Developer Specification**: write a stand-alone, implementation-ready spec with evidence links and file/symbol references. Mark facts, inferred behavior, proposals, and unknowns separately.
5. **Capability extraction**: identify what to adopt, adapt, reference, defer, reject, or replace. Explain why. Detect overlap with other sources.
6. **Contract mapping**: map source behavior to the Company in a Box canonical contracts, package boundaries, schemas, workflow APIs, tools, policies, and tests.
7. **Reconstruction design**: specify the original unified implementation, including preserved behavior, intentionally changed behavior, removed duplication, compatibility requirements, and migration path.
8. **Implementation plan**: create small tasks with exact paths, interfaces, tests, dependencies, acceptance criteria, and verification commands.
9. **Test-first implementation**: write failing tests, verify the failure, implement the minimum, verify passing tests, refactor, and run broader suite.
10. **Independent verification**: validate traceability, tests, security, licenses, UX, regressions, and source-to-target parity. Report unimplemented, unverified, and rejected capabilities explicitly.

## Source-method roles

- **REA**: source-led investigation, reverse engineering, behavior tracing, evidence capture.
- **Reverse-skill**: task/scenario routing, scope and authorization checks, tool selection, repeatable playbooks.
- **Taste Skill**: frontend art direction, layout and interaction quality, reference-informed design, browser-based quality checks.
- **Impeccable**: design-system rules, design critique/audit, deterministic anti-pattern checks, UX writing and accessibility/quality gates. Keep it complementary to Taste Skill; reconcile overlap rather than run duplicate review loops.
- **Be Ambitious**: Altitude (outcome), Depth (expert rigor), Range (cross-domain methods), with external evidence or benchmarks as judges. Scope must improve outcomes, not inflate deliverables.
- **Compound Engineering**: design/review/implementation/verification cycles that preserve reusable learning and improve the next cycle.
- **Harness Engineering**: agent roles and team patterns, task coordination, context/skills generation, handoffs, dry-runs, validation and failure handling.
- **Spec-driven development**: requirements and acceptance tests become the binding implementation contract.

These are source methods to examine and synthesize, not authorities that override Company in a Box governance.

## Canonical repository spec format

Each source repository receives an individual specification with:

1. Repository identity and provenance (canonical upstream, fork, SHA, license)
2. Purpose, users, problems solved
3. Scope, non-goals, and anti-goals
4. Top-level structure and runtime/build/deployment
5. Architecture and component responsibilities
6. Capability inventory (complete, itemized)
7. Workflow and behavioral traces (entrypoint through side effects)
8. Data models, schemas, persistence, and state transitions
9. Interfaces, APIs, commands, events, tools, and contracts
10. Dependencies and integration boundaries
11. Instructions, skills, prompts, routing, and agent behaviors (where present)
12. Permissions, security, privacy, failure modes, and recovery
13. Tests, benchmarks, validation, and evidence of quality
14. Design/UX requirements and quality criteria (where applicable)
15. Operational requirements and observability
16. Known limitations, risks, and unresolved questions
17. License/attribution/third-party obligations
18. Company in a Box disposition: Adopt / Adapt / Reference / Defer / Reject, with rationale
19. Target capability and package mapping
20. Acceptance criteria and parity tests
21. Reconstruction implementation plan
22. Source evidence index (paths, symbols, lines, commit refs)
23. Symbols/features not yet examined (mechanical completeness list)

## Company in a Box canonical contracts
Before integrating reconstructed capabilities, define and enforce common contracts for:
- Agent, role, skill, tool, task, workflow, project, organization, context, memory, artifact, evidence, decision, approval, budget, policy, and event
- Lifecycle/status and state-transition rules
- Task input/output schemas, dependencies, provenance, and idempotency
- Tool permission scopes, risk classification, approvals, and audit events
- Context loading, source priority, memory retention, and lossless artifact handling
- Agent-to-agent handoff, cancellation, retries, timeouts, backpressure, and failure recovery
- Provider/model abstraction, routing, fallbacks, cost/usage accounting
- Test/evaluation harness, quality gates, benchmark and regression records
- Human approval for external commitments, sensitive data, spending, credentials, destructive operations, or irreversible changes

## Integration principles
- One authoritative state model; no duplicate databases for overlapping capabilities without an explicit reason.
- Modular monolith first: cohesive packages and stable internal contracts, not premature microservices.
- Runtime and model providers are replaceable; domain logic and evidence should not be locked to one model.
- Folder/context + explicit instructions + evidence/state + callable tools should be inspectable and governable.
- Agents are capabilities/workers, not autonomous authorities. A coordinator assigns bounded tasks; permissions stay enforced outside the model.
- Research results and repository claims preserve citations/provenance.
- Every capability has a testable contract, failure behavior, and an accountable owner.
- Keep UnityLink domain logic isolated from generic harness capabilities, while the system can load UnityLink's policies and business context.
- Preserve upstream intellectual property notices and honor licenses; prefer clean-room specification and original implementation where appropriate.

## Phases and exit criteria

### Phase 0 — Inventory and source register
Normalize the complete repository list, remove duplicate entries, confirm identities and upstream relationships, assign categories and audit priority. Exit: no repository silently omitted; status and provenance recorded.

### Phase 1 — Methodology specifications
Audit REA, Reverse-skill, Taste Skill, Impeccable, Be Ambitious, Compound Engineering, Harness, and spec-driven development. Produce individual method specs and a synthesized Company in a Box method. Exit: conflicts, overlaps, retained mechanisms, and unified workflow explicitly documented.

### Phase 2 — Source-by-source developer specifications
Audit each repository individually using the canonical spec. Batch reading is allowed, but each repo has its own evidence, spec, disposition, target mapping, and acceptance criteria. Exit: all inventory entries accounted for, including not-audited/blocked labels if necessary.

### Phase 3 — Canonical architecture and contracts
Define the target architecture, package map, schemas, APIs, event model, permissions, state model, context/memory policy, runtime boundaries, and test/evaluation architecture. Exit: contracts reviewed for compatibility and duplication.

### Phase 4 — Capability reconstruction
Implement approved capabilities from source-derived specs in dependency order. Use test-first development and small reviewable changes. Exit: each capability meets its spec and integration tests.

### Phase 5 — Unified harness integration
Integrate skills/routing, agent lifecycle, task/workflow orchestration, context, memory, tools, approvals, provider gateway, evidence, evaluation, UX, and Company operations. Exit: end-to-end workflows work through the unified system.

### Phase 6 — Verification and operational readiness
Run full tests, builds, type checks, security checks, license review, UX checks, source parity and traceability audit, recovery tests, and end-to-end scenarios. Exit: no false completion claims; unresolved issues are documented and the release gate is satisfied.

## Prioritization
Build foundational contracts before high-level agents. Prioritize capabilities by dependency, leverage, UnityLink relevance, security risk, and measurable operational value. Do not prioritize by repository popularity or number of agents.

## Initial capability order (provisional)
1. Source register, evidence/spec pipeline, and governance
2. Canonical context/taxonomy/instruction and artifact/evidence contracts
3. Harness task lifecycle, workflow engine, agent registry, tool permissions, approvals
4. Runtime, sessions, model/provider routing, tool adapters, persistence
5. Skills catalog, routing, evaluation, learning/compound improvement
6. Research and reverse-engineering workflows
7. Company operational capabilities and UnityLink domain integration
8. User interface, design system, and browser QA
9. Autonomy and advanced delegation only after reliability gates

This order is provisional and must be updated from actual dependency and source analysis.

## Completion standard
A repository is not “reconstructed” merely because its README feature is represented. A capability counts as reconstructed only when its source behavior and intended scope are understood, its target contract is defined, implementation exists, acceptance tests pass, integration behavior is verified, and deviations are documented.

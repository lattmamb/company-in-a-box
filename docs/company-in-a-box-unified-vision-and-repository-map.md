# Company in a Box for UnityLink OS
## Unified application vision and repository contribution map

**Status: Conceptual capability map. Not a completed source audit.**

This document describes what the combined repository collection could contribute to one new application: Company in a Box (CIAB), built as the unified agent ecosystem for UnityLink OS. Repository roles below are preliminary interpretations based on project identity and available descriptions. They are not assertions that every repository has been inspected, installed, tested, or integrated.

## Executive summary

Company in a Box is envisioned as a single governed workspace where a person can direct a company and its projects through AI-assisted research, planning, engineering, operations, finance, knowledge, tools, and agents. Instead of opening a separate app for every skill or managing a swarm of disconnected bots, users give outcomes; CIAB assembles the context, methods, workers, tools, approvals, and verification needed to accomplish bounded work.

**User experience:** describe a goal, inspect the proposed plan and evidence, approve protected actions, observe execution, receive deliverables, and track the real outcome.

**Design principle:** unify capabilities and contracts, not blindly merge code. Extract, specify, reconcile, rebuild, test, and integrate.

## What it would feel like inside the application

- **Company dashboard:** company status, projects, priorities, active tasks, blockers, decisions, financial/operational signals, and outcomes.
- **Command/goal input:** a natural-language request with context-aware clarifying prompts only when essential.
- **Work plan:** objectives, subtasks, dependencies, assigned capability/worker, tools, deadlines, cost/risk estimates, approval gates, and acceptance criteria.
- **Research room:** sources, extracted evidence, contradictions, confidence, citations, notes, and decision records.
- **Engineering workspace:** requirement/spec, task contracts, code changes, tests, reviews, preview and release status.
- **Agent/workforce view:** agents and skills as bounded capabilities; what they are doing, context used, permissions, tool activity, handoffs, and status.
- **Memory and knowledge:** searchable company knowledge with provenance, source freshness, and explicit distinctions between facts, decisions, assumptions, and proposals.
- **Approval inbox:** signatures, spending, external communications/commitments, banking, sensitive access, destructive changes, and irreversible actions require appropriate human approval.
- **Artifact cabinet:** documents, code, plans, reports, spreadsheets, datasets, evidence packages, and versions.
- **Learning/evaluation:** quality scorecards, test results, failures, reusable lessons, and regression/evaluation history.
- **Business modules:** company setup, operations, legal/admin, finance, sales/marketing, product, customer/member workflows, and domain-specific UnityLink modules.
- **Automation:** recurring or event-triggered workflows with transparent schedule, scope, logs, guardrails, pause/stop controls, and outcomes.

## Unified operating loop

`Intent \rightarrow Context \rightarrow Research/Method \rightarrow Spec/Plan \rightarrow Authorized Execution \rightarrow Verification \rightarrow Outcome \rightarrow Learning`

A coordinator may delegate work, but models do not grant themselves permissions. Authorization, budget, policy, tool scope, and approval gates are enforced by the application.

---

## Repository contribution map

Each source is assigned a **primary contribution** to the envisioned application. “User experience” describes what a capability could enable. These entries are hypotheses pending individual repository audits.

### 1. Context, operating system, company knowledge and architecture

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [Interpreted-Context-Methdology](https://github.com/lattmamb/Interpreted-Context-Methdology) | Context interpretation and instructions/context engineering | Goal intake that loads and interprets the right domain rules, project files, policies and prior decisions instead of treating every prompt in isolation. |
| [os-taxonomy](https://github.com/lattmamb/os-taxonomy) | Canonical capability, domain and agent taxonomy | Organized company map: capabilities, departments, skills, projects, knowledge types, tools and workflows are classified consistently and discoverable. |
| [Personal_AI_Infrastructure](https://github.com/lattmamb/Personal_AI_Infrastructure) | Personal AI system architecture and infrastructure concepts | User-configurable assistant environment with persistent context, local/cloud options, tools, and private operating preferences. |
| [unitylink-os](https://github.com/lattmamb/unitylink-os) | UnityLink domain operating context and business system | UnityLink-specific control panel and operational workflows, kept as a domain layer rather than hard-coded into generic CIAB. |
| [company-in-a-box](https://github.com/lattmamb/company-in-a-box) | Base unified application and package architecture | The actual CIAB shell, shared services, runtime, frontend, memory, skills, taxonomy, gateway and developer tooling to evolve. |
| [LifeOS](https://github.com/danielmiessler/LifeOS) | Personal goals, life/work context and organizing principles | Optional personal dashboard connecting goals, projects, priorities, habits and reflections while keeping company state distinct from personal data. |
| [openmind](https://github.com/lattmamb/openmind) | Open-minded context or agent-system exploration (role to confirm from source) | Candidate capability for flexible knowledge and reasoning; no specific feature should be promised before audit. |
| [billion-context](https://github.com/lattmamb/billion-context) | Large-context techniques and context management research | Long-project context navigation, relevant evidence retrieval, and handling larger source collections efficiently, subject to actual model limits. |
| [context-mode](https://github.com/lattmamb/context-mode) | Context isolation and task-specific context assembly | Workers receive relevant files, rules and evidence instead of indiscriminately receiving the whole workspace. |
| [lossless-claw](https://github.com/Martian-Engineering/lossless-claw) | Loss-preserving conversation/context capture (candidate) | Preserve source material and context during compaction, summarization or handoffs; audit exact behavior and privacy implications first. |
| [Understand-Anything](https://github.com/lattmamb/Understand-Anything) | Codebase comprehension and structural exploration | A visual or navigable project map showing modules, dependencies and relationships to help users understand unfamiliar repos. |
| [omi](https://github.com/lattmamb/omi) | Personal capture/context platform candidate | Potential input stream for user notes, conversations or ambient context; source audit and consent/privacy review required before integration. |
| [openmind](https://github.com/lattmamb/openmind) | Knowledge/reasoning candidate | Research candidate only; confirm actual repository function before assigning implementation scope. |

### 2. Methodology, skills, instructions, quality and continuous improvement

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [SkillClaw](https://github.com/lattmamb/SkillClaw) | Skill discovery, routing, invocation and lifecycle concepts | Work is matched to reusable procedures; user can inspect the method selected and its prerequisites. |
| [skills](https://github.com/lattmamb/skills) | Skill definitions and catalog | A searchable library of instructions and procedures, installable/assignable to workers and workflows. |
| [agents.md](https://github.com/lattmamb/agents.md) | Agent instruction-file conventions | Project-specific operating instructions that workers can read consistently, with precedence and scope rules. |
| [reverse-skill](https://github.com/lattmamb/reverse-skill) | Reverse engineering skill/method routing | Investigation workflows selected by target type and task; structured evidence and findings. |
| [nuwa-skill](https://github.com/lattmamb/nuwa-skill) | Skill or agent method candidate | Potential reusable workflow/method module; detailed contribution pending source audit. |
| [last30days-skill](https://github.com/lattmamb/last30days-skill) | Recent-source research workflow | A “what changed recently?” research mode with recency-aware source discovery, evidence and concise briefing. |
| [openclaw-plugin-intention-hint](https://github.com/lattmamb/openclaw-plugin-intention-hint) | Intent interpretation/assistance plugin | Requests can be refined into explicit intent, useful constraints and likely next steps before execution. |
| [compound-engineering-plugin](https://github.com/lattmamb/compound-engineering-plugin) | Iterative engineering method and learning capture | Engineering work follows planned stages, reviews, tests, and captures reusable knowledge so future work benefits. |
| [superpowers](https://github.com/lattmamb/superpowers) | Software-development discipline and skill workflows | Guided brainstorming, planning, test-first implementation, debugging and verification instead of improvisational coding. |
| [impeccable](https://github.com/lattmamb/impeccable) | Design rules, critique and UI quality method | Design review checks hierarchy, consistency, UX writing, accessibility and visual anti-patterns. |
| [be-ambitious](https://github.com/robonuggets/be-ambitious) | Outcome elevation and external validation | Plans are challenged for altitude, depth and range; weak goals get a stronger target and measurable expert-standard validation. |
| [taste-skill](https://github.com/Leonxlnx/taste-skill) | Art direction, reference-driven UI design and browser validation | Frontend creation with deliberate visual direction and a browser-based quality pass, not generic template output. |
| [ponytail](https://github.com/lattmamb/ponytail) | Assistant/personality or interaction methodology candidate | Potential interaction tuning or behavioral customization; exact function and safe boundaries must be source-confirmed. |
| [evolver](https://github.com/lattmamb/evolver) | Agent/system evolution and improvement candidate | Evaluation-driven improvement proposals; changes should be tested, reviewed and reversible, never self-authorized production mutation. |
| [OpenAlpha_Evolve](https://github.com/shyamsaktawat/OpenAlpha_Evolve) | Evolutionary optimization/research candidate | Experiments can explore alternatives and compare measurable performance; strict resource budgets and reproducible experiments. |
| [Caveman](https://github.com/JuliusBrussee/caveman) | Concise interaction / reduced-noise behavior candidate | Optional low-noise response mode: brief, action-oriented updates and fewer tokens; exact implementation to audit. |
| [openclaw-skill-tobehuman](https://github.com/Holmes-mo/openclaw-skill-tobehuman) | Human-style writing skill candidate | Drafts that sound natural and audience-appropriate, with authenticity and disclosure safeguards. |
| [prompt-library](https://github.com/thibaultyou/prompt-library) | Prompt patterns and examples | Reusable prompt templates surfaced by task type, editable and versioned rather than scattered across chats. |
| [prompts.chat](https://github.com/f/prompts.chat) | Community prompt library/reference | Browse, adapt and save prompt recipes; candidates evaluated before becoming trusted skills. |
| [prompt-optimizer](https://github.com/linshenkx/prompt-optimizer) | Prompt optimization | Compare prompt variants against a defined test set and objective; retain reproducible winners and regression checks. |
| [agent-native](https://github.com/lattmamb/agent-native) | Agent-native product design principles | Features are designed around agent execution, machine-readable state, tools and workflows instead of adding chat as a superficial interface. |
| [12-factor-agents](https://github.com/lattmamb/12-factor-agents) | Principles for robust agent construction | Agents designed with bounded context, explicit control flow, structured interfaces, observable actions and testability. |
| [agent-skills/agentskills](https://github.com/agentskills/agentskills) | Skill format/interoperability reference | Portable skills with consistent packaging, metadata, discoverability and instruction boundaries. |
| [openmeth](https://github.com/twalapjs1622/openmeth) | Methodology candidate | Potential method/workflow contribution; exact role remains unverified until inspected. |
| [harness](https://github.com/lattmamb/harness) | Agent team/harness generation | Build task-specific teams, roles, context and skills from a job specification; validate the generated structure before running it. |
| [awesome-harness-engineering](https://github.com/lattmamb/awesome-harness-engineering) | Harness research collection | Reference index for patterns and examples; research input, not a runtime dependency. |
| [Master-Orchestrator-Agent-System](https://github.com/nafisjaleel/Master-Orchestrator-Agent-System) | Multi-agent coordination design candidate | Potential planning, delegation, progress aggregation and worker coordination; compare against CIAB's canonical orchestrator before adoption. |
| [agent-teams-ai](https://github.com/lattmamb/agent-teams-ai) | Team/worker coordination candidate | Collaborative task execution with role boundaries, shared task state and structured handoffs, subject to source verification. |
| [agent-bank](https://github.com/different-ai/agent-bank) | Agent definitions and workforce catalog | Browse/select reusable agent capabilities and templates; convert useful entries into governed CIAB worker profiles. |
| [paperclip](https://github.com/lattmamb/paperclip) | Organizational agent control/orchestration candidate | Potential company-level task, role and orchestration structure; reconcile with CIAB core rather than run a second control plane. |
| [ECC](https://github.com/lattmamb/ECC) | Engineering configuration/instructions baseline candidate | Reusable coding and agent operating standards, checklists and configuration; extract only source-confirmed useful controls. |

### 3. Harness, runtime, delegation, computer use and agent protocols

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [opencode](https://github.com/lattmamb/opencode) | Coding-agent interaction/runtime reference | A developer workbench for code exploration, edits, terminal/tool actions and iterative development. |
| [Open-AutoGLM](https://github.com/lattmamb/Open-AutoGLM) | GUI/computer automation agent | Bounded desktop tasks: navigate interfaces, operate controls and complete UI workflows with visible execution and approval gates. |
| [droidrun](https://github.com/lattmamb/droidrun) | Mobile UI agent/computer control | Mobile app workflow automation for supported devices, with task plans and action evidence. |
| [mac-mini-agent](https://github.com/disler/mac-mini-agent) | Mac agent and local computer orchestration | Remote or local Mac workflows, app/desktop operations and controlled task execution. |
| [cheating-daddy](https://github.com/sohzm/cheating-daddy) | Real-time agent assistance during computer workflows (candidate) | Potential screen-aware assistance and context support; privacy, use-case and source review before inclusion. |
| [CLI-Anything](https://github.com/HKUDS/CLI-Anything) | Convert software into agent-usable CLI workflows | Agents gain structured command interfaces to software that otherwise requires manual GUI interaction, with generated CLI tests. |
| [opencli](https://github.com/lattmamb/opencli) | CLI/tool interface and command workflow candidate | Unified command surface for users and agents; inspect to determine overlap with CLI-Anything and CIAB's tool registry. |
| [A2A Python](https://github.com/lattmamb/a2a-python) | Agent-to-agent protocol implementation | Agents or external agent systems exchange tasks, status and results through a standard protocol boundary. |
| [a2a-x402](https://github.com/lattmamb/a2a-x402) | Agent interoperability with payment/HTTP 402 concepts | Potentially enables agent service discovery/transactions or paid task flows; payment actions require policy, spending limits and explicit approvals. |
| [agent-tincan](https://github.com/lattmamb/agent-tincan) | Agent communication/interoperability candidate | Potential portable message or agent-to-agent communication mechanism; exact protocol role must be verified. |
| [CopilotKit](https://github.com/lattmamb/CopilotKit) | Agent-aware frontend and human-in-the-loop UI | Embedded assistant interfaces, streaming state, approvals and UI actions tied to application state. |
| [rea](https://github.com/lattmamb/rea) | Reverse engineering and software investigation toolset | User selects a system/repo/app; CIAB assembles an investigation, runs supported inspections and produces a traceable findings dossier. |
| [OpenMythos](https://github.com/lattmamb/OpenMythos) | Agent/model/system research candidate | Experimental capability or research source; contribution requires source-level identification and validation. |
| [OpenViking](https://github.com/volcengine/OpenViking) | Context/memory infrastructure candidate | Structured context retrieval and management for agents, potentially improving access to documents, skills, memories and resources. |
| [Archon](https://github.com/coleam00/Archon) | AI coding workflow, knowledge and task-management reference | Developer project workflow with knowledge, plans, tasks and coding-agent integration; compare and extract rather than duplicate. |
| [OpenMausBot](https://github.com/milind-soni/OpenMausBot) | Agent/automation bot candidate | Potential conversational or automation worker; detailed behavior must be verified. |
| [Master Orchestrator](https://github.com/nafisjaleel/Master-Orchestrator-Agent-System) | Orchestration pattern candidate | Delegates bounded work and combines worker outputs under shared contracts, if compatible with the CIAB harness. |

### 4. Engineering, code generation, developer environment and testing

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [build-your-own-x](https://github.com/lattmamb/build-your-own-x) | Build-from-first-principles learning references | Learning and engineering mode that explains and reconstructs systems rather than treating dependencies as black boxes. |
| [ai-engineering-from-scratch](https://github.com/lattmamb/ai-engineering-from-scratch) | AI engineering foundations and implementation references | Developer education, grounded design choices and reference implementations for AI components. |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Spec-driven development workflow | Projects can define changes, specs, tasks and acceptance criteria before implementation, with change artifacts visible and reviewable. |
| [compound-engineering-plugin](https://github.com/lattmamb/compound-engineering-plugin) | Engineering workflow and improvement loops | Plan, implement, review, verify and preserve reusable engineering knowledge. |
| [superpowers](https://github.com/lattmamb/superpowers) | Test-first and disciplined development skills | Guided TDD, debugging, planning, review and verification workflows. |
| [harness](https://github.com/lattmamb/harness) | Generated developer/agent harnesses | Build a specialized execution environment for a task or project, rather than hand-assembling agents. |
| [headroom](https://github.com/lattmamb/headroom) | Token/context capacity management candidate | Context-budget visibility, usage management or optimization; exact functionality needs source inspection. |
| [OpenMythos](https://github.com/lattmamb/OpenMythos) | Software/agent research candidate | Experimental implementation input; use only after verified scope and license review. |
| [Census_Classification](https://github.com/JordyKieto/Census_Classification) | Classification/ML example | Data science learning and a reusable pattern for data classification pipelines, not necessarily a production module. |
| [coding-interview-university](https://github.com/jwasham/coding-interview-university) | Computer science learning curriculum | Personal learning paths and foundations for developers/agents; course material, not runtime functionality. |
| [CLI-Anything](https://github.com/HKUDS/CLI-Anything) | Agent-facing CLI creation | Make software operations repeatable, inspectable and testable through command interfaces. |
| [opencli](https://github.com/lattmamb/opencli) | CLI framework/tooling candidate | Expose supported workflows as commands; consolidate command registration, schemas and execution logs. |
| [rea](https://github.com/lattmamb/rea) | Code/system reverse engineering | Generate architecture, behavior and implementation evidence before modification or migration. |
| [Understand-Anything](https://github.com/lattmamb/Understand-Anything) | Code understanding | Project maps, code relationships and explanations for developers and coding agents. |
| [agent-spec](https://github.com/ZhangHanDong/agent-spec) | Intent-to-contract compiler reference (external discovery) | Potential requirements IR, task contracts and deterministic verification pipeline; it was discovered during research but was not in the user's original repository inventory. Treat as an optional reference, not included in the source set. |

### 5. Model access, local AI, inference, routing and mobile AI

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [apple-on-device-openai](https://github.com/lattmamb/apple-on-device-openai) | Apple-device AI integration candidate | Local/on-device model interaction for supported Apple hardware, improving offline and privacy-sensitive workflows. |
| [Apple-Intelligence-Chat](https://github.com/lattmamb/Apple-Intelligence-Chat) | Apple Intelligence chat interface/reference | Native Apple intelligence interaction as an optional provider or client experience. |
| [macLLM](https://github.com/appenz/macLLM) | Local Mac LLM access | Manage or use local models from Mac environments, subject to supported hardware and actual repository capabilities. |
| [LocalAI](https://github.com/mudler/LocalAI) | Self-hosted local model serving | Local inference endpoints and model choice without routing every prompt through a cloud provider. |
| [OmniRoute](https://github.com/lattmamb/OmniRoute) | Model/provider routing and API compatibility candidate | Select models by task, availability, policy, cost, latency or context capability; preserve a provider-neutral interface. |
| [freellmapi](https://github.com/tashfeenahmed/freellmapi) | Free/public LLM API access aggregator candidate | Optional low-cost/free model access, with reliability, terms, rate limits and privacy surfaced rather than hidden. |
| [Open-AutoGLM](https://github.com/lattmamb/Open-AutoGLM) | Model-driven UI automation | Computer control where the model interprets UI and actions are constrained, logged and confirmed as required. |
| [opencode](https://github.com/lattmamb/opencode) | Coding runtime integration/reference | Developer tasks executed using selected model/provider and available tools. |
| [billion-context](https://github.com/lattmamb/billion-context) | Long-context research | Large knowledge sets navigated with retrieval and context management rather than assuming unlimited context. |
| [OpenViking](https://github.com/volcengine/OpenViking) | Context infrastructure | Context store/retrieval layer candidate to consolidate files, memory, skills and other agent context. |
| [Kimi dashboard](https://github.com/lattmamb/unitylink-kimi-dashboard) | UnityLink model/provider monitoring UI | Model usage, requests and performance dashboard; verify actual current dashboard metrics and data integrations. |

### 6. Research, intelligence, data, finance, economics and experimentation

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [ai-hedge-fund](https://github.com/lattmamb/ai-hedge-fund) | Financial analysis/agent research | Research and analytical workflows for markets and assets; never treat model output as validated investment advice or automatic trading authority. |
| [QuantaAlpha](https://github.com/lattmamb/QuantaAlpha) | Evolutionary financial-factor research (previously discussed) | Research pipeline to propose, test, backtest and compare factor hypotheses with experiment records; no unvalidated alpha claims. |
| [fecon235](https://github.com/rsvp/fecon235) | Economic data and computational economics reference | Macro research, economic time series, statistical analysis and explainable research notebooks/workflows. |
| [awesome-economics](https://github.com/antontarasenko/awesome-economics) | Economics learning/research resource catalog | Research resource discovery for economic concepts, datasets, models and literature. |
| [awesome-intelligence](https://github.com/ARPSyndicate/awesome-intelligence) | Intelligence/research resource catalog | Discover intelligence tools and methods; vetted resources become available to research workflows. |
| [awesome-machine-learning-interpretability](https://github.com/jphall663/awesome-machine-learning-interpretability) | ML interpretability reference collection | Explainability research and model evaluation methods to help users understand model behavior and limits. |
| [OpenAlpha_Evolve](https://github.com/shyamsaktawat/OpenAlpha_Evolve) | Evolutionary research/optimization candidate | Experiment, mutate and evaluate candidate algorithms or solutions against defined benchmarks. |
| [self-parking-car-evolution](https://github.com/trekhleb/self-parking-car-evolution) | Evolutionary learning/robotics demonstration | Educational simulation for agents, optimization and behavior learning; not a fleet autonomy product. |
| [dbt](https://github.com/dbt-labs/dbt) | Analytics engineering and data transformation | Governed transformations, models, tests, lineage and repeatable analytical datasets. |
| [Census_Classification](https://github.com/JordyKieto/Census_Classification) | ML classification example | Classification workflow and learning reference, potentially used as a template for data-science tasks. |
| [last30days-skill](https://github.com/lattmamb/last30days-skill) | Fresh intelligence research method | Recent-source briefs, trends, changes and dated evidence for decisions. |
| [Agent-Reach](https://github.com/lattmamb/Agent-Reach) | Agent research reach/access candidate | Potential broader source access and research distribution; exact integrations and reliability to verify. |
| [OpenMythos](https://github.com/lattmamb/OpenMythos) | Research/agent candidate | Experimental research contribution pending individual source audit. |

### 7. Business creation, SaaS, legal and company operations

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [company-in-a-box](https://github.com/lattmamb/company-in-a-box) | Core company operating application | Workspace for organization, projects, agents, workflows, approvals, knowledge and operations. |
| [wasp-lang/open-saas](https://github.com/wasp-lang/open-saas) | SaaS application starter patterns | SaaS scaffolding, authentication, payments, subscriptions and standard business application infrastructure, selectively adapted. |
| [nextjs-subscription-payments](https://github.com/lattmamb/nextjs-subscription-payments) | Subscription billing patterns | Product pricing, subscription lifecycle, customer billing and payment-status workflows where applicable. |
| [nocobase](https://github.com/nocobase/nocobase) | Low-code application/database interface patterns | Configurable internal apps, forms, tables, workflows and business dashboards without custom-building every screen. |
| [legal-agent-workshop](https://github.com/lattmamb/legal-agent-workshop) | Legal agent workflows and education | Legal document analysis, issue spotting, checklist and research workflows with citations and human review; not substitute counsel. |
| [paperclip-plugin-company-wizard](https://github.com/Yesterday-AI/paperclip-plugin-company-wizard) | Company setup and organizational generation | Guided setup for company structure, roles, workflows and initial operating plan; generated output remains editable and reviewable. |
| [MoneyPrinterV2](https://github.com/lattmamb/MoneyPrinterV2) | Content/marketing automation candidate | Potential automated content-production and distribution workflow; platform terms, permissions and quality controls required. |
| [Linktree](https://github.com/lattmamb/Linktree) | Creator discovery integration (listed plugin context; not a GitHub repo in the supplied list) | Optional creator discovery/marketing workflow. Not counted as an audited source repository. |
| [open-saas](https://github.com/wasp-lang/open-saas) | SaaS infrastructure patterns | Launchable web-product building blocks, selectively integrated into CIAB services or projects. |
| [dbt](https://github.com/dbt-labs/dbt) | Business analytics pipeline | Business reports and KPI pipelines built from tested, traceable data models. |
| [AI Humanizer](https://github.com/lattmamb/openclaw-skill-tobehuman) | Natural language refinement method candidate | Improve drafts for clarity and tone while preserving intent and factual accuracy; source mapping requires verification. |

### 8. UI, design, frontend and user experience

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Art direction and design process | High-quality, intentional screens, visual references, responsive layouts and browser QA. |
| [Impeccable](https://github.com/lattmamb/impeccable) | Design critique and rules | Automated/manual design audits, accessibility checks, consistency and UX copy improvements. |
| [CopilotKit](https://github.com/lattmamb/CopilotKit) | Agent-native interaction components | Inline agent experiences, tool-aware UI, progress, confirmation and human feedback. |
| [open-design](https://github.com/nexu-io/open-design) | Design/UI exploration and implementation candidate | Potential design tools, assets or workflows; verify repository contents before assigning a feature. |
| [hallmark](https://github.com/Nutlope/hallmark) | Design/product tooling candidate | Potential UI/product design contribution; exact capability remains to be source-verified. |
| [aether-ride-vision](https://github.com/lattmamb/aether-ride-vision) | UnityLink/Aether product experience | Mobility/subscription product interface, concept visualization, user journeys and product presentation. |
| [aether-ride](https://github.com/lattmamb/aether-ride-vision) | Aether Ride/UnityLink experience | User-facing vehicle subscription and mobility workflows, with the actual scope taken from source. |
| [unitylink-kimi-dashboard](https://github.com/lattmamb/unitylink-kimi-dashboard) | Model dashboard | A model operations interface that can surface usage, performance or provider information as actually implemented. |
| [company-in-a-box](https://github.com/lattmamb/company-in-a-box) | CIAB frontend | Unified application shell, workspace, navigation, controls and agent/task interfaces. |
| [Apple-Intelligence-Chat](https://github.com/lattmamb/Apple-Intelligence-Chat) | Apple-native interaction reference | Optional native chat experience and on-device integration. |

### 9. Mobility, vehicle systems, robotics and simulation

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [Tesla-Companion](https://github.com/nikships/Tesla-Companion) | Tesla vehicle integration candidate | Vehicle data, companion actions or automations for supported Tesla interfaces, subject to source, API and safety review. |
| [teslamate](https://github.com/teslamate-org/teslamate) | Tesla telemetry, data capture and vehicle analytics | Fleet/vehicle dashboards for charging, drives, usage, efficiency and history when supported and authorized. |
| [Battery-Emulator](https://github.com/lattmamb/Battery-Emulator) | Battery behavior modeling/emulation | Simulate battery state, charging, energy, load and degradation scenarios for analysis and education; model validation required. |
| [self-parking-car-evolution](https://github.com/trekhleb/self-parking-car-evolution) | Autonomous behavior simulation and evolutionary training | Visual experiments showing agents learn navigation/parking behavior in simulation, not road-ready autonomy. |
| [aether-ride-vision](https://github.com/lattmamb/aether-ride-vision) | Mobility user experience | Subscriber, vehicle, ride and mobility product flows for UnityLink, subject to current implementation. |
| [Tesla-Companion](https://github.com/nikships/Tesla-Companion) | Vehicle control/data companion | User-authorized vehicle information and control workflows with command confirmation and safety limits. |
| [Open-AutoGLM](https://github.com/lattmamb/Open-AutoGLM) | UI-based mobile/desktop automation | Operate supported interfaces for mobility workflows without inventing unavailable APIs. |

### 10. Infrastructure, cloud, networking, storage and self-hosting

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [CasaOS](https://github.com/lattmamb/CasaOS) | Self-hosted service/container management candidate | A self-hosted control surface for running supported services on user-owned infrastructure. |
| [ubicloud](https://github.com/ubicloud/ubicloud) | Cloud infrastructure platform | Potential private cloud infrastructure, compute, storage or networking deployment option; not assumed to replace current hosting. |
| [cloud-morph](https://github.com/giongto35/cloud-morph) | Cloud migration/infrastructure automation candidate | Infrastructure portability or deployment/migration workflows; precise capability pending source audit. |
| [CovenantSQL](https://github.com/CovenantSQL/CovenantSQL) | Distributed database/storage | Potential distributed persistence or data availability architecture, only if it fits CIAB's consistency and operational requirements. |
| [s3git](https://github.com/s3git/s3git) | Git-style versioned object storage candidate | Versioned, content-oriented storage workflows; compare with CIAB artifact store and existing storage contracts. |
| [OpenViking](https://github.com/volcengine/OpenViking) | Context storage and retrieval infrastructure | Potential context resource management, retrieval and indexing layer for files and agent knowledge. |
| [LocalAI](https://github.com/mudler/LocalAI) | Local inference server | Private/offline model-serving option for supported models and hardware. |
| [macLLM](https://github.com/appenz/macLLM) | Mac-local AI runtime | Local model interaction and management for compatible Mac users. |
| [Personal_AI_Infrastructure](https://github.com/lattmamb/Personal_AI_Infrastructure) | Personal infrastructure design | User-controlled runtime, data, model and automation setup options. |
| [opencli](https://github.com/lattmamb/opencli) | Command infrastructure | Standardized executable operations, usable from agent workflows and user terminals. |
| [freellmapi](https://github.com/tashfeenahmed/freellmapi) | API routing/access candidate | Alternative inference endpoints; monitor availability, terms, quality and limits. |

### 11. Privacy, security, sovereignty and decentralized networks

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [nym](https://github.com/nymtech/nym) | Privacy network infrastructure | Privacy-enhancing network options for eligible communication, with clear threat-model limits. |
| [Freenet Core](https://github.com/freenet/freenet-core) | Decentralized/private network systems | Research and potential decentralized data/service capabilities; evaluate threat model, maturity and operational fit. |
| [ZeroNet](https://github.com/HelloZeroNet/ZeroNet) | Decentralized web/network reference | Explore distributed publishing and content networks; not a default production dependency. |
| [ChatSecure-iOS](https://github.com/ChatSecure/ChatSecure-iOS) | Secure messaging reference/integration candidate | Privacy-focused communication workflows, if compatible with supported protocols and user needs. |
| [radvpn](https://github.com/mehrdadrad/radvpn) | VPN/network tooling candidate | Network privacy or secure connectivity workflows; audit security, maintenance and scope before adoption. |
| [awesome-decentralized-web](https://github.com/gdamdam/awesome-decentralized-web) | Decentralized-web reference catalog | Discover decentralized storage, identity, messaging and web technologies for research. |
| [awesome-decentralized-finance](https://github.com/ong/awesome-decentralized-finance) | DeFi reference catalog | Research decentralized financial protocols; not automatic financial execution or endorsement. |
| [heretic](https://github.com/p-e-w/heretic) | Model/security behavior research candidate | Investigate model control, policy and safety implications; no production behavior assumed. |
| [agent-bank](https://github.com/different-ai/agent-bank) | Agent catalog | Discover agent capabilities; imported agents remain untrusted templates until vetted. |
| [OpenViking](https://github.com/volcengine/OpenViking) | Context/data organization candidate | Structured resource retrieval with security boundaries and source provenance. |
| [a2a-x402](https://github.com/lattmamb/a2a-x402) | Agent commerce/payment protocol candidate | Potential agent-to-agent service payment; only with strict budgets, identity, authorization and transaction confirmation. |

### 12. Business intelligence, learning and general reference

| Repository | Contribution to CIAB | What users see / what it enables |
|---|---|---|
| [build-your-own-x](https://github.com/lattmamb/build-your-own-x) | Practical engineering tutorial collection | Learning paths and “build it yourself” project guides. |
| [coding-interview-university](https://github.com/jwasham/coding-interview-university) | CS learning curriculum | Personalized technical study plans and progress tracking. |
| [awesome-economics](https://github.com/antontarasenko/awesome-economics) | Economics research index | Searchable reference material and study resources. |
| [awesome-intelligence](https://github.com/ARPSyndicate/awesome-intelligence) | Intelligence resource index | Discover research sources and tools for intelligence workflows. |
| [awesome-machine-learning-interpretability](https://github.com/jphall663/awesome-machine-learning-interpretability) | Interpretability resources | Learn and evaluate explainable AI approaches. |
| [fecon235](https://github.com/rsvp/fecon235) | Economics/data analysis library | Economic analysis and research tooling. |
| [dbt](https://github.com/dbt-labs/dbt) | Data modeling and quality workflow | Tested, documented analytical models and reproducible reporting. |
| [Census_Classification](https://github.com/JordyKieto/Census_Classification) | ML learning/project reference | Classification and dataset experimentation. |
| [awesome-harness-engineering](https://github.com/lattmamb/awesome-harness-engineering) | Agent harness knowledge base | Discover, compare and evaluate harness patterns. |
| [prompt-library](https://github.com/thibaultyou/prompt-library) | Prompt reference | Prompt discovery and reuse. |
| [prompts.chat](https://github.com/f/prompts.chat) | Prompt reference | Search and curate prompt examples. |

### 13. Additional candidates requiring repository identity/role confirmation

These repositories are included in the supplied inventory but their contribution descriptions intentionally remain conservative until inspected:

| Repository | Candidate role / reason to inspect |
|---|---|
| [OpenMausBot](https://github.com/milind-soni/OpenMausBot) | Bot/agent capabilities and deployment model |
| [openmeth](https://github.com/twalapjs1622/openmeth) | Method/workflow architecture |
| [hallmark](https://github.com/Nutlope/hallmark) | Product/design/tooling function |
| [open-design](https://github.com/nexu-io/open-design) | Design workflow and outputs |
| [agent-tincan](https://github.com/lattmamb/agent-tincan) | Agent communication mechanism |
| [openmind](https://github.com/lattmamb/openmind) | Project purpose and system contribution |
| [headroom](https://github.com/lattmamb/headroom) | Context/resource management function |
| [evolver](https://github.com/lattmamb/evolver) | Evolution, feedback or optimization mechanics |
| [OpenMythos](https://github.com/lattmamb/OpenMythos) | Agent/model/system research scope |
| [cloud-morph](https://github.com/giongto35/cloud-morph) | Cloud/infrastructure capability and lifecycle |
| [radvpn](https://github.com/mehrdadrad/radvpn) | Networking/security role and maturity |
| [CovenantSQL](https://github.com/CovenantSQL/CovenantSQL) | Storage/database deployment and consistency guarantees |
| [s3git](https://github.com/s3git/s3git) | Storage/versioning scope and maintenance |
| [MoneyPrinterV2](https://github.com/lattmamb/MoneyPrinterV2) | Content automation workflow and platform integrations |
| [OpenAlpha_Evolve](https://github.com/shyamsaktawat/OpenAlpha_Evolve) | Optimization/evolution methodology and evaluation |
| [be-ambitious](https://github.com/robonuggets/be-ambitious) | Ambition/validation method mechanics |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Design methodology and frontend verification |
| [REA](https://github.com/lattmamb/rea) | Investigation methodology and supported tool adapters |
| [reverse-skill](https://github.com/lattmamb/reverse-skill) | Skill routing and investigative workflow |
| [SkillClaw](https://github.com/lattmamb/SkillClaw) | Skill lifecycle, routing and execution details |
| [paperclip](https://github.com/lattmamb/paperclip) | Agent company control-plane scope and data model |
| [ECC](https://github.com/lattmamb/ECC) | Actual configuration/instruction scope and compatibility |
| [Tesla-Companion](https://github.com/nikships/Tesla-Companion) | Supported vehicle endpoints, permissions and controls |
| [Battery-Emulator](https://github.com/lattmamb/Battery-Emulator) | Simulation accuracy, parameters and intended use |

This section is a verification queue, not an assertion of duplicate repositories. Some entries also appear in other categories because their eventual role may span multiple layers. The inventory's final canonical record will assign one primary category and maintain secondary capability tags.

---

## Unified capability stack (proposed)

The modules above should ultimately be reconstructed into a coherent stack, not deployed as a flat list of projects:

1. **Experience layer:** workspace, command surface, dashboard, artifact viewer, research room, approvals, engineering UI.
2. **Organization layer:** company, teams, roles, projects, goals, budgets, priorities, policies and decisions.
3. **Intent layer:** request interpretation, decomposition, ambiguity resolution, requirements and acceptance contracts.
4. **Context layer:** domain context, taxonomy, files, knowledge, memory, evidence and provenance.
5. **Methods layer:** skill registry, procedure selection, research methods, engineering methods, design and evaluation.
6. **Harness layer:** task graph, scheduling, agent lifecycle, delegation, concurrency, retries, cancellation, handoffs and observability.
7. **Execution layer:** models, runtimes, tools, CLI, browser, desktop/mobile automation and integrations.
8. **Engineering layer:** specifications, coding, tests, review, release, maintenance and dependency management.
9. **Data/intelligence layer:** research, datasets, analytics, economics, financial models and experiments.
10. **Operations layer:** business workflows, finance, legal, sales, members/customers, fleet and domain apps.
11. **Governance layer:** authorization, approvals, risk, audit, security, privacy, policy and external-action controls.
12. **Outcome layer:** completed artifacts, verified actions, metrics, decisions, cash collected, operational outcomes and lessons.

## A single request, end-to-end example

A UnityLink user enters:

> Find and prepare the best non-dilutive funding opportunities available for Unity Fleet. Build a complete evidence-backed application package and keep working until submissions are ready. Track the process through the outcome.

CIAB could render a work board:

- **Goal:** Funding secured and actually received, with source and restrictions tracked.
- **Research:** Programs, eligibility, deadlines, terms, primary sources and confidence.
- **Qualification:** Eligibility matrix, score, gaps and disqualifying conditions.
- **Evidence:** LLC documents, SAM status, business plan, financial projections, vehicle/fleet model, required records and missing evidence.
- **Workforce:** Legal researcher, funding analyst, financial modeler, document writer, evidence auditor, submission specialist.
- **Specifications:** One contract for each deliverable, its inputs, requirements and acceptance tests.
- **Execution:** Drafts, calculations, research, document assembly and permitted administrative tasks.
- **Review:** Independent accuracy, eligibility, financial consistency, citations, completeness and deadline checks.
- **Approval:** User review before representations, signatures, commitments or submission where required.
- **Tracking:** Submitted, pending, requested changes, approved, awarded, conditions, disbursed, received.
- **Outcome:** Funding received is recorded as a deposit only when confirmed, not when an application or award is merely projected.

That same underlying system can then switch from funding research to software engineering, fleet operations, product development or company administration without needing an entirely new architecture.

## What the merger should not become

- A hundred agents with no clear responsibility.
- A collection of duplicated orchestrators.
- Skills that silently execute dangerous actions.
- Memory that overwrites source evidence.
- Research without provenance.
- Plans counted as accomplishments.
- Awarded funding counted as received cash.
- A copied upstream application that becomes impossible to maintain.
- Autonomous self-modification without tests, review, rollback and permission controls.

## Source reconstruction and integration lifecycle

For each source repository:

1. Identify upstream, branch/commit, license and provenance.
2. Read its actual source, manifests, tests, docs, workflows and configuration.
3. Record the full capability inventory.
4. Produce its own developer specification.
5. Identify dependencies, contracts, permissions, data and side effects.
6. Compare it against all other source specifications.
7. Decide **Adopt / Adapt / Reference / Defer / Reject**.
8. Define the target CIAB package, interfaces and acceptance criteria.
9. Implement using test-first development where applicable.
10. Verify tests, security, integration and source-to-target traceability.
11. Record deviations and remaining gaps.

## Final vision

Company in a Box should be the user's **company workspace, intelligence engine, development team, research department, engineering factory, operational assistant and governed automation environment** in one application.

Its interface should feel simple. Its internal engineering should be rigorous.

Users should not need to know which upstream repository supplied a capability, which agent is running, how context was assembled, or which framework was used. They should be able to inspect those details when they matter, but the system should present one coherent experience.

**The user supplies direction. CIAB supplies the organized capability, method, context, workforce, execution and verification. UnityLink OS supplies the company-specific mission, operating rules, state and domain.**

---

## Audit disclaimer

This capability map is deliberately broad and useful as a product vision. Repository-by-repository source review remains necessary before converting these interpretations into binding developer specifications or making implementation, security, licensing, compatibility, performance or completeness claims. Repositories may be duplicated, archived, experimental, incompatible, incomplete or unsuitable. Nothing in this document implies that all source projects have been merged, run or validated.

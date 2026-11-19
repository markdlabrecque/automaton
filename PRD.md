# Automaton — Product Requirements

## Status

Approved Slice 1 scope. The owner approved the decisions in [the design register](docs/design-review.md), all three model routes, and preservation of selective restore as a hard evidence gate. Approval permits the runnable development tasks in [the backlog](docs/development-backlog.md); it is not a claim that the runtime works or permission to perform host operations, retrieve credentials, sign in, or deploy to production.

The pinned selective-recovery investigation supplies **negative evidence**, not a passed gate. Independent compatibility work may proceed. Recovery-dependent implementation waits for supported public interfaces and affirmative proof; do not replace the scheduler or weaken the guarantee.

## Product vision

Automaton is a self-hosted personal platform for durable, purpose-specific agents, built on Pi and pi-durable. An agent is a persistent individual, not a process, model, or conversation. Its purpose, identity and domain state outlive its service process and conversational context.

The owner installs Automaton once per Linux host and configures independent agent services. Each has its own state and unprivileged OS identity. Core, basic tools, CLI, optional modules, broker adapters, deployment assets and docs share a monorepo. Personal convenience takes priority over a third-party ecosystem or general distribution requirements.

Agents have built-in read/write/edit/shell tools and **no enabled modules by default**. Tools operate within actual OS grants. Additional capabilities are explicitly selected from trusted shipped code; repository membership does not enable them. Model access is selected by reference to a separate Core broker, not by giving provider credentials to an agent.

## First-release scope

Slice 1 must demonstrate both:

1. **Independent platform proof:** durable operator-initiated work, bounded execution, visible outcomes, a reference module using public contracts, and two separately managed systemd agent services beside a separate model broker.
2. **Useful module proof:** an optional workspace-report module produces a bounded, cited Markdown orientation brief through a private llama.cpp/Qwen route. Canonical retrieval and a successful stable export survive interruption without changing source.

All three explicit model routes are required: private llama.cpp/Qwen, hosted OpenAI Codex subscription, and hosted Anthropic Claude subscription. Hosted login, automatic refresh and authenticated generation must use supported interfaces and be observed by the operator with non-sensitive inputs. API-key billing is not a substitute. No arbitrary hosted endpoints or automatic hosted fallback.

The interface is a protected local CLI using a Unix socket, not a web/chat UI or public listener. One primary operator conversation is exposed. Scheduled/external triggers and autonomous goal initiation are deferred; durable waits within an existing explicit request remain allowed.

## Principles and authority

- Commit admission before returning its receipt; commit results before reporting completion. A model statement is not evidence of an external effect.
- Prefer supported Pi/pi-durable machinery. Do not introduce a competing agent loop, generic queue engine, or private storage mutations to bypass a missing seam.
- An uncertain external effect is distinct from confirmed failure or cancellation. Never automatically repeat it, including arbitrary interrupted shell commands. Inspection and a fresh explicit request are required.
- An idle agent or durable wait makes no model calls merely to remain alive.
- One trusted local operator delegates the agent's authority through control socket access. Slice 1 has no per-tool approval prompts. A working directory, prompt or tool allowlist is not an OS sandbox.
- Installed modules are trusted in-process code and can crash their service. Declarations aid validation and review, not isolation. Untrusted source, messages or tool output cannot grant more authority.
- No production access. Agents do not provision permissions, install themselves, retrieve credentials, sign in to subscriptions or change host services as part of development. Real host acceptance is operator-run on a non-production host.

## Core, modules and model providers

| Capability | Core responsibility | Module/adapter responsibility |
| --- | --- | --- |
| Execution | Host pinned Pi/pi-durable, durable admission, controls and bounded policy | Domain modules contribute tools, instructions, tasks, documents and typed operations |
| Basic tools | Built-in read/write/edit/shell within OS grants | Specialized domain tools, never implicit expansion of grants |
| Model access | Broker, catalog, authorization, secret store, generic agent-side Pi bridge | Trusted broker-side provider adapters implement supported inference/auth/refresh |
| State | Durable store access, ownership, identity and module namespaces | Domain records and compatibility metadata using public contracts, not private Core tables |
| Operations | Config validation, lifecycle, readiness, diagnostics and local CLI | Capability requirements, health and recovery declarations |
| Reports | Generic operation dispatch and result plumbing | Snapshot, tool-free summary, canonical Markdown and independent publication workflow |

Model provider is a capability role, Module is a capability package, and Pi extension is an upstream integration mechanism. Domain modules run in the agent service; provider adapters run inside the separate broker and cannot be loaded as agent-side credential owners. See [the glossary](GLOSSARY.md).

## Functional requirements

### 1. Configure persistent agents

Separate immutable stored agent ID, stable host-local service key and mutable display name. Rename does not change accounts, paths or units; service rekeying is deferred. Restore and host move preserve identity; a deliberate clone has a new identity (a clone command is not required).

Validate purpose, protected absolute paths, finite limits, explicit module IDs/config and optional model reference. Agent configuration must not contain upstream endpoints or credentials or silently replace stored identity. An empty module list and no configured model are valid. Controls and explicitly enabled model-independent operations work without a model; reject model-dependent requests before admission.

Use a shared installation manifest to load trusted modules by ID, not arbitrary package paths. Validate API/code/state compatibility, dependencies, cycles and registration conflicts before side effects. Unwind failed startup and stop hooks in reverse order. Prove a reference module can contribute a tool/task/document/operation without Core edits. Hot reload, independent publication and arbitrary Pi extension compatibility are not promised.

### 2. Admit and track bounded work

Store work before returning a stable request receipt. Define caller request-ID scope, deduplicate matching retries, and reject conflicting payload reuse. Results remain inspectable after client disconnection and restart; disconnecting a wait does not cancel work.

One bounded FIFO per agent admits conversational requests and direct module operations. Durable waits yield the execution slot; turns in the same conversation do not interleave. A conversational module operation must not wait behind its own caller. Verify the upstream mapping rather than inventing another scheduler. Inspection and cancellation bypass the work queue.

Expose queued, active, waiting, parked, blocked and terminal outcomes, including uncertain effects. Cancel queued/waiting work without starting it. Active cancellation is best effort, not rollback. Retry only verified safe checkpoints with finite bounds; uncertain effects require inspection and a fresh explicit request.

### 3. Recover safely

Preserve identity, conversations, durable tasks, checkpoints, waits and committed results through process restart. Show commit-before-receipt and deterministic process-kill recovery. Slice 1 does not certify physical power-loss durability or require `synchronous=FULL`; publish effective SQLite settings and filesystem limitations.

Missing task definitions or incompatible module/state changes leave dependent work visibly blocked. Changes cannot silently discard pending work. Preflight compatible code/state before shared activation. No automatic schema migration or rollback into incompatible state.

Restored pending work is parked by default. Leaving maintenance to admit **new** requests must not start or settle unselected restored work. Only individually selected recovery-eligible work may resume. An uncertain effect remains ineligible for automatic replay even when other work is released. Maintenance persists across restarts. The negative pi-durable 1.5.2 findings do not satisfy this requirement; [the positive proof](https://github.com/markdlabrecque/automaton/issues/20) remains a hard gate.

### 4. Broker model access

A separate local Core broker identity owns the model catalog, provider secret store and trusted provider adapters. It is not an agent supervisor, scheduler or state manager. Agents use a generic Pi integration and receive no upstream credentials, including in tool subprocess environments or routine diagnostics.

Authenticate callers by supported local OS identity and grant each agent one configured route. Callers cannot choose arbitrary endpoints, headers, credentials, accounts, OAuth destinations or runtime models. Protected operator administration handles account setup. Serialize concurrent refresh as necessary and persist rotated credentials atomically. Definitive expiry/revocation requires operator action, not endless retries.

Keep route/config identity and destination classification without secrets. Block effective model configuration changes while affected work is pending, including changes in the shared catalog. Unexpected route mismatch blocks recovery instead of moving context elsewhere. Same-account OAuth refresh is credential lifecycle, not a model selection change.

Private OpenAI-compatible inference permits loopback HTTP or validated HTTPS on explicitly configured private hosts, with no redirects outside the grant and no insecure TLS override. An operator-managed authenticated tunnel may expose loopback. Private addressing is not proof of server-side non-forwarding. Codex and Claude are explicit supported hosted exceptions, not permission for arbitrary public endpoints. Unsupported subscription access blocks that adapter and release; never work around vendor restrictions.

Bound streams, message sizes, retries and deadlines. Distinguish unavailable, unconfigured and auth failures. Broker outages do not stop model-independent work. Unknown price metadata is unknown, not zero.

### 5. Produce workspace reports

The optional domain module owns one workflow invoked either through a generic CLI operation or a conversational tool. Both paths enforce the same policy before admission. A hosted route requires **report-specific opt-in**; selecting that model is not consent to send workspace material. Document precisely what leaves the host. Real report acceptance uses private Qwen.

Collect a bounded relative-path inventory and explicitly allowed text from configured read-only roots. Prevent path escape and omit excluded, binary and oversized material. Never execute project code or treat source as instructions. Checkpoint the allowed snapshot and provenance, then obtain a tool-free model summary; the model cannot alter workflow steps.

Commit bounded Markdown with a stable report ID before completion. Cite relative paths, distinguish verified facts from inferences and omissions, and do not infer build/test health. The committed Markdown is canonical and retrievable by ID. Export has independent pending/failed/published status. Recover export from committed Markdown without rescanning or another model call; publish atomically and never overwrite conflicting content. Release acceptance includes successful export.

### 6. Operate separate services

Use one shared root-owned code installation with one separate-account systemd service per agent and a separate broker service/account. Services have independent protected config, state and runtime paths. Clients use IPC, never writable database opens. Acquire a kernel-backed crash-released lifetime guard before writable open, recovery or schema setup; refuse competing writers across supported aliases. Close storage before releasing ownership. No distributed lease: the operator stops the previous host before activating a copied agent.

No TCP/HTTP operator listener. Protect and distinguish operator control, agent model IPC and broker administration sockets. Socket access delegates authority. Validate paths, reject live-socket collisions and bound the versioned JSON protocol. Provide status, submit/receipt, inspect/get/wait, cancel, verified safe retry, generic operations, drain/stop, maintenance and selective recovery. No raw shell-dispatch control command.

Services support boot startup, bounded failure restart, graceful stop and shutdown deadlines. Distinguish liveness/readiness, fatal storage failure and recoverable provider failure. Logs carry safe agent/module/request/task IDs without secrets or private bodies. State/transcripts may still be sensitive.

The report profile denies source writes and has separate writable state/report/scratch paths. Explicit private network grants are allowed and must be documented and verified. Real OS/systemd controls, not mocks or prompts, must deny cross-agent protected state and broker secret access.

### 7. Back up and upgrade offline

Back up only stopped agents under the same ownership guard, without instantiating an executing Harness. Capture a consistent SQLite snapshot including WAL state where applicable, portable identity/state/transcripts, canonical reports/exports, versions, integrity and sanitized config/references. Exclude workspaces, scratch, system journals and broker secret-store contents. The archive is sensitive: captured text may itself contain private data or pasted secrets.

Restore only to a fresh protected destination after integrity, path-safety and compatibility validation. Preserve identity; recreate access and provider connections separately. Warn that an older backup may predate effects in external systems. Do not overwrite existing state or assume a local guard prevents cross-host duplicates.

Preflight shared upgrades, stop affected services and back up offline **before** activating replacement code. Restart individually; downtime for all affected services is allowed. One shared version per host, not long-term mixed versions. Agent-only config changes restart only that service, subject to pending-work checks.

No automatic purge. Bound captured inputs and document safe operator-driven removal and remaining copies in transcripts, artifacts, logs and backups. Refuse affected admissions if storage cannot commit. Important backups live outside the checkout.

## Resource requirements

Use finite configurable limits for queue size, concurrency, model/task retries, tool duration, deadlines, retained output and captured source. Surface limit failures and disk usage; never report a failed write as success. Context summaries are not authoritative operational state. Publish measured disk/recovery behavior on the supported host rather than a hardware minimum, scale promise or recovery SLA.

## Acceptance criteria and evidence ownership

These are required outcomes, not completion claims. Unit checks prove pure policy, integration checks prove real boundaries, and a small number of full journeys prove wiring. Do not duplicate policy tests across tiers. Synthetic results cannot replace live provider or actual OS/systemd evidence.

| ID | Observable outcome | Cheapest sufficient evidence / owner |
| --- | --- | --- |
| A1 | Accepted work is discoverable after reopen under its original receipt | Real storage admission integration, #2 then #6 |
| A2 | Request retries deduplicate; conflicting reuse is rejected | Durable admission integration, #2/#6 |
| A3 | Checkpointed work and durable waits retain committed progress after process kill | Child-process storage/scheduling integration, #2/#24 |
| A4 | Unsafe interrupted effects become visible uncertainty, never automatic replay | Controlled effect-boundary integration, #24; restore case #20 |
| A5 | Reference module adds tool/task/document/operation without Core edits | Module-host integration, #3 |
| A6 | Incompatible modules/conflicting registrations fail actionably | Unit validation and one loader wiring check, #3 |
| A7 | Missing definitions leave visible blocked work | Upstream integration #24 and module lifecycle #3/#6 |
| A8 | Two systemd agents run independently; stopping one leaves the other usable | Non-production host acceptance, #11 |
| A9 | Competing writer/aliases refused; kill releases guard without stale-lock deletion | File/child-process integration, #25 then #4 |
| A10 | Actual profile denies cross-agent state, broker secrets and report-source writes | Non-production OS-identity acceptance, #11 |
| A11 | Reboot starts services and recovery follows declared policy | Actual non-production reboot, #11 |
| A12 | Restore preserves identity/work/artifacts; new B completes while old A/C stay parked, only selected A releases and C remains parked across reopen | Affirmative upstream proof #20, product integration #9, host #11 |
| A13 | Real cited private report survives interruption with canonical retrieval and successful stable export | Module integration #8, one synthetic wiring journey and real Qwen acceptance #11 |
| A14 | Idle agents do not call models to remain alive | Recording synthetic model boundary, #6 |
| A15 | No-model controls/model-independent work function; model-dependent admissions refuse safely | Runtime integration #6 and IPC wiring #7 |
| A16 | Generic broker integration streams/cancels safely; secrets never reach agents; grants enforced | Pi/IPC proof #26, broker integration #12, real identities #11 |
| A17 | Codex AND Claude supported subscription login, automatic refresh and generation work | Sourced feasibility #22/#23, synthetic adapters #13/#14, operator-run real evidence #11 |
| A18 | Hosted report opt-in applies to both entry paths; pending work prevents effective route changes | Unit policy #8/#12/#6 plus boundary wiring, no live private content |

Proof tickets require affirmative evidence; failure leaves the proof open and implementation blocked. Evidence-only investigations may close supported, blocked on tested approaches or inconclusive, but closure alone never unblocks an adapter. See [the backlog](docs/development-backlog.md) for the complete dependency graph.

## Explicit non-goals

- Hosted multi-tenancy, public listeners, arbitrary public model endpoints, web/chat UI or network-wide agent management.
- Scheduled/external work initiation, autonomous goals, multiple independent operator conversations, multi-user access or per-request model switching.
- Distributed workers/ownership, high availability or automatic cross-host failover.
- Untrusted module sandboxing, third-party marketplace, independent module publication or arbitrary runtime package loading.
- Hot reload, side-by-side runtime versions, agent self-installation/deployment or permission changes.
- Online backup, arbitrary schema migrations, physical power-loss certification or exactly-once arbitrary external effects.
- Automatic purge, implicit cross-agent sharing, or a broad catalog of domain applications.

Exact package tooling, path syntax, service-key validation, local protocol details and numeric limits are delegated reversible implementation choices within these requirements. Discoveries that change scope, security, provider support or required guarantees must return to the owner, not silently become new defaults.

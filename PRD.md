# Automaton — Product Requirements

## Status

Draft 0.1 for discussion. This document defines the product and its required behavior. It is not an approved implementation plan. Proposed defaults and open questions remain subject to review.

## Product vision

Automaton is a self-hosted platform for durable, long-running agents. An operator can deploy several agents on one Linux host. Each agent has a defined purpose, its own durable state, and a configured set of capabilities.

The core uses Pi and pi-durable and runs under systemd. It supplies basic tools and the machinery to accept work, preserve progress, recover after interruption, and host modules. Modules supply all domain-specific functions and external integrations.

The platform must support new capabilities without changes to the core. An operator can adapt an existing module or install a new one to give an agent a different purpose.

## Confirmed decisions

- Use Pi and pi-durable as the agent foundation.
- Run agents as systemd services.
- Support several purpose-specific agents on a single host.
- Keep reminders, providers, to-do lists, and other application functions in modules.
- Prove the core independently, then deliver one useful module before the first release is complete.
- Include Pi file and shell tools as the baseline. Enforce their access through the agent's OS account and service restrictions.
- Start with trusted, operator-installed modules that run in-process and use a versioned contract.
- Do not require hot reload in the first release.

## Intended users

**Operator:** installs the platform, configures agents, grants access, selects modules, and maintains services and backups.

**Agent user:** gives an agent work and inspects its progress and results through an enabled interface. The operator and agent user can be the same person.

**Module author:** adds a capability without a private fork of the core or direct changes to core storage.

The initial deployment serves one trusted operator. A multi-tenant service for unrelated users is not a first-release goal.

## User outcomes

1. The operator can start a purpose-specific agent without building a separate application.
2. The agent can accept work and continue it after a process or host restart.
3. The operator can see whether work is queued, active, waiting, blocked, failed, canceled, or complete.
4. The operator can add or replace a capability through a module and configuration.
5. The operator can run several agents without accidental state, workspace, credential, or endpoint collisions.
6. The operator can stop, inspect, back up, restore, and upgrade an agent without losing track of its work.
7. The first release completes a real use case through a module, not only a synthetic demonstration.

## Product principles

### Durable does not mean always reasoning

An agent remains available and preserves its work over time. It does not need to call a model continuously. Idle agents and tasks that wait for a future time must not consume model calls merely to stay alive.

### Commit before acknowledgment

The platform reports acceptance only after it stores the work durably. It reports completion only after it stores the result. A model statement alone is not proof that an external action succeeded.

### Make uncertainty visible

A crash can occur after an external system acts but before Automaton records the result. The platform must distinguish a confirmed failure from an unknown outcome. It must not promise exactly-once external effects when the external system cannot support that guarantee.

### Keep domain behavior outside the core

The core supplies execution and operational mechanisms. Modules supply meaning and policy. Durable waits belong in the platform; reminder recurrence and missed-reminder policy belong in a reminder module.

### Prefer the upstream machinery

Use the persistence, task, extension, tool, and model mechanisms from Pi and pi-durable where they fit. Do not build a competing agent loop or generic task engine without a documented gap.

## Core and module boundary

| Capability | Core responsibility | Module responsibility |
| --- | --- | --- |
| Agent execution | Host Pi and pi-durable; manage durable submissions and recovery | Add instructions, tools, and task definitions |
| Basic tools | Supply read, write, edit, and shell execution through the configured environment | Add specialized tools or explicit adaptations |
| Model access | Define how provider modules register with the runtime; validate agent selection | Register provider implementations and resolve configured credentials |
| External input | Admit work with source identity and deduplication metadata | Connect chat, HTTP, messaging, or other input systems |
| External output | Expose committed results and action outcomes | Deliver responses or notifications through an external system |
| Time | Supply durable waits and task resumption | Define schedules, recurrence, timezones, and catch-up rules |
| State | Supply durable storage access and module namespaces | Define domain records, validation, and migrations |
| Operations | Supply service lifecycle, configuration validation, status, and diagnostics | Report module readiness, faults, and required recovery actions |
| Domain functions | None | Reminders, to-do lists, memory, calendars, and other applications |

A minimal local control surface belongs to the platform so an operator can submit work, inspect it, and stop it without a chat or web module. Its exact interface remains open; a local CLI is the proposed default.

“Provider” currently includes model providers. The draft also treats message and notification integrations as modules. The exact provider categories need confirmation.

## Functional requirements

### 1. Configure a purpose-specific agent

Each agent must have:

- A stable instance identifier and purpose instructions.
- An explicit module list and module configuration.
- A selected model supplied by a provider module.
- A workspace and persistent data location.
- Credential references or protected credential inputs, separate from source control.
- Execution limits, including bounded retries and concurrency.
- A declared OS execution identity and service restrictions.

Startup must validate configuration, module compatibility, dependencies, and required credentials before accepting affected work. Diagnostics must name the problem without printing secrets.

The agent must not silently select every module installed on the host. Installing a module and enabling it for an agent are separate actions.

### 2. Accept and track durable work

The core must:

- Store an accepted submission before returning its acceptance receipt.
- Return stable identifiers that let a caller inspect work after reconnect or restart.
- Support a caller-supplied request identifier to deduplicate retries within a documented scope.
- Preserve the source identity of submitted work without treating source content as trusted instructions.
- Define what happens when more work arrives during an active run.
- Bound queued work and concurrent execution; reject excess work explicitly.
- Expose results and failures independently of the client connection that submitted the work.

Proposed default: queue additional input for the same conversation. Explicit steering and rejection can be added through the upstream runtime where supported.

### 3. Continue work after interruption

The core must resume recoverable work from durable state after service restart. It must preserve conversations, task checkpoints, durable waits, committed results, and submission identity.

Every tool or task that can cause an external effect must have an explicit recovery policy:

- Safe to repeat.
- Safe to repeat with a stable idempotency key.
- Not safe to repeat automatically; expose an interrupted or unknown outcome.

The platform must not automatically repeat an arbitrary interrupted shell command. A shell command can change files or external systems before the process dies.

Recovery must not depend on a model reconstructing missing operational state from a conversation summary. Deterministic module tasks must be able to continue without model access when their execution does not require it.

Repeated failures must reach a bounded retry limit or a blocked state. The operator must be able to inspect the cause and explicitly retry or cancel where supported.

### 4. Host trusted modules

A module must declare:

- A stable identifier and version.
- The supported module API version.
- Required dependencies and configuration.
- Its tools, instructions, task definitions, and other registrations.
- Its durable state and migration needs, if any.
- Its operational needs, including files, network access, credentials, or child processes.

The contract must support module validation, registration, startup, health reporting, and shutdown. Pure registration modules need not implement active lifecycle hooks.

The platform must reject incompatible API versions, missing dependencies, and conflicting registrations before affected work starts. Tool replacement must be explicit; installation order must not silently replace another module's behavior.

Module data must have stable names and ownership. A module must not depend on private core tables. Use native pi-durable extensions where appropriate, with an Automaton contract for configuration and lifecycle.

A module author must be able to adapt an existing package through a small adapter. The platform must not claim that arbitrary Pi extensions, skills, or MCP servers work unchanged; compatibility requires a documented adapter or supported contract.

Installed modules run with the service's authority. Module declarations aid review and validation; they do not sandbox module code. A module can crash the agent process. The operator must trust installed code.

### 5. Change modules without stranding work

The operator must explicitly install, enable, disable, upgrade, and remove modules. Restart-based changes are sufficient for the first release.

A change must not silently discard work that depends on a module. Before a destructive or incompatible change, the platform must identify dependent tasks and state. It must require the operator to keep compatible code, complete or cancel work, or approve a supported migration.

If a required task definition is unavailable, affected work must remain visible as blocked. The platform must not convert it into success or silently delete it.

Module and core upgrades must state whether existing checkpoints and data remain compatible. Rollback must not imply that a migrated data directory works with an older binary.

### 6. Run several agents on one host

Each agent must run in a separate service process with independent configuration, durable storage, workspace selection, and credential inputs. Restarting or stopping one agent must not stop another.

Proposed deployment form: an `automaton@<instance>.service` template, or an equivalent systemd arrangement with the same independence.

The platform must prevent two processes from owning the same writable agent store. Instance names, storage paths, sockets, and ports must not collide silently.

Independent configuration is not a security boundary. Where agents must not access each other's files or credentials, deployment must enforce that restriction through separate OS identities and appropriate filesystem and systemd controls. Separate directories under one unrestricted account are insufficient.

Agents must not share conversations, domain state, or credentials implicitly. Intentional sharing requires explicit configuration. Agent-to-agent delegation is not required for the first release.

### 7. Operate under systemd

The platform must support:

- Automatic start after host boot.
- Restart after unexpected process failure, with bounded restart behavior.
- Graceful shutdown that stops new admissions and closes durable storage.
- A shutdown deadline, after which unfinished work follows its recovery policy.
- Separate liveness, readiness, and degraded-state reporting.
- Logs with instance, module, submission, and task identifiers where applicable.
- Inspection of blocked work, retry limits, provider failures, and storage errors.
- A maintenance path that prevents automatic recovery from executing work during restore or repair.

The operator must be able to use systemd to stop the service. No additional dashboard is required for basic operation.

Readiness must mean that configured work can actually be accepted, not merely that a process exists. A model-provider outage must be distinguishable from storage failure or a stopped scheduler.

### 8. Preserve and restore state

Persistent state must live outside the application checkout and survive deployment replacement. The storage implementation must support consistent backup and documented restore.

A backup must identify the core version, module versions, and configuration needed to interpret its state. Credential backup and restoration need a separate, explicit policy.

Restore must not accidentally run overdue or uncertain external actions before the operator selects the recovery behavior. Retention and deletion must explain the difference between active state, transcripts, logs, and backups.

The exact layout and storage backend remain implementation decisions. Local SQLite through pi-durable is a candidate, not an approved schema.

## Authority and security

The first release gives agents real file and shell tools. This is an intentional capability, not a claim that model-generated commands are safe.

- Services must not run as root by default.
- The operator grants writable paths, network access, credentials, and executable access through deployment policy.
- A working directory is not a filesystem sandbox.
- A tool allowlist is not a sufficient restriction when unrestricted shell access can do the same action.
- Modules and shell subprocesses must receive only the credentials the deployment intends to expose.
- Untrusted messages, files, retrieved text, and tool output must not authorize broader access.
- Agent instructions alone must not serve as the boundary for privileged operations.
- External interfaces must authenticate callers and map them to an agent's allowed operations.
- Routine logs must omit credentials and private message bodies. Durable transcripts can contain sensitive data and require protected storage.
- Agent-driven installation, permission changes, and self-deployment are not first-release capabilities. OS restrictions must enforce any claimed prohibition.

The exact service sandbox and approval model remain open. The PRD must not claim strong isolation until a supported deployment profile enforces it.

## Resource and reliability requirements

- No idle model loop.
- Bounded model retries, task retries, tool duration, queue size, concurrency, and retained tool output.
- Explicit behavior when a configured resource limit is reached.
- Usage and cost visibility when the provider reports the needed information; unknown cost must not appear as zero cost.
- Context management for long conversations without treating summaries as authoritative task state.
- Disk usage visibility and a defined response to storage exhaustion.
- No silent data loss on a failed write.

Numeric limits, expected host capacity, and recovery-time targets remain open. The first release must publish measured behavior for the supported deployment profile rather than promise arbitrary scale.

## First-release scope

The first release is complete only when both parts are demonstrated:

**A. Independent platform proof**

A minimal agent accepts durable work, uses the basic tools within its service permissions, survives interruption, hosts a reference module, and runs beside a second independent agent under systemd.

**B. Useful module proof**

One selected domain module completes a real operator use case through a configured provider and interface. Its behavior remains in the module. The core must not acquire domain-specific branches to make the demonstration work.

The useful module and interface have not been selected. Reminders and to-do lists are possible candidates, not commitments.

A provider module is required support for model use. It does not replace the requirement to prove a useful domain capability.

## Acceptance criteria

These are product acceptance targets, not claims of completed verification.

| ID | Observable outcome | Cheapest sufficient evidence |
| --- | --- | --- |
| A1 | Accepted work remains discoverable after reopen, using the same submission identifier. | Integration at the real durable storage boundary |
| A2 | Repeating a request identifier does not create duplicate admitted work within its documented scope. | Durable admission integration |
| A3 | A stopped process resumes a checkpointed task and a durable wait without losing committed progress. | Child-process recovery integration with local storage |
| A4 | Recovery does not repeat an unsafe interrupted action automatically; it reports the uncertain outcome. | Recovery integration with a controlled external-effect boundary |
| A5 | A compatible module adds a tool and durable task without a core source change. | Module-host integration |
| A6 | Incompatible modules and conflicting registrations fail with an actionable diagnostic. | Unit checks for contract rules; integration only for loader wiring |
| A7 | Missing module code leaves dependent work visible and blocked, not lost. | Module lifecycle integration |
| A8 | Two systemd agents run together; stopping one leaves the other usable and its state unchanged. | Non-production Linux host acceptance; process tests alone cannot prove systemd wiring |
| A9 | A second process cannot acquire the same writable agent store. | Storage ownership integration |
| A10 | The supported isolation profile denies cross-agent file and credential access. | Non-production host acceptance under the actual OS identities and restrictions |
| A11 | Host reboot starts the services and recovers pending work according to its declared policy. | Non-production reboot acceptance; a mocked supervisor is insufficient |
| A12 | A restored backup retains work and module state, and does not execute it before recovery is enabled. | Backup/restore integration plus deployment runbook acceptance |
| A13 | The selected useful module completes its real use case after an interruption. | One focused end-to-end journey; synthetic transports do not prove real external delivery |
| A14 | Idle agents make no periodic model requests solely to remain available. | Runtime integration with a recording model boundary and controllable time |

Use unit checks for policy and validation, integration checks for real boundaries, and only a few end-to-end journeys for complete wiring. Use a controllable clock for timing logic. Do not duplicate the same behavior at every tier. Separate simulated evidence from real provider and host evidence.

## Out of scope for the first release

- A hosted multi-tenant control plane or public agent marketplace.
- Distributed workers, host clusters, or high availability across machines.
- Untrusted third-party modules or process isolation for each module.
- Hot module reload.
- Automatic installation or upgrade of modules by an agent.
- Agent self-modification or self-deployment.
- Implicit cooperation or shared memory between agent instances.
- A required web UI, mobile app, or particular chat service.
- A full catalog of reminders, tasks, calendars, memory, and integrations.
- Exactly-once guarantees for arbitrary shell commands or external APIs.

## Decisions for the next revision

1. **First useful agent:** What concrete job must it do, and what result makes it useful?
2. **First interface:** Is local CLI access sufficient initially, or does the useful agent need a chat, web, or messaging module?
3. **Provider scope:** Does “providers” mean model providers only, or also other provider categories? Which model provider comes first?
4. **Deployment profile:** System services with separate service accounts, user services, or both? What isolation must the supported profile enforce?
5. **Module distribution:** Local packages, npm packages, or both? What installation and version-pinning flow does the operator need?
6. **Control model:** What can an agent user stop, approve, or retry, and what remains operator-only?
7. **Continuity:** How many conversations does an agent serve, and which context or state is shared between them?
8. **Operational targets:** What host size, agent count, resource budget, retention, and recovery targets matter for the first release?

Choose the first useful job and interface next. Those choices will expose the minimum module contract needed for a working release. Detailed APIs, file layouts, and implementation tickets come after that review.

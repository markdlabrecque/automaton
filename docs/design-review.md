# Slice 1 design review

Status: awaiting confirmation of the Slice 1 design. This is a decision register, not an approved implementation plan. [GLOSSARY.md](../GLOSSARY.md) contains settled terminology. [PRD.md](../PRD.md) and the existing tickets still reflect earlier assumptions and need reconciliation after the operator confirms shared understanding. See [Deployment and repository model](deployment-model.md) for the earlier accepted deployment direction.

## Settled decisions

| Question | Decision | Consequence |
| --- | --- | --- |
| Q1: Agent identity | An agent is a persistent individual, not a process, model, or conversation. Its service is a separate concept. | A restart or host move preserves identity. Slice 1 permits one active service for an agent. Review uses of agent, instance, service, and daemon in documentation and tickets. |
| Q2: Work initiation | Slice 1 accepts explicit operator requests and follows that work through completion, durable waits, or a visible stop condition. | Durability does not authorize new goals or unsolicited periodic activity. |
| Q3: Review gate | Remove ready-for-agent from the epic during review. | The label is removed. This neither stops nor cancels any work already in progress. Restore readiness only after approval of the revised documents and tickets. |
| Q4: Identity lifecycle | Restore and host move preserve agent identity. A deliberate clone is a new agent. A mutable operator-facing name is separate from identity. | Cross-host duplicate execution is not prevented by a local ownership guard. A clone command is not automatically required by this identity rule. |
| Q5: Conversations | The agent owns its purpose and domain state independently of conversational context. Slice 1 exposes one primary operator conversation. | A fresh conversation does not erase reports, pending work, or agent identity. Additional independent operator conversations and multi-user access are deferred. |
| Q6: Module language | Module is the capability package; Model provider is a capability role; Pi extension is an upstream runtime integration, not a synonym for Module. | One module can contribute several capabilities. An instruction/skill document alone is not a module. |
| Q7: Report execution | A module-owned workflow collects bounded allowed source, gets a model summary without tools, and saves a report. | The conversational agent can start the same workflow through a tool. The model cannot change its steps. General agent tools remain separate. |
| Q8: Basic Tools packaging — superseded | The initial answer accepted a bundled Basic Tools module. The owner's subsequent clarification supersedes that answer: basic tools are the built-in baseline, with no enabled Automaton modules by default. | Internal Pi extension reuse is not a separate product-level module. See [ADR 0003](adr/0003-personal-composition-and-basic-tools-baseline.md). |
| Q9: Work vocabulary | Work request, Request receipt, Durable task, Module operation, and Workspace report are distinct. | Upstream Submission/Run/Turn remain technical terms rather than interchangeable public work names. This does not authorize a competing generic execution engine. |
| Personal-use priority | The owner is the intended user; ease of personal use takes priority even if the repository is public. | The module contract supports purpose-specific capability selection, not speculative ecosystem/distribution requirements. |
| Shared deployment | Install Automaton once per host. Each agent has independent configuration, state, and a separate-account systemd service. | No per-agent application build or required central manager daemon. Initially use one installed code version per host. |
| Monorepo and data boundary | Core, basic tools, CLI, optional modules, deployment assets, and docs share one repository. Deployed configuration/state live outside the checkout; local development can use ignored `.local/`. | Repository membership and installation do not enable modules. Only sanitized configuration examples are tracked. See [ADR 0004](adr/0004-monorepo-and-shared-installation.md). |
| Q10: Report contract | A bounded Markdown orientation brief, not a source audit. | Use a bounded path inventory and explicitly allowed text, cite relative paths, and distinguish gaps from verified facts. Do not infer build or test health. |
| Q11: Model endpoints — narrowed by Q33 | The generic OpenAI-compatible route is for loopback and explicitly configured private hosts. | No redirects to other destinations. Document data sent and the limits of trusting server-side behavior. Q33 adds two explicit hosted exceptions, not arbitrary public endpoints. |
| Q12: No configured model | An agent service can start without a model. | Controls stay available; reject model-dependent requests before admission. Explicitly enabled model-independent operations can run. No raw shell control command. |
| Q13: Queue | One bounded FIFO work queue per agent; a durable wait yields the execution slot. | Conversation requests and direct module work share the queue. Do not interleave turns in the same conversation. Inspection and cancellation bypass the work queue. Verify upstream mapping before implementation. |
| Q14: Authority | One trusted local operator; no per-tool approval prompts in Slice 1. | Control socket access delegates the agent's configured authority. Enforce grants at the OS boundary; untrusted input cannot expand them. Report summarization remains tool-free. |
| Q15: Naming | Separate immutable agent identity, stable host-local service key, and mutable display name. | Renaming the display name does not change accounts, paths, or unit names; service rekeying is deferred. |
| Q16: Durability floor | Require process-crash recovery, not physical power-loss durability, for Slice 1. | Keep commit-before-receipt and exclusive ownership. Record effective SQLite settings and their limitations; do not require `synchronous=FULL` as the release gate or claim power-loss proof from a process kill. |
| Q17: Module installation | Use one shared installation with explicit opt-in by module ID. | Prove the public contract with a reference module that needs no Core edits. Arbitrary runtime package paths and independent module installation are deferred. |
| Q18: Cancellation and retry | Active cancellation is best-effort and does not roll back effects. Uncertain effects are distinct and never replay automatically. | Cancel queued or waiting work without starting it. Repeating an uncertain action requires inspection and a fresh request. Retry safe checkpoints only through verified upstream behavior. |
| Q19: Restore release | Park restored pending work by default, even after the service leaves maintenance to admit new requests. | Only individually selected, recovery-eligible work can resume. Uncertain effects are not replayed. |
| Q20: Report publication | The committed Markdown is canonical and retrievable by ID; export has its own status. | Export recovery uses the committed Markdown without rescanning or calling a model. Never overwrite conflicting content. Release acceptance must show a successful export. |
| Q21: Transport | Allow HTTP on loopback. Require validated HTTPS for non-loopback private model hosts. | No insecure TLS override. An operator-managed authenticated tunnel can provide a loopback endpoint. |
| Q22: Model configuration and secrets | Register and configure model providers once in Core, with secrets in its secret store. Agent configuration selects how models are routed. | Do not assume per-agent credential files as the primary authoring interface. |
| Q23: Shared upgrades | Allow downtime for all affected agent services while activating one shared release. | Preflight compatibility, stop affected services and back up offline before activation, then restart individually. No automatic migration or rollback against incompatible state. An agent-only config change restarts just that agent. |
| Q24: Model broker | A local Core broker runs under a separate OS identity, owns model configuration and secrets, and routes calls for authenticated agent services. | Upstream credentials never reach agent processes. The broker does not supervise agents or manage their queues or state. Model-independent work can continue without it. |
| Q25: OAuth | Include OAuth login and automatic refresh for the first provider. | Identify and validate a concrete OAuth-capable target; OpenAI-compatible inference alone does not specify OAuth. Do not claim generic OAuth support. |
| Q26: Retention | No automatic purge in Slice 1. | Bound captured inputs, document safe operator-driven removal and remaining copies, and refuse affected admissions if storage cannot commit. |
| Q27: Host targets | Require two-agent acceptance on a non-production Linux/systemd host and real model evidence. | Publish observed recovery and disk use with finite configurable limits, not a hardware minimum or recovery SLA. Keep synthetic CI evidence separate. |
| Q28: Backup contents | Back up portable agent state, including durable transcripts, canonical reports and exports, plus sanitized config/references. | Exclude workspaces, scratch, system journals, and secret-store contents. Recreate access and secrets separately. The archive is sensitive and may contain private data or secrets already present in transcripts or snapshots. |
| Q30: Agent model selection | One configured model per agent in Slice 1; allow runtime switching in a later slice. | Keep model selection explicit; no runtime selector in Slice 1. |
| Q31: Report network | The dedicated report service may have explicit private network grants. | Do not claim it has no direct IP networking. Report source stays read-only; model credentials and provider calls stay at the broker. |
| Q32: Provider contract | Core owns the broker, catalog, and authorization. Trusted provider modules register broker-side adapters; agents use a generic Pi integration. | Domain modules run in the agent service and cannot read provider secrets or private broker state. Compatibility must be proved against pinned Pi. |
| Q33: Slice 1 model routes | Require private llama.cpp/Qwen and explicit hosted OpenAI Codex and Anthropic Claude subscription routes. This resolves the conflict in Q29. | Run workspace-report acceptance on the private route. Prove supported hosted login, refresh, and generation with non-sensitive inputs. Use the owner's existing Pi extension as a Claude reference, not as proof of compatibility. Never fall back to a hosted route. |
| Q34: Hosted reports | A hosted route can produce a workspace report only with explicit report-specific opt-in. | Selecting a hosted model alone is not consent to send a workspace snapshot. Enforce the same policy for direct and conversational report requests before admission. Document exactly what leaves the host. |
| Q35: Model configuration changes | Block changes to an agent's model configuration while it has pending work. | Apply this to shared catalog changes that affect the agent as well as agent-local selection. Normal OAuth refresh is credential lifecycle, not a model configuration change. An unexpected route mismatch blocks recovery rather than moving pending context to another destination. |

## Explicit deferrals

| Topic | Boundary in Slice 1 | Revisit when |
| --- | --- | --- |
| Scheduled and external-event triggers | No domain schedule, polling source, or external event initiates work. Durable waits within an existing operator request remain allowed. | A later slice selects a module that needs one of these triggers. |
| Autonomous goal initiation | An agent does not invent new goals or pursue unspecified ongoing goals. | A later proposal defines authority, budgets, stop conditions, and operator controls for ongoing autonomy. |
| Concurrent services for one agent | Only one active service can own an agent's writable durable state. | A later deployment design requires coordinated concurrent ownership or high availability. |
| Cross-host duplicate execution | Slice 1 supplies no distributed lease or global duplicate-agent detection. Host moves require the operator to stop the old service. | One agent must run safely across several hosts or fail over automatically. |
| Additional independent operator conversations and multi-user access | One primary operator conversation is exposed. Agent-owned work and domain state are not bound to that conversation's context lifetime. | A personal use case requires independent threads or delegated access. No multi-user product roadmap is implied. |
| Side-by-side runtime versions | One shared installed code version per host. Agents have independent configuration, not a promise of independent runtime versions. | A concrete personal need requires staggered long-term versions or a second installation. |
| Independent module publication and a third-party ecosystem | Modules live in the monorepo and serve the owner's composition needs. No separate repository, marketplace, or publishing infrastructure is required. | A concrete integration need justifies a separate package or release flow. A general ecosystem is not a product goal. |

## Evidence gates and delegated details

The earlier Q8–Q11 batch was canceled after Q8 and Q9. Q10 and Q11 were resolved in the resumed review, not inferred from that cancellation. The later personal-use clarification still supersedes Q8.

- **Upstream runtime:** prove pinned Pi integration with local broker transport, durable admission, the shared queue and yielding waits, non-replay of unsafe effects, and selective recovery of parked work. Show how a conversation can invoke a report without waiting behind itself. Prove crash-released exclusive store ownership and record effective SQLite settings and limitations. Bring back a blocker if the upstream APIs cannot preserve the agreed behavior; do not write a competing execution engine.
- **Model access:** identify supported login, automatic refresh, and generation interfaces for each subscription, and map private llama.cpp/Qwen capabilities through the same generic Pi integration. Use the existing Claude extension as a design reference, not as permission to read credentials or assume the same flow works for Codex. Stop dependent implementation on unsupported access rather than working around provider restrictions. Test with synthetic services first; the operator runs real sign-in and acceptance on a non-production setup using non-sensitive content.
- **Deployment details:** use the simplest supported paths, service-key format, package tooling, local protocol, and concrete limits consistent with the agreed boundaries. Verify broker identity, cross-agent state and secret denials, read-only report source, and the actual configured private-network grants on the supported Linux/systemd host. Do not claim broader isolation or availability than the evidence proves.

## Design tree

- Persistent agent identity — settled (Q1).
  - Agent-owned purpose and domain state outlive conversational context — settled (Q5).
  - Identity behavior for restore, clone, and host move — settled (Q4).
  - Immutable identity, stable service key, and mutable display name — settled (Q15); exact key/path conventions remain open.
- Operator-initiated work — settled (Q2).
  - Work request, Request receipt, Durable task, Module operation, and Workspace report — settled (Q9).
  - Mapping these concepts onto upstream execution records — implementation evidence still needed.
  - Shared queue and yielding durable waits — settled (Q13).
  - Best-effort cancellation and no replay of uncertain effects — settled (Q18); verify upstream mapping.
- Platform and module boundary — existing decisions need precise names and review.
  - Module, Model provider, and Pi extension are distinct — settled (Q6).
  - Basic tools are built-in; no Automaton modules enabled by default — settled by the owner's clarification (supersedes Q8).
  - Personal composition, not a third-party ecosystem — settled.
  - Shared-installation module selection and bare-agent operation — settled (Q12, Q17); exact allowed module contributions remain open.
  - Module operations and their relation to agent reasoning — open.
- First useful capability — workspace reports selected previously.
  - Module-owned report workflow with tool-free model summary — settled (Q7).
  - Bounded, cited orientation brief, separate publication status, and no automatic purge — settled (Q10, Q20, Q26).
  - Loopback/private model endpoint scope and transport — settled (Q11, Q21).
  - Shared model registration and isolated model broker — settled (Q22, Q24, Q32); private Qwen and explicit hosted Codex/Claude routes with OAuth login and refresh — settled (Q25, Q33), implementation evidence pending.
  - One configured route per agent, explicit hosted-report consent, and config changes blocked by pending work — settled (Q30, Q34, Q35).
- Deployment and durable state — shared installation and separate-account agent services settled.
  - Monorepo with deployed config/state outside code; ignored `.local/` permitted for local development — settled.
  - One installed code version per host; no central manager required — settled.
  - Trusted local operator with OS-enforced tool grants; process-crash durability — settled (Q14, Q16).
  - Selective restored-work activation and stopped-service shared upgrade — settled (Q19, Q23).
  - Portable backup contents and measured two-agent host acceptance — settled (Q27, Q28).
  - Dedicated report service may receive explicit private-network grants — settled (Q31). Exact permissions and paths are delegated within the agreed boundaries.
- Scope closure — awaiting operator confirmation before reconciling the PRD and ticket specifications. Evidence gates are not approvals to weaken the design.

## Tracker state

Epic: [SLICE 1: Durable agents, workspace reports, and isolated services](https://github.com/markdlabrecque/automaton/issues/1).

The epic has ten child issues and none are marked ready for agents. The current estimate and dependency graph predate the broker and subscription scope. Reconcile the existing tickets before restoring readiness:

| Tickets | Reconciliation needed |
| --- | --- |
| [#2](https://github.com/markdlabrecque/automaton/issues/2), [#4](https://github.com/markdlabrecque/automaton/issues/4) | Replace the `FULL` gate with process-crash evidence; keep exclusive ownership, committed receipts and honest storage limits. Expand the pinned-upstream evidence for broker transport and recovery semantics. |
| [#3](https://github.com/markdlabrecque/automaton/issues/3), [#5](https://github.com/markdlabrecque/automaton/issues/5) | Replace arbitrary local module loading and per-agent credentials with explicit shared-install module selection and a broker-side provider contract. Break out broker and provider-specific work where edit boundaries permit; give unsupported integrations a blocking investigation. |
| [#6](https://github.com/markdlabrecque/automaton/issues/6), [#7](https://github.com/markdlabrecque/automaton/issues/7) | Specify providerless controls, queueing, cancellation, route-change preflight, and the distinction between broker IPC and the protected operator socket. |
| [#8](https://github.com/markdlabrecque/automaton/issues/8), [#9](https://github.com/markdlabrecque/automaton/issues/9) | Specify opt-in hosted reports, canonical results versus export, sensitive backup boundaries, and selective activation of restored work. |
| [#10](https://github.com/markdlabrecque/automaton/issues/10), [#11](https://github.com/markdlabrecque/automaton/issues/11) | Package the separate broker and agent identities. Require real private report, hosted subscription, service isolation, restore, and reboot evidence without exposing private data. |

This decision record does not authorize implementation, deployment, ticket rewrites, or restoration of readiness.

# Slice 1 development backlog

## Approval and current baseline

The owner approved the full Slice 1 scope and these recommendations during backlog preparation:

- Keep separate persistent agents, systemd services, protected local CLI, basic tools, opt-in domain modules, and a separate credential-owning broker.
- Require private Qwen **and** supported Codex/Claude subscription routes, durable reports, offline backup and individually released restore.
- Preserve selective recovery as a hard positive gate. Proceed with independent compatibility checks; do not replace the scheduler, manipulate private storage, or weaken guarantees to bypass a failed seam.
- Delegate routine reversible tooling/path/protocol choices within the approved boundaries. Live sign-in, credential provisioning and non-production host acceptance remain operator work, not agent authorization.

[PRD.md](../PRD.md) defines required behavior; [design-review.md](design-review.md) records decisions. This page maps them to execution. It does not claim implementation or compatibility. The live issue bodies/dependencies supersede older planning comments.

`develop` is the default integration branch; `main` is the release branch. Follow [CONTRIBUTING.md](../CONTRIBUTING.md). The workflow baseline is merged through [PR #16](https://github.com/markdlabrecque/automaton/pull/16), with docs-only CI in [PR #18](https://github.com/markdlabrecque/automaton/pull/18). Negative recovery evidence is merged via [PR #19](https://github.com/markdlabrecque/automaton/pull/19), commit `9aba7b84d0befdb796dbacc16c544425a7aa6625`, at [investigations/selective-recovery](../investigations/selective-recovery/README.md). There is still no application runtime/build/typecheck implementation.

## Runnable entry points

Only these tasks are initially `ready-for-agent`; each uses **`openai/gpt-6.1-terra`**:

| Task | Deliverable | Dependency |
| --- | --- | --- |
| [#2](https://github.com/markdlabrecque/automaton/issues/2) | TypeScript/pinned foundation, affirmative admission/deduplication/committed process-reopen evidence, evidence index and CI | None |
| [#21](https://github.com/markdlabrecque/automaton/issues/21) | Sourced private Qwen protocol/capability feasibility | None |
| [#22](https://github.com/markdlabrecque/automaton/issues/22) | Sourced supported Codex subscription login/refresh/inference contract | None |
| [#23](https://github.com/markdlabrecque/automaton/issues/23) | Sourced supported Claude subscription contract; non-secret extension source as reference only | None |

Ready means planned and runnable, not started or accepted. No runtime work is launched by this preparation. Evidence research does not need broker implementation or live credentials.

## Full dependency graph

All open task tickets below use `openai/gpt-6.1-terra`. The epic stays open and is **not** marked runnable as one agent assignment. Blocked tasks are not ready. Promote tasks deliberately after dependencies merge and affirmative contracts are verified; issue closure alone is insufficient for feasibility evidence.

| Task | Hard prerequisites / state | Estimate (human, no AI) |
| --- | --- | ---: |
| [#2](https://github.com/markdlabrecque/automaton/issues/2) — pinned foundation and admission | Runnable | 10h |
| [#24](https://github.com/markdlabrecque/automaton/issues/24) — queue, waits, cancellation and uncertain-effect safety | #2 | 10h |
| [#25](https://github.com/markdlabrecque/automaton/issues/25) — store ownership and effective SQLite guarantees | #2 | 8h |
| [#26](https://github.com/markdlabrecque/automaton/issues/26) — generic Pi/broker transport seam | #2 | 8h |
| [#20](https://github.com/markdlabrecque/automaton/issues/20) — affirmative selective-release proof | **Waiting for a concrete supported upstream mechanism**, not ready | 12h, excluding external wait |
| [#21](https://github.com/markdlabrecque/automaton/issues/21) — private Qwen feasibility | Runnable | 4h |
| [#22](https://github.com/markdlabrecque/automaton/issues/22) — Codex feasibility | Runnable | 6h |
| [#23](https://github.com/markdlabrecque/automaton/issues/23) — Claude feasibility | Runnable | 6h |
| [#3](https://github.com/markdlabrecque/automaton/issues/3) — config and domain module host | #2 | 10h |
| [#4](https://github.com/markdlabrecque/automaton/issues/4) — persistent identity/store | #2, #25 | 8h |
| [#12](https://github.com/markdlabrecque/automaton/issues/12) — broker and protected secrets | #26 | 16h |
| [#5](https://github.com/markdlabrecque/automaton/issues/5) — private Qwen adapter | #12, explicitly supported #21 outcome | 6h |
| [#13](https://github.com/markdlabrecque/automaton/issues/13) — Codex adapter | #12, explicitly supported #22 outcome | 10h |
| [#14](https://github.com/markdlabrecque/automaton/issues/14) — Claude adapter | #12, explicitly supported #23 outcome | 10h |
| [#6](https://github.com/markdlabrecque/automaton/issues/6) — durable agent/basic tools | #3, #4, #12, #24, **#20** | 16h |
| [#7](https://github.com/markdlabrecque/automaton/issues/7) — service and protected CLI | #6 | 10h |
| [#8](https://github.com/markdlabrecque/automaton/issues/8) — reports/canonical retrieval/export | #6 | 12h |
| [#9](https://github.com/markdlabrecque/automaton/issues/9) — offline backup and restore | #4, #7, #8, **#20** | 10h |
| [#10](https://github.com/markdlabrecque/automaton/issues/10) — shared installation/systemd packaging | #5, #7, #8, #12 | 12h |
| [#11](https://github.com/markdlabrecque/automaton/issues/11) — synthetic journey and real release acceptance | #9, #10, #13, #14 | 16h |

The new split isolates executable boundary proofs from implementation. #2 is no longer an all-purpose compatibility approval. #3/#4/#12 can progress after their own independent evidence, without waiting for selective restore. #6 and #9 explicitly require #20, so transitive service/report/packaging acceptance cannot bypass it. No speculative partial runtime is authorized on the failing restore seam.

## Evidence and stopping rules

### Selective recovery

[#15](https://github.com/markdlabrecque/automaton/issues/15) is the completed **negative evidence investigation**, not the product proof. Its merged fixture documents that admitting new work advances an unselected built-in generation, while registering a missing shared definition releases both same-kind tasks. Passing that probe reproduces the failure; it proves neither parking nor unsafe-effect non-replay.

The outstanding positive outcome belongs to [#20](https://github.com/markdlabrecque/automaton/issues/20). The [upstream request](https://github.com/earendil-works/pi/issues/12306) was auto-closed by policy without a technical resolution. Wait for a concrete documented supported mechanism, potentially in a later version. Do not assign another open-ended repetition of the same failed approaches. A candidate requires:

1. Restore same-kind eligible A/C, including built-in generation; inspect without either executing or settling.
2. Complete new B in another conversation in the **same Harness**, while A/C retain identity and remain parked.
3. Release A by ID only; C remains parked across another reopen and admission, preserving task ownership.
4. Separately prove an uncertain interrupted synthetic effect cannot replay automatically when other work is released.

A new application pin requires deliberate compatibility revalidation; keep the original pinned negative fixture as historical evidence. Read-only inspection can be proved independently. No affected restore path leaves maintenance on unsupported behavior.

### Provider feasibility vs adapter proof

#21/#22/#23 are bounded source/interface investigations and may finish **supported**, **blocked on tested approaches**, or **inconclusive**, with exact sources, versions, missing inputs and downstream disposition. They do not implement adapters, access credentials or establish account acceptance. Negative/inconclusive closure does not make #5/#13/#14 ready.

Each adapter requires an explicitly supported contract and affirmative synthetic verification. Required capabilities that remain unsupported keep its implementation/release open and blocked; no private endpoint workaround, API-key substitution or provider fallback. Real login, observed automatic refresh (not merely an unexpired token) and authenticated generation remain operator-run #11 acceptance.

### Independent runtime proofs

#2/#24/#25/#26 are affirmative proof tickets: reproducible negative evidence is useful but cannot close them as passed. Stop and record precise blockers if a supported seam fails. Their markdown reports form an evidence index, not a product implementation. Reuse synthetic fixtures and deterministic barriers. Unit tests cover pure rules; integration tests exercise real persistence/IPC/effect boundaries. Only #11 owns the full synthetic wiring journey, in PR/nightly CI rather than every commit.

## Release acceptance and estimate

[#1](https://github.com/markdlabrecque/automaton/issues/1) is complete only with the PRD acceptance outcomes and #11 evidence: private Qwen report with successful export after interruption; both subscriptions' supported login/refresh/generation; two real systemd agent identities plus broker isolation; no cross-agent state or provider secret access; source-write denial and actual configured network grants; independent restart, broker outage, offline parked restore and real reboot. No secrets/private content belong in the evidence.

Current estimate: **210h remaining human effort without AI**, excluding upstream wait time and the delivered #15 investigation. The task rows sum to 200h including task-local verification/review, plus 10h cross-cutting reconciliation/release review. Activities: 64h compatibility/provider evidence, 88h implementation with local verification, 22h runtime/CLI/report/backup boundary verification and review, 10h packaging/upgrade instructions, 16h synthetic wiring and operator QA/acceptance, 10h final release reconciliation. This replaces the old 160h estimate, not a delivery date. Re-estimate if a required interface is unsupported or a new pin changes the design; do not price an unknown upstream fix as routine implementation.

No credentials or host setup are needed to start the four runnable tasks. Later, the owner supplies non-production Linux/systemd access, private Qwen configuration and operator-run supported subscription sign-in. Development permission never overrides the no-production/no-credential-retrieval boundaries.

# Selective recovery on pi-durable 1.5.2

**Result: the tested public Harness paths do not satisfy [Slice 1 Q19](../../docs/design-review.md).** A new model input can complete, but admitting it also lets an unselected restored generation settle. Withholding a custom task definition keeps tasks of that kind blocked, but reinstalling it releases both same-kind tasks. Treat selective recovery of existing Pi work as **blocked for [#2](https://github.com/markdlabrecque/automaton/issues/2)** until a supported per-item control is demonstrated. This is evidence against the tested mappings, not a proof that every possible composition is impossible.

## Reproduce

Observed on Linux with Node.js 24.20.0 and npm 11.19.0:

```sh
cd investigations/selective-recovery
npm ci --ignore-scripts --no-audit --no-fund
npm run probe
```

The fixture pins `@earendil-works/pi-durable`, `@earendil-works/pi-ai`, and `@earendil-works/chord` to 1.5.2 with a lockfile. It uses the public `Harness`, `ReadOnlySession`, `createRegistry`, `defineExtension`, and `defineTask` exports, `openNodeSqliteStorage` from `@earendil-works/pi-durable/storage/sqlite/node`, `createModels`, `fauxProvider`, and `fauxAssistantMessage` from `@earendil-works/pi-ai`, and `BACKGROUND_CONTEXT` from `@earendil-works/chord/context`.

Each scenario seeds a temporary SQLite store and kills its own seed process with `SIGKILL` at a known boundary. The parent checks the child's exit signal before reopening in a fresh process. Committed receipts and `observeCommits()` are the observation barriers; there are no sleeps, provider credentials, network requests, or external effects. The parent timeout only bounds a stalled probe. A zero exit means the assertions reproduced the **pinned runtime behavior**, not that Q19 passed.

## Observed behavior

```text
same-kind: a new write settled while both restored tasks were blocked
same-kind: reinstalling the shared definition released both tasks, not just old-a
generation: read-only Harness preserved the interrupted task and refused admission and scheduling
generation: new input answered, but the unselected restored input settled as interrupted
```

### Missing definitions block by kind, not by item

The seed commits two pending tasks, `old-a` and `old-b`, with one shared task definition while scheduling is paused, then crashes. The next process opens without the definition. It submits a passive transcript write and verifies the write settles and both task records remain unchanged with `blocked: missing_task`, even though scheduling is now running. It then installs the definition and waits only on `old-a` by ID. A passive commit observer sees `old-b` complete too. Neither task needs model access; the write is not a successful model turn or proof of a general parking mechanism.

### New model work progresses by advancing unselected restored work

The seed submits a model input and crashes inside the in-process faux provider. A read-only **Harness** over the same SQLite file preserves the stored `running` task and `placed` input, rejects both `resume()` and new admission, and makes no model call. This is Harness-level read-only behavior, not a test of filesystem permissions or a read-only SQLite connection.

A writable reopen reports the same `pi.generation` task as `pending` with one restart. Creating a fresh conversation in the same Harness leaves that state unchanged and scheduling paused. `fresh.submit()` of a new model input causes the old input to settle as `unanswered` / `interrupted`, which the probe observes **before any submission or idle wait**. The new input then returns a successful receipt with a synthetic assistant answer. The faux provider was called once after reopen, for the new answer. With retries disabled, the old task changed durable state without making another model call. This violates parking; it does **not** demonstrate replay of an uncertain effect. The separate conversation isolates the scheduler behavior from same-conversation inbox rules; it is not a proposed product design.

## Why the reviewed paths cannot enforce Q19

References below are relative to the published `node_modules/@earendil-works/pi-durable/dist/` from the clean install. The probe calls only public APIs; implementation files explain the observations in this pin.

- `harness/types.d.ts` (`HarnessOptions`, `Harness`) documents `readOnly` as inspection without admission or task execution. A writable Harness starts paused, but submit and task/submission waits enable scheduling. `onWake` lets a host arrange wakeups, not choose runnable task IDs.
- `harness/submissions.js` (`Submissions.#traced`) calls the scheduler-wide resume before admission, including the `Conversation.submit(tx, draft)` overload. Moving submit into a transaction is therefore not a scheduler-off admission mechanism.
- `harness/scheduler.js` (`TaskScheduler.open`, `resume`, `#reserve`) recovers live tasks at writable open, then uses a shared scheduler switch and reserves ready records. The public Harness declarations offer no per-ID hold/release or ready-task predicate. `waitForTask(id)` selects a receipt, not a scheduling scope.
- `harness/scheduler.js` resolves definitions by `record.kind`; `harness/harness.js` requires built-in definitions at open. Missing-definition blocking is not an operator hold for `pi.generation` or for individual same-kind records. `types.d.ts` lets a task set its own checkpoint through `TaskRuntime.commit`; public host `Tx` does not expose an update of an arbitrary existing task's checkpoint. Designing a new cooperative task does not establish control over existing built-ins.

## Downstream contract

Do not use paused writable reopen, transactional submission, targeted waits, or registry withholding as the Q19 implementation. Read-only inspection can remain an independent operation, subject to the storage and ownership checks in [#2](https://github.com/markdlabrecque/automaton/issues/2). This probe does not cover those checks, same-conversation ordering, or non-replay of uncertain tool effects.

Ask upstream for a supported seam, or evaluate a later pin that documents one. Require an affirmative integration probe against the candidate before shipping restore release:

1. Restore two distinguishable eligible items, A and C, of the same kind. Inspect them without starting or settling either. Cover built-in generation, not only cooperative custom task definitions.
2. Admit and complete B in an independent conversation in the same Harness. A and C must retain their identities and stay parked, with neither executing nor settling.
3. Release A by ID and verify it progresses while C stays parked. Reopen the store and admit new work again; C must still be parked. Verify the hold preserves task ownership relationships.
4. Include a separate interrupted, uncertain synthetic effect: it must remain ineligible for automatic replay, even when other work is released.

Until then, keep the affected restore path in maintenance rather than edit SQLite rows, replace the scheduler, or weaken Q19. Independent compatibility checks can continue.

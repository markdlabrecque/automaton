# Pinned foundation compatibility evidence

## Scope and status

Evaluation pin: Node **24.20.0**, npm **11.19.0**, `@earendil-works/pi-durable`, `@earendil-works/pi-ai`, and `@earendil-works/chord` **1.5.2**, TypeScript **5.9.3**. Exact transitive dependencies are in the root lockfile; the historical investigation has its own unchanged lockfile. Upstream describes pi-durable as experimental. This is a narrow executable admission experiment, not a product runtime, product acceptance, or release readiness. Acceptance remains subject to review and merge.

Public imports exercised: `BACKGROUND_CONTEXT` from `@earendil-works/chord/context`; `createModels` from `@earendil-works/pi-ai`; `Harness`, `createRegistry`, `defineExtension`, `defineTask`, `defineDoc` and the `Conversation`/`SubmissionId` types from `@earendil-works/pi-durable`; `openNodeSqliteStorage` from `@earendil-works/pi-durable/storage/sqlite/node`. No private SQLite mutation or network/model call is used.

## Reproduce

On Linux, from the repository root:

```sh
export PATH=/home/mark/.config/nvm/versions/node/v24.20.0/bin:$PATH
node -v && npm -v
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
npm test
(cd investigations/selective-recovery && npm ci --ignore-scripts --no-audit --no-fund && npm run probe)
git diff --check
```

The absolute PATH is specific to the evaluation host; elsewhere use the same Node/npm versions. `tests/foundation.test.mjs` uses local SQLite and synthetic data, spawning `tests/fixtures/foundation-child.mjs`. Its child writes a barrier containing identifiers **after** the immediate commits have resolved, then SIGKILLs itself; the parent requires that exact signal and opens a new Harness. The timeout bounds hangs, not progress. `tests/fixtures/foundation.mjs` holds the shared deterministic task/document setup. No sleeps or credentials are used.

## Observed contract and limits

`src/admission.ts` is a deliberately narrow evaluation mapping for passive string writes, not a generic admission API. Caller request IDs are nonempty and scoped to a conversation. A conversation document stores exact payload and submission ID, atomically with `Conversation.submit(tx, draft)` inside `Conversation.commit`. A retry compares the payload and verifies the mapped submission; conflicting reuse and an upstream ID without the mapping fail closed. The commit return, not the ID returned inside its callback, is the receipt boundary. Matching concurrent retries serialize on the Harness transaction line. The test observes the original ID and exactly one entry after a kill/reopen, matching retries, conflict rejection, and independent reuse in a different conversation. Upstream request-ID lookup alone does not compare same-type payloads; consumers must not bypass this mapping or mix unmanaged IDs with it. General JSON canonicalization, request policy, bounds and cross-process ownership remain future work.

The same child stores a conversation document and a terminal synthetic task result, creates another task, then is killed; a fresh Harness reads their stored values/records. This proves survival at these committed boundaries, not selective parking, queue behavior or recovery of arbitrary in-flight effects. The rollback check obtains a provisional transactional submission ID and throws before commit; it is absent after reopen. A wrapper of the public Storage boundary injects a commit rejection before delegating to real SQLite: admission rejects, no success receipt is returned, and the request is absent on reopen. This is deterministic failure injection, not a simulation of every disk-full, I/O or ambiguous-commit failure. Never report success on a rejected commit; after an ambiguous failure reopen and reconcile before retrying.

Pi's documented immediate commit stores before resolving; do not use deferred document-only commits as receipt/result barriers. `submit(tx, ...)` may resume the scheduler and its ID is provisional until the outer commit succeeds. A fresh writable Harness can recover tasks; neither this experiment nor its mapping makes restored work safe to run. This is process-crash evidence only, not physical power-loss durability or a verified effective SQLite settings/ownership claim.

## Evidence index

| Gate | Status and owner |
| --- | --- |
| Pinned admission and committed process reopen | Runnable narrow affirmative evidence above; [#2](https://github.com/markdlabrecque/automaton/issues/2), pending review/merge and product integration |
| Queue, cancellation, waits and unsafe effects | Unverified; [#24](https://github.com/markdlabrecque/automaton/issues/24) |
| Exclusive ownership and effective SQLite settings | Unverified; [#25](https://github.com/markdlabrecque/automaton/issues/25) |
| Generic Pi broker seam | Unverified; [#26](https://github.com/markdlabrecque/automaton/issues/26) |
| Selective restored-work release | Blocked pending supported candidate and positive proof; [#20](https://github.com/markdlabrecque/automaton/issues/20) |

The [historical investigation](../investigations/selective-recovery/README.md) from [#15](https://github.com/markdlabrecque/automaton/issues/15) is negative evidence. Its zero exit reproduces the failed selective-recovery gate; it is **not** positive recovery acceptance. Do not admit new work in a way that releases unselected restored work, manipulate private rows, replace the scheduler, or downgrade the guarantee.

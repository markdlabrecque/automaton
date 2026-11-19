# Development and release workflow

## Branches and tickets

- `develop` is the default branch and integration point for the next release.
- `main` represents released code. Release PRs go from this repository's `develop` to `main`; do not merge individual feature branches directly into `main`.
- Start standalone ticket work from current `origin/develop`, using `feature/<ticket>-<slug>`, `fix/<ticket>-<slug>`, or `chore/<ticket>-<slug>`. Open the PR back into `develop`.
- Prefer an epic for a feature with multiple tickets. The epic issue describes the outcome, acceptance criteria, and links its task issues using GitHub sub-issues. Each task links back to the epic and records dependencies.
- Create `epic/<epic-ticket>-<slug>` from current `origin/develop`. Branch each task from that integration branch; merge task PRs back into it. Once the epic is complete and verified, merge an epic PR into `develop`.
- Keep integration branches current through PRs from a normal numbered task branch. Do not open `develop` → epic synchronization PRs: they bypass the task route. For example, create `chore/<ticket>-sync-develop` from the epic, merge `origin/develop` locally, then PR it into the epic.
- Use merge commits for `develop` → `main` releases to preserve shared ancestry across releases. Squash merging is available for task PRs. Delete finished task/epic branches manually; do not delete `develop` after a release.

```text
origin/develop ── feature/2-task ──PR──────────────────────► develop
       └─────── epic/1-feature ────────────────────PR─────► develop ──PR──► main
                       ├── feature/3-task ──PR──► epic/1-feature
                       └── feature/4-task ──PR──► epic/1-feature
```

Example task setup:

```sh
git fetch origin
git switch -c feature/2-example origin/develop
# For an epic task, use origin/epic/1-feature instead.
```

## Required PR metadata

Include a real issue URL on its own line, matching the source branch's ticket number:

```text
Ticket: https://github.com/markdlabrecque/automaton/issues/2
```

For a task targeting an epic branch, also link that epic. For an epic integration PR, both `Ticket` and `Epic` point to the epic issue:

```text
Epic: https://github.com/markdlabrecque/automaton/issues/1
```

Release PRs also link a release/epic ticket using `Ticket:`. Avoid `Closes` for task PRs into an epic branch if closure should wait for release; update ticket status deliberately. GitHub's automatic issue closure follows the default branch (`develop`), not necessarily a production release.

The CI policy validates routes and matching URL numbers, not issue existence, sub-issue membership, completion, or acceptance evidence. Reviewers verify those. It does not enforce which commit a branch was originally created from; follow the ancestry instructions above.

## Checks and review

The `CI` workflow runs on every branch push and every PR (including PRs into `develop`, `epic/*`, and `main`). PR body/base edits rerun metadata checks. It has read-only permissions, does not retain checkout credentials, and uses no provider credentials or live services.

### Docs-only CI exception

The required PR job always runs, including branch-route and ticket validation. Only code tests and recovery probes are skipped when **every changed path** is one of root `README.md`, `CONTRIBUTING.md`, `PRD.md`, `GLOSSARY.md`, or a Markdown (`.md`) file under `docs/`. `AGENTS.md` and `CLAUDE.md` are never considered docs-only, even under `docs/`.

Changes to workflows, rulesets, scripts, tests, dependencies, other file types, or any mixture of docs and code run the full checks. Renames count both the old and new paths. PR detection covers the complete merge-base diff, not just the latest commit; push detection covers the complete pushed range. Manual runs, new branches, empty diffs, unavailable history, or detection errors default to full checks. There are no workflow-level path filters that could leave a required check pending.

To force full checks for a documentation branch, use Actions → CI → Run workflow and select that branch. Manual runs never take the docs-only shortcut.

Run the commit-tier checks locally before opening a PR, with Node 24.20.0:

```sh
node --test tests/*.test.mjs
# If the selective-recovery investigation is present on your branch:
(cd investigations/selective-recovery && npm ci --ignore-scripts --no-audit --no-fund && npm run probe)
```

The policy and docs-path classification tests are unit-tier; one local Git integration test verifies actual diff behavior. The investigation probes use real local persistence and synthetic providers (integration-tier). Their success reproduces known compatibility findings; it does **not** pass the selective-recovery release gate. There is no implemented application build/typecheck suite on the initial development branch. Add those checks as the runtime lands; do not mistake the current CI for runtime or release acceptance.

Keep unit/integration checks on every code-affecting commit; the docs-only CI exception above skips those checks for strictly allowlisted documentation changes. Future functional journeys belong in PR/nightly CI, with real-model/systemd acceptance remaining operator-run on a non-production host.

## GitHub enforcement

Active repository rulesets protect `main`, `develop`, and `epic/*`:

- PR required; direct updates cannot bypass review flow, including administrators (no bypass actors).
- `Repository checks` must pass and the PR must be up to date with its base.
- All review conversations must be resolved.
- Force pushes and deletion are blocked.
- No additional approving reviewer is required, so a solo maintainer can merge their own passing PR.

`develop` is the repository default. Merge commits and squash merges are enabled; rebase merges and automatic head-branch deletion are disabled. The latter preserves the long-lived `develop` branch after release PRs.

The applied ruleset payload is versioned in [`.github/rulesets/protected-branches.json`](.github/rulesets/protected-branches.json). GitHub settings are live repository configuration, not automatically applied by these files. An owner can still edit rulesets; no repository rule prevents an owner from changing repository settings. CI files and policy changes need review just like other code—these checks are not a security sandbox against a collaborator rewriting the checks themselves.

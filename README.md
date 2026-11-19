# Automaton

A personal platform for durable, purpose-specific agents built on Pi and pi-durable.

Install Automaton once per host. Configure each agent independently, with its own persistent state and systemd service. Agents start with basic file and shell tools and no enabled modules; additional capabilities are opt-in.

The Core, basic tools, CLI, optional modules, and deployment assets share one monorepo. Real agent configuration and state live outside the deployed code. Local development can use the ignored root `.local/` directory; tracked examples must contain no private data or credentials.

## Contributing

Use ticket branches and epic integration branches, with PRs into `develop` and release PRs from `develop` into `main`. See [the development workflow](CONTRIBUTING.md) for branch names, required ticket links, CI, and protected-branch rules.

## Documentation

- [Product requirements](PRD.md)
- [Deployment and repository model](docs/deployment-model.md)
- [Domain glossary](GLOSSARY.md)
- [Approved design decisions and evidence gates](docs/design-review.md)
- [Development backlog and execution order](docs/development-backlog.md)
- Architecture decisions:
  - [Agent identity outlives execution and context](docs/adr/0001-agent-identity-outlives-execution-and-context.md)
  - [Module-owned workspace report workflow](docs/adr/0002-module-owned-workspace-report-workflow.md)
  - [Personal composition and the basic-tools baseline](docs/adr/0003-personal-composition-and-basic-tools-baseline.md)
  - [Monorepo and shared installation](docs/adr/0004-monorepo-and-shared-installation.md)

## Current status

- **Repository workflow is established:** [PR #16](https://github.com/markdlabrecque/automaton/pull/16) landed on `develop`. It is the default development branch; `main` remains the release branch. Protected integration/release branches require PRs and passing checks, with no administrator bypass. See [CONTRIBUTING.md](CONTRIBUTING.md) for task and epic routes.
- **CI is a foundation, not runtime acceptance:** the workflow runs on branch pushes and PRs. After [PR #18](https://github.com/markdlabrecque/automaton/pull/18), the required `Repository checks` PR job and its route/ticket validation always run; only code tests and synthetic selective-recovery probes skip strictly allowlisted docs-only changes. Mixed changes, unrecognized paths, or uncertain detection run full checks. See [the docs-only CI exception](CONTRIBUTING.md#docs-only-ci-exception) for the allowlist and fallback rules. The current suite has 13 tests; recovery probes run when their investigation files are present and full checks apply. Those files landed on `develop` via [PR #19](https://github.com/markdlabrecque/automaton/pull/19); their passing probe reproduces negative findings. No application build/typecheck suite or installed runtime is delivered by these workflow changes.
- **Slice 1 scope is approved:** the [epic](https://github.com/markdlabrecque/automaton/issues/1) remains open, with all three model routes required and selective restore preserved as a hard positive gate. Start with the runnable foundation and provider-feasibility tasks in [the development backlog](docs/development-backlog.md). The completed [negative investigation](https://github.com/markdlabrecque/automaton/issues/15) does not satisfy the outstanding [selective-release proof](https://github.com/markdlabrecque/automaton/issues/20), which waits for a concrete supported mechanism.

The product and deployment documents describe approved required behavior, not an implemented runtime or installation procedure. Scope approval and repository CI do not satisfy provider, recovery, or non-production host release gates, or authorize credential retrieval, sign-in or host-service changes.

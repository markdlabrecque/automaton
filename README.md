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
- [Design review and unresolved questions](docs/design-review.md)
- Architecture decisions:
  - [Agent identity outlives execution and context](docs/adr/0001-agent-identity-outlives-execution-and-context.md)
  - [Module-owned workspace report workflow](docs/adr/0002-module-owned-workspace-report-workflow.md)
  - [Personal composition and the basic-tools baseline](docs/adr/0003-personal-composition-and-basic-tools-baseline.md)
  - [Monorepo and shared installation](docs/adr/0004-monorepo-and-shared-installation.md)

## Current status

- **Repository workflow is established:** [PR #16](https://github.com/markdlabrecque/automaton/pull/16) landed on `develop`. It is the default development branch; `main` remains the release branch. Protected integration/release branches require PRs and passing checks, with no administrator bypass. See [CONTRIBUTING.md](CONTRIBUTING.md) for task and epic routes.
- **CI is a foundation, not runtime acceptance:** the workflow runs on branch pushes and PRs, validates PR routes/ticket references, and runs the policy unit tests. It also runs the synthetic selective-recovery probes when their investigation files are present. Those files have not yet landed on `develop`; no application build/typecheck suite or installed runtime is delivered by the workflow change.
- **Slice 1 is still gated:** the [epic](https://github.com/markdlabrecque/automaton/issues/1) remains open. [Selective recovery](https://github.com/markdlabrecque/automaton/issues/15) has reproducible negative evidence against pi-durable 1.5.2, not a passing restore implementation. Its evidence branch is not yet merged. Independent checks in the [compatibility task](https://github.com/markdlabrecque/automaton/issues/2) can proceed, while the selective-release path remains blocked pending a supported mechanism and positive evidence.

The product and deployment documents describe intended behavior, not an implemented runtime or installation procedure. Merging repository infrastructure does not approve unresolved design questions or satisfy provider, recovery, or non-production host release gates.

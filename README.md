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

The project is in design review. These documents record accepted directions and open questions; they do not claim an implemented runtime or installation procedure. The [Slice 1 epic](https://github.com/markdlabrecque/automaton/issues/1) remains paused for reconciliation with the design decisions.

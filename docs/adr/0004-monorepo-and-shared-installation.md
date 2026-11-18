# One monorepo and one shared installation per host

Keep the Core, basic tools, CLI, optional modules, deployment assets, and documentation in one monorepo. Install Automaton once per host and deploy each agent independently through configuration, persistent state, and its own systemd service under a separate unprivileged account. Sharing source or installed module code does not enable a capability for an agent or permit bypassing the module contract.

We chose this over separate application builds and repositories for each agent or capability because the owner's development and deployment convenience takes priority. Agent configuration and state remain separate from the installed code and from each other. Deployed data lives outside the checkout; local development can use the ignored root `.local/` directory. Only sanitized templates belong in tracked files.

Slice 1 targets one installed code version per host, not independently pinned runtime versions per agent. Agent configuration changes need only that agent's compatible restart; shared code upgrades require controlled restarts of affected services. There is no required central manager daemon. Side-by-side versions, independent module publication, and exact package/build tooling are not requirements of this decision.

# Deployment and repository model

Status: accepted deployment direction; the application and deployment tooling are not implemented yet. Exact package names, commands, and filesystem paths below are illustrative, not an installed interface.

## Personal use comes first

Automaton is a personal agent platform for its owner. It can be open source, but convenience for the owner takes priority over a third-party module ecosystem, broad distribution support, or hosted multi-tenancy.

The module boundary exists so the owner can select tools and capabilities for each agent's purpose. It does not require independent repositories, independent release schedules, a package marketplace, or a separate service for each module.

## Install once, configure agents independently

A host has one shared Automaton installation. Each agent has its own configuration, persistent state, service process, and OS execution identity.

| Part | Contains | Changes when |
| --- | --- | --- |
| Automaton installation | Core code, basic tools, and available module code | The owner installs or upgrades the platform or module code |
| Agent configuration | Purpose, enabled modules and their settings, model selection, workspace grants, limits, and credential references | The owner changes what that agent can do |
| Agent state | Persistent identity, conversations, accepted work, checkpoints, results, and module-owned data | The agent accepts or performs work |
| Agent service | The active execution of one agent using the shared installation and its own configuration and state | The owner or systemd starts, stops, or restarts it |

An agent is not another source checkout, application build, or copy of the installed code. It is also not merely its configuration file: its persistent identity and history live in its state.

Changing an agent's configuration does not create a new agent or erase its state. A deliberate clone creates a new identity; recovery from a backup or a host move preserves identity. Module changes must still respect pending work and stored-state compatibility.

## Default composition

An agent has the built-in basic tools—read, write, edit, and shell execution—and no enabled modules by default. Their actual reach depends on its OS permissions and service restrictions.

Basic tools are the platform baseline, not an enabled Automaton module. The implementation can reuse upstream Pi extension mechanisms without changing this product distinction.

Model access, workspace reports, and other capabilities are optional modules. Code being present in the repository or available in the installation does not enable it for an agent.

For example:

```text
Shared Automaton installation
  Core and basic tools
  Available modules
    OpenAI-compatible model access
    Workspace reports

Agent: project-reporter
  Enabled modules: model access, workspace reports
  Source workspace: read-only
  Report output and scratch workspace: writable
  Separate configuration, identity, state, credentials, and service account

Agent: coding-helper
  Enabled modules: model access
  Project workspace: explicitly writable
  Separate configuration, identity, state, credentials, and service account
```

The workspace-report module remains optional even if its source and the platform source share a repository. It is the first useful domain capability used to prove the module boundary, not part of the Core.

Because model access is a module capability, the default composition has no configured model provider. The exact startup, readiness, and available-command behavior of that unconfigured agent remains an open design question. Implementors must not silently enable a provider to avoid deciding it.

## One service per agent

Systemd supervises the individual agent services. There is no required central manager daemon, shared live harness, or shared scheduler for all agents.

Illustrative service names:

```text
automaton@project-reporter.service
automaton@coding-helper.service
```

Each service loads the same installed code with different configuration and state paths. Stopping or restarting one service does not stop another. Each runs as a separate unprivileged account, with access to the files, sockets, network, and credentials granted to that agent.

The service name is an operational address, not the agent's immutable identity. The precise identifier format and rename procedure remain to be specified.

Only one active service can own an agent's writable state. A local ownership guard does not prevent an operator from running a copied store on a second host. Before moving or recovering an agent elsewhere, the owner must stop its previous service. Distributed ownership and automatic failover are deferred.

## One monorepo, separate runtime data

Keep the Core, basic tools, operator CLI, optional modules, deployment assets, and documentation in this repository. A module must use the public module contract even when its source is nearby; it must not depend on private core tables or implementation details.

An illustrative future source layout is:

```text
automaton/
  packages/
    core/                    # Includes the basic tools
    cli/
  modules/
    openai-compatible/
    workspace-report/
  deploy/
  docs/
  examples/                  # Sanitized templates only
  .local/                    # Ignored local development data, if used
```

This is not a decision to adopt a particular workspace manager, build orchestrator, or publication system. Choose the simplest tooling needed by the actual implementation.

### Deployed agents

Real agent configuration, state, credentials, reports, and backups live outside the source checkout and installed application directory. This lets the owner replace code without replacing agents or exposing private data through source control.

Illustrative Linux locations are:

```text
/etc/automaton/agents/<service-name>.json    # Agent configuration
/var/lib/automaton/<service-name>/           # Identity and persistent state
/run/automaton/<service-name>/              # Ephemeral control socket/runtime files
```

Credential storage and exact path conventions still need specification. Credential references can appear in protected configuration; credential values must not appear in committed examples or ordinary logs. Backups must not depend on the application checkout being a copy of runtime state.

### Local development

Prefer an external development data directory. When in-checkout data is convenient, put all local configuration, state, artifacts, and scratch files under the root `.local/` directory, which `.gitignore` excludes.

Only sanitized example configurations belong in tracked files. A local configuration cannot become a tracked deployment merely because it is useful on the owner's machine: this repository can be made public.

Git ignore rules are a convention, not access control or secret protection. They do not untrack files already committed or prevent a forced add. Review staged files before committing; use filesystem permissions to protect private data. Keep important backups outside the checkout, including outside `.local/`.

## Independent agent changes, shared code upgrades

**Change an agent:** update that agent's configuration, validate compatibility with its pending work, then restart its service. Other agent services need not restart.

**Upgrade shared code:** replace the shared installation, check core/module/state compatibility, then restart affected agent services. The installed code is not agent-writable. Do not replace code underneath running module loaders in a way that mixes releases; the packaging implementation must define a safe activation procedure.

Slice 1 targets one installed code version per host. Per-agent runtime version pinning, side-by-side installations, independent module publication, and hot reload are deferred. Independent configuration does not promise independent code versions. This does not require every service to restart simultaneously, but it is not a supported long-term mixed-version deployment model.

## Remaining design work

- Define bare-agent startup/readiness without a model-provider module.
- Specify immutable identity, mutable names, service addressing, and rename behavior.
- Set exact module loading, package/build, path, and credential conventions.
- Finish the service permission profile and resource limits.
- Reconcile the PRD and paused Slice 1 tickets with the accepted decisions before restoring implementation readiness.

See [the glossary](../GLOSSARY.md), [the design review](design-review.md), and [the deployment ADR](adr/0004-monorepo-and-shared-installation.md).

# Deployment and repository model

Status: approved Slice 1 deployment direction, reconciled with the owner-approved model broker and recovery gates. The application and deployment tooling are not implemented yet. Exact package names, commands, and filesystem paths below are illustrative, not an installed interface. See [the development backlog](development-backlog.md) for runnable tasks and required proof.

## Personal use comes first

Automaton is a personal agent platform for its owner. It can be open source, but convenience for the owner takes priority over a third-party module ecosystem, broad distribution support, or hosted multi-tenancy.

The module boundary exists so the owner can select tools and capabilities for each agent's purpose. It does not require independent repositories, independent release schedules, a package marketplace, or a separate service for each module.

## Install once, configure agents independently

A host has one shared Automaton installation. Each agent has its own configuration, persistent state, service process, and OS execution identity.

| Part | Contains | Changes when |
| --- | --- | --- |
| Automaton installation | Core code, basic tools, and available module code | The owner installs or upgrades the platform or module code |
| Agent configuration | Purpose, opted-in domain modules, broker model-selection reference, workspace grants and limits; no upstream endpoint or credentials | The owner changes what that agent can do, subject to pending-work checks |
| Core model broker | Separate account, protected catalog and secret store, trusted provider adapters, authenticated model IPC and operator administration | The owner configures supported routes/accounts; refresh rotates credentials without changing the selected route |
| Agent state | Persistent identity, conversations, accepted work, checkpoints, results, and module-owned data | The agent accepts or performs work |
| Agent service | The active execution of one agent using the shared installation and its own configuration and state | The owner or systemd starts, stops, or restarts it |

An agent is not another source checkout, application build, or copy of the installed code. It is also not merely its configuration file: its persistent identity and history live in its state.

Changing an agent's configuration does not create a new agent or erase its state. A deliberate clone creates a new identity; recovery from a backup or a host move preserves identity. Module changes must still respect pending work and stored-state compatibility.

## Default composition

An agent has the built-in basic tools—read, write, edit, and shell execution—and no enabled modules by default. Their actual reach depends on its OS permissions and service restrictions.

Basic tools are the platform baseline, not an enabled Automaton module. The implementation can reuse upstream Pi extension mechanisms without changing this product distinction.

Workspace reports and other domain capabilities are opt-in modules in the agent service. Trusted model-provider adapters run broker-side; agent configuration selects one broker-authorized route through a generic Pi integration, never loads provider secrets. Code being present in the repository or installation does not enable it for an agent.

For example:

```text
Shared Automaton installation
  Core, basic tools, CLI and broker
  Available domain module: workspace reports
  Available broker adapters: private Qwen, Codex subscription, Claude subscription

Core model broker (separate account)
  Protected model catalog and upstream secrets
  Per-agent OS-identity grants; protected operator administration

Agent: project-reporter
  Enabled domain modules: workspace reports
  Model reference: private Qwen route authorized by broker
  Source workspace: read-only
  Report output and scratch workspace: writable
  Separate configuration, identity, state and service account; no provider secrets

Agent: coding-helper
  Enabled domain modules: none
  Optional model reference: one explicitly authorized broker route
  Project workspace: explicitly writable
  Separate configuration, identity, state and service account; no provider secrets
```

The workspace-report module remains optional even if its source and the platform source share a repository. It is the first useful domain capability used to prove the module boundary, not part of the Core.

The default composition has no selected model. It can start for status, inspection, cancellation and explicitly enabled model-independent operations. Reject model-dependent work before admission; never silently select a provider. All three route adapters are required for the release, not implicitly configured for every agent. Hosted report generation additionally requires report-specific opt-in on both direct and conversational entry paths.

## One service per agent

Systemd supervises the individual agent services. There is no required central manager daemon, shared live harness, or shared scheduler for all agents.

Illustrative service names:

```text
automaton@project-reporter.service
automaton@coding-helper.service
```

Each service loads the same installed code with different configuration and state paths. Stopping or restarting one service does not stop another. Each runs as a separate unprivileged account, with access to the files, sockets, network, and credentials granted to that agent.

The service key is a stable host-local operational address, not the immutable agent ID or mutable display name. Changing the display name must not rekey units, accounts or paths. Service rekeying is deferred; the implementation chooses and validates a simple key format.

Only one active service can own an agent's writable state. A local ownership guard does not prevent an operator from running a copied store on a second host. Before moving or recovering an agent elsewhere, the owner must stop its previous service. Distributed ownership and automatic failover are deferred.

## One monorepo, separate runtime data

Keep the Core, basic tools, operator CLI, optional modules, deployment assets, and documentation in this repository. A module must use the public module contract even when its source is nearby; it must not depend on private core tables or implementation details.

An illustrative future source layout is:

```text
automaton/
  packages/
    core/                    # Includes basic tools and broker contracts
    cli/
    broker/
  modules/
    workspace-report/
  providers/                 # Trusted broker-side adapters
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

Broker-owned protected secret storage and catalog paths are separate from every agent's state/config. Exact path conventions are delegated implementation details. Agent configuration references the authorized model selection, never upstream credentials or endpoints. Credential values must not appear in committed examples, ordinary logs, agent environments/tool subprocesses or agent backup archives. Backups must not depend on the checkout being a copy of runtime state. The broker authenticates model callers by OS identity, while its administration boundary is operator-only; neither socket is the agent control socket.

### Local development

Prefer an external development data directory. When in-checkout data is convenient, put all local configuration, state, artifacts, and scratch files under the root `.local/` directory, which `.gitignore` excludes.

Only sanitized example configurations belong in tracked files. A local configuration cannot become a tracked deployment merely because it is useful on the owner's machine: this repository can be made public.

Git ignore rules are a convention, not access control or secret protection. They do not untrack files already committed or prevent a forced add. Review staged files before committing; use filesystem permissions to protect private data. Keep important backups outside the checkout, including outside `.local/`.

## Independent agent changes, shared code upgrades

**Change an agent:** validate configuration against its pending work, then restart only that service. Block changes to effective model selection/configuration while affected work is pending, including shared catalog changes. Unexpected route mismatch blocks recovery instead of redirecting context. Normal same-account OAuth refresh is not a route change.

**Upgrade shared code:** preflight Core/module/state compatibility, stop affected services, and take offline backups **before** activating replacement code. Restart individually. Downtime for all affected services is allowed. The installed code is not agent-writable. Never mix releases under running loaders, auto-migrate arbitrary schemas or roll back against incompatible state.

**Backup and restore:** require stopped services and the same crash-released ownership guard, without instantiating an executing Harness. Capture consistent SQLite state, transcripts, reports/exports, versions and sanitized config/references. Exclude source, scratch, journals and broker secret-store contents; captured records may still contain sensitive pasted data. Restore to a fresh protected destination, preserve identity and reprovision grants/secrets separately. All restored work stays parked even after new admissions open; only individually selected eligible work releases. This path remains blocked on [affirmative upstream proof](https://github.com/markdlabrecque/automaton/issues/20). Uncertain effects never replay automatically. No automatic purge.

Slice 1 targets one installed code version per host. Per-agent runtime version pinning, side-by-side installations, independent module publication, and hot reload are deferred. Independent configuration does not promise independent code versions. This does not require every service to restart simultaneously, but it is not a supported long-term mixed-version deployment model.

## Implementation and acceptance boundaries

- Choose simple package/build tooling, explicit trusted manifests, protected paths, finite limits and service-key syntax within the approved design.
- Prove public upstream scheduling, storage ownership and generic broker interfaces before dependent implementation; preserve selective restore as a separate hard gate.
- Validate actual separate-account/systemd behavior on a non-production host: deny cross-agent state and broker-secret reads, deny report-source writes, verify documented private-network grants, independent restart and real reboot. Prompts and mocked systemctl calls cannot prove this.
- The operator provisions accounts/credentials, performs supported provider sign-in and host acceptance, and activates releases. Agent preparation/implementation must not fetch credentials, access production or modify host services.
- Follow [the development backlog](development-backlog.md) for task readiness and acceptance; scope approval does not imply compatibility or an installed deployment.

See [the glossary](../GLOSSARY.md), [the design review](design-review.md), and [the deployment ADR](adr/0004-monorepo-and-shared-installation.md).

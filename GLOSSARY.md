# Automaton

Automaton is a personal platform for persistent, purpose-specific agents. This glossary records terms settled during the design review; unresolved terms are not definitions yet.

## Language

**Automaton Core**:
The shared platform foundation and built-in basic tools, distinct from optional agent capabilities. A capability does not become part of the Core merely because its source lives in the same repository.
_Avoid_: Entire monorepo, every installed module

**Basic tools**:
The read, write, edit, and shell capabilities present in an agent's default composition. They are the platform baseline, not an enabled Automaton module.
_Avoid_: Basic Tools module, default modules

**Agent**:
A persistent individual with a defined purpose, configuration, and durable history. Its identity remains the same across restarts and moves between hosts.
_Avoid_: Instance, daemon, model, chat session

**Agent service**:
The active execution of an agent, distinct from the agent's persistent identity. A stopped service does not mean that the agent no longer exists.
_Avoid_: Agent instance, agent identity

**Service key**:
The stable host-local address of an agent service, distinct from the agent's persistent identity and display name.
_Avoid_: Instance ID, agent ID

**Display name**:
A mutable operator-facing label for an agent. It is neither the agent's identity nor its service address.
_Avoid_: Service key, agent ID

**Agent configuration**:
The owner's declaration of an agent's purpose, selected capabilities, and operating settings. It is distinct from the agent's identity and accumulated state.
_Avoid_: Agent state, agent build

**Agent state**:
The agent's persistent identity and accumulated record of conversations, work, results, and domain data. It remains when its service stops or its configuration changes.
_Avoid_: Configuration, checkout, transcript alone

**Conversation**:
An exchange with an agent that supplies conversational context. It is not the agent's identity or the authoritative record of its domain state.
_Avoid_: Agent, memory store, work queue

**Module**:
An operator-selected package of capabilities that an agent can use. A module can supply more than one kind of capability.
_Avoid_: Plugin, Pi extension, skill

**Model provider**:
The source of model access available to an agent. It is a capability supplied by a module, not the agent itself.
_Avoid_: Provider (without qualification), agent, model

**Model broker**:
The Core service that holds provider credentials and routes model requests authorized for an agent. It does not supervise agents or own their work.
_Avoid_: Agent manager, model provider

**Model route**:
A configured way to reach a specific model through a particular provider and upstream destination. It is separate from the credentials used to authorize access.
_Avoid_: Model provider (for a configured destination), credential

**Workspace report**:
A saved account of a configured workspace, based on bounded source material and with references to its evidence. It is distinct from the request to create it and from the work that produces it.
_Avoid_: Report task, agent response

**Report workflow**:
The module-defined process that collects allowed workspace material, gets a model summary, and saves a workspace report. The model does not choose or change this process.
_Avoid_: General reporting agent, report prompt

**Work request**:
An operator's tracked unit of work for an agent. Acceptance and completion are separate events, and a request can involve several durable tasks.
_Avoid_: Task, report, run (as an interchangeable public work name)

**Request receipt**:
The durable acceptance acknowledgment and identifier for a work request. It is not proof that the requested work completed.
_Avoid_: Completion result, success report

**Durable task**:
A unit of checkpointed execution that contributes to an agent's work. It is distinct from the operator's work request and its final result.
_Avoid_: To-do item, work request, report

**Module operation**:
A named entry point to a capability supplied by a module. It is not a separate agent.
_Avoid_: Agent, model turn

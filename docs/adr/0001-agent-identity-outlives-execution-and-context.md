# Agent identity outlives execution and conversational context

An agent is a persistent individual, not a running process or a conversation. Restarts, host moves, and recovery from a backup preserve its identity; an intentional clone is a new agent. Its purpose and durable domain state outlive conversational context, so starting a fresh conversation does not discard pending work or reports.

This separates continuity from a particular deployment or transcript, at the cost of tracking agent identity independently of a mutable operator-facing name. Slice 1 exposes one primary operator conversation and permits one active service per agent. It does not provide distributed ownership: the operator must stop the old service before activating a host move or recovered copy.

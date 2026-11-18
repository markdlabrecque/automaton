# Personal composition and the basic-tools baseline

Automaton serves its owner's personal use. The module contract exists to compose purpose-specific agents, not to establish a third-party plugin ecosystem. An agent has the built-in read, write, edit, and shell tools with no enabled Automaton modules by default; model access and domain functions are opt-in capabilities.

This supersedes the interview's earlier proposal to package Basic Tools as an enabled Automaton module. Reusing Pi extension machinery internally does not make the baseline an Automaton module. A small explicit contract remains useful for maintenance and agent composition, but speculative marketplace, independent publishing, and broad external compatibility requirements must not drive the design.

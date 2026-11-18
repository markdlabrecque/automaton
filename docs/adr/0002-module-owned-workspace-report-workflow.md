# A module owns the workspace report workflow

The first workspace-report capability uses a module-defined workflow: collect bounded allowed source material, get a model summary without tools, and save the report. A conversational agent can start the same workflow through a tool, but the model does not choose or change its steps.

We chose this over giving a general agent a reporting goal and letting it select investigation steps. The fixed workflow limits source access and makes recovery and saved-result behavior easier to specify, but it gives the model less freedom to investigate. General file and shell tools remain separate agent capabilities; service permissions must enforce any claimed source read-only boundary.

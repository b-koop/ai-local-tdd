Feature: Forge makes phase agents available

  Forge ships default phase-agent prompts, but users may customize those agents
  in project-local or user-global agent directories.

  Scenario: /forge uses existing phase agents when they are already available
    Given every Forge phase agent exists in a normal Pi agent location
    When Forge prepares the orchestration prompt
    Then the prompt reports the available agents without copying bundled defaults

  Scenario: /forge offers bundled phase agents when required agents are missing
    Given one or more Forge phase agents are missing from normal Pi agent locations
    When Forge prepares the orchestration prompt
    Then the user is asked whether to copy the bundled defaults into the project agent directory

  Scenario: /forge reports copied phase agents in the orchestration prompt
    Given the user accepts copying missing bundled phase agents
    When Forge prepares the orchestration prompt
    Then the prompt names the agents that are now available for the run
    And the user is notified which agents were copied

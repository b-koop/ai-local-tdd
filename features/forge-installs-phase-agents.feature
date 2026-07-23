Feature: Forge makes phase agents available

  Forge ships default phase-agent prompts and lets users override those agents
  in project-local or user-global agent directories.

  @scenario-forge-uses-bundled-local-phase-agents-without-asking-to-install
  Scenario: /forge uses bundled local phase agents without asking to install
    Given no Forge phase agent override exists in project-local or user-global agent directories
    When Forge prepares the orchestration prompt
    Then the prompt reports bundled local defaults as available
    And the user is not asked to install or copy agents

  @scenario-forge-reports-project-phase-agent-overrides-before-bundled-defaults
  Scenario: /forge reports project phase agent overrides before bundled defaults
    Given a project-local Forge phase agent override exists
    When Forge prepares the orchestration prompt
    Then the prompt reports the override for that phase
    And bundled local defaults remain available for phases without overrides

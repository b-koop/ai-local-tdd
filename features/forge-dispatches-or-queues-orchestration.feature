Feature: Forge dispatches orchestration at the right time

  The /forge command should start immediately when the Pi session can accept a
  prompt, and queue as a follow-up when another agent is already running.

  @scenario-forge-sends-the-orchestration-prompt-immediately-in-an-idle-session
  Scenario: /forge sends the orchestration prompt immediately in an idle session
    Given the Pi session is idle
    When a user starts /forge
    Then Forge sends the orchestration prompt for immediate agent work
    And Forge status shows that the run is working

  @scenario-forge-queues-orchestration-as-a-follow-up-in-a-busy-session
  Scenario: /forge queues orchestration as a follow-up in a busy session
    Given the Pi session is already running another agent
    When a user starts /forge
    Then Forge queues the orchestration prompt as follow-up work
    And the user is notified that the run was queued

  @scenario-forge-status-returns-to-idle-after-agent-completion
  Scenario: Forge status returns to idle after agent completion
    Given a Forge run is working
    When the active agent completes
    Then Forge status shows that the run is idle and complete

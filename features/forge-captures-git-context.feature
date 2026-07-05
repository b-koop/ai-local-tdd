Feature: Forge captures repository context

  A Forge run starts with repository evidence so the agent can distinguish the
  user's current work from changes made during the TDD slice.

  Scenario: /forge includes current repository context in the orchestration prompt
    Given a user starts /forge in a repository
    When Forge prepares the orchestration prompt
    Then the prompt includes the current working tree summary
    And the prompt includes the current branch and head commit
    And the prompt includes upstream information when it is available

  Scenario: /forge marks unavailable repository context without crashing
    Given one repository context command cannot provide a result
    When Forge prepares the orchestration prompt
    Then the prompt marks that context as unavailable
    And the Forge run can still continue with the remaining context

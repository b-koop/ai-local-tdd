Feature: Rolling Forge narrows larger work one validated item at a time

  Rolling Forge lets a large request contain many possible items while only
  deeply planning the next item that is ready to validate and implement.

  @scenario-rolling-starts-just-in-time-tdd-planning
  Scenario: /rolling starts just-in-time TDD planning
    Given a large ticket has known useful work and uncertain future branches
    When Rolling Forge prepares the orchestration prompt
    Then the prompt tells the agent not to fully decompose the entire ticket up front
    And the prompt requires the next definitely useful behavior item to be validated before red starts

  @scenario-each-ready-item-uses-a-fresh-agent-context
  Scenario: Each ready item uses a fresh agent context
    Given Rolling Forge has completed one behavior item
    When it promotes the next item to ready
    Then the next item is sent to new agent instances
    And only curated summaries and compact item packets carry forward
    But prior worker transcripts and stale ticket hypotheses are not inherited

  @scenario-future-work-waits-until-current-reality-is-clear
  Scenario: Future work waits until current reality is clear
    Given a future behavior depends on a choice that may change after the current item lands
    When Rolling Forge records the future behavior
    Then the behavior is kept as candidate, deferred, or blocked
    And it is not deeply planned until reassessment makes it the next useful item

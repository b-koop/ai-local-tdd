Feature: Forge gathers ticket evidence before orchestration

  The /forge command can start from an explicit ticket selector or from the
  current branch. It should gather available planning evidence without letting a
  failed lookup prevent the user from seeing what was found.

  Scenario: /forge looks up an explicit ticket selector across supported trackers
    Given a user invokes /forge with a ticket selector
    When Forge prepares the orchestration prompt
    Then the prompt includes available evidence from supported pull request, issue, and ticket lookups

  Scenario: /forge falls back to current-branch ticket evidence when no selector is provided
    Given a user invokes /forge without a ticket selector
    When Forge prepares the orchestration prompt
    Then the prompt includes available ticket evidence inferred from the current branch

  Scenario: /forge preserves lookup failures as evidence instead of aborting
    Given one ticket evidence source is unavailable
    When Forge prepares the orchestration prompt
    Then the prompt shows that source as unavailable or errored while keeping any other evidence that was found

  Scenario: /forge reports external lookup timeouts clearly
    Given a ticket evidence command does not respond in time
    When Forge waits for the command result
    Then the user receives a timeout reason that names the command that could not finish

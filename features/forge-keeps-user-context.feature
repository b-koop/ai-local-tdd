Feature: Forge keeps the user's context

  The /forge command lets a user pass a ticket reference along with their own
  extra context. Resolving the ticket must never drop that context.

  @scenario-forge-keeps-the-user-s-context-after-the-ticket-selector
  Scenario: /forge keeps the user's context after the ticket selector
    Given a user invokes /forge with a ticket reference and extra context
    When the ticket selector resolves the ticket
    Then the message sent to the agent still contains the user's extra context

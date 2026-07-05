Feature: Forge blocks unsafe ticket selectors

  Ticket selectors are passed to external lookup tools. Forge must reject
  selector-shaped command flags before they can be treated as tool options.

  Scenario: /forge rejects a dash-prefixed selector before ticket lookup
    Given a user invokes /forge with a selector that starts with a dash
    When Forge validates the selector
    Then no external ticket lookup command receives that selector
    And no orchestration prompt is sent to an agent
    And the user sees that the Forge run was blocked as invalid

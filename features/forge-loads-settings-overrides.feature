Feature: Forge loads settings safely

  Forge settings can come from global user settings or trusted project settings.
  Invalid, legacy, and unknown values must be adapted or ignored with clear
  warnings so the run keeps safe defaults.

  @scenario-forge-includes-trusted-project-settings-in-the-orchestration-prompt
  Scenario: /forge includes trusted project settings in the orchestration prompt
    Given a trusted project defines Forge settings
    When Forge prepares the orchestration prompt
    Then the prompt includes the trusted project overrides that passed validation

  @scenario-forge-reads-global-settings-from-the-configured-settings-location
  Scenario: /forge reads global settings from the configured settings location
    Given global Forge settings are available
    When Forge prepares the orchestration prompt
    Then the prompt includes the global settings values that passed validation

  @scenario-forge-accepts-legacy-timeout-settings-with-a-warning
  Scenario: /forge accepts legacy timeout settings with a warning
    Given Forge settings use a legacy timeout value
    When Forge loads the settings
    Then the run uses that timeout value
    And the prompt warns that the legacy setting should be renamed

  @scenario-forge-ignores-unknown-settings-without-exposing-raw-unsafe-values
  Scenario: /forge ignores unknown settings without exposing raw unsafe values
    Given Forge settings include an unsupported key
    When Forge loads the settings
    Then the unsupported key is ignored
    And the prompt explains how to replace or remove it without echoing unsafe input

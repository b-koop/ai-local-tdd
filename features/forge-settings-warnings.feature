Feature: Forge warns about invalid or legacy settings and falls back safely

  Forge settings come from project files that may be invalid, legacy, or
  untrusted. Forge must tell the user exactly what it ignored or adapted and
  keep running with safe values instead of failing or silently misbehaving.

  @scenario-forge-warns-about-invalid-testcommands-and-uses-fallback-commands
  Scenario: /forge warns about invalid testCommands and uses fallback commands
    Given trusted project settings where forge.testCommands is not an array of commands
    When /forge loads the project settings
    Then the agent message lists a settings warning for forge.testCommands
    And the previous or default test commands are used instead

  @scenario-forge-keeps-valid-skill-siblings-while-warning-about-invalid-skill-steps
  Scenario: /forge keeps valid skill siblings while warning about invalid skill steps
    Given trusted project settings where one skill phase is valid and another is empty
    When /forge loads the project settings
    Then the valid skill phase override is kept
    And the agent message warns about the invalid skill phase while defaults are used for it

  @scenario-forge-warns-about-legacy-testcommand-while-preserving-compatibility
  Scenario: /forge warns about legacy testCommand while preserving compatibility
    Given trusted project settings that use the deprecated forge.testCommand string
    When /forge loads the project settings
    Then the agent message warns that the legacy key is deprecated
    And the value is accepted as a one-item testCommands list

  @scenario-forge-warns-about-malformed-trusted-project-settings-json
  Scenario: /forge warns about malformed trusted project settings JSON
    Given a trusted project settings file containing malformed JSON
    When /forge loads the project settings
    Then the agent message reports the malformed JSON as a settings warning
    And the user receives a warning notification

  @scenario-forge-warns-when-untrusted-project-settings-are-skipped
  Scenario: /forge warns when untrusted project settings are skipped
    Given project settings in a project the user has not trusted
    When /forge loads its settings
    Then the project settings file is skipped and defaults are used
    And the agent message explains that project settings were not trusted

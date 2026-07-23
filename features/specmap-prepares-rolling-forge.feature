Feature: SpecMap links behavior scenarios to executable test coverage

  SpecMap runs before Rolling Forge so a large feature can track which behavior
  scenarios are covered, missing, or ready for the next TDD item.

  @scenario-specmap-defaults-to-feature-files
  Scenario: /specmap defaults to feature files
    Given the user does not provide a feature path
    When SpecMap prepares traceability
    Then it scans the "features" folder
    And it treats discovered Gherkin scenarios as behavior contracts

  @scenario-scenario-coverage-uses-the-lowest-useful-test-level
  Scenario: Scenario coverage uses the lowest useful test level
    Given a scenario can be proven by a unit test
    When SpecMap links the scenario to executable coverage
    Then it prefers the unit test over a broader integration or end-to-end test
    But behavior that crosses module boundaries can be linked to an integration test

  @scenario-ambiguous-matches-are-reported-instead-of-linked
  Scenario: Ambiguous matches are reported instead of linked
    Given multiple tests might cover the same scenario
    When SpecMap cannot identify one high-confidence match
    Then it reports the scenario as ambiguous
    And it does not add a misleading coverage tag

  @scenario-rolling-forge-receives-uncovered-scenarios-as-candidates
  Scenario: Rolling Forge receives uncovered scenarios as candidates
    Given SpecMap finds a tagged scenario with no matching executable test
    When SpecMap reports traceability status
    Then the scenario is recommended as a candidate item for Rolling Forge

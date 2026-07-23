Feature: Forge validates trusted contributions

  The repository should run the Forge validation suite for mainline work and
  trusted contributor pull requests while avoiding unsafe automatic execution for
  untrusted pull request authors.

  @scenario-mainline-pushes-run-the-validation-suite
  Scenario: mainline pushes run the validation suite
    Given a change is pushed to a maintained branch
    When repository validation starts
    Then dependency installation, type checking, and tests are run

  @scenario-trusted-pull-requests-run-the-validation-suite
  Scenario: trusted pull requests run the validation suite
    Given a pull request is opened by a trusted contributor
    When repository validation starts
    Then dependency installation, type checking, and tests are run

  @scenario-untrusted-pull-requests-do-not-run-trusted-validation-automatically
  Scenario: untrusted pull requests do not run trusted validation automatically
    Given a pull request is opened by an untrusted contributor
    When repository validation evaluates the pull request author
    Then trusted validation steps are not run automatically

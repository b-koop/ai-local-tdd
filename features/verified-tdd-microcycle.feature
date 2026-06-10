Feature: Verified TDD micro-cycle

  Rule: Work is always reduced to the next smallest test

    Scenario: Choose the next test
      Given unfinished work remains
      When the developer reviews the goal
      Then they select the smallest behavior not yet proven

  Rule: Red must fail for the expected reason

    Scenario: Verify red
      Given the next test is written
      When the test is run
      Then it fails for the intended missing behavior

    Scenario: Reject the wrong red
      Given the next test is written
      When the test fails for another reason
      Then the developer fixes the test before implementation

  Rule: Green uses the smallest working change

    Scenario: Reach green
      Given the test fails for the intended reason
      When the developer makes the smallest useful change
      Then the test passes

  Rule: Refactor ends fully green and committed

    Scenario: Commit the refactored state
      Given the implementation is green
      When the developer refactors the work
      Then all checks pass
      And the clean state is committed

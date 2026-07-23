Feature: TDD micro-cycle workflow is observable and verifiable

  This companion spec describes the externally observable workflow for running
  programmatic TDD behavior slices from a recorded backlog through final green
  verification and cleanup.

  @rule-run-backlog
  Rule: Forge records every testable behavior before implementation begins

    @scenario-record-testable-items
    Scenario: Testable behavior items are recorded before TDD starts
      Given a ticket or feature request with multiple testable behaviors
      When Forge prepares the run backlog
      Then each individual testable behavior is recorded with status "todo"
      And the TDD implementation loop has not started yet

    @scenario-backlog-untracked
    Scenario: The run backlog is reused without becoming a project artifact
      Given Forge has recorded the testable behavior backlog for a run
      When the operator reviews the project changes
      Then the backlog file is available at ".tmp/.forge/<name>.jsonl"
      And the backlog file is not included in tracked project changes

  @rule-tdd-item-flow
  Rule: Forge completes each recorded behavior through the TDD procedure

    @scenario-select-next-smallest-slice
    Scenario: Select the next smallest behavior slice
      Given a behavior backlog for the current ticket contains unfinished items
      When the operator starts a new micro-cycle slice
      Then exactly one smallest behavior with status "todo" is selected for the slice
      And the selected behavior is marked with status "red" before the red test is written

    @scenario-verify-red
    Scenario: Red is verified as an intended failure
      Given a newly added behavior test for the selected slice
      When the focused test command is executed
      Then the run fails for the intended missing behavior reason

    @scenario-green-smallest-change
    Scenario: Green change is the smallest passing implementation
      Given a verified red failure for the selected behavior
      When the smallest production change is applied
      Then the focused test for that behavior passes
      And the selected behavior is marked with status "green"

    @scenario-refactor-keeps-behavior
    Scenario: Refactor keeps observable behavior unchanged
      Given the slice is green for the selected behavior
      When cleanup refactors are applied
      Then focused and required wider checks remain green
      And the selected behavior is marked with status "refactor"

    @scenario-complete-or-block-item
    Scenario: Forge finishes or blocks each recorded item before moving on
      Given the selected behavior has reached the end of its TDD procedure
      When Forge records the item outcome
      Then a passing behavior is marked with status "done"
      But a behavior that cannot continue is marked with status "blocked" before Forge selects another unfinished item

  @rule-final-verification
  Rule: Forge verifies the completed backlog before final cleanup

    @scenario-run-full-suites
    Scenario: Final verification runs full suites after all items finish
      Given every recorded behavior item is marked with status "done"
      When final verification runs
      Then the full unit test suite is executed
      And every configured end-to-end test suite is executed

    @scenario-skip-missing-e2e-with-evidence
    Scenario: Missing end-to-end suite is skipped with evidence
      Given every recorded behavior item is marked with status "done"
      And no end-to-end test suite command is configured
      When final verification runs
      Then Forge records that no end-to-end suite was available
      And final verification continues with the configured validation commands

    @scenario-investigate-suite-failures
    Scenario: Final verification investigates suite failures before cleanup commit
      Given every recorded behavior item is marked with status "done"
      When the full unit suite or a configured end-to-end suite fails
      Then Forge records the failing command and likely cause before cleanup continues
      And final cleanup is not committed while the failure remains unresolved

    @scenario-final-commit-anchored
    Scenario: The final commit is anchored to the recorded start hash
      Given START_SHA is recorded before the slice begins
      And final verification has passed for the completed backlog
      When the final green slice commit is created
      Then the final commit's first parent equals START_SHA

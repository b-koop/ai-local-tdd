# Questions for TDD micro-cycle workflow is observable and verifiable

Feature file: `features/verified-tdd-microcycle.feature`

## Answered

- [x] Q-FORGE-TDD-RUN-BACKLOG-003: What exact JSONL file path or naming convention should Forge use for the reusable untracked behavior backlog?
  - Context: The story requires a reusable JSONL backlog file that is not tracked by git, but no path or naming convention was specified in the starting point or existing docs.
  - Scenario tags: @scenario-backlog-untracked
  - Rule tags: @rule-run-backlog
  - Answer: Use `.tmp/forge/<name>.jsonl`.
  - Source: user intake answer
  - Scenario update: Updated @scenario-backlog-untracked to cover the reusable backlog path `.tmp/forge/<name>.jsonl` while keeping it out of tracked project changes.

- [x] Q-FORGE-TDD-RUN-BACKLOG-001: What status lifecycle should each JSONL behavior item use during the Forge run?
  - Scenario tags: @scenario-record-testable-items, @scenario-select-next-smallest-slice, @scenario-green-smallest-change, @scenario-refactor-keeps-behavior, @scenario-complete-or-block-item
  - Rule tags: @rule-run-backlog, @rule-tdd-item-flow
  - Answer: Use `todo`, `red`, `green`, `refactor`, `done`, and `blocked`.
  - Source: user intake answer
  - Scenario update: Scenarios now require initial `todo`, phase statuses, completed `done`, and unable-to-continue `blocked` outcomes.

- [x] Q-FORGE-TDD-RUN-BACKLOG-002: How should Forge handle the final end-to-end suite when this repo or a target project has no configured e2e command?
  - Scenario tags: @scenario-run-full-suites, @scenario-skip-missing-e2e-with-evidence
  - Rule tags: @rule-final-verification
  - Answer: Skip the missing end-to-end suite with evidence.
  - Source: user intake answer
  - Scenario update: Added a configured-e2e happy path and a missing-e2e evidence path.

- [x] Q-FORGE-TDD-RUN-BACKLOG-004: What level of failure-cause investigation is required before final cleanup continues after a full-suite failure?
  - Scenario tags: @scenario-investigate-suite-failures
  - Rule tags: @rule-final-verification
  - Answer: Assumed final cleanup/commit cannot proceed while suites fail; Forge records the failing command and likely cause before routing the issue back to a behavior item, configuration, or external dependency.
  - Source: intake assumption from starting point and existing final-verification guidance
  - Scenario update: Added failure-investigation scenario that blocks cleanup commit while failures remain unresolved.

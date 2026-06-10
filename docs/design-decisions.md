# Forge design decisions

## Start gate

- If the repo is dirty at start, Forge lists the files and stops.
- No AI is called before the clean-start gate passes.
- After Forge setup, only ignored `.forge/runs/<slug>/` artifacts are allowed outside git.

## Planning phase

- `/forge <details>` starts read-only research and planning.
- AI may research ideas/functionality but may not edit code.
- Forge writes planning artifacts, not the AI directly.
- Each run lives under `.forge/runs/<slug>/`.
- The run uses:
  - `state.json` for machine-readable state
  - Markdown notes for human-readable planning
  - a Gherkin feature/spec for expected behavior
- Planning produces an ordered slice list with explicit dependencies.
- Questions are asked and resolved until the plan is clear.

## Slice dependency behavior

- Failed slices can be skipped only if later slices do not depend on them.
- A failed slice can be retried when it becomes the only blocker dependency or the only remaining work.
- AI may investigate a blocker to improve retry instructions.

## Red phase

- Before red, Forge runs the focused command and records it passing.
- Red receives the prompt, notes, relevant files, expected test area, and expected failure.
- Red may change test files only.
- Red may not commit.
- If red changes non-test files or commits, Forge reverts/undoes and returns feedback.
- Red must produce exactly one failing test case.
- If not exactly one failing test case, Forge returns output to the same red agent.
- Same red agent gets 5 attempts.
- If still failing, mark the slice failed and continue independent slices.
- After all possible slices, retry failed slices with new agents for 5 more attempts.
- If still failing, stop and report to the user.

## Verify red

- Verify agent receives test results, basic prompt, and surrounding files.
- Verify decides whether the single failure matches the intended missing behavior.
- If not, feedback returns to red.
- If yes, Forge continues to green.

## Red checkpoint commit

- After verified red, Forge creates a temporary checkpoint commit.
- Green amends this commit.
- Final slice history must contain one conventional commit.
- Parent/hash checks prove no unexpected commits appeared.

## Green phase

- Green receives the verified failure and expected behavior.
- Green may modify code only.
- Green may not modify test files.
- If green changes test files, Forge reverts those test changes and returns feedback.
- Green continues until focused and planned related checks pass.

## Check policy

- Planning defines per-slice targeted related checks.
- Forge uses two tiers:
  - targeted related checks on every slice
  - expensive/full milestone checks at milestones and final completion

## Cleanup/review phase

- V1 includes minimal read-only cleanup notes.
- Cleanup notes block only if they identify a correctness or test-coverage issue that invalidates the slice.
- Editing cleanup/refactor agents are deferred to later design.

## Commit model

- One conventional commit per behavior slice.
- After each completed slice, Forge updates the start SHA for the next slice.

## Worktree model

- V1 uses the direct current worktree.
- Isolated worktrees are a later enhancement.

# Plan the Forge from scratch

## Outcome

Build a public Pi extension that makes agent-led BDD/TDD safer by separating deterministic code gates from AI judgment.

## Work plan

1. Define the behavior contract in Gherkin.
2. Design deterministic gates for git state, file scope, command exit codes, and commit ancestry.
3. Design AI responsibilities for behavior selection, red failure interpretation, green implementation, and refactor quality.
4. Implement the smallest `/forge` command that injects the loop contract into Pi.
5. Add settings for retries, timeout, test command, and per-step skill choices.
6. Add tests proving command safety, prompt construction, settings loading, and git boundary checks.
7. Document usage, configuration, and recovery paths.

## Research tracked in the wiki

- Verified red/green/refactor loop
- Code-owned vs AI-owned responsibilities
- Pi extension settings options
- Git commit ancestry safety
- Public package shape

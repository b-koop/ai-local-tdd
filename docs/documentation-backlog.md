# Docs to promote from `.forge`

These `.forge` notes are local design/run memory. Public durable docs should be distilled from them.

## Recommended committed docs

1. `docs/deterministic-gates.md`
   - clean-start gate
   - `.forge/runs/<slug>` exception
   - planning state schema
   - pre-red baseline gate
   - red test-only diff gate
   - one failing test case gate
   - verified-red checkpoint commit gate
   - green code-only diff gate
   - two-tier checks gate
   - final parent hash gate
   - retry/failure state transitions

2. `docs/run-artifacts.md`
   - `.forge/runs/<slug>/state.json`
   - notes Markdown
   - generated feature/spec file
   - logs and retry history

3. Update `features/verified-tdd-microcycle.feature`
   - add clean-start block
   - add no-work-complete case
   - add red-passes-unexpectedly case
   - add wrong-red case
   - add green-breaks-existing-behavior case
   - add failed-refactor/review block case

4. Update `docs/initial-plan.md`
   - define gate-assisted v1
   - include ordered slices and dependencies
   - move cleanup editing to later

# The Forge

The Forge is a planned Pi extension for verified BDD/TDD orchestration.

It will guide an agent through the smallest useful behavior slice, prove red fails for the intended reason, reach green with the smallest production change, refactor while green, and commit one clean final slice.

## Status

Planning from scratch.

See the GitHub wiki for research notes and the issue tracker for planned work.

## Core loop

```text
record_start_hash()
choose_next_smallest_behavior()
write_red_test_only_change()
verify_red_fails_for_intended_reason()
make_smallest_green_change()
verify_green()
refactor_without_behavior_change()
verify_fully_green()
commit_final_green_slice()
verify_commit_parent_is_start_hash()
```

## Principles

- Code owns deterministic gates: git state, hashes, file boundaries, exit codes, and test output.
- AI owns semantic judgment: behavior selection, intended-failure interpretation, naming, implementation clarity, and refactor quality.
- Deterministic checks block progress; AI judgment cannot override failed code checks.
- Each behavior slice ends as one fully green commit.

## License

MIT

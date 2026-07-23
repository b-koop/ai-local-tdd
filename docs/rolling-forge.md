# Rolling Forge

Status: planning contract with initial `/rolling` command support.
Audience: contributors and design reviewers.

## Purpose

Rolling Forge is a just-in-time TDD mode for larger work where the future shape
will change as earlier slices land. It keeps the Forge red/green verification
kernel, but avoids freezing a large upfront implementation plan.

Use Rolling Forge when a large request contains many useful possibilities, but
only the next one or few items are stable enough to validate and implement.

## Core idea

Rolling Forge treats the backlog as living state:

1. identify the next definitely useful behavior item;
2. validate that the item is small, testable, and safe to start;
3. run one normal Forge TDD micro-cycle;
4. commit and record durable evidence;
5. re-read the current code reality;
6. promote the next candidate only when it is now clear enough.

Large work may contain many items. The safety constraint is not item count; the
constraint is that each active item has one observable behavior, explicit scope,
and concrete validation.

## Backlog states

- `candidate`: likely useful, but not yet deeply planned.
- `ready`: small enough to start and has validation metadata.
- `active`: currently running through a TDD micro-cycle.
- `blocked`: cannot proceed until a dependency, decision, or baseline issue is resolved.
- `deferred`: intentionally not planned yet because current reality may change it.
- `done`: implemented, verified, and recorded.
- `dropped`: no longer useful after reassessment.

## Ready item packet

Before an item can enter red, it needs a compact packet:

```json
{
  "itemId": "load-trusted-project-settings",
  "behavior": "Trusted project settings override global Forge defaults",
  "whyNow": "Later model-routing behavior depends on the final settings shape",
  "dependenciesDone": ["parse-global-settings"],
  "relevantFiles": ["src/forge-config.ts", "test/forge.test.mjs"],
  "allowedTestPaths": ["test/forge.test.mjs"],
  "allowedCodePaths": ["src/forge-config.ts"],
  "focusedCommand": "pnpm test -- test/forge.test.mjs",
  "expectedRed": "Trusted project settings are ignored or not merged",
  "outOfScope": ["Do not change model routing yet"]
}
```

If the packet cannot be completed without guessing, keep the item as
`candidate`, `blocked`, or `deferred` instead of starting implementation.

## Fresh-agent rule

Each ready backlog item runs in a fresh agent context. Phase agents should not
inherit the full prior conversation, previous ticket text, stale hypotheses, or
transcripts from earlier workers.

The orchestrator carries forward only curated summaries and item packets:

- completed behavior;
- final commit;
- files changed;
- validation commands and results;
- dependency facts discovered;
- new constraints that future items must respect;
- candidate/deferred/blocked backlog updates.

This keeps each item close to a clean-room execution while preserving the facts
needed to keep building the larger outcome.

## Workflow

```text
intake/reassess
→ record candidate, deferred, and blocked items
→ promote the next definitely useful item to ready
→ validate the ready item packet
→ run red / verify-red / green / refactor / final-verify
→ commit the item
→ summarize durable facts
→ reassess current code before choosing the next item
```

## Validation rules

Rolling Forge blocks before red when:

- the item has more than one observable behavior;
- the focused command is unknown and cannot be discovered locally;
- allowed test or code paths are ambiguous;
- dependencies are missing, unknown, or cyclic;
- baseline validation is already failing without an owner;
- the item depends on a future design choice that should not be guessed.

Risk findings and newly discovered future work do not automatically expand the
active scope. They are recorded as candidates unless the current ticket and code
make them the next definitely useful item.

## Command contract

`/rolling <ticket|issue|pr|url> [extra context]` starts Forge in rolling mode.
It shares Forge settings, ticket lookup, git context, phase-agent availability,
model guidance, and deterministic safety rules with `/tdd`.

The prompt differs by requiring:

- no full upfront decomposition of the entire ticket;
- one deeply planned ready item at a time;
- fresh agent context for each ready item;
- minimal curated carryover between items;
- reassessment after every completed item.

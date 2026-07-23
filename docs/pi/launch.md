# Launching Pi

Quick reference for launching the Pi CLI across common workflows.

## Basic Launch

```bash
pi                          # Interactive mode
pi "your prompt here"       # Interactive with an initial message
```

## Modes

| Flag | Mode | Description |
|------|------|-------------|
| *(default)* | Interactive | Full TUI with editor, session tree, extensions |
| `-p`, `--print` | Print | Output response and exit (non-interactive) |
| `--mode json` | JSON | Emit all events as JSON lines |
| `--mode rpc` | RPC | RPC over stdin/stdout |
| `--export <in> [out]` | Export | Convert a session file to HTML |

### Print mode

```bash
pi -p "Summarize this codebase"
cat README.md | pi -p "Summarize this text"       # piped stdin
pi -p @screenshot.png "What's in this image?"      # file attachment
```

## Sessions

Sessions auto-save to `~/.pi/agent/sessions/`, organized by working directory.

```bash
pi -c                       # Continue the most recent session
pi -r                       # Browse and select a past session
pi --session <path|id>      # Resume a specific session file or partial UUID
pi --fork <path|id>         # Fork a session into a new session file
pi --name "my task"         # Set a session display name at startup
pi --no-session             # Ephemeral mode — nothing is saved
```

### Session slash commands (interactive)

| Command | Description |
|---------|-------------|
| `/session` | Show current session file, ID, messages, tokens, cost |
| `/resume` | Browse and select a past session |
| `/new` | Start a fresh session |
| `/name <name>` | Set session display name |
| `/tree` | Navigate the in-file session tree |
| `/fork` | Create a new session from an earlier user message |
| `/clone` | Duplicate the active branch into a new session file |
| `/compact [prompt]` | Summarize older context to free tokens |
| `/export [file]` | Export session to HTML |
| `/import <file>` | Import and resume a session from a JSONL file |
| `/share` | Upload as a private GitHub gist with a shareable link |

## Model Selection

```bash
pi --model claude-sonnet-4-20250514
pi --model sonnet                              # fuzzy match
pi --model openai/gpt-4o                       # provider/model shorthand
pi --model sonnet:high                         # model with thinking level
pi --provider anthropic --model claude-sonnet-4-20250514
pi --thinking high                             # set thinking level independently
pi --models "claude-*,gpt-4o"                  # limit Ctrl+P model cycling
pi --list-models                               # list available models
pi --api-key <key>                             # override API key for this run
```

## Tool Control

```bash
pi --tools read,grep,find,ls                   # allowlist specific tools
pi --exclude-tools ask_question                # disable one tool
pi --no-builtin-tools                          # disable built-in tools only
pi --no-tools                                  # disable all tools
```

Built-in tools: `read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`.

## Context and Extensions

```bash
pi --no-context-files                          # skip AGENTS.md / CLAUDE.md loading
pi -e ./my-extension.ts                        # load an extension
pi --no-extensions -e ./my-extension.ts        # only this extension, nothing else
pi --skill ./my-skill.md                       # load a skill
pi --prompt-template ./tpl.md                  # load a prompt template
pi --system-prompt "You are a code reviewer"   # replace the default system prompt
pi --append-system-prompt "Always use TypeScript" # append to the system prompt
```

## Project Trust

On first launch in a project with `.pi/` config, Pi asks whether to trust it.

```bash
pi --approve                # trust project-local files for this run
pi --no-approve             # ignore project-local files for this run
```

Use `/trust` interactively to save the decision permanently.

## File Arguments

Prefix files with `@` to attach them to the message:

```bash
pi @prompt.md "Answer this"
pi @code.ts @test.ts "Review these files"
pi -p @screenshot.png "What's in this image?"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PI_CODING_AGENT_DIR` | Override config directory (default `~/.pi/agent`) |
| `PI_CODING_AGENT_SESSION_DIR` | Override session storage directory |
| `PI_OFFLINE` | Disable startup network operations |
| `PI_SKIP_VERSION_CHECK` | Skip the version update check |
| `PI_CACHE_RETENTION` | Set to `long` for extended prompt cache |
| `VISUAL`, `EDITOR` | Fallback external editor for Ctrl+G |

## Common Recipes

```bash
# Quick one-shot question
pi -p "What does the main function in src/index.ts do?"

# Code review in read-only mode
pi --tools read,grep,find,ls -p "Review the code in src/"

# Named session for a multi-day task
pi --name "auth refactor" "Let's refactor the auth module"

# Continue where you left off
pi -c

# Fork from a previous session to try a different approach
pi --fork abc123
```

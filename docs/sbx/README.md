# Docker AI Sandboxes (`sbx`)

The `sbx` CLI runs AI coding agents in isolated microVM sandboxes. Each sandbox
gets its own Docker daemon, filesystem, and network stack. Agents can build
containers, install packages, and modify files without touching your host system.

Free to use (including commercial). Docker Desktop is **not** required.

## Install

**macOS** (Apple Silicon, Sonoma 14+):

```bash
brew trust docker/tap
brew install docker/tap/sbx
sbx login
```

**Windows** (Windows 11, x86_64):

```powershell
winget install -h Docker.sbx
sbx login
```

**Linux** (Ubuntu 24.04+):

```bash
curl -fsSL https://get.docker.com | sudo REPO_ONLY=1 sh
sudo apt-get install docker-sbx
sudo usermod -aG kvm $USER
newgrp kvm
sbx login
```

## Quick start

```bash
sbx run claude .          # launch Claude Code in a sandbox against cwd
sbx run shell .           # bare shell sandbox (bring your own agent)
sbx run --clone claude .  # agent works on a private git clone
```

Run `sbx` with no arguments for an interactive dashboard.

## Supported agents

Claude Code, OpenAI Codex, GitHub Copilot, Cursor, Gemini CLI, Kiro,
OpenCode, Docker Agent, Droid, and `shell` for custom setups.

## Docs in this directory

| File | Contents |
|------|----------|
| [commands.md](commands.md) | CLI command reference |
| [customization.md](customization.md) | Templates, kits, and secrets |
| [ollama-integration.md](ollama-integration.md) | Running Pi against local Ollama in a sandbox |

## Key concepts

### Workspace mounting

Your workspace is mounted via filesystem passthrough at the same absolute path
as on your host. Changes appear instantly in both directions.

- **Direct mode** (default) -- read-write access to your working tree.
- **Clone mode** (`--clone`) -- agent works on a private Git clone; your host
  repo is mounted read-only. The sandbox exposes its clone as a Git remote
  (`sandbox-<name>`).

```bash
sbx run --clone claude .
git fetch sandbox-my-sandbox
git diff main..sandbox-my-sandbox/main
```

Multiple workspaces:

```bash
sbx run claude ~/project-a ~/shared-libs:ro ~/docs:ro
```

### Networking

All outbound traffic routes through an HTTP/HTTPS proxy on your host that
enforces network policies and handles credential injection.

Three policy levels:

| Policy | Behavior |
|--------|----------|
| Open | All traffic allowed |
| Balanced (default) | Default deny, common dev sites allowed |
| Locked Down | All blocked unless explicitly allowed |

```bash
sbx policy ls
sbx policy allow network registry.npmjs.org
sbx policy allow network "*.example.com:443"
```

### Accessing host services

Use `host.docker.internal` to reach services running on your host machine from
inside a sandbox:

```bash
sbx policy allow network localhost:11434
# inside sandbox:
curl http://host.docker.internal:11434
```

### Security model

- Hypervisor isolation (full microVM, not just a container)
- Credential injection via proxy (secrets never enter the VM)
- Network policy enforcement (all traffic goes through host proxy)
- Workspace isolation (direct or clone mode)
- No host Docker access (sandbox has its own daemon)

## References

- <https://docs.docker.com/ai/sandboxes/>
- <https://docs.docker.com/ai/sandboxes/customize/>

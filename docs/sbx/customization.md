# Customizing Sandboxes

## Templates

Templates are reusable sandbox images with tools and packages pre-installed.

### Base images

Available at `docker/sandbox-templates:<variant>`:

- `claude-code`, `claude-code-minimal`, `codex`, `copilot`, `cursor-agent`,
  `gemini`, `kiro`, `opencode`, `shell`
- Each has a `-docker` variant with a full Docker Engine inside

### Building a custom template

```dockerfile
FROM docker/sandbox-templates:claude-code
USER root
RUN apt-get update && apt-get install -y protobuf-compiler
USER agent
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

```bash
docker build -t my-org/my-template:v1 --push .
sbx run --template docker.io/my-org/my-template:v1 claude
```

### Saving a running sandbox as a template

```bash
sbx template save my-sandbox my-template:v1
sbx run -t my-template:v1 claude
```

### Loading a local image as a template

```bash
docker build -t my-template:v1 .
docker image save my-template:v1 -o my-template.tar
sbx template load my-template.tar
```

## Kits (experimental)

Kits are declarative YAML artifacts that extend agents with tools, env vars,
credentials, network rules, files, startup commands, and agent context.

Two kinds:

- **Mixin kits** -- extend an existing agent
- **Sandbox kits** -- define a new agent from scratch

### Example mixin kit (`spec.yaml`)

```yaml
schemaVersion: "1"
kind: mixin
name: ruff-lint

network:
  allowedDomains:
    - pypi.org
    - files.pythonhosted.org

commands:
  install:
    - command: "uv tool install ruff@latest"
      user: "1000"

agentContext: |
  Ruff is installed. Run `ruff check` before committing.
```

### Using kits

```bash
sbx run claude --kit ./my-kit/
sbx run claude --kit "git+https://github.com/org/repo.git#dir=mykit"
sbx run claude --kit ghcr.io/myorg/my-kit:1.0
```

## Secrets

Secrets are injected via the host proxy and never enter the VM directly.

```bash
sbx secret set -g anthropic              # prompts for API key
sbx secret set -g github -t "$(gh auth token)"
```

Registry credentials:

```bash
gh auth token | sbx secret set --registry ghcr.io --password-stdin
```

# Running Pi Against Local Ollama in a Sandbox

## Overview

Sandboxes can reach host services via `host.docker.internal`. This lets you
run Ollama on your host and connect to it from inside a sandbox without
exposing anything to the network.

## Setup

### 1. Run Ollama on your host

```bash
ollama serve
ollama pull qwen2.5-coder:7b   # or whichever model you want
```

Ollama listens on `localhost:11434` by default.

### 2. Allow the connection in sbx

```bash
sbx policy allow network localhost:11434
```

### 3. Verify from inside a sandbox

```bash
sbx run shell .
# inside the sandbox:
curl http://host.docker.internal:11434/v1/models
```

### 4. Configure Pi to use Ollama

Point Pi's LLM endpoint at `http://host.docker.internal:11434/v1` from inside
the sandbox. The exact configuration depends on how Pi exposes provider
settings -- look for an OpenAI-compatible base URL option and set:

- **Base URL:** `http://host.docker.internal:11434/v1`
- **API key:** `ollama` (Ollama doesn't require a real key but some clients
  expect one)
- **Model:** whatever you pulled, e.g. `qwen2.5-coder:7b`

## Custom template approach

For a repeatable setup, bake the config into a template.

### Dockerfile

```dockerfile
FROM docker/sandbox-templates:shell-docker
USER root
# install pi or your agent tooling here
USER agent
```

### Build and load

```bash
docker build -t pi-ollama-sbx:v1 .
docker image save pi-ollama-sbx:v1 -o pi-ollama-sbx.tar
sbx template load pi-ollama-sbx.tar
```

### Run

```bash
sbx policy allow network localhost:11434
sbx run --template pi-ollama-sbx:v1 shell .
```

## Kit approach (experimental)

You can also use a kit to declaratively wire up the Ollama connection:

```yaml
schemaVersion: "1"
kind: mixin
name: ollama-local

network:
  allowedDomains:
    - localhost:11434

environment:
  OLLAMA_HOST: "http://host.docker.internal:11434"

agentContext: |
  Local Ollama is available at http://host.docker.internal:11434.
  Use the /v1 endpoint for OpenAI-compatible API access.
```

```bash
sbx run shell --kit ./ollama-kit/ .
```

## Troubleshooting

- **Connection refused** -- make sure `ollama serve` is running on the host
  and you've allowed `localhost:11434` in the network policy.
- **Timeout** -- sandbox services must use `host.docker.internal`, not
  `localhost` or `127.0.0.1` (those resolve to the sandbox itself).
- **Model not found** -- pull the model on the host first with `ollama pull`.

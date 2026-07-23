# `sbx` CLI Command Reference

## Sandbox lifecycle

### `sbx run <agent> [paths...]`

Create a sandbox and attach to it.

```bash
sbx run claude .                          # current directory
sbx run shell ~/project                   # bare shell
sbx run --clone claude .                  # private git clone
sbx run --template my-template:v1 claude  # custom template
sbx run claude --kit ./my-kit/            # with a kit
```

### `sbx create <agent> <path>`

Create a sandbox without attaching (headless).

### `sbx ls`

List all sandboxes.

### `sbx stop <name>`

Stop a sandbox. State is preserved (installed packages, Docker images, config
changes, command history all persist across restarts).

### `sbx rm <name>`

Delete a sandbox completely. Only host workspace files remain.

## Interacting with sandboxes

### `sbx exec -it <name> <command>`

Run a command inside a sandbox.

```bash
sbx exec -it my-sandbox bash
```

### `sbx cp <src> <dest>`

Copy files to/from a sandbox.

```bash
sbx cp ./local-file.txt my-sandbox:/tmp/
sbx cp my-sandbox:/tmp/output.txt ./
```

## Networking

### `sbx ports <name>`

List port mappings for a sandbox.

### `sbx ports <name> --publish <host>:<sandbox>`

Forward a port from host to sandbox.

```bash
sbx ports my-sandbox --publish 8080:3000
```

Services must listen on `0.0.0.0` (not `127.0.0.1`) to be reachable.

### `sbx ports <name> --unpublish <host>:<sandbox>`

Remove a port mapping.

### `sbx policy ls`

List current network policies.

### `sbx policy allow network <target>`

Allow outbound traffic to a target.

```bash
sbx policy allow network registry.npmjs.org
sbx policy allow network "*.example.com:443"
sbx policy allow network localhost:11434
```

### `sbx policy deny network <target>`

Block outbound traffic to a target.

## Secrets

### `sbx secret set -g <service>`

Store an API key (injected via proxy, never enters the VM).

```bash
sbx secret set -g anthropic
sbx secret set -g github -t "$(gh auth token)"
```

### Registry credentials

```bash
gh auth token | sbx secret set --registry ghcr.io --password-stdin
```

## Templates

### `sbx template ls`

List available templates.

### `sbx template save <sandbox> <name:tag>`

Save a running sandbox as a reusable template.

```bash
sbx template save my-sandbox my-template:v1
```

### `sbx template load <tarball>`

Load a template from a Docker image tarball.

```bash
docker build -t my-template:v1 .
docker image save my-template:v1 -o my-template.tar
sbx template load my-template.tar
```

### `sbx template rm <name:tag>`

Delete a template.

## Kits (experimental)

### `sbx kit add <source>`

Add a kit to a sandbox.

### `sbx kit validate <path>`

Validate a kit's `spec.yaml`.

### `sbx kit push <path>`

Push a kit to a registry.

### `sbx kit pull <reference>`

Pull a kit from a registry.

# @warpgogol/werkstatt-godot-game

[Українська](README.uk.md) | English

Werkstatt plugin for the Godot 4.x + C# + .NET 8+ stack. Implements the `werkstatt/plugin@1` contract: 12 scene/asset/project validators, dotnet build hook, itch.io and GitHub Releases deploy adapters, project scaffold hook, and release evidence generation.

---

## What this package does

This is a **stack plugin** for the [Werkstatt](https://www.npmjs.com/package/@warpgogol/werkstatt) engine. It provides everything the engine needs to manage a Godot 4.x game project with C#:

- **12 validators** (scene structure, gitignore, secret scan, project config, scene references, csproj, resources, scripts, export presets, UID uniqueness, NuGet packages, addons)
- **Build hook** (runs `dotnet build` then Godot export)
- **2 deploy adapters** (itch.io, GitHub Releases)
- **Scaffold hook** (generates Godot project boilerplate)
- **Release evidence hook** (SHA-256 hashes for release integrity)
- **Dev commands** (dev server, test runner, smoke test, playtest, screenshot, context generator)

You don't use this package on its own — it is loaded by the Werkstatt engine when you create a project with the `godot-csharp` profile.

---

## Installation

This package is installed as a devDependency alongside the Werkstatt engine:

```sh
pnpm add -D @warpgogol/werkstatt @warpgogol/werkstatt-godot-game
```

> **Note for agents:** When scaffolding a new project with `forge create --profile godot-csharp`, always install the engine and this plugin after the scaffold completes. The `forge.yaml` bindings reference commands from these packages, and they will fail if the packages are not installed.

---

## How it fits into the Werkstatt ecosystem

| Package | Role |
| --- | --- |
| `@warpgogol/forge` | Governance layer — skills, RFC/ADR workflows, CLI, project scaffolding |
| `@warpgogol/werkstatt` | Runtime engine — missions, releases, deployment, certification, Bordbuch |
| `@warpgogol/werkstatt-shared` | Shared infrastructure — checks, integration, ontology, passport |
| `@warpgogol/werkstatt-godot-game` | **This package** — Godot stack plugin for desktop/mobile game projects |

**Forge** creates the project and sets up governance. **Werkstatt** manages the lifecycle (missions, releases, deployment). **This plugin** provides Godot-specific validators, build hooks, and deploy adapters that the engine calls during the pipeline.

---

## Validators

The plugin registers 12 kernel commands that run during the check gate:

| Command | Invariant | What it checks |
| --- | --- | --- |
| `godot.scene.validate` | GODOT-01 | Scene files (.tscn) in `Scenes/`, scripts (.cs) in `Scripts/` |
| `godot.gitignore.validate` | GODOT-02 | `.godot/` directory is gitignored |
| `godot.secret.scan` | GODOT-03 | No hardcoded API keys or secrets in C# source |
| `godot.project.config.validate` | GODOT-04 | `project.godot` autoloads and input map changes require confirmation |
| `godot.scene.reference.validate` | GODOT-05 | Scene `.tscn` `res://` references point to existing files |
| `godot.csproj.validate` | GODOT-06 | `Game.csproj` uses `Godot.NET.Sdk`, targets `net8.0`, enables dynamic loading |
| `godot.resource.validate` | GODOT-07 | `.tres` files in `Resources/`, `res://` references exist |
| `godot.script.validate` | GODOT-08 | C# scripts: class name matches file name, `partial` on Node subclasses, `using Godot;` |
| `godot.export.presets.validate` | GODOT-09 | `export_presets.cfg` has valid presets with non-empty export paths and known platforms |
| `godot.uid.validate` | GODOT-10 | `.tscn`/`.tres` files have unique `uid://` declarations |
| `godot.nuget.validate` | GODOT-11 | `Game.csproj` NuGet packages are Godot-compatible and non-problematic |
| `godot.addon.validate` | GODOT-12 | Addons have valid `plugin.cfg`, enabled in `project.godot`, declare NuGet deps |

`checkGate` runs all 12 validators sequentially. All must pass (GODOT-04 is non-blocking warnings).

---

## Deploy adapters

| Adapter | Target | Credentials source |
| --- | --- | --- |
| `itch-io` | itch.io | `deploy.itch.apiKey`, `deploy.itch.project` from `systems/registry.yaml` |
| `github-releases` | GitHub Releases | `deploy.github.token`, `deploy.github.repo` from `systems/registry.yaml` |

Credentials are read from the system registry, not from environment variables.

---

## Hooks

| Hook | What it does |
| --- | --- |
| `build` | Runs `dotnet build ./Game.csproj` then Godot export for each preset |
| `checkGate` | Runs all 12 validators sequentially |
| `releaseEvidence` | Generates SHA-256 hashes for release integrity verification |
| `scaffoldProject` | Generates Godot project boilerplate (scenes, scripts, csproj, project.godot) |

---

## Dev commands

| Command | What it does |
| --- | --- |
| `godot.dev.server` | Launches `godot --editor` for interactive development |
| `godot.test` | Runs `dotnet test` |
| `godot.smoke.test` | Headless runtime error detection |
| `godot.playtest` | Gameplay runtime error detection with deterministic input |
| `godot.screenshot` | Viewport capture via Xvfb |
| `godot.context.generate` | Structured project summary for AI agents |

---

## Path conventions

| Path | Value |
| --- | --- |
| Content directory | `Scenes` |
| Distribution directory | `bin` |
| Entry points | `project.godot`, `Game.csproj` |
| Scenes directory | `Scenes` |
| Scripts directory | `Scripts` |
| Resources directory | `Resources` |

---

## Programmatic API

```ts
import { werkstattGodotPlugin } from "@warpgogol/werkstatt-godot-game";

// Register the plugin with the Werkstatt engine
engine.registerPlugin(werkstattGodotPlugin);
```

The plugin exports a single `WerkstattPlugin` object with `profileId: "godot-csharp"`. The engine discovers it automatically when the package is installed.

### Subpath exports

| Export | What it provides |
| --- | --- |
| `@warpgogol/werkstatt-godot-game` | Plugin entry point (`werkstattGodotPlugin`) |
| `@warpgogol/werkstatt-godot-game/paths` | Godot path constants |
| `@warpgogol/werkstatt-godot-game/checks` | Check gate runner |
| `@warpgogol/werkstatt-godot-game/checks/module` | Kernel module with validator registrations |
| `@warpgogol/werkstatt-godot-game/invariants` | GODOT-01..12 invariant declarations |
| `@warpgogol/werkstatt-godot-game/deploy/types` | Deploy adapter type definitions |
| `@warpgogol/werkstatt-godot-game/build` | Dotnet build hook |
| `@warpgogol/werkstatt-godot-game/release-evidence` | Release evidence hook |

---

## Architecture

| Directory | Purpose |
| --- | --- |
| `src/index.ts` | Plugin entry point — exports `werkstattGodotPlugin` |
| `src/paths/` | Godot path conventions (`Scenes`, `bin`, entry points) |
| `src/invariants/` | GODOT-01..12 invariant declarations |
| `src/checks/` | 12 validators + check gate runner + kernel module |
| `src/build/` | Dotnet build hook + dev commands (dev server, test, smoke test, playtest, screenshot, context) |
| `src/dev/` | Kernel module registering dev commands |
| `src/deploy/` | itch.io and GitHub Releases deploy adapters |
| `src/onboarding/` | Project scaffold hook (boilerplate generation) |
| `src/release-evidence/` | Release evidence hook (SHA-256 hashes) |

---

## Publishing to npm

This package is published to the npm registry as `@warpgogol/werkstatt-godot-game`. Publishing is automated via GitHub Actions CI.

### How it works

1. The source lives in the [warpgogol/werkstatt](https://github.com/syrokomskyi/werkstatt) monorepo under `packages/werkstatt-godot-game/`.
2. [`@warpgogol/repo-extract`](https://github.com/syrokomskyi/repo-extract) extracts the package into the standalone [syrokomskyi/werkstatt-godot-game](https://github.com/syrokomskyi/werkstatt-godot-game) repository, flattening it to repo root and stripping workspace dependencies.
3. The generated GitHub Actions CI workflow runs on every push to `main`: lint → typecheck → build → test → `npm publish --provenance --access public`.
4. The `NPM_TOKEN` secret must be set in the [repository settings](https://github.com/syrokomskyi/werkstatt-godot-game/settings/secrets/actions).

### Triggering a new release

From the werkstatt monorepo root:

```sh
# 1. Bump the version in packages/werkstatt-godot-game/package.json
# 2. Run the extraction (extracts + commits + pushes to github.com:syrokomskyi/werkstatt-godot-game.git)
pnpm exec repo-extract --config packages/werkstatt-godot-game/extract.config.yaml --verbose

# 3. CI picks up the push and publishes to npm automatically
```

After CI completes, verify the new version on [npmjs.com/package/@warpgogol/werkstatt-godot-game](https://www.npmjs.com/package/@warpgogol/werkstatt-godot-game).

---

## License

Apache-2.0

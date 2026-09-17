/*
<MODULE_CONTRACT>
<purpose>Godot dev module — registers dev server, test, smoke test, context generate, playtest, and screenshot commands as kernel commands.</purpose>

<non-goals>
  <item>Do not implement logic here — delegate to build/ files.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
  <item>RFC-1100: import command factories from build/ files — module is registration-only (godot application of the spec-driven deepening pattern).</item>
</CHANGE_SUMMARY>
*/

import { createDevServerCommand } from "../build/godot-dev-server.ts";
import { createTestCommand } from "../build/dotnet-test.ts";
import { createSmokeTestCommand } from "../build/godot-smoke-test.ts";
import { createContextGenerateCommand } from "../build/godot-context-generate.ts";
import { createPlaytestCommand } from "../build/godot-playtest.ts";
import { createScreenshotCommand } from "../build/godot-screenshot.ts";
import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";

export function createGodotDevModule(): ModuleExport {
  return {
    name: "godot-dev",
    version: "0.4.0",
    declarations: [],
    commands: [
      createDevServerCommand(),
      createTestCommand(),
      createSmokeTestCommand(),
      createContextGenerateCommand(),
      createPlaytestCommand(),
      createScreenshotCommand(),
    ],
    pipelines: [],
  };
}

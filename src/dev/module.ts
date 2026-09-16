/*
<MODULE_CONTRACT>
<purpose>Godot dev module — registers dev server, test, smoke test, context generate, playtest, and screenshot commands as kernel commands.</purpose>

<non-goals>
  <item>Do not implement logic here — delegate to build/ files.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
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

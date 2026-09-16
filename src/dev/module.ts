/*
<MODULE_CONTRACT>
<purpose>Godot dev module — registers dev server, test, smoke test, context generate, playtest, and screenshot commands as kernel commands.</purpose>
<keywords>dev, server, test, godot, module</keywords>
<non-goals>
  <item>Do not implement logic here — delegate to build/ files.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial Godot dev module — registers godot.dev.server and godot.test commands.</item>
  <item>Enhancement: register godot.smoke.test and godot.context.generate commands.</item>
  <item>Enhancement: register godot.playtest and godot.screenshot commands.</item>
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

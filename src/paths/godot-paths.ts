/*
<MODULE_CONTRACT>
<purpose>Godot path conventions for the Godot plugin.</purpose>
<keywords>godot, paths, game, plugin</keywords>
<non-goals>
  <item>Do not import from any @warpgogol/* package — pure path constants only.</item>
</non-goals>
<!-- risk: publish -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial Godot path conventions.</item>
  <item>Refactor: add canonical GODOT_SKIP_DIRS — single skip-list for all recursive project scans (architecture deepening).</item>
</CHANGE_SUMMARY>
*/

import type { StackPathConventions } from "@warpgogol/werkstatt-shared/plugin";

export const godotPathConventions: StackPathConventions = {
  contentDir: "Scenes",
  distDir: "bin",
  entryPoints: ["project.godot", "Game.csproj"],
};

export const GODOT_PATHS = {
  scenesDir: "Scenes",
  scriptsDir: "Scripts",
  resourcesDir: "Resources",
  assetsDir: "Assets",
  projectGodot: "project.godot",
  gameCsproj: "Game.csproj",
  godotCacheDir: ".godot",
  binDir: "bin",
  objDir: "obj",
} as const;

/**
 * Canonical skip-list for recursive project scans — build outputs, VCS, and
 * the Godot cache. Single source of truth: validators, context generator, and
 * release evidence all import this instead of declaring local copies.
 */
export const GODOT_SKIP_DIRS: string[] = ["bin", "obj", ".godot", ".git", "node_modules"];

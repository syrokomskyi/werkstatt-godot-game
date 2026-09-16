/*
<MODULE_CONTRACT>
<purpose>Godot path conventions for the Godot plugin — canonical directory and file locations.</purpose>

<non-goals>
  <item>Do not import from any @warpgogol/* package — pure path constants only.</item>
</non-goals>
<!-- risk: publish -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
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

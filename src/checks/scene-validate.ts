/*
<MODULE_CONTRACT>
<purpose>godot.scene.validate — checks the scene and script directory structure for common issues (GODOT-01).</purpose>

<non-goals>
  <item>Does not modify files — read-only validator.</item>
</non-goals>
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

import { relative } from "node:path";
import type { KernelCommandResult } from "@warpgogol/werkstatt-engine/kernel/types";
import { listFilesRecursive } from "../utils/list-files-recursive.ts";
import { GODOT_SKIP_DIRS } from "../paths/godot-paths.ts";
import type { GodotCheckData, GodotViolation } from "./godot-check.ts";

export interface SceneValidateData extends GodotCheckData {
  status: "pass" | "fail";
}

const SCENES_DIR = "Scenes";
const SCRIPTS_DIR = "Scripts";

export async function validateSceneStructure(
  projectRoot: string,
): Promise<KernelCommandResult<SceneValidateData>> {
  const violations: GodotViolation[] = [];

  const tscnFiles = await listFilesRecursive(projectRoot, ".tscn", GODOT_SKIP_DIRS);
  const csFiles = await listFilesRecursive(projectRoot, ".cs", GODOT_SKIP_DIRS);

  for (const filePath of tscnFiles) {
    const relPath = relative(projectRoot, filePath);
    if (!relPath.startsWith(`${SCENES_DIR}/`)) {
      violations.push({
        ruleId: "GODOT-01",
        file: relPath,
        message: `Scene file "${relPath}" must reside in ${SCENES_DIR}/`,
      });
    }
  }

  for (const filePath of csFiles) {
    const relPath = relative(projectRoot, filePath);
    if (!relPath.startsWith(`${SCRIPTS_DIR}/`)) {
      violations.push({
        ruleId: "GODOT-01",
        file: relPath,
        message: `Script file "${relPath}" must reside in ${SCRIPTS_DIR}/`,
      });
    }
  }

  const status = violations.length === 0 ? "pass" : "fail";
  return {
    data: { command: "godot.scene.validate", status, violations },
    exitCode: status === "pass" ? 0 : 1,
    summary: `godot.scene.validate: ${status} (${violations.length} violations)`,
  };
}

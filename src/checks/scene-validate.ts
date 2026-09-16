/*
<MODULE_CONTRACT>
<purpose>godot.scene.validate — checks scene/script directory structure (GODOT-01).</purpose>
<keywords>validator, scenes, scripts, godot</keywords>
<non-goals>
  <item>Does not modify files — read-only validator.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Fix: scan entire project root for misplaced .tscn/.cs files instead of only scanning Scenes/ and Scripts/ (circular logic).</item>
  <item>Use shared listFilesRecursive from utils/list-files-recursive.ts.</item>
  <item>Refactor: shared GodotViolation/GodotCheckData types + canonical GODOT_SKIP_DIRS; command factory moved to spec table (architecture deepening).</item>
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

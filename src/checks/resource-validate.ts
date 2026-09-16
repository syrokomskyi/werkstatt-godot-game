/*
<MODULE_CONTRACT>
<purpose>godot.resource.validate — checks .tres files are in Resources/ and their res:// references exist (GODOT-07).</purpose>
<keywords>validator, resource, tres, godot</keywords>
<non-goals>
  <item>Does not modify files — read-only validator.</item>
  <item>Does not validate .tscn scene references — that is scene-reference-validate's job.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial resource validator — checks .tres files in Resources/ and res:// reference integrity.</item>
  <item>Fix: use shared extractResReferences from utils/extract-res-references.ts instead of local duplicate.</item>
  <item>Refactor: shared GodotViolation/GodotCheckData types + canonical GODOT_SKIP_DIRS; command factory moved to spec table (architecture deepening).</item>
</CHANGE_SUMMARY>
*/

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import type { KernelCommandResult } from "@warpgogol/werkstatt-engine/kernel/types";
import { listFilesRecursive } from "../utils/list-files-recursive.ts";
import { extractResReferences } from "../utils/extract-res-references.ts";
import { GODOT_SKIP_DIRS } from "../paths/godot-paths.ts";
import type { GodotCheckData, GodotViolation } from "./godot-check.ts";

export interface ResourceValidateData extends GodotCheckData {
  status: "pass" | "fail";
}

const RESOURCES_DIR = "Resources";

export async function validateResources(
  projectRoot: string,
): Promise<KernelCommandResult<ResourceValidateData>> {
  const violations: GodotViolation[] = [];
  const tresFiles = await listFilesRecursive(projectRoot, ".tres", GODOT_SKIP_DIRS);

  for (const tresFile of tresFiles) {
    const relPath = relative(projectRoot, tresFile);

    if (!relPath.startsWith(`${RESOURCES_DIR}/`)) {
      violations.push({
        ruleId: "GODOT-07",
        file: relPath,
        message: `Resource file "${relPath}" must reside in ${RESOURCES_DIR}/`,
      });
    }

    const content = await readFile(tresFile, "utf-8");
    const references = extractResReferences(content);

    for (const resPath of references) {
      const absPath = join(projectRoot, resPath);

      if (!existsSync(absPath)) {
        violations.push({
          ruleId: "GODOT-07",
          file: relPath,
          message: `Resource references "res://${resPath}" but file does not exist`,
        });
      }
    }
  }

  const status = violations.length === 0 ? "pass" : "fail";
  return {
    data: { command: "godot.resource.validate", status, violations },
    exitCode: status === "pass" ? 0 : 1,
    summary: `godot.resource.validate: ${status} (${violations.length} violations)`,
  };
}

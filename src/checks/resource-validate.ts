/*
<MODULE_CONTRACT>
<purpose>godot.resource.validate — checks .tres files are in Resources/ and their res:// references exist (GODOT-07).</purpose>

<non-goals>
  <item>Does not modify files — read-only validator.</item>
  <item>Does not validate .tscn scene references — that is scene-reference-validate's job.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
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

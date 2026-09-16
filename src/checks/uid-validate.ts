/*
<MODULE_CONTRACT>
<purpose>godot.uid.validate — checks UID uniqueness in .tscn and .tres files (GODOT-10).</purpose>


<non-goals>
  <item>Does not validate res:// references — that is scene-reference-validate's job.</item>
  <item>Does not generate UIDs — use the Godot editor for that.</item>
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
import { relative } from "node:path";
import type { KernelCommandResult } from "@warpgogol/werkstatt-engine/kernel/types";
import { listFilesRecursive } from "../utils/list-files-recursive.ts";
import { GODOT_SKIP_DIRS } from "../paths/godot-paths.ts";
import type { GodotCheckData, GodotViolation } from "./godot-check.ts";

export interface UidValidateData extends GodotCheckData {
  status: "pass" | "fail";
}

const UID_PATTERN = /uid="uid:\/\/([^"]+)"/;

export async function validateUids(
  projectRoot: string,
): Promise<KernelCommandResult<UidValidateData>> {
  const violations: GodotViolation[] = [];
  const uidMap = new Map<string, string>(); // uid -> first file seen

  const tscnFiles = await listFilesRecursive(projectRoot, ".tscn", GODOT_SKIP_DIRS);
  const tresFiles = await listFilesRecursive(projectRoot, ".tres", GODOT_SKIP_DIRS);
  const allFiles = [...tscnFiles, ...tresFiles];

  for (const file of allFiles) {
    const relPath = relative(projectRoot, file);
    const content = await readFile(file, "utf-8");
    const uidMatch = content.match(UID_PATTERN);

    if (!uidMatch) {
      violations.push({
        ruleId: "GODOT-10",
        file: relPath,
        message:
          "Missing uid:// declaration — Godot will generate one on first open, causing unnecessary git diffs",
      });
      continue;
    }

    const uid = uidMatch[1]!;
    const existingFile = uidMap.get(uid);
    if (existingFile) {
      violations.push({
        ruleId: "GODOT-10",
        file: relPath,
        message: `Duplicate UID "uid://${uid}" — also declared in ${existingFile}. Godot will load the wrong resource.`,
      });
    } else {
      uidMap.set(uid, relPath);
    }
  }

  return {
    data: {
      command: "godot.uid.validate",
      status: violations.length === 0 ? "pass" : "fail",
      violations,
    },
    exitCode: violations.length === 0 ? 0 : 1,
    summary: `godot.uid.validate: ${violations.length === 0 ? "pass" : `${violations.length} violation${violations.length === 1 ? "" : "s"}`}`,
  };
}

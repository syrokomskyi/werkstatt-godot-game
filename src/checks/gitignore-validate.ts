/*
<MODULE_CONTRACT>
<purpose>godot.gitignore.validate — checks .godot/ is gitignored (GODOT-02).</purpose>

<non-goals>
  <item>Does not modify files — read-only validator.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { KernelCommandResult } from "@warpgogol/werkstatt-engine/kernel/types";
import type { GodotCheckData, GodotViolation } from "./godot-check.ts";

export interface GitignoreValidateData extends GodotCheckData {
  status: "pass" | "fail";
}

const GITIGNORE = ".gitignore";
const GODOT_CACHE_PATTERN = ".godot/";

export async function validateGitignore(
  projectRoot: string,
): Promise<KernelCommandResult<GitignoreValidateData>> {
  const violations: GodotViolation[] = [];

  let content = "";
  try {
    content = await readFile(join(projectRoot, GITIGNORE), "utf-8");
  } catch {
    violations.push({
      ruleId: "GODOT-02",
      file: GITIGNORE,
      message: ".gitignore not found — .godot/ must be gitignored",
    });
    const status = "fail";
    return {
      data: { command: "godot.gitignore.validate", status, violations },
      exitCode: 1,
      summary: `godot.gitignore.validate: ${status} (${violations.length} violations)`,
    };
  }

  const lines = content.split("\n").map((l) => l.trim());
  const hasGodotIgnore = lines.some(
    (l) => l === GODOT_CACHE_PATTERN || l === ".godot" || l.startsWith(`${GODOT_CACHE_PATTERN}`),
  );

  if (!hasGodotIgnore) {
    violations.push({
      ruleId: "GODOT-02",
      file: GITIGNORE,
      message: `.godot/ is not in .gitignore — add "${GODOT_CACHE_PATTERN}" to prevent committing the Godot cache`,
    });
  }

  const status = violations.length === 0 ? "pass" : "fail";
  return {
    data: { command: "godot.gitignore.validate", status, violations },
    exitCode: status === "pass" ? 0 : 1,
    summary: `godot.gitignore.validate: ${status} (${violations.length} violations)`,
  };
}

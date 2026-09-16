/*
<MODULE_CONTRACT>
<purpose>godot.gitignore.validate — checks .godot/ is gitignored (GODOT-02).</purpose>
<keywords>validator, gitignore, godot</keywords>
<non-goals>
  <item>Does not modify files — read-only validator.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial gitignore validator — checks .gitignore for .godot/ entry.</item>
  <item>Refactor: shared GodotViolation/GodotCheckData types; command factory moved to spec table (architecture deepening).</item>
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

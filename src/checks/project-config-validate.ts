/*
<MODULE_CONTRACT>
<purpose>godot.project.config.validate — warns on project.godot sensitive field changes vs git HEAD (GODOT-04).</purpose>
<keywords>validator, project, godot, config, autoload, input, diff</keywords>
<responsibilities>
  <item>Reads current project.godot and compares sensitive sections against git HEAD baseline.</item>
  <item>Warns only when sensitive sections are added or modified, not on initial presence.</item>
</responsibilities>
<non-goals>
  <item>Does not modify files — read-only validator.</item>
  <item>Does not block — severity is warning only (exitCode 0 always).</item>
  <item>Does not validate section content semantics — only detects changes in sensitive section blocks.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Fix: make GODOT-04 warning-only (exitCode 0 always) to match described severity. Document presence-based limitation.</item>
  <item>Enhancement: diff sensitive sections against git HEAD instead of presence check — eliminates false-positives on new projects.</item>
  <item>Refactor: shared types; git HEAD read via runTool seam; extractSection from utils/godot-project (architecture deepening).</item>
</CHANGE_SUMMARY>
*/

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { KernelCommandResult } from "@warpgogol/werkstatt-engine/kernel/types";
import { runTool } from "../utils/run-tool.ts";
import { extractSection } from "../utils/godot-project.ts";
import type { GodotCheckData, GodotViolation } from "./godot-check.ts";

export interface ProjectConfigValidateData extends GodotCheckData {
  status: "pass" | "warn";
}

const PROJECT_GODOT = "project.godot";

const SENSITIVE_SECTIONS = ["[autoload]", "[input]", "[layer_names]", "[rendering]"];

export async function validateProjectConfig(
  projectRoot: string,
): Promise<KernelCommandResult<ProjectConfigValidateData>> {
  const violations: GodotViolation[] = [];

  let currentContent: string;
  try {
    currentContent = await readFile(join(projectRoot, PROJECT_GODOT), "utf-8");
  } catch {
    return {
      data: { command: "godot.project.config.validate", status: "pass", violations },
      exitCode: 0,
      summary: `godot.project.config.validate: pass (no project.godot found, skipping)`,
    };
  }

  const baselineContent = readGitHeadProjectGodot(projectRoot);

  if (baselineContent === null) {
    return {
      data: { command: "godot.project.config.validate", status: "pass", violations },
      exitCode: 0,
      summary: `godot.project.config.validate: pass (no git HEAD baseline, skipping)`,
    };
  }

  for (const section of SENSITIVE_SECTIONS) {
    const currentBlock = extractSection(currentContent, section);
    const baselineBlock = extractSection(baselineContent, section);

    if (currentBlock !== baselineBlock) {
      violations.push({
        ruleId: "GODOT-04",
        file: PROJECT_GODOT,
        message: `project.godot "${section}" section changed — autoloads, input map, physics layers, or rendering settings require explicit confirmation`,
      });
    }
  }

  const status: ProjectConfigValidateData["status"] = violations.length === 0 ? "pass" : "warn";
  return {
    data: { command: "godot.project.config.validate", status, violations },
    exitCode: 0,
    summary: `godot.project.config.validate: ${status} (${violations.length} warnings)`,
  };
}

function readGitHeadProjectGodot(projectRoot: string): string | null {
  const result = runTool("git", ["show", "HEAD:project.godot"], {
    cwd: projectRoot,
    timeoutMs: 10_000,
  });
  return result.ok ? result.output : null;
}

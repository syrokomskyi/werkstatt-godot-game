/*
<MODULE_CONTRACT>
<purpose>godot.project.config.validate — warns on project.godot sensitive field changes vs git HEAD (GODOT-04).</purpose>


<non-goals>
  <item>Does not modify files — read-only validator.</item>
  <item>Does not block — severity is warning only (exitCode 0 always).</item>
  <item>Does not validate section content semantics — only detects changes in sensitive section blocks.</item>
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

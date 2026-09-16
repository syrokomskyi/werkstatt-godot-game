/*
<MODULE_CONTRACT>
<purpose>godot.export.presets.validate — checks export_presets.cfg for common export misconfigurations across presets (GODOT-09).</purpose>


<non-goals>
  <item>Does not run Godot export — that is the build hook's job.</item>
  <item>Does not validate deploy channel mapping — that is the deploy adapter's job.</item>
</non-goals>
<!-- risk: publish -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { KernelCommandResult } from "@warpgogol/werkstatt-engine/kernel/types";
import { parseExportPresets } from "../utils/parse-export-presets.ts";
import type { GodotCheckData, GodotViolation } from "./godot-check.ts";

export interface ExportPresetsValidateData extends GodotCheckData {
  status: "pass" | "fail";
}

const EXPORT_PRESETS_FILE = "export_presets.cfg";

export async function validateExportPresets(
  projectRoot: string,
): Promise<KernelCommandResult<ExportPresetsValidateData>> {
  const violations: GodotViolation[] = [];
  const presetsPath = join(projectRoot, EXPORT_PRESETS_FILE);

  if (!existsSync(presetsPath)) {
    return {
      data: {
        command: "godot.export.presets.validate",
        status: "pass",
        violations,
      },
      exitCode: 0,
      summary: "godot.export.presets.validate: pass (no export_presets.cfg found, skipping)",
    };
  }

  const content = await readFile(presetsPath, "utf-8");

  // Check: at least one [preset.N] section exists (Godot 4.x dot notation)
  if (!/\[preset\.\d+\]/.test(content)) {
    violations.push({
      ruleId: "GODOT-09",
      message:
        "export_presets.cfg contains no preset sections — at least one export preset is required for deployment",
    });
    return {
      data: {
        command: "godot.export.presets.validate",
        status: "fail",
        violations,
      },
      exitCode: 1,
      summary: `godot.export.presets.validate: ${violations.length} violation${violations.length === 1 ? "" : "s"}`,
    };
  }

  // Parse presets using shared utility
  const presets = parseExportPresets(presetsPath);

  if (presets.length === 0) {
    violations.push({
      ruleId: "GODOT-09",
      message:
        "export_presets.cfg has preset sections but none are complete (missing name, platform, or export_path)",
    });
  }

  for (const preset of presets) {
    // Check: export path is not empty
    if (!preset.exportPath || preset.exportPath.trim() === "") {
      violations.push({
        ruleId: "GODOT-09",
        message: `Preset "${preset.name}" has empty export_path — Godot cannot export without a target file`,
      });
    }

    // Check: export path is not an absolute filesystem path
    if (preset.exportPath.startsWith("/") || /^[A-Za-z]:/.test(preset.exportPath)) {
      violations.push({
        ruleId: "GODOT-09",
        message: `Preset "${preset.name}" uses absolute path "${preset.exportPath}" — use relative paths (e.g., "bin/Game.exe") for portability`,
      });
    }

    // Check: platform is a known Godot platform
    const knownPlatforms = [
      "Windows Desktop",
      "Linux/X11",
      "macOS",
      "Android",
      "iOS",
      "Web",
      "HTML5",
    ];
    if (!knownPlatforms.includes(preset.platform)) {
      violations.push({
        ruleId: "GODOT-09",
        message: `Preset "${preset.name}" has unknown platform "${preset.platform}" — expected one of: ${knownPlatforms.join(", ")}`,
      });
    }
  }

  return {
    data: {
      command: "godot.export.presets.validate",
      status: violations.length === 0 ? "pass" : "fail",
      violations,
    },
    exitCode: violations.length === 0 ? 0 : 1,
    summary: `godot.export.presets.validate: ${violations.length === 0 ? "pass" : `${violations.length} violation${violations.length === 1 ? "" : "s"}`}`,
  };
}

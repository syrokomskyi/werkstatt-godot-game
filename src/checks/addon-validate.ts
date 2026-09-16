/*
<MODULE_CONTRACT>
<purpose>godot.addon.validate — checks Godot addons in the addons/ directory for common misconfigurations (GODOT-12).</purpose>


<non-goals>
  <item>Does not validate NuGet packages generally — that is nuget-validate's job.</item>
  <item>Does not install or remove addons.</item>
  <item>Does not validate addon functionality — only structural presence.</item>
</non-goals>
<!-- risk: delete -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { KernelCommandResult } from "@warpgogol/werkstatt-engine/kernel/types";
import { loadGodotProject } from "../utils/godot-project.ts";
import type { GodotCheckData, GodotViolation } from "./godot-check.ts";

export interface AddonValidateData extends GodotCheckData {
  status: "pass" | "fail";
  addons: { name: string; enabled: boolean; hasPluginCfg: boolean; hasCsproj: boolean }[];
}

const ADDONS_DIR = "addons";
const PLUGIN_CFG = "plugin.cfg";
const GAME_CSPROJ = "Game.csproj";

export async function validateAddons(
  projectRoot: string,
): Promise<KernelCommandResult<AddonValidateData>> {
  const violations: GodotViolation[] = [];
  const addonsDir = join(projectRoot, ADDONS_DIR);

  if (!existsSync(addonsDir)) {
    return {
      data: {
        command: "godot.addon.validate",
        status: "pass",
        addons: [],
        violations,
      },
      exitCode: 0,
      summary: "godot.addon.validate: pass (no addons/ directory, skipping)",
    };
  }

  // Read project.godot via the shared parse seam to find enabled plugins
  const project = await loadGodotProject(projectRoot);
  const enabledPlugins = project?.enabledPlugins ?? [];

  // Read Game.csproj for NuGet dependency check
  const csprojPath = join(projectRoot, GAME_CSPROJ);
  let csprojContent = "";
  if (existsSync(csprojPath)) {
    csprojContent = await readFile(csprojPath, "utf-8");
  }

  // List addon directories
  const entries = await readdir(addonsDir, { withFileTypes: true });
  const addonDirs = entries.filter((e) => e.isDirectory());

  const addons: AddonValidateData["addons"] = [];

  for (const addonDir of addonDirs) {
    const addonName = addonDir.name;
    const addonPath = join(addonsDir, addonName);
    const pluginCfgPath = join(addonPath, PLUGIN_CFG);
    const addonCsprojPath = join(addonPath, `${addonName}.csproj`);

    const hasPluginCfg = existsSync(pluginCfgPath);
    const hasCsproj = existsSync(addonCsprojPath);

    // Check if addon is enabled in project.godot [editor_plugins] enabled=
    const enabled = enabledPlugins.includes(`res://addons/${addonName}`);

    addons.push({ name: addonName, enabled, hasPluginCfg, hasCsproj });

    // Violation: missing plugin.cfg
    if (!hasPluginCfg) {
      violations.push({
        ruleId: "GODOT-12",
        addon: addonName,
        message: `Addon "${addonName}" is missing plugin.cfg — Godot cannot load it without this file`,
      });
      continue;
    }

    // Validate plugin.cfg has required fields
    const pluginCfgContent = await readFile(pluginCfgPath, "utf-8");
    const requiredFields = ["name", "author", "version", "description"];
    for (const field of requiredFields) {
      const fieldPattern = new RegExp(`^${field}=`, "m");
      if (!fieldPattern.test(pluginCfgContent)) {
        violations.push({
          ruleId: "GODOT-12",
          addon: addonName,
          message: `Addon "${addonName}" plugin.cfg is missing required field "${field}"`,
        });
      }
    }

    // For C# addons with .csproj, check that their NuGet deps are in Game.csproj
    if (hasCsproj) {
      const addonCsprojContent = await readFile(addonCsprojPath, "utf-8");
      const packageRefPattern = /<PackageReference\s+Include="([^"]+)"/g;
      let match: RegExpExecArray | null;
      while ((match = packageRefPattern.exec(addonCsprojContent)) !== null) {
        const pkgName = match[1]!;
        // Check if this package is also in Game.csproj
        const gameHasPkg = new RegExp(
          `<PackageReference\\s+Include="${pkgName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
        ).test(csprojContent);
        if (!gameHasPkg) {
          violations.push({
            ruleId: "GODOT-12",
            addon: addonName,
            message: `C# addon "${addonName}" references NuGet package "${pkgName}" in its .csproj but it is not declared in Game.csproj — the addon will fail to compile`,
          });
        }
      }
    }
  }

  return {
    data: {
      command: "godot.addon.validate",
      status: violations.length === 0 ? "pass" : "fail",
      addons,
      violations,
    },
    exitCode: violations.length === 0 ? 0 : 1,
    summary: `godot.addon.validate: ${violations.length === 0 ? "pass" : `${violations.length} violation${violations.length === 1 ? "" : "s"}`} (${addons.length} addon(s))`,
  };
}

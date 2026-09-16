/*
<MODULE_CONTRACT>
<purpose>Build hook for the Godot plugin — runs dotnet build then Godot export for each preset.</purpose>


<non-goals>
  <item>Does not manage deploy — that is the deploy adapter's job.</item>
  <item>Does not run checkGate — that is a separate hook.</item>
  <item>Does not install Godot or dotnet — both must be on PATH.</item>
</non-goals>
<!-- risk: publish -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";
import { parseExportPresets } from "../utils/parse-export-presets.ts";
import { runTool, type ToolExecutor } from "../utils/run-tool.ts";

export async function runDotnetBuild(
  ctx: PluginHookContext,
  executor?: ToolExecutor,
): Promise<HookResult> {
  const cwd = ctx.workpiecePath ?? ctx.workspaceRoot;
  const csprojPath = join(cwd, "Game.csproj");

  if (!existsSync(csprojPath)) {
    return {
      success: false,
      errors: [`Game.csproj not found at ${csprojPath}`],
    };
  }

  ctx.logger.info(`dotnet-build: running dotnet build in ${cwd}`);

  const buildResult = runTool("dotnet", ["build", "./Game.csproj"], {
    cwd,
    timeoutMs: 180_000,
  }, executor);

  if (!buildResult.ok) {
    const message = buildResult.output.slice(-500);
    ctx.logger.error("dotnet-build: build failed", { error: message });
    return {
      success: false,
      errors: [`dotnet build failed: ${message}`],
    };
  }
  ctx.logger.info("dotnet-build: build completed", {
    output: buildResult.output.slice(-200),
  });

  const presetsPath = join(cwd, "export_presets.cfg");
  if (!existsSync(presetsPath)) {
    ctx.logger.info("dotnet-build: no export_presets.cfg found, skipping Godot export");
    return { success: true };
  }

  const presets = parseExportPresets(presetsPath);
  if (presets.length === 0) {
    ctx.logger.info("dotnet-build: no export presets found, skipping Godot export");
    return { success: true };
  }

  const exportErrors: string[] = [];
  for (const preset of presets) {
    ctx.logger.info(`dotnet-build: exporting preset "${preset.name}" (${preset.platform})`);

    const exportResult = runTool(
      "godot",
      ["--headless", "--export-release", preset.name, preset.exportPath],
      { cwd, timeoutMs: 300_000 },
      executor,
    );
    if (exportResult.ok) {
      ctx.logger.info(`dotnet-build: export "${preset.name}" completed`, {
        output: exportResult.output.slice(-200),
      });
    } else {
      const message = exportResult.output.slice(-500);
      ctx.logger.error(`dotnet-build: export "${preset.name}" failed`, { error: message });
      exportErrors.push(`Godot export failed for preset "${preset.name}": ${message}`);
    }
  }

  if (exportErrors.length > 0) {
    return { success: false, errors: exportErrors };
  }

  return { success: true };
}

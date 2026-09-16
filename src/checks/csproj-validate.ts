/*
<MODULE_CONTRACT>
<purpose>godot.csproj.validate — checks Game.csproj for required Godot C# project settings (GODOT-06).</purpose>

<non-goals>
  <item>Does not modify files — read-only validator.</item>
  <item>Does not validate .sln files — only .csproj.</item>
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
import { join } from "node:path";
import type { KernelCommandResult } from "@warpgogol/werkstatt-engine/kernel/types";
import type { GodotCheckData, GodotViolation } from "./godot-check.ts";

export interface CsprojValidateData extends GodotCheckData {
  status: "pass" | "fail";
}

const GAME_CSPROJ = "Game.csproj";

export async function validateCsproj(
  projectRoot: string,
): Promise<KernelCommandResult<CsprojValidateData>> {
  const violations: GodotViolation[] = [];

  let content: string;
  try {
    content = await readFile(join(projectRoot, GAME_CSPROJ), "utf-8");
  } catch {
    return {
      data: { command: "godot.csproj.validate", status: "pass", violations },
      exitCode: 0,
      summary: `godot.csproj.validate: pass (no Game.csproj found, skipping)`,
    };
  }

  // Also read Directory.Build.props if it exists — MSBuild merges these properties
  const dbpPath = join(projectRoot, "Directory.Build.props");
  let dbpContent = "";
  if (existsSync(dbpPath)) {
    try {
      dbpContent = await readFile(dbpPath, "utf-8");
    } catch {
      // ignore read errors
    }
  }
  const combined = content + "\n" + dbpContent;

  if (!content.includes('Sdk="Godot.NET.Sdk"')) {
    violations.push({
      ruleId: "GODOT-06",
      file: GAME_CSPROJ,
      message: 'Game.csproj must use Sdk="Godot.NET.Sdk" for Godot C# projects',
    });
  }

  if (!/<TargetFramework>net(\d+)\.0/.test(combined)) {
    violations.push({
      ruleId: "GODOT-06",
      file: GAME_CSPROJ,
      message: "Game.csproj must target net8.0 or higher (Godot 4.x requires .NET 8+)",
    });
  } else {
    const tfmMatch = combined.match(/<TargetFramework>net(\d+)\.0/);
    if (tfmMatch && parseInt(tfmMatch[1]!, 10) < 8) {
      violations.push({
        ruleId: "GODOT-06",
        file: GAME_CSPROJ,
        message: "Game.csproj must target net8.0 or higher (Godot 4.x requires .NET 8+)",
      });
    }
  }

  if (!combined.includes("<EnableDynamicLoading>true</EnableDynamicLoading>")) {
    violations.push({
      ruleId: "GODOT-06",
      file: GAME_CSPROJ,
      message: "Game.csproj must set EnableDynamicLoading=true for Godot C# integration",
    });
  }

  const status = violations.length === 0 ? "pass" : "fail";
  return {
    data: { command: "godot.csproj.validate", status, violations },
    exitCode: status === "pass" ? 0 : 1,
    summary: `godot.csproj.validate: ${status} (${violations.length} violations)`,
  };
}

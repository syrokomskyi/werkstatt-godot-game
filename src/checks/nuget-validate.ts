/*
<MODULE_CONTRACT>
<purpose>godot.nuget.validate — checks NuGet package references in Game.csproj for Godot compatibility (GODOT-11).</purpose>


<non-goals>
  <item>Does not validate csproj SDK settings — that is csproj-validate's job.</item>
  <item>Does not restore packages — use dotnet restore for that.</item>
</non-goals>
<!-- risk: delete -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { KernelCommandResult } from "@warpgogol/werkstatt-engine/kernel/types";
import type { GodotCheckData, GodotViolation } from "./godot-check.ts";

export interface NugetValidateData extends GodotCheckData {
  status: "pass" | "fail";
}

const GAME_CSPROJ = "Game.csproj";

// Packages known to conflict with Godot's .NET runtime or cause issues
const PROBLEMATIC_PACKAGES: Record<string, string> = {
  "System.Runtime.CompilerServices.Unsafe":
    "Conflicts with Godot's internal .NET runtime — use Godot's built-in APIs instead",
  "Microsoft.NETCore.App":
    "Should not be explicitly referenced — Godot.NET.Sdk handles framework references",
  "NETStandard.Library":
    "Should not be explicitly referenced — Godot.NET.Sdk handles framework references",
};

// Packages that should not be in a Godot game project (desktop-only, server-only, etc.)
const NON_GAME_PACKAGES: Record<string, string> = {
  "Microsoft.AspNetCore.App": "ASP.NET Core is not applicable to Godot game projects",
  "Microsoft.AspNetCore.Mvc": "ASP.NET MVC is not applicable to Godot game projects",
  Npgsql: "Direct database drivers are not recommended in game clients — use a server backend",
  "Microsoft.Data.SqlClient":
    "Direct database drivers are not recommended in game clients — use a server backend",
};

export async function validateNuget(
  projectRoot: string,
): Promise<KernelCommandResult<NugetValidateData>> {
  const violations: GodotViolation[] = [];
  const csprojPath = join(projectRoot, GAME_CSPROJ);

  if (!existsSync(csprojPath)) {
    return {
      data: {
        command: "godot.nuget.validate",
        status: "pass",
        violations,
      },
      exitCode: 0,
      summary: "godot.nuget.validate: pass (no Game.csproj found, skipping)",
    };
  }

  const content = await readFile(csprojPath, "utf-8");

  // Extract all PackageReference entries
  const packageRefPattern = /<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]+)")?/g;
  const packages: { name: string; version?: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = packageRefPattern.exec(content)) !== null) {
    packages.push({ name: match[1]!, version: match[2] });
  }

  // Check for problematic packages
  for (const pkg of packages) {
    const problematicReason = PROBLEMATIC_PACKAGES[pkg.name];
    if (problematicReason) {
      violations.push({
        ruleId: "GODOT-11",
        message: `Package "${pkg.name}" is problematic: ${problematicReason}`,
      });
    }

    const nonGameReason = NON_GAME_PACKAGES[pkg.name];
    if (nonGameReason) {
      violations.push({
        ruleId: "GODOT-11",
        message: `Package "${pkg.name}" is not suitable for game projects: ${nonGameReason}`,
      });
    }
  }

  // Check for duplicate package references
  const seen = new Set<string>();
  for (const pkg of packages) {
    if (seen.has(pkg.name)) {
      violations.push({
        ruleId: "GODOT-11",
        message: `Duplicate PackageReference for "${pkg.name}" — remove the duplicate`,
      });
    }
    seen.add(pkg.name);
  }

  return {
    data: {
      command: "godot.nuget.validate",
      status: violations.length === 0 ? "pass" : "fail",
      violations,
    },
    exitCode: violations.length === 0 ? 0 : 1,
    summary: `godot.nuget.validate: ${violations.length === 0 ? "pass" : `${violations.length} violation${violations.length === 1 ? "" : "s"}`}`,
  };
}

/*
<MODULE_CONTRACT>
<purpose>GODOT check spec table — one declarative entry per invariant; commands, gate, and invariants derive from it.</purpose>


<non-goals>
  <item>Does not implement validator logic — imports run() functions from validator modules.</item>
  <item>Does not register commands — module.ts maps specs via godotCheckToCommand.</item>
</non-goals>
<!-- risk: vault -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import type { GodotCheckSpec } from "./godot-check.ts";
import { validateSceneStructure } from "./scene-validate.ts";
import { validateGitignore } from "./gitignore-validate.ts";
import { scanSecrets } from "./secret-scan.ts";
import { validateProjectConfig } from "./project-config-validate.ts";
import { validateSceneReferences } from "./scene-reference-validate.ts";
import { validateCsproj } from "./csproj-validate.ts";
import { validateResources } from "./resource-validate.ts";
import { validateScripts } from "./script-validate.ts";
import { validateUids } from "./uid-validate.ts";
import { validateExportPresets } from "./export-presets-validate.ts";
import { validateNuget } from "./nuget-validate.ts";
import { validateAddons } from "./addon-validate.ts";

/**
 * All GODOT checks in check-gate order. Adding a validator = adding one row:
 * the kernel command, the gate step, and the StackInvariant all derive from it.
 */
export const GODOT_CHECKS: readonly GodotCheckSpec[] = [
  {
    id: "GODOT-01",
    command: "godot.scene.validate",
    description: "Validate scene/script directory structure (GODOT-01)",
    invariant: "Scene files (.tscn) must reside in Scenes/ and scripts (.cs) in Scripts/",
    blocking: true,
    cacheable: false,
    run: validateSceneStructure,
  },
  {
    id: "GODOT-02",
    command: "godot.gitignore.validate",
    description: "Validate .godot/ is gitignored (GODOT-02)",
    invariant: "The .godot/ directory must not be committed to git",
    blocking: true,
    cacheable: false,
    run: validateGitignore,
  },
  {
    id: "GODOT-03",
    command: "godot.secret.scan",
    description: "Scan C# source for hardcoded secrets (GODOT-03)",
    invariant: "No hardcoded API keys or secrets in C# source files",
    blocking: true,
    cacheable: false,
    run: scanSecrets,
  },
  {
    id: "GODOT-04",
    command: "godot.project.config.validate",
    description: "Validate project.godot sensitive field changes vs git HEAD (GODOT-04)",
    invariant: "project.godot autoloads and input map changes require explicit confirmation",
    blocking: false,
    cacheable: false,
    run: validateProjectConfig,
  },
  {
    id: "GODOT-05",
    command: "godot.scene.reference.validate",
    description: "Validate scene res:// references exist (GODOT-05)",
    invariant: "Scene files (.tscn) res:// references must point to existing files",
    blocking: true,
    cacheable: false,
    run: validateSceneReferences,
  },
  {
    id: "GODOT-06",
    command: "godot.csproj.validate",
    description: "Validate Game.csproj Godot C# settings (GODOT-06)",
    invariant: "Game.csproj must use Godot.NET.Sdk, target net8.0, and enable dynamic loading",
    blocking: true,
    cacheable: false,
    run: validateCsproj,
  },
  {
    id: "GODOT-07",
    command: "godot.resource.validate",
    description: "Validate .tres resource location and references (GODOT-07)",
    invariant:
      "Resource files (.tres) must reside in Resources/ and their res:// references must exist",
    blocking: true,
    cacheable: false,
    run: validateResources,
  },
  {
    id: "GODOT-08",
    command: "godot.script.validate",
    description: "Validate C# script conventions (class name, partial, using Godot)",
    invariant:
      "C# scripts must have class name matching file name, partial keyword on Node subclasses, and using Godot; directive",
    blocking: true,
    cacheable: true,
    run: validateScripts,
  },
  {
    id: "GODOT-10",
    command: "godot.uid.validate",
    description: "Validate UID uniqueness in .tscn and .tres files (GODOT-10)",
    invariant: "Scene (.tscn) and resource (.tres) files must have unique uid:// declarations",
    blocking: true,
    cacheable: true,
    run: validateUids,
  },
  {
    id: "GODOT-09",
    command: "godot.export.presets.validate",
    description: "Validate export_presets.cfg for common misconfigurations (GODOT-09)",
    invariant:
      "export_presets.cfg must have valid presets with non-empty relative export paths and known platforms",
    blocking: true,
    cacheable: true,
    run: validateExportPresets,
  },
  {
    id: "GODOT-11",
    command: "godot.nuget.validate",
    description: "Validate NuGet package references in Game.csproj (GODOT-11)",
    invariant: "Game.csproj NuGet package references must be Godot-compatible and non-problematic",
    blocking: true,
    cacheable: true,
    run: validateNuget,
  },
  {
    id: "GODOT-12",
    command: "godot.addon.validate",
    description: "Validate Godot addons in addons/ directory (GODOT-12)",
    invariant:
      "Addons in addons/ must have valid plugin.cfg, be enabled in project.godot, and declare NuGet deps in Game.csproj for C# addons",
    blocking: true,
    cacheable: true,
    run: validateAddons,
  },
];

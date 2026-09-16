/*
<MODULE_CONTRACT>
<purpose>Check gate composition for the Godot plugin — runs all 12 validators.</purpose>
<keywords>checkgate, validators, godot</keywords>
<responsibilities>
  <item>Defines which validators run in checkGate: all 12 (scene, gitignore, secret-scan, project-config, scene-reference, csproj, resource, script, uid, export-presets, nuget, addon).</item>
  <item>Aggregates results from each validator into a single HookResult.</item>
  <item>Treats project-config (GODOT-04) as non-blocking warnings.</item>
</responsibilities>
<non-goals>
  <item>Do not implement validator logic — orchestrate validators only.</item>
</non-goals>
<!-- risk: vault -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial check gate composition running scene, gitignore, secret-scan, and project-config validators.</item>
  <item>Fix: treat GODOT-04 config validator as non-blocking (warnings only, not errors).</item>
  <item>Enhancement: add scene-reference (GODOT-05), csproj (GODOT-06), and resource (GODOT-07) validators to check gate.</item>
  <item>Enhancement: add script (GODOT-08), export-presets (GODOT-09), uid (GODOT-10), and nuget (GODOT-11) validators to check gate.</item>
  <item>Enhancement: add addon (GODOT-12) validator to check gate.</item>
  <item>Refactor: gate delegates to spec-driven runGodotCheckGate over GODOT_CHECKS (architecture deepening).</item>
</CHANGE_SUMMARY>
*/

import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";
import { runGodotCheckGate as runGate } from "./godot-check.ts";
import { GODOT_CHECKS } from "./specs.ts";

export async function runGodotCheckGate(ctx: PluginHookContext): Promise<HookResult> {
  return runGate(ctx, GODOT_CHECKS);
}

export type { GodotViolation, GodotCheckData, GodotCheckSpec } from "./godot-check.ts";
export { GODOT_CHECKS } from "./specs.ts";
export { validateSceneStructure } from "./scene-validate.ts";
export { validateGitignore } from "./gitignore-validate.ts";
export { scanSecrets } from "./secret-scan.ts";
export { validateProjectConfig } from "./project-config-validate.ts";
export { validateSceneReferences } from "./scene-reference-validate.ts";
export { validateCsproj } from "./csproj-validate.ts";
export { validateResources } from "./resource-validate.ts";
export { validateScripts } from "./script-validate.ts";
export { validateUids } from "./uid-validate.ts";
export { validateExportPresets } from "./export-presets-validate.ts";
export { validateNuget } from "./nuget-validate.ts";
export { validateAddons } from "./addon-validate.ts";

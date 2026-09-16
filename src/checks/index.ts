/*
<MODULE_CONTRACT>
<purpose>Check gate composition for the Godot plugin — runs all 12 validators.</purpose>


<non-goals>
  <item>Do not implement validator logic — orchestrate validators only.</item>
</non-goals>
<!-- risk: vault -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
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

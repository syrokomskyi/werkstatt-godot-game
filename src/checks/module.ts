/*
<MODULE_CONTRACT>
<purpose>Godot check module — registers Godot validators as kernel commands.</purpose>

<non-goals>
  <item>Do not implement validator logic here — delegate to individual validator files.</item>
</non-goals>
<!-- risk: vault -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";
import { godotCheckToCommand } from "./godot-check.ts";
import { GODOT_CHECKS } from "./specs.ts";

export function createGodotCheckModule(): ModuleExport {
  return {
    name: "godot-checks",
    version: "0.5.0",
    declarations: [],
    commands: GODOT_CHECKS.map(godotCheckToCommand),
    pipelines: [],
  };
}

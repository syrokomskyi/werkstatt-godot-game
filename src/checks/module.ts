/*
<MODULE_CONTRACT>
<purpose>Godot check module — registers Godot validators as kernel commands.</purpose>
<keywords>checks, validators, godot</keywords>
<non-goals>
  <item>Do not implement validator logic here — delegate to individual validator files.</item>
</non-goals>
<!-- risk: vault -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial Godot check module — registers godot.scene.validate, godot.gitignore.validate, godot.secret.scan, godot.project.config.validate.</item>
  <item>Enhancement: register godot.scene.reference.validate, godot.csproj.validate, godot.resource.validate.</item>
  <item>Enhancement: register godot.script.validate, godot.export.presets.validate, godot.uid.validate, godot.nuget.validate.</item>
  <item>Refactor: derive commands from GODOT_CHECKS spec table via godotCheckToCommand (architecture deepening).</item>
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

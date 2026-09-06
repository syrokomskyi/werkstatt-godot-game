/*
<MODULE_CONTRACT>
<purpose>Godot check module — registers Godot validators as kernel commands.</purpose>
<keywords>checks, validators, godot</keywords>
<non-goals>
  <item>Do not implement validator logic here — delegate to individual validator files.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial Godot check module — registers godot.scene.validate, godot.gitignore.validate, godot.secret.scan, godot.project.config.validate.</item>
  <item>Enhancement: register godot.scene.reference.validate, godot.csproj.validate, godot.resource.validate.</item>
  <item>Enhancement: register godot.script.validate, godot.export.presets.validate, godot.uid.validate, godot.nuget.validate.</item>
</CHANGE_SUMMARY>
*/

import { createSceneValidateCommand } from "./scene-validate.ts";
import { createGitignoreValidateCommand } from "./gitignore-validate.ts";
import { createSecretScanCommand } from "./secret-scan.ts";
import { createProjectConfigValidateCommand } from "./project-config-validate.ts";
import { createSceneReferenceValidateCommand } from "./scene-reference-validate.ts";
import { createCsprojValidateCommand } from "./csproj-validate.ts";
import { createResourceValidateCommand } from "./resource-validate.ts";
import { createScriptValidateCommand } from "./script-validate.ts";
import { createUidValidateCommand } from "./uid-validate.ts";
import { createExportPresetsValidateCommand } from "./export-presets-validate.ts";
import { createNugetValidateCommand } from "./nuget-validate.ts";
import { createAddonValidateCommand } from "./addon-validate.ts";
import type { ModuleExport } from "@warpgogol/werkstatt-engine/runtime/desired-state";

export function createGodotCheckModule(): ModuleExport {
  return {
    name: "godot-checks",
    version: "0.4.0",
    declarations: [],
    commands: [
      createSceneValidateCommand(),
      createGitignoreValidateCommand(),
      createSecretScanCommand(),
      createProjectConfigValidateCommand(),
      createSceneReferenceValidateCommand(),
      createCsprojValidateCommand(),
      createResourceValidateCommand(),
      createScriptValidateCommand(),
      createUidValidateCommand(),
      createExportPresetsValidateCommand(),
      createNugetValidateCommand(),
      createAddonValidateCommand(),
    ],
    pipelines: [],
  };
}

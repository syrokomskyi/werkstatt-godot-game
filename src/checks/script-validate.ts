/*
<MODULE_CONTRACT>
<purpose>godot.script.validate — checks C# script conventions for Godot 4.x + C# projects (GODOT-08).</purpose>
<keywords>validator, script, csharp, conventions, godot</keywords>
<responsibilities>
  <item>Validates that .cs files in Scripts/ follow Godot C# conventions.</item>
  <item>Checks: class name matches file name, partial keyword on Node subclasses, using Godot; present.</item>
</responsibilities>
<non-goals>
  <item>Does not compile C# code — use dotnet build for that.</item>
  <item>Does not validate .csproj settings — that is csproj-validate's job.</item>
  <item>Does not check for secrets — that is secret-scan's job.</item>
</non-goals>
<!-- risk: vault -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial C# script conventions validator — GODOT-08.</item>
  <item>Refactor: shared GodotViolation/GodotCheckData types + canonical GODOT_SKIP_DIRS; command factory moved to spec table (architecture deepening).</item>
</CHANGE_SUMMARY>
*/

import { readFile } from "node:fs/promises";
import { basename, relative } from "node:path";
import type { KernelCommandResult } from "@warpgogol/werkstatt-engine/kernel/types";
import { listFilesRecursive } from "../utils/list-files-recursive.ts";
import { GODOT_SKIP_DIRS } from "../paths/godot-paths.ts";
import type { GodotCheckData, GodotViolation } from "./godot-check.ts";

export interface ScriptValidateData extends GodotCheckData {
  status: "pass" | "fail";
}

const GODOT_NODE_BASE_CLASSES = [
  "Node",
  "Node2D",
  "Node3D",
  "Control",
  "CanvasItem",
  "CharacterBody2D",
  "CharacterBody3D",
  "RigidBody2D",
  "RigidBody3D",
  "StaticBody2D",
  "StaticBody3D",
  "Area2D",
  "Area3D",
  "AnimationPlayer",
  "AnimationTree",
  "Camera2D",
  "Camera3D",
  "CollisionShape2D",
  "CollisionShape3D",
  "Sprite2D",
  "Sprite3D",
  "Label",
  "Button",
  "TextureRect",
  "ColorRect",
  "VBoxContainer",
  "HBoxContainer",
  "MarginContainer",
  "ScrollContainer",
  "Panel",
  "Window",
  "Resource",
  "RefCounted",
];

export async function validateScripts(
  projectRoot: string,
): Promise<KernelCommandResult<ScriptValidateData>> {
  const violations: GodotViolation[] = [];
  const csFiles = await listFilesRecursive(projectRoot, ".cs", GODOT_SKIP_DIRS);

  for (const csFile of csFiles) {
    const relPath = relative(projectRoot, csFile);
    const fileName = basename(csFile, ".cs");
    const content = await readFile(csFile, "utf-8");

    // Check: using Godot; present
    if (!content.includes("using Godot;")) {
      violations.push({
        ruleId: "GODOT-08",
        file: relPath,
        message: 'C# script must include "using Godot;" for Godot API access',
      });
    }

    // Check: class name matches file name
    const classMatch = content.match(
      /(?:public|internal|file)?\s*(?:abstract\s+|sealed\s+|static\s+)?class\s+(\w+)/,
    );
    if (classMatch) {
      const className = classMatch[1]!;
      if (className !== fileName) {
        violations.push({
          ruleId: "GODOT-08",
          file: relPath,
          message: `Class name "${className}" does not match file name "${fileName}" — Godot requires exact match for script attachment`,
        });
      }

      // Check: partial keyword on Godot Node subclasses
      const classDeclMatch = content.match(
        /(?:public|internal|file)?\s*(?:abstract\s+|sealed\s+|static\s+)?(partial\s+)?class\s+\w+(?:\s*:\s*(\w+))?/,
      );
      if (classDeclMatch) {
        const isPartial = classDeclMatch[1] !== undefined;
        const baseClass = classDeclMatch[2];

        if (baseClass && GODOT_NODE_BASE_CLASSES.includes(baseClass)) {
          if (!isPartial) {
            violations.push({
              ruleId: "GODOT-08",
              file: relPath,
              message: `Class "${className}" inherits from Godot Node type "${baseClass}" but is not declared "partial" — Godot source generators require the partial keyword`,
            });
          }
        }
      }
    }
  }

  return {
    data: {
      command: "godot.script.validate",
      status: violations.length === 0 ? "pass" : "fail",
      violations,
    },
    exitCode: violations.length === 0 ? 0 : 1,
    summary: `godot.script.validate: ${violations.length === 0 ? "pass" : `${violations.length} violation${violations.length === 1 ? "" : "s"}`}`,
  };
}

/*
<MODULE_CONTRACT>
<purpose>Godot stack invariants GODOT-01..12 surfaced to agents.</purpose>
<keywords>invariants, godot, csharp</keywords>
<non-goals>
  <item>Do not enforce invariants here — enforcement lives in validators.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial Godot stack invariants GODOT-01..04.</item>
  <item>Enhancement: add GODOT-05 (scene reference integrity), GODOT-06 (csproj settings), GODOT-07 (resource location and references).</item>
  <item>Enhancement: add GODOT-08 (script conventions), GODOT-09 (export presets), GODOT-10 (UID uniqueness), GODOT-11 (NuGet packages).</item>
  <item>Enhancement: add GODOT-12 (addon validation).</item>
  <item>Refactor: derive GODOT_INVARIANTS from the GODOT_CHECKS spec table (architecture deepening).</item>
</CHANGE_SUMMARY>
*/

import type { StackInvariant } from "@warpgogol/werkstatt-shared/plugin";
import { godotInvariants } from "../checks/godot-check.ts";
import { GODOT_CHECKS } from "../checks/specs.ts";

/** Derived from the GODOT_CHECKS spec table — id, description, and check command stay in sync automatically. */
export const GODOT_INVARIANTS: StackInvariant[] = godotInvariants(GODOT_CHECKS);

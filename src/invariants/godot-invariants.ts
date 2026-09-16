/*
<MODULE_CONTRACT>
<purpose>Godot stack invariants GODOT-01..12 surfaced to agents.</purpose>

<non-goals>
  <item>Do not enforce invariants here — enforcement lives in validators.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type { StackInvariant } from "@warpgogol/werkstatt-shared/plugin";
import { godotInvariants } from "../checks/godot-check.ts";
import { GODOT_CHECKS } from "../checks/specs.ts";

/** Derived from the GODOT_CHECKS spec table — id, description, and check command stay in sync automatically. */
export const GODOT_INVARIANTS: StackInvariant[] = godotInvariants(GODOT_CHECKS);

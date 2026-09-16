/*
<MODULE_CONTRACT>
<purpose>Shared parser for Godot export_presets.cfg files used by the export validators.</purpose>


<non-goals>
  <item>Does not validate preset correctness — only extracts structured data.</item>
  <item>Does not resolve export paths — caller handles path resolution.</item>
</non-goals>
</MODULE_CONTRACT>
<KEY_DECISIONS>
  <item>Parsing extracts structured data only — preset correctness is the validator's call, not the parser's.</item>
</KEY_DECISIONS>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { readFileSync } from "node:fs";

export interface ExportPreset {
  name: string;
  platform: string;
  exportPath: string;
}

export function parseExportPresets(presetsPath: string): ExportPreset[] {
  const content = readFileSync(presetsPath, "utf-8");
  const presets: ExportPreset[] = [];
  const sections = content.split(/\[preset\.(\d+)\]/);

  for (let i = 1; i < sections.length; i += 2) {
    const body = sections[i + 1];
    if (!body) continue;

    const nameMatch = body.match(/^name="([^"]+)"/m);
    const platformMatch = body.match(/^platform="([^"]+)"/m);
    const pathMatch = body.match(/^export_path="([^"]+)"/m);

    if (nameMatch && platformMatch && pathMatch) {
      presets.push({
        name: nameMatch[1]!,
        platform: platformMatch[1]!,
        exportPath: pathMatch[1]!,
      });
    }
  }

  return presets;
}

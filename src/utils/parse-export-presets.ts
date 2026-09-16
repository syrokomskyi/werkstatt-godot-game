/*
<MODULE_CONTRACT>
<purpose>Shared parser for Godot export_presets.cfg files.</purpose>


<non-goals>
  <item>Does not validate preset correctness — only extracts structured data.</item>
  <item>Does not resolve export paths — caller handles path resolution.</item>
</non-goals>
</MODULE_CONTRACT>
<KEY_DECISIONS>
  <item>TODO: record current design decisions</item>
</KEY_DECISIONS>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
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

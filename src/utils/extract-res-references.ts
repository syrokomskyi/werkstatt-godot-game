/*
<MODULE_CONTRACT>
<purpose>Shared utility for extracting res:// references from Godot resource files.</purpose>


<non-goals>
  <item>Does not check file existence — caller handles existsSync.</item>
  <item>Does not parse Godot resource format semantically — only extracts res:// string paths.</item>
</non-goals>
</MODULE_CONTRACT>
<KEY_DECISIONS>
  <item>Extraction is string-level only — res:// paths are pulled without semantic parsing of the resource format.</item>
</KEY_DECISIONS>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

const RES_PATTERN = /"res:\/\/([^"]+)"/g;

export function extractResReferences(content: string): string[] {
  const references: string[] = [];
  RES_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RES_PATTERN.exec(content)) !== null) {
    references.push(match[1]!);
  }
  return references;
}

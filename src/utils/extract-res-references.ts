/*
<MODULE_CONTRACT>
<purpose>Shared utility for extracting res:// references from Godot resource files.</purpose>


<non-goals>
  <item>Does not check file existence — caller handles existsSync.</item>
  <item>Does not parse Godot resource format semantically — only extracts res:// string paths.</item>
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

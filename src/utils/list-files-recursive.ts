/*
<MODULE_CONTRACT>
<purpose>Shared recursive file listing utility for Godot validators and evidence hooks.</purpose>

<non-goals>
  <item>Do not import from any @warpgogol/* package — pure filesystem utility.</item>
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

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Dirent } from "node:fs";

export async function listFilesRecursive(
  dir: string,
  ext: string,
  skipDirs: string[] = [],
): Promise<string[]> {
  const results: string[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.includes(entry.name)) {
        continue;
      }
      results.push(...(await listFilesRecursive(fullPath, ext, skipDirs)));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

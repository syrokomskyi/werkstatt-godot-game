/*
<MODULE_CONTRACT>
<purpose>Godot release evidence hook — generates hashes for all project artifacts.</purpose>


<non-goals>
  <item>Does not verify hashes — that is the integrity module's job.</item>
  <item>Does not modify files — read-only hook.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";
import { listFilesRecursive } from "../utils/list-files-recursive.ts";
import { GODOT_SKIP_DIRS } from "../paths/godot-paths.ts";

export interface GodotReleaseEvidence {
  projectHash: string;
  scenesHash: string;
  scriptsHash: string;
  resourcesHash: string;
  projectFilesHash: string;
  importHash: string;
  sceneCount: number;
  scriptCount: number;
  resourceCount: number;
  importCount: number;
  generatedAt: string;
}

export async function generateGodotEvidence(ctx: PluginHookContext): Promise<HookResult> {
  const projectRoot = ctx.workpiecePath ?? ctx.workspaceRoot;

  const projectHash = await hashFile(join(projectRoot, "project.godot"));
  const sceneFiles = await listFilesRecursive(join(projectRoot, "Scenes"), ".tscn");
  const scriptFiles = await listFilesRecursive(join(projectRoot, "Scripts"), ".cs");
  const resourceFiles = await listFilesRecursive(join(projectRoot, "Resources"), ".tres");
  const csprojFiles = await listFilesRecursive(projectRoot, ".csproj", GODOT_SKIP_DIRS);
  const slnFiles = await listFilesRecursive(projectRoot, ".sln", GODOT_SKIP_DIRS);
  const importFiles = await listFilesRecursive(join(projectRoot, ".godot", "imported"), ".import");

  const scenesHash = await hashFiles(sceneFiles);
  const scriptsHash = await hashFiles(scriptFiles);
  const resourcesHash = await hashFiles(resourceFiles);
  const projectFilesHash = await hashFiles([...csprojFiles, ...slnFiles]);
  const importHash = await hashFiles(importFiles);

  const evidence: GodotReleaseEvidence = {
    projectHash,
    scenesHash,
    scriptsHash,
    resourcesHash,
    projectFilesHash,
    importHash,
    sceneCount: sceneFiles.length,
    scriptCount: scriptFiles.length,
    resourceCount: resourceFiles.length,
    importCount: importFiles.length,
    generatedAt: new Date().toISOString(),
  };

  ctx.logger.info("release-evidence: generated", evidence);

  return {
    success: true,
    data: evidence,
  };
}

async function hashFile(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath);
    return createHash("sha256").update(content).digest("hex");
  } catch {
    return "0000000000000000000000000000000000000000000000000000000000000000";
  }
}

async function hashFiles(filePaths: string[]): Promise<string> {
  if (filePaths.length === 0) {
    return "0000000000000000000000000000000000000000000000000000000000000000";
  }
  const hasher = createHash("sha256");
  for (const filePath of filePaths.sort()) {
    const content = await readFile(filePath);
    hasher.update(content);
  }
  return hasher.digest("hex");
}

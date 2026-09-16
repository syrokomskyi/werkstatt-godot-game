/*
<MODULE_CONTRACT>
<purpose>GitHub Releases deploy adapter for the Godot plugin — builds and publishes release artifacts.</purpose>


<non-goals>
  <item>Does not build — build hook runs before deploy.</item>
  <item>Does not manage DNS or custom domains.</item>
</non-goals>
<!-- risk: vault -->
<!-- risk: publish -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { DeployResult } from "./types.ts";
import { runTool, type ToolExecutor } from "../utils/run-tool.ts";

export interface GitHubReleasesDeployConfig {
  token: string;
  repo?: string;
  tag?: string;
  title?: string;
  buildDir?: string;
}

export interface GitHubReleasesAdapter {
  deploy(workpiecePath: string, config: GitHubReleasesDeployConfig): DeployResult;
}

export function createGitHubReleasesAdapter(executor?: ToolExecutor): GitHubReleasesAdapter {
  return {
    deploy(workpiecePath: string, config: GitHubReleasesDeployConfig): DeployResult {
      const buildDir = config.buildDir ?? "bin/Debug";
      const tag = config.tag ?? "v0.1.0";
      const buildPath = join(workpiecePath, buildDir);

      if (!existsSync(buildPath)) {
        return {
          success: false,
          errors: [`Build directory not found at ${buildPath} — run build first`],
        };
      }

      if (!config.token) {
        return {
          success: false,
          errors: ["GitHub token not provided in channel config (deploy.github.token)"],
        };
      }

      const env: Record<string, string> = {
        ...process.env,
        GH_TOKEN: config.token,
      };

      const args = ["release", "create", tag];
      if (config.title) {
        args.push("--title", config.title);
      }
      if (config.repo) {
        args.push("--repo", config.repo);
      }

      const entries = readdirSync(buildPath);
      const artifacts = entries
        .filter((e) => e.endsWith(".zip") || e.endsWith(".pck") || e.endsWith(".exe"))
        .map((e) => join(buildPath, e));

      if (artifacts.length > 0) {
        args.push(...artifacts);
      }

      const result = runTool(
        "gh",
        args,
        {
          cwd: workpiecePath,
          timeoutMs: 120_000,
          env,
        },
        executor,
      );

      if (!result.ok) {
        return {
          success: false,
          errors: [`GitHub Releases deploy failed: ${result.output.slice(-300)}`],
        };
      }

      return {
        success: true,
        url: config.repo ? `https://github.com/${config.repo}/releases/tag/${tag}` : undefined,
      };
    },
  };
}

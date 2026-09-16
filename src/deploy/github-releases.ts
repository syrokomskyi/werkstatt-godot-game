/*
<MODULE_CONTRACT>
<purpose>GitHub Releases deploy adapter for the Godot plugin.</purpose>


<non-goals>
  <item>Does not build — build hook runs before deploy.</item>
  <item>Does not manage DNS or custom domains.</item>
</non-goals>
<!-- risk: vault -->
<!-- risk: publish -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
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

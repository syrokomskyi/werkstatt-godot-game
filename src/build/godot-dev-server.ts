/*
<MODULE_CONTRACT>
<purpose>Dev server hook for the Godot plugin — launches godot --editor for local development.</purpose>


<non-goals>
  <item>Does not build — that is the build hook's job.</item>
  <item>Does not manage process lifecycle beyond launch — the caller handles shutdown.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into history, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — werkstatt-engine clean

Sweep batch 4: 73 Compass headers on headerless engine files (certification, component-runtime, isolation, evolution, testing), real KEY_DECISIONS on 75 files (kernel, cache, dht, swim, gitmesh, runtime), ~80 purpose expansions (CONTRACT-02/PURPOSE-02), non-goals on 13 CONTRACT-03 files, CS-07 history literal fix repo-wide (253 files). Policy: .template.ts/.template.astro excludedPaths. werkstatt-engine now 0 diagnostics.</item>
</CHANGE_SUMMARY>
*/

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";
import type {
  KernelCommandDefinition,
  KernelCommandResult,
} from "@warpgogol/werkstatt-engine/kernel/types";

export interface DevServerData {
  command: string;
  status: "pass" | "fail";
  pid?: number;
}

export async function runGodotDevServer(ctx: PluginHookContext): Promise<HookResult> {
  const cwd = ctx.workpiecePath ?? ctx.workspaceRoot;
  const projectGodotPath = join(cwd, "project.godot");

  if (!existsSync(projectGodotPath)) {
    return {
      success: false,
      errors: [`project.godot not found at ${projectGodotPath}`],
    };
  }

  ctx.logger.info(`dev-server: launching godot --editor in ${cwd}`);

  try {
    const child = spawn("godot", ["--editor"], {
      cwd,
      stdio: "ignore",
      detached: false,
    });

    child.on("error", (err) => {
      ctx.logger.error("dev-server: godot process error", { error: err.message });
    });

    ctx.logger.info(`dev-server: godot editor launched (PID ${child.pid})`);

    return {
      success: true,
      data: {
        pid: child.pid,
        projectPath: cwd,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.logger.error("dev-server: failed to launch godot", { error: message });
    return {
      success: false,
      errors: [`dev-server failed: ${message}`],
    };
  }
}

export function createDevServerCommand(): KernelCommandDefinition<DevServerData> {
  return {
    name: "godot.dev.server",
    description: "Launch godot --editor for local development",
    scope: "workspace",
    cacheable: false,
    async execute(_input, context) {
      const result = await runGodotDevServer(context);
      const pid =
        typeof result.data === "object" && result.data !== null && "pid" in result.data
          ? (result.data as { pid?: number }).pid
          : undefined;
      const data: DevServerData = {
        command: "godot.dev.server",
        status: result.success ? "pass" : "fail",
        pid,
      };
      return {
        data,
        exitCode: result.success ? 0 : 1,
        summary: `godot.dev.server: ${data.status}`,
      } satisfies KernelCommandResult<DevServerData>;
    },
  };
}

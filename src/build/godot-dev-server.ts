/*
<MODULE_CONTRACT>
<purpose>Dev server hook for the Godot plugin — launches godot --editor for local development.</purpose>
<keywords>dev, server, godot, editor</keywords>
<responsibilities>
  <item>Launches `godot --editor` in the workpiece directory as a non-blocking child process.</item>
  <item>Returns HookResult with the process PID for external management.</item>
</responsibilities>
<non-goals>
  <item>Does not build — that is the build hook's job.</item>
  <item>Does not manage process lifecycle beyond launch — the caller handles shutdown.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial dev server hook — launches godot --editor for local development.</item>
  <item>Refactor: createDevServerCommand folded in from dev/module.ts (architecture deepening).</item>
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

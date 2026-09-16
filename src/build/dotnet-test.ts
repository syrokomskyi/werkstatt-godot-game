/*
<MODULE_CONTRACT>
<purpose>Test hook for the Godot plugin — runs dotnet test for C# unit tests.</purpose>
<keywords>test, dotnet, xunit, nunit, godot</keywords>
<responsibilities>
  <item>Runs `dotnet test` in the workpiece directory if test projects exist.</item>
  <item>Reports success/failure via HookResult.</item>
</responsibilities>
<non-goals>
  <item>Does not build — that is the build hook's job.</item>
  <item>Does not run GdUnit4 tests — only dotnet test (xUnit/NUnit).</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial test hook — runs dotnet test for C# unit test integration.</item>
  <item>Refactor: runTool seam; createTestCommand folded in from dev/module.ts (architecture deepening).</item>
</CHANGE_SUMMARY>
*/

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { PluginHookContext, HookResult } from "@warpgogol/werkstatt-shared/plugin";
import type {
  KernelCommandDefinition,
  KernelCommandResult,
} from "@warpgogol/werkstatt-engine/kernel/types";
import { runTool, type ToolExecutor } from "../utils/run-tool.ts";

export interface TestData {
  command: string;
  status: "pass" | "fail";
}

export async function runDotnetTest(
  ctx: PluginHookContext,
  executor?: ToolExecutor,
): Promise<HookResult> {
  const cwd = ctx.workpiecePath ?? ctx.workspaceRoot;

  const hasTestProjects = checkForTestProjects(cwd);
  if (!hasTestProjects) {
    ctx.logger.info("test: no test projects found, skipping dotnet test");
    return { success: true };
  }

  ctx.logger.info(`test: running dotnet test in ${cwd}`);

  const result = runTool(
    "dotnet",
    ["test", "--no-build", "--verbosity", "normal"],
    { cwd, timeoutMs: 300_000 },
    executor,
  );

  if (!result.ok) {
    const message = result.output.slice(-500);
    ctx.logger.error("test: failed", { error: message });
    return {
      success: false,
      errors: [`dotnet test failed: ${message}`],
    };
  }

  ctx.logger.info("test: completed", { output: result.output.slice(-200) });
  return { success: true };
}

export function createTestCommand(): KernelCommandDefinition<TestData> {
  return {
    name: "godot.test",
    description: "Run dotnet test for C# unit tests",
    scope: "workspace",
    cacheable: false,
    async execute(_input, context) {
      const result = await runDotnetTest(context);
      const data: TestData = {
        command: "godot.test",
        status: result.success ? "pass" : "fail",
      };
      return {
        data,
        exitCode: result.success ? 0 : 1,
        summary: `godot.test: ${data.status}`,
      } satisfies KernelCommandResult<TestData>;
    },
  };
}

function checkForTestProjects(projectRoot: string): boolean {
  try {
    const entries = readdirSync(projectRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".Test.csproj")) {
        return true;
      }
      if (entry.isFile() && entry.name.endsWith(".Tests.csproj")) {
        return true;
      }
    }

    const testDir = join(projectRoot, "Tests");
    if (existsSync(testDir)) {
      const testEntries = readdirSync(testDir, { withFileTypes: true });
      for (const entry of testEntries) {
        if (entry.isFile() && entry.name.endsWith(".csproj")) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

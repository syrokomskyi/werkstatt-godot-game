/*
<MODULE_CONTRACT>
<purpose>godot.smoke.test — launches the Godot game headless for a few seconds to catch runtime errors that static validators cannot detect.</purpose>


<non-goals>
  <item>Does not run unit tests — use godot.test (dotnet test) for that.</item>
  <item>Does not test visual output — headless mode has no rendering.</item>
  <item>Does not run the editor — uses --headless game mode only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  KernelCommandDefinition,
  KernelCommandResult,
} from "@warpgogol/werkstatt-engine/kernel/types";
import {
  runTool,
  extractPrefixedLines,
  type ToolExecutor,
} from "../utils/run-tool.ts";

export interface SmokeTestData {
  command: string;
  status: "pass" | "fail";
  duration: number;
  errors: string[];
  warnings: string[];
  output: string;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export function runSmokeTest(
  projectRoot: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  executor?: ToolExecutor,
): KernelCommandResult<SmokeTestData> {
  const projectGodot = join(projectRoot, "project.godot");

  if (!existsSync(projectGodot)) {
    return {
      data: {
        command: "godot.smoke.test",
        status: "fail",
        duration: 0,
        errors: ["project.godot not found — cannot run smoke test"],
        warnings: [],
        output: "",
      },
      exitCode: 1,
      summary: "godot.smoke.test: fail (no project.godot)",
    };
  }

  const result = runTool(
    "godot",
    ["--headless", "--quit-after", String(Math.ceil(timeoutMs / 1000))],
    { cwd: projectRoot, timeoutMs: timeoutMs + 5_000 },
    executor,
  );

  const output = result.output;
  const duration = result.durationMs;
  const errors = extractPrefixedLines(output, "ERROR:");
  const warnings = extractPrefixedLines(output, "WARNING:");

  const status = !result.ok || errors.length > 0 ? "fail" : "pass";

  return {
    data: {
      command: "godot.smoke.test",
      status,
      duration,
      errors,
      warnings,
      output: output.slice(-500),
    },
    exitCode: status === "pass" ? 0 : 1,
    summary: `godot.smoke.test: ${status} (${duration}ms, ${errors.length} errors, ${warnings.length} warnings)`,
  };
}

export function createSmokeTestCommand(): KernelCommandDefinition<SmokeTestData> {
  return {
    name: "godot.smoke.test",
    description: "Run Godot headless smoke test to catch runtime errors",
    scope: "workspace",
    cacheable: false,
    async execute(_input, context) {
      return runSmokeTest(context.workspaceRoot);
    },
  };
}

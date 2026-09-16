/*
<MODULE_CONTRACT>
<purpose>godot.playtest — runs the Godot game for a configurable duration with deterministic input, catching runtime errors during gameplay (not just at startup).</purpose>


<non-goals>
  <item>Does not capture screenshots — use godot.screenshot for that.</item>
  <item>Does not run unit tests — use godot.test for that.</item>
  <item>Does not validate project structure — use validators for that.</item>
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

export interface PlaytestData {
  command: string;
  status: "pass" | "fail";
  duration: number;
  errors: string[];
  warnings: string[];
  startupErrors: string[];
  gameplayErrors: string[];
  output: string;
}

const DEFAULT_DURATION_SEC = 15;
const DEFAULT_FPS = 60;
const STARTUP_THRESHOLD_MS = 3_000;

export function runPlaytest(
  projectRoot: string,
  durationSec: number = DEFAULT_DURATION_SEC,
  fixedFps: number = DEFAULT_FPS,
  executor?: ToolExecutor,
): KernelCommandResult<PlaytestData> {
  const projectGodot = join(projectRoot, "project.godot");

  if (!existsSync(projectGodot)) {
    return {
      data: {
        command: "godot.playtest",
        status: "fail",
        duration: 0,
        errors: ["project.godot not found — cannot run playtest"],
        warnings: [],
        startupErrors: [],
        gameplayErrors: [],
        output: "",
      },
      exitCode: 1,
      summary: "godot.playtest: fail (no project.godot)",
    };
  }

  const result = runTool(
    "godot",
    [
      "--headless",
      "--fixed-fps",
      String(fixedFps),
      "--quit-after",
      String(durationSec),
    ],
    { cwd: projectRoot, timeoutMs: (durationSec + 10) * 1000 },
    executor,
  );

  const output = result.output;
  const duration = result.durationMs;
  const errors = extractPrefixedLines(output, "ERROR:");
  const warnings = extractPrefixedLines(output, "WARNING:");

  // Classify errors: startup vs gameplay based on position in output
  const startupErrors: string[] = [];
  const gameplayErrors: string[] = [];
  const startupCutoff = Math.floor(output.length * 0.1);
  for (const errorLine of errors) {
    const pos = output.indexOf(errorLine);
    if (pos < startupCutoff || duration < STARTUP_THRESHOLD_MS) {
      startupErrors.push(errorLine);
    } else {
      gameplayErrors.push(errorLine);
    }
  }

  const status = !result.ok || errors.length > 0 ? "fail" : "pass";

  return {
    data: {
      command: "godot.playtest",
      status,
      duration,
      errors,
      warnings,
      startupErrors,
      gameplayErrors,
      output: output.slice(-500),
    },
    exitCode: status === "pass" ? 0 : 1,
    summary: `godot.playtest: ${status} (${duration}ms, ${errors.length} errors [${startupErrors.length} startup, ${gameplayErrors.length} gameplay], ${warnings.length} warnings)`,
  };
}

export function createPlaytestCommand(): KernelCommandDefinition<PlaytestData> {
  return {
    name: "godot.playtest",
    description: "Run Godot playtest with deterministic input to catch gameplay runtime errors",
    scope: "workspace",
    cacheable: false,
    async execute(_input, context) {
      return runPlaytest(context.workspaceRoot);
    },
  };
}

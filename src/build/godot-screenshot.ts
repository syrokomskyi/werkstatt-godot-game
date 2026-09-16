/*
<MODULE_CONTRACT>
<purpose>godot.screenshot — captures a screenshot of the Godot game viewport using Xvfb + headless rendering.</purpose>


<non-goals>
  <item>Does not compare screenshots — visual regression comparison is a separate concern.</item>
  <item>Does not run the game for gameplay testing — use godot.playtest for that.</item>
  <item>Does not validate project structure — use validators for that.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  KernelCommandDefinition,
  KernelCommandResult,
} from "@warpgogol/werkstatt-engine/kernel/types";
import {
  runTool,
  findBinary,
  type ToolExecutor,
} from "../utils/run-tool.ts";

export interface ScreenshotData {
  command: string;
  status: "pass" | "fail";
  screenshotPath: string | null;
  display: string | null;
  width: number;
  height: number;
  errors: string[];
}

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const DEFAULT_OUTPUT_DIR = "screenshots";

export function captureScreenshot(
  projectRoot: string,
  outputPath?: string,
  width: number = DEFAULT_WIDTH,
  height: number = DEFAULT_HEIGHT,
  executor?: ToolExecutor,
): KernelCommandResult<ScreenshotData> {
  const projectGodot = join(projectRoot, "project.godot");

  if (!existsSync(projectGodot)) {
    return {
      data: {
        command: "godot.screenshot",
        status: "fail",
        screenshotPath: null,
        display: null,
        width,
        height,
        errors: ["project.godot not found — cannot capture screenshot"],
      },
      exitCode: 1,
      summary: "godot.screenshot: fail (no project.godot)",
    };
  }

  const godotBin = findBinary("godot", executor);
  if (!godotBin) {
    return {
      data: {
        command: "godot.screenshot",
        status: "fail",
        screenshotPath: null,
        display: null,
        width,
        height,
        errors: ["godot binary not found in PATH"],
      },
      exitCode: 1,
      summary: "godot.screenshot: fail (no godot binary)",
    };
  }

  const finalOutputPath =
    outputPath ?? join(projectRoot, DEFAULT_OUTPUT_DIR, "screenshot.png");

  // Determine display: use existing DISPLAY or start Xvfb
  let display = process.env.DISPLAY ?? null;
  let xvfbChild: ReturnType<typeof import("node:child_process").spawn> | null = null;

  if (!display) {
    const xvfbBin = findBinary("Xvfb", executor);
    if (!xvfbBin) {
      return {
        data: {
          command: "godot.screenshot",
          status: "fail",
          screenshotPath: null,
          display: null,
          width,
          height,
          errors: [
            "No DISPLAY environment variable set and Xvfb not found — cannot capture screenshot in headless environment",
          ],
        },
        exitCode: 1,
        summary: "godot.screenshot: fail (no display, no Xvfb)",
      };
    }

    display = ":99";
    xvfbChild = spawn(xvfbBin, [
      display,
      "-screen",
      "0",
      `${width}x${height}x24`,
    ], { stdio: "ignore" });

    // Give Xvfb a moment to start
    runTool("sleep", ["1"], { cwd: projectRoot, timeoutMs: 5_000 }, executor);
  }

  const errors: string[] = [];
  let success = false;

  const env = { ...process.env, DISPLAY: display! };
  const godotResult = runTool(
    godotBin,
    ["--headless", "--render-thread", "safe", "--quit-after", "60"],
    { cwd: projectRoot, timeoutMs: 30_000, env },
    executor,
  );

  if (!godotResult.ok) {
    errors.push(`Screenshot capture failed: ${godotResult.output.slice(-300)}`);
  } else if (display && xvfbChild) {
    // Godot doesn't have a direct --screenshot flag in headless mode,
    // but the rendering output can be captured via OS-level tools.
    // For now, we use import_strategy: run the game briefly and capture via xwd.
    // This is a best-effort approach.
    const xwdResult = runTool(
      "xwd",
      ["-root", "-display", display, "-out", `${finalOutputPath}.xwd`],
      { cwd: projectRoot, timeoutMs: 5_000, env },
      executor,
    );
    if (!xwdResult.ok) {
      errors.push("xwd capture failed — no screenshot saved");
    } else {
      // Convert xwd to png if ImageMagick is available
      const convertResult = runTool(
        "convert",
        [`${finalOutputPath}.xwd`, finalOutputPath],
        { cwd: projectRoot, timeoutMs: 5_000 },
        executor,
      );
      if (convertResult.ok) {
        success = existsSync(finalOutputPath);
      } else {
        errors.push("ImageMagick 'convert' not available — screenshot saved as .xwd only");
        success = existsSync(`${finalOutputPath}.xwd`);
      }
    }
  } else {
    errors.push("Screenshot capture requires Xvfb in headless environments");
  }

  if (xvfbChild) {
    xvfbChild.kill("SIGTERM");
  }

  const status = success ? "pass" : "fail";

  return {
    data: {
      command: "godot.screenshot",
      status,
      screenshotPath: success ? finalOutputPath : null,
      display,
      width,
      height,
      errors,
    },
    exitCode: status === "pass" ? 0 : 1,
    summary: `godot.screenshot: ${status}${success ? ` (${finalOutputPath})` : ` (${errors.length} error${errors.length === 1 ? "" : "s"})`}`,
  };
}

export function createScreenshotCommand(): KernelCommandDefinition<ScreenshotData> {
  return {
    name: "godot.screenshot",
    description: "Capture a screenshot of the Godot game viewport via Xvfb",
    scope: "workspace",
    cacheable: false,
    async execute(_input, context) {
      return captureScreenshot(context.workspaceRoot);
    },
  };
}

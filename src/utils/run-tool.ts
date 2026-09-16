/*
<MODULE_CONTRACT>
<purpose>Single seam for synchronous subprocess invocation — binary resolution, output capture, error-line classification.</purpose>
<keywords>subprocess, exec, tool, seam, godot</keywords>
<responsibilities>
  <item>Runs an external binary synchronously and returns merged stdout/stderr output.</item>
  <item>Accepts an injected executor — production uses execFileSync, tests inject a fake.</item>
  <item>Extracts prefixed lines (ERROR:, WARNING:) from tool output.</item>
  <item>Resolves binary paths via `which`.</item>
</responsibilities>
<non-goals>
  <item>Does not manage long-running daemons — dev server and Xvfb use spawn directly.</item>
  <item>Does not interpret tool output beyond line classification — callers own semantics.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial tool runner — extracted from smoke-test, playtest, screenshot, dotnet-build, dotnet-test, and deploy adapters (architecture review candidate #2).</item>
</CHANGE_SUMMARY>
*/

import { execFileSync } from "node:child_process";

export interface ToolExecOptions {
  cwd: string;
  timeoutMs: number;
  env?: Record<string, string>;
}

export interface ToolResult {
  /** True when the process exited 0; false on non-zero exit, timeout, or spawn error. */
  ok: boolean;
  /** Merged stdout + stderr (+ error message on failure). */
  output: string;
  durationMs: number;
}

/**
 * Subprocess executor — the seam between commands and child_process.
 * Production passes execFileSyncExecutor; tests pass a fake returning canned output.
 */
export type ToolExecutor = (bin: string, args: string[], opts: ToolExecOptions) => string;

export const execFileSyncExecutor: ToolExecutor = (bin, args, opts) =>
  execFileSync(bin, args, {
    cwd: opts.cwd,
    encoding: "utf-8",
    timeout: opts.timeoutMs,
    stdio: ["pipe", "pipe", "pipe"],
    env: opts.env,
  });

export function runTool(
  bin: string,
  args: string[],
  opts: ToolExecOptions,
  executor: ToolExecutor = execFileSyncExecutor,
): ToolResult {
  const start = Date.now();
  try {
    const output = executor(bin, args, opts);
    return { ok: true, output, durationMs: Date.now() - start };
  } catch (err) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    const output = [error.stdout ?? "", error.stderr ?? "", error.message ?? String(err)]
      .filter(Boolean)
      .join("\n");
    return { ok: false, output, durationMs: Date.now() - start };
  }
}

export function findBinary(
  name: string,
  executor: ToolExecutor = execFileSyncExecutor,
): string | null {
  try {
    const path = executor("which", [name], { cwd: process.cwd(), timeoutMs: 5_000 }).trim();
    return path || null;
  } catch {
    return null;
  }
}

/** Extract whole lines starting with `prefix` (e.g. "ERROR:", "WARNING:"). */
export function extractPrefixedLines(output: string, prefix: string): string[] {
  return output.split("\n").filter((line) => line.startsWith(prefix));
}

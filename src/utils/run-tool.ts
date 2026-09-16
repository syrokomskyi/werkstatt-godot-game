/*
<MODULE_CONTRACT>
<purpose>Single seam for synchronous subprocess invocation — binary resolution, output capture, error-line classification.</purpose>


<non-goals>
  <item>Does not manage long-running daemons — dev server and Xvfb use spawn directly.</item>
  <item>Does not interpret tool output beyond line classification — callers own semantics.</item>
</non-goals>
<!-- risk: publish -->
</MODULE_CONTRACT>
<KEY_DECISIONS>
  <item>All synchronous subprocess calls route through this seam so binary resolution and error classification stay consistent.</item>
  <item>Long-running processes are excluded — daemons use spawn directly instead.</item>
</KEY_DECISIONS>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
  <item>RFC-1097: sweep — tail packages clean

Sweep batch 3: rewrote ~95 purposes across werkstatt-knowledge, werkstatt-shared, godot-game, phaser-game, lifecycle-core, projektarchiv-*, portal-*, billing-*, typescript (CONTRACT-02/PURPOSE-02). Real KEY_DECISIONS on 5 godot utils, non-goals on 5 CONTRACT-03 files, headers on 4 headerless files, CS-07 history literal fix on 2 files. Policy: vitest.config.ts + test-fixtures testPatterns, worker-configuration.d.ts excludedPath. All non-site/engine packages now 0 diagnostics.</item>
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

/*
<MODULE_CONTRACT>
<purpose>Godot check harness — shared violation/result types plus spec-to-command/gate/invariant machinery.</purpose>


<non-goals>
  <item>Does not implement validator logic — validators export run() functions consumed by specs.ts.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type {
  KernelCommandDefinition,
  KernelCommandResult,
} from "@warpgogol/werkstatt-engine/kernel/types";
import type {
  PluginHookContext,
  HookResult,
  StackInvariant,
} from "@warpgogol/werkstatt-shared/plugin";

/** Single violation shape shared by all GODOT validators. */
export interface GodotViolation {
  ruleId: string;
  message: string;
  file?: string;
  line?: number;
  reference?: string;
  addon?: string;
}

/** Base result payload — validators may extend with extra fields (e.g. addons list). */
export interface GodotCheckData {
  command: string;
  status: "pass" | "warn" | "fail";
  violations: GodotViolation[];
}

export interface GodotCheckSpec {
  /** Invariant id, e.g. "GODOT-01". */
  id: string;
  /** Kernel command name, e.g. "godot.scene.validate". */
  command: string;
  /** Command description for the kernel manifest. */
  description: string;
  /** Agent-facing invariant text for GODOT_INVARIANTS. */
  invariant: string;
  /** Non-blocking specs report warnings instead of gate errors (GODOT-04). */
  blocking: boolean;
  cacheable: boolean;
  run: (projectRoot: string) => Promise<KernelCommandResult<GodotCheckData>>;
}

export function godotCheckToCommand(spec: GodotCheckSpec): KernelCommandDefinition<GodotCheckData> {
  return {
    name: spec.command,
    contract: "godot",
    rules: [],
    description: spec.description,
    scope: "workspace",
    cacheable: spec.cacheable,
    async execute(_input, context) {
      return spec.run(context.workspaceRoot);
    },
  };
}

export function godotInvariants(specs: readonly GodotCheckSpec[]): StackInvariant[] {
  return specs.map((s) => ({ id: s.id, description: s.invariant, check: s.command }));
}

export async function runGodotCheckGate(
  ctx: PluginHookContext,
  specs: readonly GodotCheckSpec[],
): Promise<HookResult> {
  const projectRoot = ctx.workpiecePath ?? ctx.workspaceRoot;
  const errors: string[] = [];
  const statuses: string[] = [];

  for (const spec of specs) {
    const result = await spec.run(projectRoot);
    const count = result.data?.violations.length ?? 0;
    statuses.push(`${spec.id}=${result.data?.status ?? "unknown"}`);

    if (spec.blocking) {
      if (result.exitCode !== 0) {
        errors.push(`${spec.command}: ${count} violations`);
      }
    } else if (count > 0) {
      ctx.logger.warn(`${spec.command}: ${count} warnings (non-blocking)`);
    }
  }

  ctx.logger.info(`checkGate: ${statuses.join(", ")}`);

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

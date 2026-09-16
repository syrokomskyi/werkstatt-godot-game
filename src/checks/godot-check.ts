/*
<MODULE_CONTRACT>
<purpose>Godot check harness — shared violation/result types plus spec-to-command/gate/invariant machinery.</purpose>
<keywords>checks, harness, spec, validators, godot</keywords>
<responsibilities>
  <item>Defines GodotViolation and GodotCheckData — the single result shape for all GODOT validators.</item>
  <item>Defines GodotCheckSpec — one declarative entry per invariant (id, command, run, blocking, cacheable).</item>
  <item>godotCheckToCommand wraps a spec's run() into a CommandDeclaration.</item>
  <item>runGodotCheckGate executes all specs, honoring non-blocking specs as warnings.</item>
  <item>godotInvariants derives StackInvariant[] from the spec table.</item>
</responsibilities>
<non-goals>
  <item>Does not implement validator logic — validators export run() functions consumed by specs.ts.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial check harness — collapses per-validator command factories, gate orchestration, and invariant table into one spec-driven module (architecture review candidates #1, #5).</item>
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

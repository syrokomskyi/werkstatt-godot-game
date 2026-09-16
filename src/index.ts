/*
<MODULE_CONTRACT>
<purpose>Werkstatt Godot plugin entry point — Godot 4.x + C# stack implementing werkstatt/plugin@1.</purpose>


<non-goals>
  <item>Do not implement engine logic — delegate to @warpgogol/werkstatt-engine.</item>
  <item>Do not import stack-specific dependencies into the engine package.</item>
  <item>Do not depend on Godot directly — validate project structure only.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import type { WerkstattPlugin } from "@warpgogol/werkstatt-shared/plugin";
import type { KernelModule } from "@warpgogol/werkstatt-engine/kernel/types";
import { godotPathConventions } from "./paths/godot-paths.ts";
import { GODOT_INVARIANTS } from "./invariants/godot-invariants.ts";

export const werkstattGodotPlugin: WerkstattPlugin = {
  schema: "werkstatt/plugin@1",
  id: "werkstatt-godot-game",
  profileId: "godot-csharp",
  paths: godotPathConventions,
  moduleLoaders: {
    checks: async (): Promise<KernelModule> =>
      (await import("./checks/module.ts")).createGodotCheckModule(),
    dev: async (): Promise<KernelModule> =>
      (await import("./dev/module.ts")).createGodotDevModule(),
  },
  deployAdapters: {
    "itch-io": async () => {
      const { createItchIoAdapter } = await import("./deploy/itch-io.ts");
      return createItchIoAdapter();
    },
    "github-releases": async () => {
      const { createGitHubReleasesAdapter } = await import("./deploy/github-releases.ts");
      return createGitHubReleasesAdapter();
    },
  },
  hooks: {
    build: async (ctx) => {
      const { runDotnetBuild } = await import("./build/dotnet-build.ts");
      return runDotnetBuild(ctx);
    },
    checkGate: async (ctx) => {
      const { runGodotCheckGate } = await import("./checks/index.ts");
      return runGodotCheckGate(ctx);
    },
    releaseEvidence: async (ctx) => {
      const { generateGodotEvidence } = await import("./release-evidence/godot-evidence.ts");
      return generateGodotEvidence(ctx);
    },
    scaffoldProject: async (ctx) => {
      const { scaffoldGodotProject } = await import("./onboarding/scaffold-project.ts");
      return scaffoldGodotProject(ctx);
    },
  },
  invariants: GODOT_INVARIANTS,
};

export default werkstattGodotPlugin;

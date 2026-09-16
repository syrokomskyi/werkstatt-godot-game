/*
<MODULE_CONTRACT>
<purpose>godot.context.generate — produces a structured summary of a Godot project for AI agent context.</purpose>


<non-goals>
  <item>Does not validate the project — use validators for that.</item>
  <item>Does not read file contents beyond project.godot — only lists paths.</item>
  <item>Does not generate AI prompts — the structured data is the output.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import type {
  KernelCommandDefinition,
  KernelCommandResult,
} from "@warpgogol/werkstatt-engine/kernel/types";
import { listFilesRecursive } from "../utils/list-files-recursive.ts";
import { loadGodotProject } from "../utils/godot-project.ts";
import { GODOT_SKIP_DIRS } from "../paths/godot-paths.ts";

export interface GodotAddonInfo {
  name: string;
  enabled: boolean;
  hasPluginCfg: boolean;
  hasCsproj: boolean;
}

export interface GodotProjectContext {
  command: string;
  projectRoot: string;
  mainScene: string | null;
  autoloads: { name: string; path: string }[];
  inputActions: string[];
  renderer: string | null;
  stretchMode: string | null;
  stretchAspect: string | null;
  windowWidth: number | null;
  windowHeight: number | null;
  scenes: string[];
  scripts: string[];
  resources: string[];
  addons: GodotAddonInfo[];
  csprojExists: boolean;
  slnExists: boolean;
  exportPresetsExist: boolean;
}

export type ContextGenerateData = GodotProjectContext;

export async function generateContext(
  projectRoot: string,
): Promise<KernelCommandResult<ContextGenerateData>> {
  const project = await loadGodotProject(projectRoot);

  if (!project) {
    return {
      data: {
        command: "godot.context.generate",
        projectRoot,
        mainScene: null,
        autoloads: [],
        inputActions: [],
        renderer: null,
        stretchMode: null,
        stretchAspect: null,
        windowWidth: null,
        windowHeight: null,
        scenes: [],
        scripts: [],
        resources: [],
        addons: [],
        csprojExists: false,
        slnExists: false,
        exportPresetsExist: false,
      },
      exitCode: 1,
      summary: "godot.context.generate: fail (no project.godot)",
    };
  }

  const {
    mainScene,
    autoloads,
    inputActions,
    renderer,
    stretchMode,
    stretchAspect,
    windowWidth,
    windowHeight,
    enabledPlugins,
  } = project;

  // List files
  const [scenes, scripts, resources] = await Promise.all([
    listFilesRecursive(projectRoot, ".tscn", GODOT_SKIP_DIRS),
    listFilesRecursive(projectRoot, ".cs", GODOT_SKIP_DIRS),
    listFilesRecursive(projectRoot, ".tres", GODOT_SKIP_DIRS),
  ]);

  // List addons
  const addons: GodotAddonInfo[] = [];
  const addonsDir = join(projectRoot, "addons");
  if (existsSync(addonsDir)) {
    const addonEntries = await readdir(addonsDir, { withFileTypes: true });
    for (const entry of addonEntries.filter((e) => e.isDirectory())) {
      const addonName = entry.name;
      const addonPath = join(addonsDir, addonName);
      const hasPluginCfg = existsSync(join(addonPath, "plugin.cfg"));
      const hasCsproj = existsSync(join(addonPath, `${addonName}.csproj`));
      const enabled = enabledPlugins.includes(`res://addons/${addonName}`);
      addons.push({ name: addonName, enabled, hasPluginCfg, hasCsproj });
    }
  }

  const data: GodotProjectContext = {
    command: "godot.context.generate",
    projectRoot: relative(projectRoot, projectRoot) || ".",
    mainScene,
    autoloads,
    inputActions,
    renderer,
    stretchMode,
    stretchAspect,
    windowWidth,
    windowHeight,
    scenes: scenes.map((f) => relative(projectRoot, f)),
    scripts: scripts.map((f) => relative(projectRoot, f)),
    resources: resources.map((f) => relative(projectRoot, f)),
    addons,
    csprojExists: existsSync(join(projectRoot, "Game.csproj")),
    slnExists: existsSync(join(projectRoot, "Game.sln")),
    exportPresetsExist: existsSync(join(projectRoot, "export_presets.cfg")),
  };

  return {
    data,
    exitCode: 0,
    summary: `godot.context.generate: ${data.scenes.length} scenes, ${data.scripts.length} scripts, ${data.resources.length} resources, ${data.autoloads.length} autoloads, ${data.inputActions.length} input actions, ${data.addons.length} addons`,
  };
}

export function createContextGenerateCommand(): KernelCommandDefinition<ContextGenerateData> {
  return {
    name: "godot.context.generate",
    description: "Generate structured project context for AI agents",
    scope: "workspace",
    cacheable: false,
    async execute(_input, context) {
      return generateContext(context.workspaceRoot);
    },
  };
}

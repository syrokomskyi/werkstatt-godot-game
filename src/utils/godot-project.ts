/*
<MODULE_CONTRACT>
<purpose>Single parse seam for project.godot — loads the file once into a typed GodotProject model.</purpose>
<keywords>project, godot, parser, model, ini</keywords>
<responsibilities>
  <item>Parses project.godot into sections, autoloads, input actions, display/stretch settings, and enabled editor plugins.</item>
  <item>Exposes raw section blocks for diff-style consumers (project-config-validate).</item>
  <item>loadGodotProject returns null when project.godot is absent — callers decide skip semantics.</item>
</responsibilities>
<non-goals>
  <item>Does not validate the project — validators consume the model and decide.</item>
  <item>Does not parse export_presets.cfg — that is parse-export-presets' job.</item>
</non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>Initial Godot project model — extracted from godot-context-generate, addon-validate, and project-config-validate ad-hoc regexes (architecture review candidate #4).</item>
</CHANGE_SUMMARY>
*/

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface GodotProject {
  /** Full file content, for consumers that need raw text. */
  raw: string;
  /** Section header (e.g. "[autoload]") → full block text including the header line. */
  sections: ReadonlyMap<string, string>;
  mainScene: string | null;
  autoloads: { name: string; path: string }[];
  inputActions: string[];
  renderer: string | null;
  stretchMode: string | null;
  stretchAspect: string | null;
  windowWidth: number | null;
  windowHeight: number | null;
  /** Enabled editor plugins as res://addons/<name> paths from [editor_plugins] enabled=. */
  enabledPlugins: string[];
}

export function parseGodotProject(content: string): GodotProject {
  const sections = parseSections(content);

  const mainScene = content.match(/^run\/main_scene="([^"]+)"/m)?.[1] ?? null;

  const autoloads: { name: string; path: string }[] = [];
  const autoloadPattern = /^autoload\/([^=]+)="([^"]+)"/gm;
  let match: RegExpExecArray | null;
  while ((match = autoloadPattern.exec(content)) !== null) {
    autoloads.push({ name: match[1]!, path: match[2]! });
  }

  const inputActions: string[] = [];
  const inputPattern = /^input\/([^=]+)=/gm;
  while ((match = inputPattern.exec(content)) !== null) {
    inputActions.push(match[1]!);
  }

  const renderer =
    content.match(/^rendering\/renderer\/rendering_method="([^"]+)"/m)?.[1] ?? null;
  const stretchMode =
    content.match(/^display\/window\/stretch\/mode="([^"]+)"/m)?.[1] ?? null;
  const stretchAspect =
    content.match(/^display\/window\/stretch\/aspect="([^"]+)"/m)?.[1] ?? null;

  const widthMatch = content.match(/^display\/window\/size\/viewport_width=(\d+)/m);
  const heightMatch = content.match(/^display\/window\/size\/viewport_height=(\d+)/m);
  const windowWidth = widthMatch ? parseInt(widthMatch[1]!, 10) : null;
  const windowHeight = heightMatch ? parseInt(heightMatch[1]!, 10) : null;

  const editorPlugins = sections.get("[editor_plugins]") ?? "";
  const enabledLine = editorPlugins.match(/^enabled=(.*)$/m)?.[1] ?? "";
  const enabledPlugins = [...enabledLine.matchAll(/"(res:\/\/addons\/[^"]+)"/g)].map(
    (m) => m[1]!,
  );

  return {
    raw: content,
    sections,
    mainScene,
    autoloads,
    inputActions,
    renderer,
    stretchMode,
    stretchAspect,
    windowWidth,
    windowHeight,
    enabledPlugins,
  };
}

export async function loadGodotProject(projectRoot: string): Promise<GodotProject | null> {
  try {
    const content = await readFile(join(projectRoot, "project.godot"), "utf-8");
    return parseGodotProject(content);
  } catch {
    return null;
  }
}

/** Full text of one [section] block (header line included), or "" when absent. */
export function extractSection(content: string, sectionHeader: string): string {
  return parseSections(content).get(sectionHeader) ?? "";
}

function parseSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  let currentHeader: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentHeader !== null) {
      sections.set(currentHeader, currentLines.join("\n"));
    }
  };

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      flush();
      currentHeader = trimmed;
      currentLines = [line];
    } else if (currentHeader !== null) {
      currentLines.push(line);
    }
  }
  flush();

  return sections;
}

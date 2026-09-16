/*
<MODULE_CONTRACT>
<purpose>itch.io deploy adapter for the Godot plugin — supports multi-platform channels.</purpose>


<non-goals>
  <item>Does not build — build hook runs before deploy.</item>
  <item>Does not manage DNS or custom domains.</item>
</non-goals>
<!-- risk: vault -->
<!-- risk: publish -->
</MODULE_CONTRACT>
<CHANGE_SUMMARY>
  <item>RFC-1097: step 6 — compass.migrate codemod run

Mechanical v1 to v2 header migration across the workspace: 942 files rewritten — CHANGE_SUMMARY windows collapsed into <history>, forbidden v1 blocks stripped, KEY_DECISIONS seeded from @ai-invariant comments (5 files) or TODO placeholders (103 files), blocks reordered to canonical order.</item>
</CHANGE_SUMMARY>
*/

import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import type { DeployResult } from "./types.ts";
import { parseExportPresets } from "../utils/parse-export-presets.ts";
import { runTool, type ToolExecutor } from "../utils/run-tool.ts";

export interface ItchIoChannelConfig {
  channel: string;
  buildPath: string;
}

export interface ItchIoDeployConfig {
  apiKey: string;
  project: string;
  channel?: string;
  buildDir?: string;
  channels?: ItchIoChannelConfig[];
}

export interface ItchIoAdapter {
  deploy(workpiecePath: string, config: ItchIoDeployConfig): DeployResult;
}

export function createItchIoAdapter(executor?: ToolExecutor): ItchIoAdapter {
  return {
    deploy(workpiecePath: string, config: ItchIoDeployConfig): DeployResult {
      if (!config.apiKey) {
        return {
          success: false,
          errors: ["itch.io API key not provided in channel config (deploy.itch.apiKey)"],
        };
      }

      if (!config.project) {
        return {
          success: false,
          errors: ["itch.io project not provided in channel config (deploy.itch.project)"],
        };
      }

      const channels = resolveChannels(workpiecePath, config);
      if (channels.length === 0) {
        return {
          success: false,
          errors: ["No deployable channels found — provide channels config or export_presets.cfg"],
        };
      }

      const errors: string[] = [];
      const urls: string[] = [];

      for (const ch of channels) {
        if (!existsSync(ch.buildPath)) {
          errors.push(`Build directory not found at ${ch.buildPath} for channel "${ch.channel}"`);
          continue;
        }

        const env: Record<string, string> = {
          ...process.env,
          BUTLER_API_KEY: config.apiKey,
        };

        const result = runTool(
          "butler",
          ["push", ch.buildPath, `${config.project}:${ch.channel}`],
          { cwd: workpiecePath, timeoutMs: 300_000, env },
          executor,
        );

        if (result.ok) {
          urls.push(`https://${config.project}.itch.io/${ch.channel}`);
        } else {
          errors.push(
            `itch.io deploy failed for channel "${ch.channel}": ${result.output.slice(-300)}`,
          );
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      return {
        success: true,
        url: urls.length === 1 ? urls[0] : undefined,
        urls: urls.length > 1 ? urls : undefined,
      };
    },
  };
}

function resolveChannels(workpiecePath: string, config: ItchIoDeployConfig): ItchIoChannelConfig[] {
  if (config.channels && config.channels.length > 0) {
    return config.channels.map((ch) => ({
      channel: ch.channel,
      buildPath: join(workpiecePath, ch.buildPath),
    }));
  }

  const presetsPath = join(workpiecePath, "export_presets.cfg");
  if (existsSync(presetsPath)) {
    return resolveChannelsFromPresets(workpiecePath, presetsPath);
  }

  if (config.channel && config.buildDir) {
    return [
      {
        channel: config.channel,
        buildPath: join(workpiecePath, config.buildDir),
      },
    ];
  }

  return [
    {
      channel: config.channel ?? "windows",
      buildPath: join(workpiecePath, config.buildDir ?? "bin/Debug"),
    },
  ];
}

function resolveChannelsFromPresets(
  workpiecePath: string,
  presetsPath: string,
): ItchIoChannelConfig[] {
  const presets = parseExportPresets(presetsPath);
  const channels: ItchIoChannelConfig[] = [];

  for (const preset of presets) {
    const channel = platformToChannel(preset.platform);
    channels.push({
      channel,
      buildPath: join(workpiecePath, dirname(preset.exportPath)),
    });
  }

  return channels;
}

function platformToChannel(platform: string): string {
  const map: Record<string, string> = {
    "Windows Desktop": "windows",
    "Linux/X11": "linux",
    macOS: "mac",
    Web: "html",
    Android: "android",
    iOS: "ios",
  };
  return map[platform] ?? platform.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

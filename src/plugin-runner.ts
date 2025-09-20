import type {FileSystem} from './file-system.js';
import type {Message, Options, ReportPlugin, Stats} from './types.js';

interface RunPluginsResult {
  messages: Message[];
  stats: Stats;
}

function updateStats(target: Stats, patch: Partial<Stats>, seenExtra: Set<string>) {
  if (patch.name) target.name = patch.name;
  if (patch.version) target.version = patch.version;
  if (patch.installSize !== undefined) target.installSize = patch.installSize;

  if (patch.dependencyCount) {
    target.dependencyCount = {
      ...target.dependencyCount,
      ...patch.dependencyCount
    };
  }

  if (patch.extraStats?.length) {
    const dst = target.extraStats ??= [];
    for (const st of patch.extraStats) {
      if (seenExtra.has(st.name)) continue;
      seenExtra.add(st.name);
      dst.push(st);
    }
  }
}

export async function runPlugins(
  fileSystem: FileSystem,
  plugins: ReportPlugin[],
  baseStats: Stats,
  options?: Options
): Promise<RunPluginsResult> {
  const messages: Message[] = [];
  const stats = baseStats;
  stats.extraStats ??= [];

  const seenExtra = new Set<string>(stats.extraStats.map((s) => s.name));

  for (const plugin of plugins) {
    const res = await plugin(fileSystem, options);

    messages.push(...res.messages);

    if (res.stats) {
      updateStats(stats, res.stats, seenExtra);
    }
  }

  return {messages, stats};
}
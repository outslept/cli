import {describe, it, expect} from 'vitest';
import {runPlugins} from '../plugin-runner.js';
import type {FileSystem} from '../file-system.js';
import type {ReportPlugin, Stats} from '../types.js';

const fsMock: FileSystem = {
  getRootDir: async () => '/',
  listPackageFiles: async () => [],
  readFile: async () => '',
  getInstallSize: async () => 0,
  fileExists: async () => false
};

const depCounts = {production: 0, development: 0, cjs: 0, esm: 0, duplicate: 0};

describe('runPlugins', () => {
  it('should aggregate messages and merge stats with extraStats de-dup', async () => {
    const pluginA: ReportPlugin = async () => ({
      messages: [{severity: 'warning', score: 0, message: 'A'}],
      stats: {
        name: 'pkg-a',
        version: '1.0.0',
        dependencyCount: depCounts,
        extraStats: [{name: 's1', value: 'v1'}]
      }
    });

    const pluginB: ReportPlugin = async () => ({
      messages: [{severity: 'suggestion', score: 0, message: 'B'}],
      stats: {
        name: 'pkg-b',
        version: '2.0.0',
        dependencyCount: depCounts,
        extraStats: [
          {name: 's1', value: 'v1-dup'},
          {name: 's2', value: 'v2'}
        ]
      }
    });

    const pluginC: ReportPlugin = async () => ({
      messages: [{severity: 'error', score: 0, message: 'C'}]
    });

    const baseStats: Stats = {
      name: 'unknown',
      version: 'unknown',
      dependencyCount: depCounts,
      extraStats: [{name: 'seed', value: 'seed'}]
    };

    const {messages, stats} = await runPlugins(
      fsMock,
      [pluginA, pluginB, pluginC],
      baseStats
    );

    expect(messages.map((m) => m.message)).toEqual(['A', 'B', 'C']);
    expect(stats.name).toBe('pkg-b');
    expect(stats.version).toBe('2.0.0');

    const names = stats.extraStats?.map((s) => s.name) ?? [];
    expect(new Set(names)).toEqual(new Set(['seed', 's1', 's2']));
    expect(names.filter((n) => n === 's1').length).toBe(1);
  });

  it('should use shared extraStats array and preserve seed when no plugin stats', async () => {
    const baseStats: Stats = {
      name: 'unknown',
      version: 'unknown',
      dependencyCount: depCounts,
      extraStats: [{name: 'seed', value: 'seed'}]
    };

    const noop: ReportPlugin = async () => ({messages: []});

    const {stats} = await runPlugins(fsMock, [noop], baseStats);

    expect(stats.extraStats).toBe(baseStats.extraStats);
    expect(stats.extraStats?.map((s) => s.name)).toEqual(['seed']);
    expect(baseStats.extraStats?.map((s) => s.name)).toEqual(['seed']);
  });

  it('should propagate plugin errors', async () => {
    const ok: ReportPlugin = async () => ({
      messages: [{severity: 'warning', score: 0, message: 'ok'}],
      stats: {
        name: 'n',
        version: 'v',
        dependencyCount: depCounts,
        extraStats: []
      }
    });

    const boom: ReportPlugin = async () => {
      throw new Error('boom');
    };

    await expect(
      runPlugins(fsMock, [ok, boom], {
        name: 'unknown',
        version: 'unknown',
        dependencyCount: depCounts,
        extraStats: []
      })
    ).rejects.toThrow('boom');
  });

  it('should return provided baseStats when plugins only emit messages', async () => {
    const onlyMsgs: ReportPlugin = async () => ({
      messages: [{severity: 'warning', score: 0, message: 'M'}]
    });

    const baseStats: Stats = {
      name: 'unknown',
      version: 'unknown',
      dependencyCount: depCounts,
      extraStats: []
    };

    const {stats, messages} = await runPlugins(fsMock, [onlyMsgs], baseStats);

    expect(messages).toHaveLength(1);
    expect(stats.name).toBe('unknown');
    expect(stats.version).toBe('unknown');
    expect(stats.dependencyCount).toEqual(depCounts);
    expect(stats.extraStats).toEqual([]);
  });

  it('should merge stats when plugin provides stats without extraStats', async () => {
    const plugin: ReportPlugin = async () => ({
      messages: [],
      stats: {
        name: 'p',
        version: '1',
        dependencyCount: depCounts
      }
    });

    const baseStats: Stats = {
      name: 'unknown',
      version: 'unknown',
      dependencyCount: depCounts
    };

    const {stats} = await runPlugins(fsMock, [plugin], baseStats);
    expect(stats.name).toBe('p');
    expect(stats.version).toBe('1');
    expect(stats.extraStats).toEqual([]);
  });

  it('should handle empty plugin list', async () => {
    const baseStats: Stats = {
      name: 'unknown',
      version: 'unknown',
      dependencyCount: depCounts,
      extraStats: []
    };

    const {messages, stats} = await runPlugins(fsMock, [], baseStats);
    expect(messages).toEqual([]);
    expect(stats.name).toBe('unknown');
    expect(stats.extraStats).toEqual([]);
  });
});

#!/usr/bin/env node

import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import sade from 'sade';
import c from 'picocolors';
import {report} from './index.js';
import type {Message} from './types.js';

const version = createRequire(import.meta.url)('../package.json').version;
const cli = sade('e18e', false)
  .version(version)
  .option(
    '--pack',
    `Package manager to use for packing ('auto' | 'npm' | 'yarn' | 'pnpm' | 'bun')`,
    'auto'
  );

cli.command('run [root]', '', {default: true}).action(async (root, opts) => {
  console.log(`${c.bold(`@e18e/reporter v${version}`)}`);
  console.log('-'.repeat(21));
  console.log();

  // If a path is passed, see if it's a path to a file (likely the tarball file)
  if (root) {
    const stat = await fs.stat(root).catch(() => {});
    const isTarballFilePassed = !!stat?.isFile();
    if (isTarballFilePassed) {
      opts.pack = {tarball: (await fs.readFile(root)).buffer};
    }
  }

  const {info, messages} = await report({root, pack: opts.pack});

  console.log(c.cyan('Package info'));
  console.log(`${c.dim('Name   ')}  ${info.name}`);
  console.log(`${c.dim('Version')}  ${info.version}`);
  console.log(`${c.dim('Type   ')}  ${info.type.toUpperCase()}`);
  console.log();

  console.log(c.cyan('Package report'));
  if (messages.length === 0) {
    console.log(c.bold(c.green('All good!')));
  } else {
    formatMessages(messages).forEach((l) => console.log(l));
  }
  console.log();
});

cli.parse(process.argv);

function formatMessages(messages: Message[]) {
  /** @type {string[]} */
  const logs = [];

  const errors = messages.filter((v) => v.severity === 'error');
  if (errors.length) {
    logs.push(c.bold(c.red('Errors:')));
    errors.forEach((m, i) => logs.push(c.dim(`${i + 1}. `) + m.message));
    process.exitCode = 1;
  }

  const warnings = messages.filter((v) => v.severity === 'warning');
  if (warnings.length) {
    logs.push(c.bold(c.yellow('Warnings:')));
    warnings.forEach((m, i) => logs.push(c.dim(`${i + 1}. `) + m.message));
  }

  const suggestions = messages.filter((v) => v.severity === 'suggestion');
  if (suggestions.length) {
    logs.push(c.bold(c.blue('Suggestions:')));
    suggestions.forEach((m, i) => logs.push(c.dim(`${i + 1}. `) + m.message));
  }

  return logs;
}

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripVersion } from './utils.js';

describe('--help command', () => {
  it('prints the up to date help command', () => {
    const cliPath = join(__dirname, '..', 'cli.js');

    const output = execSync(`node ${cliPath} --help`, {
      stdio: 'pipe',
    });

    expect(stripVersion(output.toString())).toMatchInlineSnapshot(`
      "e18e (cli <version>)

      USAGE:
        cli [(anonymous)] <OPTIONS>
        cli <COMMANDS>

      COMMANDS:
        analyze          Analyze the project for any warnings or errors  
        migrate          Migrate from a package to a more performant alternative.  

      For more info, run any command with the \`--help\` flag:
        cli analyze --help
        cli migrate --help

      OPTIONS:
        -h, --help             Display this help message
        -v, --version          Display this version

      "
    `);
  });

  it('prints the analyze command help', () => {
    const cliPath = join(__dirname, '..', 'cli.js');

    const output = execSync(`node ${cliPath} analyze --help`, {
      stdio: 'pipe',
    });

    const cleanOutput = stripVersion(output.toString());
    expect(cleanOutput).toMatchInlineSnapshot(`
      "e18e (cli <version>)

      Analyze the project for any warnings or errors

      USAGE:
        cli analyze <OPTIONS>

      OPTIONS:
        --pack [pack]                    Package manager to use for packing (default: auto, choices: auto | npm | yarn | pnpm | bun | none)
        --log-level [log-level]          Set the log level (debug | info | warn | error) (default: info, choices: debug | info | warn | error)
        -h, --help                       Display this help message
        -v, --version                    Display this version

      "
    `);
  });

  it('prints the migrate command help', () => {
    const cliPath = join(__dirname, '..', 'cli.js');

    const output = execSync(`node ${cliPath} migrate --help`, {
      stdio: 'pipe',
    });

    const cleanOutput = stripVersion(output.toString());
    expect(cleanOutput).toMatchInlineSnapshot(`
      "e18e (cli <version>)

      Migrate from a package to a more performant alternative.

      USAGE:
        cli migrate <OPTIONS>

      OPTIONS:
        --dry-run                    Don't apply any fixes, only show what would change. (default: false)
        --interactive                Run in interactive mode. (default: false)
        --include [include]          Files to migrate (default: **/*.{ts,js})
        -h, --help                   Display this help message
        -v, --version                Display this version

      "
    `);
  });

  it('prints the up to date version', () => {
    const cliPath = join(__dirname, '..', 'cli.js');

    const output = execSync(`node ${cliPath} --version`, {
      stdio: 'pipe',
    });

    expect(output.toString().trim()).toMatch(/^\d+\.\d+\.\d+(?:-\S+)?$/); /** major.minor.patch[-prerelease] */
  });
});

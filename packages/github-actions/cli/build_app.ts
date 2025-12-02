#!/usr/bin/env node
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { existsSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';

const WORKING_DIRECTORY_INPUT = 'working_directory';

const getWorkingDirectory = (): string => {
  return core.getInput(WORKING_DIRECTORY_INPUT) || process.cwd();
};

const runCommand = async (
  command: string,
  args: string[],
  cwd: string,
): Promise<void> => {
  core.info(`Running: ${command} ${args.join(' ')}`);
  await exec.exec(command, args, { cwd });
};

const removeIcnsFiles = (workingDirectory: string): void => {
  const assetsDir = join(workingDirectory, 'apps/wallet/dist/assets');

  if (!existsSync(assetsDir)) {
    core.info(`Assets directory not found: ${assetsDir}`);
    return;
  }

  const files = readdirSync(assetsDir);
  for (const file of files) {
    if (file.endsWith('.icns')) {
      const filePath = join(assetsDir, file);
      unlinkSync(filePath);
      core.info(`Removed: ${filePath}`);
    }
  }
};

const handleError = (err: unknown): void => {
  console.error(err);
  core.setFailed(`Unhandled error: ${err}`);
};

const main = async (): Promise<void> => {
  try {
    const workingDirectory = getWorkingDirectory();
    core.info(`Working directory: ${workingDirectory}`);

    // Install app dependencies
    core.info('Installing app dependencies...');
    await runCommand('npm', ['install'], workingDirectory);

    // Build packages
    core.info('Building packages...');
    await runCommand('./cli/build.sh', [], workingDirectory);

    // Copy icons to public dir
    core.info('Copying icons to public dir...');
    await runCommand('npm', ['run', 'copy:icons'], workingDirectory);

    // Build Minotaur JS app and update capacitor
    core.info('Building Minotaur JS app and updating capacitor...');
    await runCommand('npm', ['run', 'build:app'], workingDirectory);

    // Remove icns from assets
    core.info('Removing icns files from assets...');
    removeIcnsFiles(workingDirectory);

    core.info('Build completed successfully!');
  } catch (error) {
    let message;
    if (error instanceof Error) message = error.message;
    else message = String(error);
    core.setFailed(message);
  }
};

process.on('unhandledRejection', handleError);
main().catch(handleError);


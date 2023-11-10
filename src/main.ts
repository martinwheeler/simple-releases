#!/usr/bin/env node

import { input } from "@inquirer/prompts";
import chalk from "chalk";
import util from "node:util";
import { exec } from "node:child_process";
import cliSpinners from "cli-spinners";
import ora from "ora";

const asyncExec = util.promisify(exec);

// Notify the user why this has appeared.

const SOURCE_BRANCH = "dev";
const TARGET_BRANCH = "staging";

console.log(
  `You're merging ${chalk.blue.bold(SOURCE_BRANCH)} into ${chalk.yellow.bold(
    TARGET_BRANCH
  )}. \n`
);

const version = await input({
  message: "What version would you like to assign to this release?",
  default: "1.0.0",
});

const issueTag = await input({
  message:
    "What issue tag do you want to scan for? (this helps create the changelog)",
  default: "SR",
});

const { stdout: changelogCommits, stderr: commitCheckError } = await asyncExec(
  `git log --oneline | grep -Eo "${issueTag}-[0-9]+"`
);

if (
  changelogCommits &&
  SOURCE_BRANCH === "dev" &&
  TARGET_BRANCH === "staging"
) {
  const timestamp = new Date().toString();

  // NOTE: No indents for the message otherwise it is reflected in the CHANGELOG.md file too
  const newChanelogEntry = `## v${version} - ${timestamp}

### Added
    - Merged feature/branches
### Fixed
    - Merged bugfix/branches
    - Merged hotfix/branches
`;

  const { stdout: appendingChangelog, stderr: changelogError } =
    await asyncExec(`echo "${newChanelogEntry}" > CHANGELOG.md`);
}

console.log({
  version,
  issueTag,
  changelogCommits,
});

await asyncExec(`git add -A`);
await asyncExec(`git commit -m 'build: release v${version}'`);

const { stdout: tag, stderr: tagError } = await asyncExec(
  `git tag -a ${version} -m 'build: release v${version}'`
);

// spinner.stop();

#!/usr/bin/env node

import { input } from "@inquirer/prompts";
import chalk from "chalk";
import util from "node:util";
import { exec } from "node:child_process";
import cliSpinners from "cli-spinners";
import ora from "ora";

const asyncExec = util.promisify(exec);

// Notify the user why this has appeared.

let SOURCE_BRANCH = "dev";
let TARGET_BRANCH: "dev" | "staging" | "main" = "staging";

console.log(
  `You're merging ${chalk.blue.bold(SOURCE_BRANCH)} into ${chalk.yellow.bold(
    TARGET_BRANCH
  )}. \n`
);

const getDefaultVersion = async () => {
  // TODO: Get the default tag value from a git --tags (get the latest one)
  // Bump the value based on the source branch E.g. if dev -> staging bump the minor
  // anything -> dev bump the patch
  // staging -> prod bump the major

  const { stdout: latestTag, stderr: getLatestTagError } = await asyncExec(
    `git describe --tags --abbrev=0`
  );

  const [major, minor, patch] = latestTag.split(".");

  if (TARGET_BRANCH === "dev") {
    return `${major}.${minor}.${Number(patch) + 1}`;
  }

  if (TARGET_BRANCH === "staging") {
    return `${major}.${Number(minor) + 1}.${patch}`;
  }

  if (TARGET_BRANCH === "main") {
    return `${Number(major) + 1}.${minor}.${patch}`;
  }

  return "1.0.0";
};

const version = await input({
  message: "What version would you like to assign to this release?",
  default: (await getDefaultVersion()).trim(),
});

const issueTag = await input({
  message:
    "What issue tag do you want to scan for? (this helps create the changelog)",
  default: "SR",
});

// TODO: Only look between a range of commits (ATM it does everything)
const { stdout: changelogCommits, stderr: commitCheckError } = await asyncExec(
  `git log --oneline | grep -E "\S{7}\sMerge.*${issueTag}-[0-9]+"`
);

if (
  changelogCommits &&
  SOURCE_BRANCH === "dev" &&
  TARGET_BRANCH === "staging"
) {
  const timestamp = new Date().toString();

  const arrayOfCommits = changelogCommits.split("\n");

  // TODO: Need to define how we want the commits to be shaped, as feat may not always appear on the same line
  const featRegex = new RegExp(/feature\//);
  const fixRegex = new RegExp(/(bug|hot)fix\//);

  const featCommits = arrayOfCommits.filter((c) => featRegex.test(c));
  const fixCommits = arrayOfCommits.filter((c) => fixRegex.test(c));

  // NOTE: No indents for the message otherwise it is reflected in the CHANGELOG.md file too
  const newChanelogEntry = `## v${version} - ${timestamp}

### Added
    ${featCommits.reduce((result, commit) => {
      if (result) {
        return `${result}\n- ${commit}`;
      }

      return `- ${commit}`;
    }, "")}

### Fixed
    ${fixCommits.reduce((result, commit) => {
      if (result) {
        return `${result}\n- ${commit}`;
      }

      return `- ${commit}`;
    }, "")}
`;

  const { stdout: appendingChangelog, stderr: changelogError } =
    await asyncExec(`echo "${newChanelogEntry}" > CHANGELOG.md`);
}

console.log({
  version,
  issueTag,
  changelogCommits,
});

await asyncExec(`git add CHANGELOG.md`);
await asyncExec(`git commit -m 'build: release v${version}'`);

const { stdout: tag, stderr: tagError } = await asyncExec(
  `git tag -a ${version} -m 'build: release v${version}'`
);

// spinner.stop();

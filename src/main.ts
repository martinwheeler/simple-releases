#!/usr/bin/env node

import { input } from "@inquirer/prompts";
import chalk from "chalk";
import util from "node:util";
import { exec } from "node:child_process";

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
});

const issueTag = await input({
  message:
    "What issue tag do you want to scan for? (this helps create the changelog)",
});

console.log({
  version,
  issueTag: `${issueTag}-[0-9]+`,
});

const { stdout, stderr } = await asyncExec("git log");
console.log("stdout:", stdout);
console.error("stderr:", stderr);

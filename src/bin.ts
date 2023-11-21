#!/usr/bin/env node
const path = require("path");
const sr = require("./");

// Show usage and exit with code
function help(code: number) {
  console.log(`Usage:
  simplified-release run`);
  process.exit(code);
}

// Get CLI arguments
const [, , cmd] = process.argv;

// CLI commands
const cmds: { [key: string]: () => void } = {
  run: sr.run,
  ["-v"]: () =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
    console.log(require(path.join(__dirname, "../package.json")).version),
};

// Run CLI
try {
  // Run command or show usage for unknown command
  cmds[cmd] ? cmds[cmd]() : help(0);
} catch (e) {
  console.error(e instanceof Error ? `simplified-release - ${e.message}` : e);
  process.exit(1);
}

// Renames the project from the `myapp` placeholder, then deletes itself.
//
//   bun scripts/rename.ts <name>
//
// Every name derived from the project name (database prefix, Compose project,
// dev URL, service names) either contains it verbatim or is computed from the
// root package.json, so replacing the placeholder everywhere is enough.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const PLACEHOLDER = "myapp";
// Strict kebab-case: valid as a hostname label, an npm scope and a Compose
// project name. The group doesn't capture, which Ultracite requires.
const VALID_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const RENAME_BLOCK = /<!-- rename:start -->.*?<!-- rename:end -->\n*/su;
// STARTER.md specifies the template itself, placeholder included, so it stays
// as written in projects made from it.
const KEEP = new Set(["STARTER.md"]);

const [, , name] = process.argv;
if (!(name && VALID_NAME.test(name))) {
  throw new Error(
    "Usage: bun scripts/rename.ts <name>, where <name> is kebab-case, such as my-project."
  );
}

const root = fileURLToPath(new URL("..", import.meta.url));

const tracked = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter((file) => file && !KEEP.has(file));

for (const file of tracked) {
  const path = join(root, file);
  const text = readFileSync(path, "utf8");
  const renamed = (
    file === "README.md" ? text.replace(RENAME_BLOCK, "") : text
  ).replaceAll(PLACEHOLDER, name);
  if (renamed !== text) {
    writeFileSync(path, renamed);
  }
}

rmSync(fileURLToPath(import.meta.url));

// The lockfile names the workspaces, and the new scope can sort imports
// differently.
execFileSync("bun", ["install"], { cwd: root, stdio: "inherit" });
execFileSync("bun", ["run", "fix"], { cwd: root, stdio: "inherit" });

console.log(
  `Renamed ${PLACEHOLDER} to ${name}. Review the diff and commit it.`
);

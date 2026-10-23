// Renames the template's placeholder project name `app` everywhere it names the
// project: package scopes (@app/*), the Portless URL (app.localhost), and the
// local database (app, app_<branch>), which follows the root package.json name.
// Run once after creating a repo from the template, then delete it:
//   bun scripts/rename.ts <name>
import { $, file, write } from "bun";

const name = process.argv[2] ?? "";
// Must work as an npm scope, a hostname label, and a database name.
if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error("Usage: bun scripts/rename.ts <name>");
  console.error("The name needs lowercase letters, digits, and hyphens.");
  process.exit(1);
}
const database = name.replaceAll("-", "_");

const replacements: [RegExp, string][] = [
  [/@app\//g, `@${name}/`],
  [/"name": "app"/g, `"name": "${name}"`],
  [/--name app\b/g, `--name ${name}`],
  [/\bapp\.localhost\b/g, `${name}.localhost`],
  [/`app` in the main checkout/g, `\`${database}\` in the main checkout`],
  [/`app_<branch>`/g, `\`${database}_<branch>\``],
];

const files = (await $`git ls-files`.text()).trim().split("\n");
const results = await Promise.all(
  files.map(async (path) => {
    const before = await file(path).text();
    const after = replacements.reduce(
      (text, [pattern, value]) => text.replace(pattern, value),
      before
    );
    if (after === before) {
      return false;
    }
    await write(path, after);
    return true;
  })
);
const changed = results.filter(Boolean).length;

await $`rm ${import.meta.path}`;
await $`bun install`.quiet();
// The new name sorts and wraps differently, so reorder imports and reformat.
await $`bun run fix`.quiet();
console.log(`Renamed the project to ${name} in ${changed} files.`);
console.log("Review the diff, then commit it. This script deleted itself.");

// Gives every checkout of this repo its own database on the local Postgres
// server (docker-compose.yml).
//
//   url     Print this checkout's DATABASE_URL. Every varlock load runs this,
//           so it must stay a pure computation that never fails.
//   ensure  Start the server and create $DATABASE_URL's database, when it's local.
//           With --local, refuse a database that isn't (db:push uses this).
//   reset   Drop and recreate $DATABASE_URL's database; refuses unless it's local.
//   prune   Drop <prefix>_* databases that no live worktree maps to.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client, escapeIdentifier } from "pg";

const NON_ALPHANUMERIC = /[^a-z0-9]+/gu;
const EDGE_UNDERSCORES = /^_+|_+$/gu;
const MAX_IDENTIFIER_BYTES = 63;

const projectName: string = JSON.parse(
  readFileSync(new URL("../../../package.json", import.meta.url), "utf8")
).name;
const composeFile = fileURLToPath(
  new URL("../docker-compose.yml", import.meta.url)
);
// OrbStack names containers <service>.<compose project>.orb.local.
const host = `postgres.${projectName}.orb.local`;

// Lowercase ASCII, digits and underscores, so length in characters is bytes.
const identifier = (value: string) =>
  value
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, "_")
    .replace(EDGE_UNDERSCORES, "");

const prefix = identifier(projectName);

const shortHash = (value: string) =>
  createHash("sha256").update(value).digest("hex").slice(0, 6);

const git = (...args: string[]) =>
  execFileSync("git", args, {
    cwd: import.meta.dirname,
    encoding: "utf8",
  }).trim();

// Uses the branch's last path segment, like portless's URLs.
const branchDatabase = (branch: string) => {
  const name = `${prefix}_${identifier(branch.split("/").at(-1) ?? "")}`;
  return name.length <= MAX_IDENTIFIER_BYTES
    ? name
    : `${name.slice(0, MAX_IDENTIFIER_BYTES - 7)}_${shortHash(branch)}`;
};

const checkoutDatabase = () => {
  const gitDir = git("rev-parse", "--absolute-git-dir");
  const commonDir = git(
    "rev-parse",
    "--path-format=absolute",
    "--git-common-dir"
  );
  if (gitDir === commonDir) {
    return prefix;
  }
  const branch = git("branch", "--show-current");
  // Detached (rebase, bisect, --detach): never fall back to the main database.
  return branch
    ? branchDatabase(branch)
    : `${prefix}_detached_${shortHash(git("rev-parse", "--show-toplevel"))}`;
};

const serverUrl = (database: string) =>
  `postgresql://postgres:postgres@${host}/${database}`;

// The database $DATABASE_URL names, or undefined when it isn't on the local server.
const localDatabase = () => {
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Run this through `bun run db:*`."
    );
  }
  const url = new URL(DATABASE_URL);
  return url.hostname === host
    ? decodeURIComponent(url.pathname.slice(1))
    : undefined;
};

const startServer = () =>
  execFileSync(
    "docker",
    ["compose", "--file", composeFile, "up", "--detach", "--wait"],
    {
      stdio: "inherit",
    }
  );

const onServer = async (run: (client: Client) => Promise<void>) => {
  const client = new Client({ connectionString: serverUrl("postgres") });
  await client.connect();
  try {
    await run(client);
  } finally {
    await client.end();
  }
};

const DUPLICATE_DATABASE = "42P04";

const ensure = async (requireLocal: boolean) => {
  const database = localDatabase();
  if (!database) {
    if (requireLocal) {
      throw new Error(`Refusing to push to a database that isn't on ${host}.`);
    }
    return;
  }
  startServer();
  await onServer(async (client) => {
    try {
      await client.query(`CREATE DATABASE ${escapeIdentifier(database)}`);
      console.log(`Created database ${database}`);
    } catch (error) {
      // Another checkout's setup may create it at the same moment.
      if ((error as { code?: string }).code !== DUPLICATE_DATABASE) {
        throw error;
      }
    }
  });
};

const reset = async () => {
  const database = localDatabase();
  if (!database) {
    throw new Error(`Refusing to reset a database that isn't on ${host}.`);
  }
  startServer();
  await onServer(async (client) => {
    await client.query(
      `DROP DATABASE IF EXISTS ${escapeIdentifier(database)} WITH (FORCE)`
    );
    await client.query(`CREATE DATABASE ${escapeIdentifier(database)}`);
  });
};

const prune = async () => {
  // Only this checkout's git runs: another worktree's directory may be gone.
  // The first entry is the main checkout, whose database is <prefix> itself.
  const linked = git("worktree", "list", "--porcelain")
    .split("\n\n")
    .slice(1)
    .map((entry) => entry.split("\n"))
    .filter((lines) => !lines.some((line) => line.startsWith("prunable")));
  // A detached worktree has no branch line, so the database it will return to
  // after a rebase or bisect would look orphaned.
  if (linked.some((lines) => lines.includes("detached"))) {
    throw new Error("Refusing to prune while a worktree is detached.");
  }
  const live = new Set(
    linked.flatMap((lines) =>
      lines
        .filter((line) => line.startsWith("branch refs/heads/"))
        .map((line) => branchDatabase(line.slice("branch refs/heads/".length)))
    )
  );
  startServer();
  await onServer(async (client) => {
    const { rows } = await client.query<{ datname: string }>(
      "SELECT datname FROM pg_database"
    );
    const stale = rows
      .map(({ datname }) => datname)
      .filter((name) => name.startsWith(`${prefix}_`) && !live.has(name));
    // One client runs these one at a time.
    await Promise.all(
      stale.map(async (name) => {
        await client.query(
          `DROP DATABASE ${escapeIdentifier(name)} WITH (FORCE)`
        );
        console.log(`Dropped database ${name}`);
      })
    );
  });
};

const [, , command, flag] = process.argv;
if (command === "url") {
  console.log(serverUrl(checkoutDatabase()));
} else if (command === "ensure") {
  await ensure(flag === "--local");
} else if (command === "reset") {
  await reset();
} else if (command === "prune") {
  await prune();
} else {
  throw new Error(
    "Usage: bun scripts/local.ts url|ensure [--local]|reset|prune"
  );
}

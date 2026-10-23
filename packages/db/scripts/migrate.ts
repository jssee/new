// Applies migrations to DATABASE_URL.
//
// For a local URL it first makes sure the dev Postgres server is running and
// the checkout's database exists, so a fresh worktree needs only this command.
// With --reset it drops the local database first. It never creates or drops a
// remote database.
import { $, file, sleep } from "bun";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

// One dev server per machine, shared by every project made from this template;
// each project and worktree gets its own database on it.
const CONTAINER = "dev-postgres";
const IMAGE = "postgres:18-alpine";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const STARTUP_TIMEOUT_MS = 30_000;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Run this through a db:* script.");
}

const target = new URL(databaseUrl);
const reset = process.argv.includes("--reset");
const isLocal = LOCAL_HOSTS.has(target.hostname);

if (reset && !isLocal) {
  throw new Error(
    `Refusing to reset ${target.hostname}: db:reset only drops local databases.`
  );
}

if (isLocal) {
  await prepareLocalDatabase();
}

const migrationsFolder = new URL("../migrations", import.meta.url).pathname;
// drizzle-kit writes the journal with the first migration; until a table
// exists there is nothing to apply.
if (await file(`${migrationsFolder}/meta/_journal.json`).exists()) {
  const db = drizzle(databaseUrl);
  await migrate(db, { migrationsFolder });
  await db.$client.end();
  console.log(`Migrated ${target.pathname.slice(1)} on ${target.host}`);
} else {
  console.log("No migrations yet. Add a table and run bun run db:generate.");
}

async function prepareLocalDatabase() {
  const server = new URL(target);
  server.pathname = "/postgres";
  const admin = await connectStartingServer(server);
  const name = target.pathname.slice(1);
  const quoted = admin.escapeIdentifier(name);

  if (reset) {
    await admin.query(`drop database if exists ${quoted} with (force)`);
  }
  const { rowCount } = await admin.query(
    "select 1 from pg_database where datname = $1",
    [name]
  );
  if (!rowCount) {
    await admin.query(`create database ${quoted}`);
    console.log(`Created database ${name}`);
  }
  await admin.end();
}

async function connectStartingServer(url: URL) {
  let startedServer = false;
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;

  for (;;) {
    const client = new Client({ connectionString: url.href });
    try {
      // biome-ignore lint/performance/noAwaitInLoops: each retry waits for the last.
      await client.connect();
      return client;
    } catch (error) {
      if (!(isServerDown(error) && Date.now() < deadline)) {
        throw error;
      }
      if (!startedServer) {
        startedServer = true;
        await startServer();
      }
      await sleep(500);
    }
  }
}

// A refused connection means no server yet. While a new container initializes,
// Docker accepts the connection and drops it, or Postgres reports 57P03.
function isServerDown(error: unknown) {
  const { code, message } = error as { code?: string; message?: string };
  return (
    code === "ECONNREFUSED" ||
    code === "57P03" ||
    message === "Connection terminated unexpectedly"
  );
}

async function startServer() {
  console.log(`Starting the ${CONTAINER} Docker container`);
  const exists = await $`docker container inspect ${CONTAINER}`
    .quiet()
    .nothrow();
  if (exists.exitCode === 0) {
    await $`docker start ${CONTAINER}`.quiet();
    return;
  }
  await $`docker run --detach --name ${CONTAINER} --restart unless-stopped \
    --publish 5432:5432 --env POSTGRES_PASSWORD=postgres \
    --volume ${CONTAINER}-data:/var/lib/postgresql ${IMAGE}`.quiet();
}

import { initLogger, toLoggerConfig, toMiddlewareOptions } from "evlog";
import { createEvlogHooks } from "evlog/sveltekit";
import config from "../evlog.config.ts";

initLogger(toLoggerConfig(config));

const evlog = createEvlogHooks(toMiddlewareOptions(config));

// `handleError` records only thrown `Error`s, which SvelteKit reports as
// `kind: "unknown"`. `error()` and framework errors (404s) are expected and stay
// out of the log.
export const { handle, handleError } = evlog;

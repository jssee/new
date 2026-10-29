import { COMMON_ERROR_STATUS_MAP, ORPCError } from "@orpc/server";

/**
 * The single definition of an expected error: an `ORPCError` whose code maps
 * to a 4xx status. The caller caused it, so it is logged at `warn` and passed
 * on with its real status. Anything else is unexpected and becomes a 500.
 */
export function expectedError(error: unknown) {
  if (!(error instanceof ORPCError)) {
    return;
  }
  const status: number | undefined =
    COMMON_ERROR_STATUS_MAP[error.code as keyof typeof COMMON_ERROR_STATUS_MAP];
  if (status === undefined || status < 400 || status >= 500) {
    return;
  }
  return { code: error.code, message: error.message, status };
}

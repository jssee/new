// Open-redirect guard for the redirectTo param that requireSession adds, the
// sign-in and sign-up forms send back, and the auth pages honor. Returns the same-origin path, or
// null when the value is missing or points elsewhere.
export function sanitizeRedirect(
  redirectTo: string | undefined,
  origin: string
) {
  if (
    !redirectTo?.startsWith("/") ||
    redirectTo.startsWith("//") ||
    redirectTo.startsWith("/\\")
  ) {
    return null;
  }
  try {
    const target = new URL(redirectTo, origin);
    return target.origin === origin
      ? `${target.pathname}${target.search}${target.hash}`
      : null;
  } catch {
    return null;
  }
}

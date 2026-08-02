import { isValidIanaTimeZone } from './is-valid-iana-time-zone';
import type { RequestPresentationContext } from './request-presentation-context';

/**
 * Validates an IANA time zone identifier without deriving it from locale.
 */
export function isValidTimeZone(timeZone: string): boolean {
  return isValidIanaTimeZone(timeZone);
}

function normalizeExplicitTimeZone(
  timeZone: string | undefined,
): string | null {
  if (!timeZone || timeZone.trim().length === 0) {
    return null;
  }

  const normalized = timeZone.trim();

  return isValidTimeZone(normalized) ? normalized : null;
}

/**
 * Resolves an explicit user time zone from request presentation context.
 *
 * Per ADR-0012, the current server source is a validated cookie value passed
 * through `cookieTimeZone`. Time zone is never derived from locale,
 * Accept-Language, server host, or deployment region. Returns `null` when no
 * valid explicit time zone is available.
 */
export function resolveRequestTimeZone(
  context: RequestPresentationContext,
): string | null {
  return normalizeExplicitTimeZone(context.cookieTimeZone);
}

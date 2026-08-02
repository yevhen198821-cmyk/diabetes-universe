/**
 * Plain request-derived presentation inputs for bootstrap resolution.
 *
 * Does not contain Next.js `Request`, `Headers`, or `Cookies` objects.
 *
 * Time zone source policy (ADR-0012):
 * - account profile → future primary source;
 * - validated cookie → current server source (`cookieTimeZone` when wired);
 * - browser IANA detection → first-client-visit source (CR-03, not bootstrap).
 */
export type RequestPresentationContext = Readonly<{
  /**
   * Optional locale from an existing user cookie value.
   * Not read in production until a cookie scheme is approved for the app.
   */
  readonly cookieLocale?: string;

  /**
   * Validated explicit IANA time zone from the current approved server source.
   *
   * Represents a validated cookie value once a cookie scheme is wired. Bootstrap
   * does not derive, guess, or default time zone when this field is absent.
   */
  readonly cookieTimeZone?: string;

  /**
   * Raw `Accept-Language` header value.
   */
  readonly acceptLanguage?: string;
}>;

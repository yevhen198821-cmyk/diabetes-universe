// Capture host Intl before client tests replace the global for browser mocks.
const validateDateTimeFormat = Intl.DateTimeFormat.bind(Intl);

/**
 * Validates an IANA time zone identifier without deriving it from locale.
 */
export function isValidIanaTimeZone(timeZone: string): boolean {
  const normalized = timeZone.trim();

  if (normalized.length === 0) {
    return false;
  }

  try {
    validateDateTimeFormat(undefined, { timeZone: normalized });
    return true;
  } catch {
    return false;
  }
}

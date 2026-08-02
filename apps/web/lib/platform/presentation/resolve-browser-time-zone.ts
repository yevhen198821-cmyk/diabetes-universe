import { isValidIanaTimeZone } from '../is-valid-iana-time-zone';
import { ensureClientOnly } from './ensure-client-only';

export type BrowserTimeZoneResolution =
  | {
      readonly status: 'resolved';
      readonly timeZone: string;
    }
  | {
      readonly status: 'unavailable';
    };

const MODULE_NAME = 'resolveBrowserTimeZone';

/**
 * Resolves the browser IANA time zone on the client.
 *
 * Never derives time zone from locale and never applies UTC or geographic
 * fallbacks.
 */
export function resolveBrowserTimeZone(): BrowserTimeZoneResolution {
  ensureClientOnly(MODULE_NAME);

  if (
    typeof Intl === 'undefined' ||
    typeof Intl.DateTimeFormat !== 'function'
  ) {
    return { status: 'unavailable' };
  }

  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (
      typeof resolved !== 'string' ||
      resolved.trim().length === 0 ||
      !isValidIanaTimeZone(resolved)
    ) {
      return { status: 'unavailable' };
    }

    return {
      status: 'resolved',
      timeZone: resolved.trim(),
    };
  } catch {
    return { status: 'unavailable' };
  }
}

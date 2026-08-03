/**
 * Canonical demo instant for deterministic tests.
 * Value matches `DEMO_TIMELINE_REFERENCE_DATE` in demo fixtures; test-only export.
 */
export const CANONICAL_DEMO_REFERENCE_TIME_ISO = '2026-08-02T10:00:00.000Z';

export const CANONICAL_DEMO_REFERENCE_TIME = new Date(
  CANONICAL_DEMO_REFERENCE_TIME_ISO,
);

/** Midday anchor on the demo calendar day for local-day sensitive scenarios. */
export const CANONICAL_DEMO_LOCAL_DAY_TIME_ISO = '2026-08-02T12:00:00.000Z';

export const CANONICAL_DEMO_LOCAL_DAY_TIME = new Date(
  CANONICAL_DEMO_LOCAL_DAY_TIME_ISO,
);

export const CANONICAL_DEMO_TIME_ZONE = 'UTC';

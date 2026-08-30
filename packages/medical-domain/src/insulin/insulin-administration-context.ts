import type { InsulinAdministrationContext } from '@diabetes-universe/types';

export const INSULIN_ADMINISTRATION_CONTEXTS = [
  'before_meal',
  'after_meal',
  'correction',
  'basal',
  'other',
  'unspecified',
] as const satisfies readonly InsulinAdministrationContext[];

export const INSULIN_ADMINISTRATION_CONTEXT_SET: ReadonlySet<InsulinAdministrationContext> =
  new Set(INSULIN_ADMINISTRATION_CONTEXTS);

export type InsulinNewWriteAdministrationContextErrorCode =
  'insulin.administration_context.invalid';

export type InsulinNewWriteAdministrationContextResult =
  | {
      readonly ok: true;
      readonly administrationContext: InsulinAdministrationContext;
    }
  | {
      readonly ok: false;
      readonly error: InsulinNewWriteAdministrationContextErrorCode;
    };

export function isInsulinAdministrationContext(
  value: unknown,
): value is InsulinAdministrationContext {
  return (
    typeof value === 'string' &&
    INSULIN_ADMINISTRATION_CONTEXT_SET.has(
      value as InsulinAdministrationContext,
    )
  );
}

/**
 * New-write context rule: omitted or no-choice becomes `unspecified`.
 *
 * Invalid tokens are rejected. This helper does not write legacy `context`.
 */
export function resolveInsulinNewWriteAdministrationContext(
  value: unknown,
): InsulinNewWriteAdministrationContextResult {
  if (value === undefined || value === null || value === '') {
    return { ok: true, administrationContext: 'unspecified' };
  }

  if (!isInsulinAdministrationContext(value)) {
    return { ok: false, error: 'insulin.administration_context.invalid' };
  }

  return { ok: true, administrationContext: value };
}

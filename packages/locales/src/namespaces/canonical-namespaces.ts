/**
 * Canonical Quick Add namespace identifier.
 */
export const QUICK_ADD_NAMESPACE = 'quick-add' as const;

/**
 * Approved resource namespaces for Localization Platform v1.0.
 */
export const CANONICAL_NAMESPACES = [
  'account',
  'common',
  'dashboard',
  'timeline',
  QUICK_ADD_NAMESPACE,
  'validation',
  'errors',
] as const;

export type CanonicalNamespace = (typeof CANONICAL_NAMESPACES)[number];

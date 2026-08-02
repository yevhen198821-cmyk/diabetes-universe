import type { CanonicalNamespace } from '../namespaces';

/**
 * Messages grouped under one canonical namespace.
 *
 * Entry keys are namespace-relative (for example `actions.save` in `common`).
 */
export interface TranslationNamespace {
  readonly namespace: CanonicalNamespace;
  readonly entries: Readonly<Record<string, string>>;
}

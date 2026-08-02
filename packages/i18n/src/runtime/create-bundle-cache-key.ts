import type { LocaleCode, Namespace } from '../types';

export function createBundleCacheKey(
  locale: LocaleCode,
  namespace: Namespace,
): string {
  return `${locale}::${namespace}`;
}

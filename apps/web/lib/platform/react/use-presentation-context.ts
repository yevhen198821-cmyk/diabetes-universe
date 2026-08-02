'use client';

import type { PresentationContext } from '../presentation/presentation-context';

import { useLocalization } from './use-localization';

/**
 * Returns the current presentation context from the active localization runtime.
 */
export function usePresentationContext(): PresentationContext {
  return useLocalization().localeContext;
}

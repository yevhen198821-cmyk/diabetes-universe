import type { Brand } from './brand';

/**
 * Stable translation lookup key (for example `dashboard.nextAction.title`).
 */
export type TranslationKey = Brand<string, 'TranslationKey'>;

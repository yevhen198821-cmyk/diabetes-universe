import type { Brand } from './brand';

/**
 * BCP 47 locale identifier (for example `en-GB`, `ru-RU`).
 */
export type LocaleCode = Brand<string, 'LocaleCode'>;

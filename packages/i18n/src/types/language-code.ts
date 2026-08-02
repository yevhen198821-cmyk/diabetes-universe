import type { Brand } from './brand';

/**
 * Supported language codes for Localization Platform v1.0.
 *
 * The platform may extend this set in future releases without changing the
 * meaning of {@link LanguageCode}.
 */
export type SupportedLanguageCode = 'en' | 'uk' | 'de' | 'ru';

/**
 * Platform language identifier.
 *
 * Current releases operate on {@link SupportedLanguageCode}. The branded
 * string model allows future language codes without a breaking contract change.
 */
export type LanguageCode = Brand<string, 'LanguageCode'>;

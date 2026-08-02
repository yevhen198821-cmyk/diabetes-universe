/**
 * Serializable ICU parameter values accepted by the translation runtime.
 */
export type TranslationParameterValue = string | number | boolean;

/**
 * Named ICU message parameters for one translation request.
 */
export type TranslationParameters = Readonly<
  Record<string, TranslationParameterValue>
>;

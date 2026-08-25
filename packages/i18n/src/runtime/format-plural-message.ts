export type PluralCategory = 'few' | 'many' | 'one' | 'other' | 'two' | 'zero';

export interface PluralMessageTemplates {
  readonly few?: string;
  readonly many?: string;
  readonly one?: string;
  readonly other: string;
  readonly two?: string;
  readonly zero?: string;
}

export function resolvePluralCategory(
  count: number,
  locale: string,
): PluralCategory {
  return new Intl.PluralRules(locale).select(count) as PluralCategory;
}

export function formatPluralMessage(
  count: number,
  templates: PluralMessageTemplates,
  locale: string,
  formatValue: (value: number) => string = String,
  placeholder = '{count}',
): string {
  const category = resolvePluralCategory(count, locale);
  const template =
    templates[category] ??
    (category === 'two' ? templates.few : undefined) ??
    templates.other;
  const resolvedTemplate = template ?? templates.other;

  return resolvedTemplate.replaceAll(placeholder, formatValue(count));
}

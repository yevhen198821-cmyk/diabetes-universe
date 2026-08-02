import type { LocaleCode, Namespace } from '@diabetes-universe/i18n';

export function asLocaleCode(value: string): LocaleCode {
  return value as LocaleCode;
}

export function asNamespace(value: string): Namespace {
  return value as Namespace;
}

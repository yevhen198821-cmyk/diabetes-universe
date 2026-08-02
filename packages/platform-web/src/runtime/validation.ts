import type { FormattingContext } from '@diabetes-universe/formatting';
import type { LocaleContext } from '@diabetes-universe/i18n';
import type {
  WebPlatformConfig,
  WebPlatformPreloadConfig,
} from '../contracts/web-platform-config';

function assertObject(
  value: unknown,
  fieldName: string,
): asserts value is Record<string, unknown> {
  if (value === undefined || value === null || typeof value !== 'object') {
    throw new Error(`Web platform config ${fieldName} is required.`);
  }
}

function assertNonEmptyString(value: unknown, fieldName: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Web platform config ${fieldName} must not be empty.`);
  }
}

function assertStringArray(
  value: unknown,
  fieldName: string,
): asserts value is readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Web platform config ${fieldName} must be an array.`);
  }

  for (const entry of value) {
    if (entry === undefined || entry === null) {
      throw new Error(
        `Web platform config ${fieldName} must not contain null or undefined entries.`,
      );
    }

    assertNonEmptyString(entry, `${fieldName} entry`);
  }
}

function assertFormattingContextConsistency(
  localeContext: LocaleContext,
  formattingContext: FormattingContext,
): void {
  if (formattingContext.locale !== localeContext.locale) {
    throw new Error(
      'Web platform config formattingContext.locale must match localeContext.locale.',
    );
  }

  if (formattingContext.timeZone !== localeContext.timeZone) {
    throw new Error(
      'Web platform config formattingContext.timeZone must match localeContext.timeZone.',
    );
  }

  if (
    formattingContext.hourCycle !== undefined &&
    formattingContext.hourCycle !== localeContext.hourCycle
  ) {
    throw new Error(
      'Web platform config formattingContext.hourCycle must match localeContext.hourCycle when provided.',
    );
  }

  if (
    formattingContext.numberingSystem !== undefined &&
    localeContext.numberingSystem !== undefined &&
    formattingContext.numberingSystem !== localeContext.numberingSystem
  ) {
    throw new Error(
      'Web platform config formattingContext.numberingSystem must match localeContext.numberingSystem when provided.',
    );
  }
}

export function assertValidWebPlatformConfig(
  config: WebPlatformConfig | undefined | null,
): asserts config is WebPlatformConfig {
  assertObject(config, 'config');
  assertObject(config.localeContext, 'localeContext');
  assertObject(config.formattingContext, 'formattingContext');
  assertObject(config.fallbackPolicy, 'fallbackPolicy');
  assertObject(config.preload, 'preload');

  assertStringArray(config.preload.locales, 'preload.locales');
  assertStringArray(config.preload.namespaces, 'preload.namespaces');
  assertFormattingContextConsistency(
    config.localeContext,
    config.formattingContext,
  );
}

export function assertValidWebPlatformPreloadConfig(
  preload: WebPlatformPreloadConfig | undefined | null,
): asserts preload is WebPlatformPreloadConfig {
  assertObject(preload, 'preload');
  assertStringArray(preload.locales, 'preload.locales');
  assertStringArray(preload.namespaces, 'preload.namespaces');
}

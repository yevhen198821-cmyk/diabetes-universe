import type { FallbackPolicy, LocaleContext } from '@diabetes-universe/i18n';
import type { FormattingContext } from '@diabetes-universe/formatting';
import type { LocaleCode, Namespace } from '@diabetes-universe/i18n';

/**
 * Explicit preload scope for Platform Readiness preparation.
 */
export interface WebPlatformPreloadConfig {
  readonly namespaces: readonly Namespace[];
  readonly locales: readonly LocaleCode[];
}

/**
 * Plain Web configuration DTO consumed by Web Composition Root.
 *
 * Must not contain React, Next.js, request, cookie, header, function, or medical
 * data fields.
 */
export interface WebPlatformConfig {
  readonly localeContext: LocaleContext;
  readonly formattingContext: FormattingContext;
  readonly fallbackPolicy: FallbackPolicy;
  readonly preload: WebPlatformPreloadConfig;
}

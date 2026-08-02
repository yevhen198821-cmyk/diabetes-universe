import type { LocaleContext } from '@diabetes-universe/i18n';

/**
 * Canonical immutable presentation context for Web UI integration.
 *
 * Reuses `LocaleContext` from Localization Platform contracts to avoid a
 * parallel presentation model. Presentation and localization share the same
 * language, locale, and time zone dimensions per ADR-0009.
 */
export type PresentationContext = LocaleContext;

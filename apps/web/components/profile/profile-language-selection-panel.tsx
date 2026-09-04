'use client';

import { useMemo } from 'react';

import { CANONICAL_SUPPORTED_LOCALE_METADATA } from '@diabetes-universe/i18n-locales';
import type { CanonicalSupportedLocale } from '@diabetes-universe/i18n-locales';

import { persistWebLocalePreferenceAction } from '../../lib/platform/persist-web-locale-preference-action';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveProfileLanguagePageLabels } from './profile-language-page-labels';
import {
  profileCardClassName,
  profileInsetSurfaceClassName,
  profileThemeControlActiveClassName,
  profileThemeControlInactiveClassName,
} from './profile-surface-styles';

export function ProfileLanguageSelectionPanel() {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveProfileLanguagePageLabels(localization),
    [localization],
  );
  const currentLocale = localization.localeContext
    .locale as CanonicalSupportedLocale;

  return (
    <section className={`${profileCardClassName} space-y-4 p-4 sm:p-5`}>
      <div className="space-y-1">
        <h2 className="text-text-primary text-lg font-bold">{labels.title}</h2>
        <p className="text-text-secondary text-sm">{labels.description}</p>
      </div>

      <div
        aria-label={labels.title}
        className={`${profileInsetSurfaceClassName} divide-border-subtle divide-y overflow-hidden dark:divide-white/8`}
        role="listbox"
      >
        {CANONICAL_SUPPORTED_LOCALE_METADATA.map((option) => {
          const selected = option.locale === currentLocale;
          const optionLabel = selected
            ? `${option.nativeName}, ${labels.selected}`
            : option.nativeName;

          return (
            <form action={persistWebLocalePreferenceAction} key={option.locale}>
              <input name="locale" type="hidden" value={option.locale} />
              <button
                aria-label={optionLabel}
                aria-selected={selected}
                className={`focus-visible:outline-interactive-primary flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${
                  selected
                    ? profileThemeControlActiveClassName
                    : profileThemeControlInactiveClassName
                }`}
                data-locale={option.locale}
                role="option"
                type="submit"
              >
                <span className="text-sm font-semibold">
                  {option.nativeName}
                </span>
                {selected ? (
                  <span className="text-xs font-semibold">
                    {labels.selected}
                  </span>
                ) : null}
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}

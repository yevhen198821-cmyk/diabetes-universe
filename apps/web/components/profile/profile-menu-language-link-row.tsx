'use client';

import { Globe2 } from 'lucide-react';
import Link from 'next/link';

import { getCanonicalSupportedLocaleMetadata } from '@diabetes-universe/i18n-locales';
import type { CanonicalSupportedLocale } from '@diabetes-universe/i18n-locales';

import type { ProfileLabels } from './profile-labels';
import {
  profileInteractiveLinkClassName,
  PROFILE_ICON_TONE_CLASS,
} from './profile-surface-styles';

export function ProfileMenuLanguageLinkRow({
  currentLocale,
  labels,
}: {
  readonly currentLocale: CanonicalSupportedLocale;
  readonly labels: ProfileLabels;
}) {
  const currentNativeName =
    getCanonicalSupportedLocaleMetadata(currentLocale).nativeName;

  return (
    <Link
      aria-label={`${labels.menu.language.title}: ${currentNativeName}`}
      className={profileInteractiveLinkClassName}
      href="/account/language"
    >
      <span className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${PROFILE_ICON_TONE_CLASS.teal}`}
        >
          <Globe2 aria-hidden="true" size={18} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-text-primary block text-sm font-semibold">
            {labels.menu.language.title}
          </span>
          <span className="text-text-secondary mt-0.5 block text-xs">
            {currentNativeName}
          </span>
        </span>
      </span>
      <span aria-hidden="true" className="text-text-secondary">
        →
      </span>
    </Link>
  );
}

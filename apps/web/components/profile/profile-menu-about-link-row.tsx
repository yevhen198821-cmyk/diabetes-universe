'use client';

import { Info } from 'lucide-react';
import Link from 'next/link';

import type { ProfileLabels } from './profile-labels';
import {
  profileInteractiveLinkClassName,
  PROFILE_ICON_TONE_CLASS,
} from './profile-surface-styles';

function ProfileMenuAboutLinkRow({
  labels,
}: {
  readonly labels: ProfileLabels;
}) {
  return (
    <Link className={profileInteractiveLinkClassName} href="/account/about">
      <span className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${PROFILE_ICON_TONE_CLASS.neutral}`}
        >
          <Info aria-hidden="true" size={18} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-text-primary block text-sm font-semibold">
            {labels.about.title}
          </span>
          <span className="text-text-secondary mt-0.5 block text-xs">
            {labels.about.subtitle}
          </span>
        </span>
      </span>
      <span aria-hidden="true" className="text-text-secondary">
        →
      </span>
    </Link>
  );
}

export { ProfileMenuAboutLinkRow };

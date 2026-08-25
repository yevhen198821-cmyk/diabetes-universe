'use client';

import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { profileCardClassName } from './profile-page-background';
import { resolveProfileLabels } from './profile-labels';

export function ProfileSettingsPanel() {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveProfileLabels(localization),
    [localization],
  );

  return (
    <section className={`${profileCardClassName} space-y-2 p-6`}>
      <h2 className="text-text-primary text-lg font-bold">
        {labels.settings.title}
      </h2>
      <p className="text-text-secondary text-sm">
        {labels.settings.description}
      </p>
    </section>
  );
}

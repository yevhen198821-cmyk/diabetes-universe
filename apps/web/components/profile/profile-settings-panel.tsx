'use client';

import { Palette } from 'lucide-react';
import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveProfileLabels } from './profile-labels';
import {
  profileCardClassName,
  profileInsetSurfaceClassName,
  profileSettingsThemeIconClassName,
} from './profile-surface-styles';
import { ProfileThemeControl } from './profile-theme-control';

export function ProfileSettingsPanel() {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveProfileLabels(localization),
    [localization],
  );

  return (
    <section className={`${profileCardClassName} space-y-5 p-6`}>
      <div className="space-y-2">
        <h2 className="text-text-primary text-lg font-bold">
          {labels.settings.title}
        </h2>
        <p className="text-text-secondary text-sm">
          {labels.settings.description}
        </p>
      </div>

      <div className={`${profileInsetSurfaceClassName} px-4 py-3`}>
        <div className="flex items-start gap-3">
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${profileSettingsThemeIconClassName}`}
          >
            <Palette aria-hidden="true" size={18} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-text-primary text-sm font-semibold">
              {labels.settings.theme.title}
            </p>
            <p className="text-text-secondary mt-0.5 text-xs">
              {labels.settings.theme.subtitle}
            </p>
            <ProfileThemeControl labels={labels.settings.theme} />
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useMemo } from 'react';

import { useLocalization } from '../../lib/platform/react/use-localization';
import { resolveSessionManagerLabels } from '../auth/session-manager-labels';

export function ProfileSessionsHeader() {
  const localization = useLocalization();
  const labels = useMemo(
    () => resolveSessionManagerLabels(localization),
    [localization],
  );

  return (
    <header className="space-y-2">
      <h2 className="text-text-primary text-lg font-bold">{labels.title}</h2>
      <p className="text-text-secondary text-sm">{labels.description}</p>
    </header>
  );
}

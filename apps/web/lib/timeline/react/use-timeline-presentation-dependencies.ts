'use client';

import { useMemo } from 'react';

import { useFormatter } from '../../platform/react/use-formatter';
import { useLocalization } from '../../platform/react/use-localization';
import {
  createTimelinePresentationDependencies,
  type TimelinePresentationDependencies,
} from '../presentation';

export function useTimelinePresentationDependencies(): TimelinePresentationDependencies {
  const formatter = useFormatter();
  const localization = useLocalization();
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  return useMemo(
    () =>
      createTimelinePresentationDependencies({
        formatter,
        localization,
        timeZone,
      }),
    [formatter, localization, timeZone],
  );
}

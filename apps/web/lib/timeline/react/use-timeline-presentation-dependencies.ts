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
  return useMemo(
    () =>
      createTimelinePresentationDependencies({
        formatter,
        localization,
      }),
    [formatter, localization],
  );
}

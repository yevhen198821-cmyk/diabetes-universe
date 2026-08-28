'use client';

import { useMemo } from 'react';

import { useGlucosePresentationDependencies } from '../../medical/glucose/use-glucose-presentation-dependencies';
import {
  createTimelinePresentationDependencies,
  type TimelinePresentationDependencies,
} from '../presentation';

export function useTimelinePresentationDependencies(
  referenceTime?: Date,
): TimelinePresentationDependencies {
  const glucosePresentation = useGlucosePresentationDependencies();

  return useMemo(
    () =>
      createTimelinePresentationDependencies({
        formatter: glucosePresentation.formatter,
        glucoseDisplayUnit: glucosePresentation.glucoseDisplayUnit,
        localization: glucosePresentation.localization,
        referenceTime: referenceTime ?? new Date(),
        targetRange: glucosePresentation.targetRange,
      }),
    [glucosePresentation, referenceTime],
  );
}

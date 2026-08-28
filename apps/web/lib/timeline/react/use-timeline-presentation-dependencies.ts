'use client';

import { useMemo } from 'react';

import {
  useGlucosePresentationDependencies,
  type GlucosePresentationDependencies,
} from '../../medical/glucose/use-glucose-presentation-dependencies';
import {
  createTimelinePresentationDependencies,
  type TimelinePresentationDependencies,
} from '../presentation';

export function composeTimelinePresentationDependencies(
  glucosePresentation: GlucosePresentationDependencies,
  referenceTime: Date | string = new Date(),
): TimelinePresentationDependencies {
  return createTimelinePresentationDependencies({
    formatter: glucosePresentation.formatter,
    glucoseDisplayUnit: glucosePresentation.glucoseDisplayUnit,
    localization: glucosePresentation.localization,
    referenceTime,
    targetRange: glucosePresentation.targetRange,
  });
}

export function useTimelinePresentationDependencies(
  referenceTime?: Date,
): TimelinePresentationDependencies {
  const glucosePresentation = useGlucosePresentationDependencies();

  return useMemo(
    () =>
      composeTimelinePresentationDependencies(
        glucosePresentation,
        referenceTime ?? new Date(),
      ),
    [glucosePresentation, referenceTime],
  );
}

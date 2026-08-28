'use client';

import type { GlucoseTargetRange } from '@diabetes-universe/medical-domain';
import { useEffect, useMemo, useState } from 'react';

import { fetchGlucoseTargetProfile } from '../client/diabetes-settings-client';
import { useDiabetesSettings } from '../react';
import { useFormatter } from '../../platform/react/use-formatter';
import { useLocalization } from '../../platform/react/use-localization';

export interface GlucosePresentationDependencies {
  readonly formatter: ReturnType<typeof useFormatter>;
  readonly glucoseDisplayUnit: ReturnType<
    typeof useDiabetesSettings
  >['glucoseDisplayUnit'];
  readonly localization: ReturnType<typeof useLocalization>;
  readonly targetRange: GlucoseTargetRange | null;
}

export function useGlucosePresentationDependencies(): GlucosePresentationDependencies {
  const formatter = useFormatter();
  const localization = useLocalization();
  const { glucoseDisplayUnit, settings } = useDiabetesSettings();
  const [targetRange, setTargetRange] = useState<GlucoseTargetRange | null>(
    null,
  );

  useEffect(() => {
    if (!settings) {
      return;
    }

    let cancelled = false;

    void fetchGlucoseTargetProfile()
      .then((profile) => {
        if (!cancelled) {
          setTargetRange(profile.defaultRange);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTargetRange(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [settings]);

  const resolvedTargetRange = settings ? targetRange : null;

  return useMemo(
    () => ({
      formatter,
      glucoseDisplayUnit,
      localization,
      targetRange: resolvedTargetRange,
    }),
    [formatter, glucoseDisplayUnit, localization, resolvedTargetRange],
  );
}

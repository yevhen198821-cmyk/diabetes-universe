import type { PlatformFormatter } from '@diabetes-universe/formatting';
import {
  buildGlucosePresentation,
  type BuildGlucosePresentationInput,
  type GlucosePresentationModel,
} from '@diabetes-universe/medical-domain';

import { formatGlucoseValueForLocalizedDisplay } from '../client/diabetes-settings-display';

export interface LocalizedGlucosePresentation {
  readonly formattedMeasurement: string;
  readonly formattedValue: string;
  readonly model: GlucosePresentationModel;
}

export function adaptGlucosePresentationForDisplay(
  formatter: PlatformFormatter,
  input: BuildGlucosePresentationInput,
): LocalizedGlucosePresentation {
  const model = buildGlucosePresentation(input);
  const formattedValue = formatGlucoseValueForLocalizedDisplay(
    formatter,
    model.canonicalMmolPerL,
    model.displayUnit,
  );

  return {
    formattedMeasurement: `${formattedValue} ${model.displayUnitSymbol}`,
    formattedValue,
    model,
  };
}

/**
 * Wave 3A-I compatibility surface for Timeline glucose presentation migration.
 *
 * Consumer migration to these shared primitives is deferred to PR 3A-II.
 */
export {
  buildGlucosePresentation,
  resolveGlucoseFreshnessState,
  resolveGlucoseRangeState,
  toGlucoseDisplayNumericValue,
  type BuildGlucosePresentationInput,
  type GlucoseFreshnessPolicy,
  type GlucoseFreshnessState,
  type GlucosePresentationModel,
  type GlucoseRangeState,
  type GlucoseReadingInput,
} from '@diabetes-universe/medical-domain';

import type { GlucoseTargetRange } from '../types/glucose-target-range';
import type { GlucoseRangeState } from './glucose-semantics';

function isValidTargetRange(
  target: GlucoseTargetRange,
): target is GlucoseTargetRange {
  return (
    Number.isFinite(target.lowMmolPerL) &&
    Number.isFinite(target.highMmolPerL) &&
    target.lowMmolPerL <= target.highMmolPerL
  );
}

/**
 * Resolves glucose concentration relative to a user-provided target band.
 *
 * Never invents default clinical targets. Missing or invalid targets resolve to
 * `unknown`. Boundary values are inclusive.
 */
export function resolveGlucoseRangeState(
  concentrationMmolPerL: number,
  target: GlucoseTargetRange | null | undefined,
): GlucoseRangeState {
  if (!Number.isFinite(concentrationMmolPerL)) {
    return 'unknown';
  }

  if (!target || !isValidTargetRange(target)) {
    return 'unknown';
  }

  if (concentrationMmolPerL < target.lowMmolPerL) {
    return 'below_range';
  }

  if (concentrationMmolPerL > target.highMmolPerL) {
    return 'above_range';
  }

  return 'in_range';
}

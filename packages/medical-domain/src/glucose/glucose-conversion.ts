/**
 * Standard biochemical conversion factor for glucose concentration.
 *
 * Domain-owned per Wave 2A / ADR-0010. Formatting owns display rounding only.
 */
export const GLUCOSE_MMOL_PER_L_TO_MG_PER_DL = 18.0182 as const;

export function convertGlucoseMmolPerLToMgPerDl(mmolPerL: number): number {
  return mmolPerL * GLUCOSE_MMOL_PER_L_TO_MG_PER_DL;
}

export function convertGlucoseMgPerDlToMmolPerL(mgPerDl: number): number {
  return mgPerDl / GLUCOSE_MMOL_PER_L_TO_MG_PER_DL;
}

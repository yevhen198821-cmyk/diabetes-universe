export interface ParsedLegacyNumeric {
  readonly value: number;
}

/**
 * Parses a leading numeric token from legacy presentation values.
 * Supports comma and dot decimal separators.
 */
export function parseLegacyLeadingNumber(
  value: string,
): ParsedLegacyNumeric | null {
  const match = value.trim().match(/^([\d.,]+)/);

  if (!match) {
    return null;
  }

  const normalized = match[1].replace(',', '.');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return { value: parsed };
}

export function buildEventCardFallbackAriaLabel(input: {
  readonly context?: string;
  readonly metadataLines?: readonly string[];
  readonly statusLabel?: string;
  readonly statusLines?: readonly string[];
  readonly time: string;
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}): string {
  return [
    input.time,
    input.title,
    input.value,
    input.unit,
    input.context,
    ...(input.statusLines ?? []),
    ...(input.metadataLines ?? []),
    input.statusLabel,
  ]
    .filter(Boolean)
    .join(', ');
}

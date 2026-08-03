import type { DashboardAiInsightData } from '../../components/dashboard/dashboard-ai-insight-model';

export interface DashboardAiInsightSource {
  readonly generatedAt: string;
  readonly id: string;
  readonly relatedEventIds: readonly string[];
  readonly summary: string;
  readonly title: string;
}

function normalizeRelatedEventIds(
  relatedEventIds: readonly string[],
): readonly string[] {
  return relatedEventIds
    .map((eventId) => eventId.trim())
    .filter((eventId) => eventId.length > 0);
}

function composeRelatedEventsLabel(
  count: number,
  options: {
    readonly formatRelatedEventsCount: (count: number) => string;
    readonly relatedEventsLabel: string;
    readonly relatedEventsNone: string;
  },
): string {
  if (count === 0) {
    return options.relatedEventsNone;
  }

  return `${options.relatedEventsLabel}: ${options.formatRelatedEventsCount(count)}`;
}

/**
 * Dashboard AI Insight presentation path.
 * Formats display time and related-events label at the container boundary.
 */
export function prepareDashboardAiInsightPresentation(
  source: DashboardAiInsightSource,
  options: {
    readonly formatDisplayTime: (generatedAt: string) => string;
    readonly formatRelatedEventsCount: (count: number) => string;
    readonly relatedEventsLabel: string;
    readonly relatedEventsNone: string;
  },
): DashboardAiInsightData {
  const relatedEventIds = normalizeRelatedEventIds(source.relatedEventIds);
  const relatedEventsCount = relatedEventIds.length;

  return {
    displayTime: options.formatDisplayTime(source.generatedAt),
    generatedAt: source.generatedAt,
    id: source.id,
    relatedEventIds,
    relatedEventsLabel: composeRelatedEventsLabel(relatedEventsCount, options),
    summary: source.summary,
    title: source.title,
  };
}

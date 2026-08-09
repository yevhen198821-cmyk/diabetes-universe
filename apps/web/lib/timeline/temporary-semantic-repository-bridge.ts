import type {
  GlucoseMeasurementContext,
  SemanticTimelineEvent,
  TimelineEvent,
} from '@diabetes-universe/types';

import {
  getSemanticEventCardContext,
  getSemanticEventCardTitle,
  getSemanticEventCardUnit,
  getSemanticEventCardValue,
  getSemanticEventOccurredAt,
} from './semantic-event-fields';

const legacyGlucoseContextBySemantic: Readonly<
  Record<GlucoseMeasurementContext, string>
> = {
  after_meal: 'После еды',
  bedtime: 'Перед сном',
  before_meal: 'Перед едой',
  fasting: 'Натощак',
  other: 'Другое',
};

function projectLegacyContext(
  event: SemanticTimelineEvent,
): string | undefined {
  if (event.kind === 'glucose' && event.context) {
    return legacyGlucoseContextBySemantic[event.context];
  }

  return getSemanticEventCardContext(event);
}

/**
 * Temporary P3c repository compatibility bridge.
 *
 * Reconstructs a legacy `TimelineEvent` shape for P2 repository mutations
 * until P3e introduces the semantic write path. Output is not canonical and
 * must not be exposed through `useTimelineStore().events`.
 */
export function projectSemanticToLegacyRepositoryEvent(
  event: SemanticTimelineEvent,
): TimelineEvent {
  const unit = getSemanticEventCardUnit(event);
  const value = getSemanticEventCardValue(event);
  const legacyValue =
    event.kind === 'glucose'
      ? `${value.replace('.', ',')} ммоль/л`
      : event.kind === 'insulin'
        ? `${value} ЕД`
        : event.kind === 'nutrition'
          ? `${value} г углеводов`
          : event.kind === 'activity'
            ? value
            : event.kind === 'note'
              ? event.body
              : value;

  return {
    context: projectLegacyContext(event),
    createdAt: event.createdAt,
    dateTime: getSemanticEventOccurredAt(event),
    id: event.id,
    kind: event.kind,
    note:
      event.kind === 'nutrition'
        ? event.note
        : event.kind === 'medication'
          ? event.note
          : event.kind === 'activity'
            ? event.note
            : undefined,
    source: event.source,
    title: getSemanticEventCardTitle(event),
    unit: unit || undefined,
    updatedAt: event.updatedAt,
    value: legacyValue,
  };
}

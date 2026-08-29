import type { TimelineEventCardPresentation } from './timeline-presentation-types';

export function buildTimelineEventCardAriaLabel(
  presentation: Pick<
    TimelineEventCardPresentation,
    'context' | 'statusLines' | 'time' | 'title' | 'unit' | 'value'
  >,
  openEventAriaPrefix: string,
): string {
  const parts = [
    presentation.time,
    presentation.title,
    [presentation.value, presentation.unit].filter(Boolean).join(' '),
    presentation.context,
    ...(presentation.statusLines ?? []),
  ].filter((part) => Boolean(part && part.length > 0));

  return `${openEventAriaPrefix}: ${parts.join(', ')}`;
}

export function buildTimelineEventMapMarkerAriaLabel(
  presentation: Pick<
    TimelineEventCardPresentation,
    'context' | 'statusLines' | 'time' | 'title' | 'unit' | 'value'
  >,
): string {
  return [
    presentation.time,
    presentation.title,
    [presentation.value, presentation.unit].filter(Boolean).join(' '),
    ...(presentation.statusLines ?? []),
    presentation.context,
  ]
    .filter((part) => Boolean(part && part.length > 0))
    .join(', ');
}

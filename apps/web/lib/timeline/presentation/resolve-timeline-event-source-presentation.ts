import type { TimelineEventSource } from '@diabetes-universe/types';

export interface TimelineEventSourceLabels {
  readonly demo: string;
  readonly device: string;
  readonly import: string;
  readonly manual: string;
}

export interface TimelineEventSourcePresentation {
  readonly isDemo: boolean;
  readonly label: string;
}

export function resolveTimelineEventSourcePresentation(
  source: TimelineEventSource | undefined,
  labels: TimelineEventSourceLabels,
): TimelineEventSourcePresentation | null {
  if (!source) {
    return null;
  }

  switch (source) {
    case 'manual':
      return { isDemo: false, label: labels.manual };
    case 'device':
      return { isDemo: false, label: labels.device };
    case 'import':
      return { isDemo: false, label: labels.import };
    case 'demo':
      return { isDemo: true, label: labels.demo };
    default:
      return null;
  }
}

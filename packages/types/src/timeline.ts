export type TimelineEventKind =
  'glucose' | 'activity' | 'meal' | 'insulin' | 'note';

export interface TimelineEvent {
  readonly id: string;
  readonly time: string;
  readonly kind: TimelineEventKind;
  readonly title: string;
  readonly value: string;
  readonly details: string;
  readonly expandedDetails: readonly string[];
  readonly linked: boolean;
}

export interface DaySummary {
  readonly glucose: string;
  readonly events: number;
  readonly carbohydrates: string;
  readonly insulin: string;
  readonly activity: string;
}

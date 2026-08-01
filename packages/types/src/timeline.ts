export type TimelineEventKind =
  'glucose' | 'meal' | 'nutrition' | 'insulin' | 'medication' | 'activity';

export interface TimelineEvent {
  readonly id: string;
  readonly time: string;
  readonly kind: TimelineEventKind;
  readonly title: string;
  readonly value: string;
  readonly unit?: string;
  readonly context: string;
  readonly note?: string;
}

export interface DaySummary {
  readonly timeInRange: string;
}

export interface LastGlucose {
  readonly value: string;
  readonly time: string;
}

export interface NextStep {
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
}

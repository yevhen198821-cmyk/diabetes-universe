export type TimelineEventKind =
  'glucose' | 'insulin' | 'nutrition' | 'medication' | 'activity' | 'note';

export type TimelineEventSource = 'manual' | 'demo' | 'device' | 'import';

export interface TimelineEvent {
  readonly id: string;
  readonly kind: TimelineEventKind;
  readonly dateTime: string;
  readonly title: string;
  readonly value: string;
  readonly unit?: string;
  readonly context?: string;
  readonly note?: string;
  readonly source?: TimelineEventSource;
  readonly createdAt?: string;
  readonly updatedAt?: string;
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

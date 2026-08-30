import type { GlucoseQuickAddEntry } from '@diabetes-universe/types';

export interface GlucoseQuickAddSubmitRequest {
  readonly entry: GlucoseQuickAddEntry;
  readonly eventId: string;
}

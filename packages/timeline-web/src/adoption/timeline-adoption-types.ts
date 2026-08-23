import type { SemanticTimelineEvent } from '@diabetes-universe/types';

export interface AdoptionItemInput {
  readonly sourceNamespace: string;
  readonly localEventId: string;
  readonly sourceSchemaVersion: number;
  readonly event: SemanticTimelineEvent;
}

export type AdoptionItemResult =
  | {
      readonly localEventId: string;
      readonly status: 'adopted';
      readonly resourceId: string;
      readonly revision: string;
      readonly createdAt: string;
    }
  | {
      readonly localEventId: string;
      readonly status: 'already_adopted';
      readonly resourceId: string;
      readonly revision: string;
    }
  | {
      readonly localEventId: string;
      readonly status: 'failed';
      readonly code: string;
      readonly message: string;
    };

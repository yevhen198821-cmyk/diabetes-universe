import type { PresentationContext } from './presentation-context';
import type { PresentationSnapshot } from './presentation-snapshot';

export type ClientPresentationBootstrapResult =
  | {
      readonly status: 'ready';
      readonly context: PresentationContext;
      readonly snapshot: PresentationSnapshot;
    }
  | {
      readonly status: 'time-zone-unavailable';
    };

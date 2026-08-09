import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { cloneSemanticTimelineEvents } from '../semantic-timeline-clone';

export interface NativeSemanticEventSidecar {
  readonly events: ReadonlyMap<string, SemanticTimelineEvent>;
}

export function createNativeSemanticEventSidecar(
  events: ReadonlyMap<string, SemanticTimelineEvent> = new Map(),
): NativeSemanticEventSidecar {
  return {
    events: new Map(events),
  };
}

export function registerNativeSemanticEvent(
  sidecar: NativeSemanticEventSidecar,
  event: SemanticTimelineEvent,
): NativeSemanticEventSidecar {
  const events = new Map(sidecar.events);
  events.set(event.id, event);

  return { events };
}

export function unregisterNativeSemanticEvent(
  sidecar: NativeSemanticEventSidecar,
  eventId: string,
): NativeSemanticEventSidecar {
  const events = new Map(sidecar.events);
  events.delete(eventId);

  return { events };
}

export function cloneNativeSemanticEventSidecar(
  sidecar: NativeSemanticEventSidecar,
): NativeSemanticEventSidecar {
  return {
    events: new Map(
      cloneSemanticTimelineEvents([...sidecar.events.values()]).map(
        (event) => [event.id, event] as const,
      ),
    ),
  };
}

export function isNativeSemanticEventId(
  sidecar: NativeSemanticEventSidecar,
  eventId: string,
): boolean {
  return sidecar.events.has(eventId);
}

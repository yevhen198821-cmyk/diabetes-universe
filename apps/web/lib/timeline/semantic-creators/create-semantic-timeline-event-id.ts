export function createSemanticTimelineEventId(
  kind: string,
  time: string,
  clientUuid: string = crypto.randomUUID(),
): string {
  return `${kind}-${time.replace(':', '')}-${clientUuid}`;
}

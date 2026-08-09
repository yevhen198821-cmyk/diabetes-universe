export function createSemanticTimelineEventId(
  kind: string,
  time: string,
): string {
  return `${kind}-${time.replace(':', '')}-${crypto.randomUUID()}`;
}

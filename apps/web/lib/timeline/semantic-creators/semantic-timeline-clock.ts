export interface SemanticTimelineClock {
  readonly now: () => Date;
}

export const systemSemanticTimelineClock: SemanticTimelineClock = {
  now: () => new Date(),
};

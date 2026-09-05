/**
 * Canonical Nutrition domain generation.
 *
 * `2` is the target contract for new canonical records. Persisted Timeline
 * events, IndexedDB, and the medical API remain on schemaVersion 1 in this
 * wave. Do not write v2 through those boundaries until later waves.
 */
export const NUTRITION_SCHEMA_VERSION = 2;

/**
 * Persisted / legacy Nutrition generation currently stored on
 * `SemanticTimelineEvent`.
 */
export const NUTRITION_LEGACY_SCHEMA_VERSION = 1;

/**
 * Canonical event kind. Parallel kinds (`food`, `meal`, `recipeMeal`,
 * `carbEntry`) are forbidden.
 */
export const NUTRITION_KIND = 'nutrition' as const;

/**
 * Technical maximum carbohydrate mass for one canonical Nutrition event.
 *
 * This is not a therapeutic recommendation, a "safe" meal size, or the
 * future Quick Add presentation guard (500 g belongs to Wave 5B UI policy).
 */
export const NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS = 1000;

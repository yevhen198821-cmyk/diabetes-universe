/**
 * Compile-time exhaustiveness: both directions must be `never`.
 *
 * Nutrition keeps its own copy so this vertical does not import insulin
 * internals. Same pattern as `insulin-registry`.
 */
export type KeysMatchUnion<
  TRecord extends object,
  TUnion extends PropertyKey,
> = [Exclude<TUnion, keyof TRecord> | Exclude<keyof TRecord, TUnion>] extends [
  never,
]
  ? true
  : never;

export function freezeRecord<const T extends Record<string, unknown>>(
  record: T,
): Readonly<T> {
  return Object.freeze(record);
}

export function freezeKeys<T extends Record<string, unknown>>(
  record: T,
): readonly (keyof T & string)[] {
  return Object.freeze(Object.keys(record) as (keyof T & string)[]);
}

export function isRecordInput(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

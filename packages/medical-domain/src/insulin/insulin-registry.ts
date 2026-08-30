/**
 * Compile-time exhaustiveness: both directions must be `never`.
 *
 * Used with an exhaustive `Record<Union, Metadata>` so a new union member
 * without a registry key fails typecheck, and an extra registry key also fails.
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

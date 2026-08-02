/**
 * Nominal brand helper for platform-agnostic identifier types.
 */
export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

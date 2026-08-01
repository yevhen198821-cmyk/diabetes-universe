/**
 * Shared, platform-agnostic type contracts belong in this package.
 *
 * Domain types will be introduced only when their product requirements and
 * ownership boundaries are defined.
 */
export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

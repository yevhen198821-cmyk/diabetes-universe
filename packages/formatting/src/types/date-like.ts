/**
 * ISO 8601 date-time string with an explicit time zone name or numeric offset.
 *
 * Parsing and validation are not implemented in this package.
 */
export type IsoDateTimeString = string & {
  readonly __isoDateTimeString?: unique symbol;
};

/**
 * Presentation input accepted by date and date-time formatters.
 *
 * Accepts native `Date` values or ISO 8601 date-time strings that include an
 * explicit time zone or offset. Parsing is not implemented in this package.
 */
export type DateLike = Date | IsoDateTimeString;

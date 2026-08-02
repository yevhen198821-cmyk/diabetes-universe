# @diabetes-universe/formatting

## Purpose

Platform package for the Diabetes Universe Platform Formatting Library — contracts
and a framework-independent Intl-backed runtime for locale-aware formatting of
presentation values (dates, times, numbers, and display units).

**Formatting does not perform parsing or medical conversion.** Intl APIs are
permitted only inside this package.

Formatting and localization are neighboring but independent presentation
subsystems. This package owns value formatting contracts and runtime; translation
strings live in `@diabetes-universe/i18n`.

## Responsibility

- Define immutable, framework-independent formatting contracts.
- Provide shared types for formatting context, domain value inputs, formatter
  options, and the formatter factory contract.
- Implement `createPlatformFormatter()` and Intl-backed formatters.
- Remain free of React, Next.js, DOM APIs, Node APIs, and third-party libraries
  at the package boundary.

Infrastructure adapter wiring and Composition Root integration remain outside
this package.

## Architecture

- The package belongs to **Platform Contracts + Runtime**.
- Runtime uses only the built-in **Intl API**.
- Runtime does not depend on React, Next.js, Localization Platform, UI, or
  medical logic.
- Formatter instances are cached as an internal optimization.
- Formatted output values are not cached.
- All formatting methods are deterministic relative to their input parameters.

## Implemented

### Contracts (FMT-01A–C)

- `FormattingContext` — locale, time zone, and optional presentation dimensions
- `PlatformFormatter` — public formatter interface
- `PlatformFormatterFactory` — factory contract aligned with
  `createPlatformFormatter()`
- Domain types (`DateLike`, `DurationValue`, `DisplayMeasurement`, ranges, …)
- Options contracts (`DateFormatOptions`, `NumberFormatOptions`, …)

### Runtime (FMT-01D–G)

- `createPlatformFormatter(context)` — public factory function
- `formatDate()` — `Intl.DateTimeFormat`, default `dateStyle: medium`
- `formatTime()` — `Intl.DateTimeFormat`, default `timeStyle: short`, applies
  `hourCycle`
- `formatDateTime()` — `Intl.DateTimeFormat`, defaults `dateStyle: medium`,
  `timeStyle: short`
- `formatNumber()` — `Intl.NumberFormat`
- `formatPercentage()` — `Intl.NumberFormat` with `style: percent`; input
  semantics: **`0.25 → 25%`**
- `formatCurrency()` — `Intl.NumberFormat` with `style: currency`; explicit
  currency argument takes priority over `FormattingContext.currency`; **currency
  formatting is not currency conversion**
- `formatRelativeTime()` — `Intl.RelativeTimeFormat`; does not replace an exact
  date and does not decide where relative time is appropriate in UI
- `formatDuration()` — `Intl.NumberFormat` unit formatting plus
  `Intl.ListFormat`; `Intl.DurationFormat` is unavailable in Node v22.14.0 and
  is not used; no third-party polyfill is required; default style is `short`; an
  empty `{}` formats as `0 seconds`; duration formatting does not compute
  intervals between events, does not normalize components, and is not relative
  time
- `formatRange()` — `NumericRange` via Number Formatter composition; `DateRange`
  via `Intl.DateTimeFormat.formatRange()` when supported by the runtime; range
  boundaries are not sorted or swapped
- `formatMeasurement()` — Number Formatter + canonical unit symbols (`mmol/L`,
  `mg/dL`); **measurement formatting is not medical conversion**; Intl does not
  provide ICU units for these glucose symbols, so `unitDisplay` affects spacing
  only
- Internal cache of `Intl.DateTimeFormat`, `Intl.NumberFormat`,
  `Intl.RelativeTimeFormat`, duration unit/list formatters (formatter instances
  only; formatted user values are not cached)

`DateLike` runtime validation accepts:

- valid `Date` values;
- ISO 8601 date-time strings with explicit `Z` or numeric offset.

Ambiguous strings, date-only strings, and locale-shaped date strings are
rejected. There is no locale-aware parsing API.

All `PlatformFormatter` methods are implemented. FMT-01 runtime scope is complete;
Composition Root wiring and UI integration remain outside this package.

## Not implemented yet

- Date/time parsing beyond `DateLike` contract validation
- Medical unit conversion
- Formatting Infrastructure Adapter
- Composition Root wiring
- React hooks and UI integration
- Lint/CI enforcement of the formatting single entry point

## Public API

All public exports are available only through the package root entry point:

```ts
import {
  createPlatformFormatter,
  type CurrencyFormatOptions,
  type DateFormatOptions,
  type DateLike,
  type DateRange,
  type DateTimeFormatOptions,
  type DisplayMeasurement,
  type DurationFormatOptions,
  type DurationValue,
  type FormatRangeValue,
  type FormattingContext,
  type IsoDateTimeString,
  type MeasurementDisplayPolicy,
  type MeasurementFormatOptions,
  type MeasurementUnit,
  type NumberFormatOptions,
  type NumericRange,
  type PercentageFormatOptions,
  type PlatformFormatter,
  type PlatformFormatterFactory,
  type RangeFormatOptions,
  type RelativeTimeFormatOptions,
  type TimeFormatOptions,
} from '@diabetes-universe/formatting';
```

Deep imports (for example `@diabetes-universe/formatting/runtime/...`) are not
supported.

## Architecture references

- [ADR-0010 — Platform Formatting Library](../../docs/adr/0010-platform-formatting-library.md)
- [ADR-0011 — Platform Infrastructure Layer](../../docs/adr/0011-platform-infrastructure-layer.md)

## Related packages

| Package                      | Role                                          |
| ---------------------------- | --------------------------------------------- |
| `@diabetes-universe/i18n`    | Localization Platform contracts and runtime   |
| `@diabetes-universe/locales` | Canonical messages and locale metadata (Data) |

# Platform Localization Closure

## Status

| Field      | Value                                               |
| ---------- | --------------------------------------------------- |
| Status     | **Implemented**                                     |
| Date       | 2026-09-04                                          |
| Base SHA   | `10c46555eef291040ffca3e75ca92692e55a242e`          |
| Depends on | Localization Platform v1.0, CR-03 presentation gate |

This wave closes Localization Platform as a production Web capability for the
four supported Diabetes Universe locales before Nutrition work begins.

## Locale ownership

| Layer                       | Package / area                    | Owns                                                             |
| --------------------------- | --------------------------------- | ---------------------------------------------------------------- |
| Translation resources       | `@diabetes-universe/locales`      | Canonical keys and per-locale message bundles                    |
| Concrete locale authority   | `@diabetes-universe/i18n-locales` | Supported locales, default, language defaults, fallback, catalog |
| Generic contracts / runtime | `@diabetes-universe/i18n`         | `LocaleContext`, `FallbackPolicy`, `LocalizationPlatform`        |
| Generic formatting          | `@diabetes-universe/formatting`   | `PlatformFormatter`                                              |
| Generic Web adapter         | `@diabetes-universe/platform-web` | Runtime assembly; no app-specific locale arrays                  |
| Web composition + UI        | `apps/web`                        | Cookie, request bootstrap, Profile language UX                   |

`apps/web` consumes the catalog. It does not import individual translation
resources or build a second registry. `platform-web` stays on loader contracts
and does not gain a new dependency on concrete locale tables.

## Supported locale registry

Canonical supported locales:

- `en-GB`
- `uk-UA`
- `de-DE`
- `ru-RU`

Selector metadata, including native names (`English`, `Українська`, `Deutsch`,
`Русский`), lives in `CANONICAL_SUPPORTED_LOCALE_METADATA`. Profile UI reads
that list and does not declare another locale array.

## Default locale

Platform default is `en-GB`.

## Fallback semantics

Translation fallback is:

`requested locale → en-GB`

Examples:

- `de-DE` → `en-GB`
- `uk-UA` → `en-GB`
- `ru-RU` → `en-GB`
- `en-GB` → `en-GB`

A missing German key never resolves through Ukrainian or Russian. CI key-parity
tests fail before runtime when a production key is absent.

## Locale precedence

Official resolution order:

1. Explicit current user selection
2. Persisted first-party locale cookie
3. `Accept-Language`
4. `en-GB`

`resolveRequestLocale()` implements cookie → Accept-Language → default.
`createRequestPlatformRuntime()` now reads the locale cookie before the server
seed/runtime is created. Time zone bootstrap is unchanged and is never derived
from locale.

## Cookie persistence contract

| Field    | Value                                         |
| -------- | --------------------------------------------- |
| Name     | `du-web-locale`                               |
| Path     | `/`                                           |
| SameSite | `Lax`                                         |
| HttpOnly | `true`                                        |
| Secure   | HTTPS, or production when proto is missing    |
| Max-Age  | 31536000 (365 days)                           |
| Value    | exact canonical supported locale              |
| Invalid  | ignored; no bootstrap error                   |
| Contents | locale code only; no medical data or user IDs |
| Logout   | cookie is not cleared                         |
| Sync     | no cloud or profile sync in this wave         |

Writer: `persistWebLocalePreferenceAction`. Parser:
`parseCanonicalSupportedLocale` / `parseWebLocaleCookieValue`.
`localStorage` is not a locale authority. `PresentationPersistence` remains a
deferred contract and is not the Web locale store.

After a language change the server action writes the cookie, revalidates the
root layout, and redirects so server and client runtimes rebuild from the new
presentation context.

## Server / client bootstrap

- `html lang` continues to come from the platform bootstrap language.
- `ApplicationRuntimeGate`, `PresentationContext`, and `PresentationSnapshot`
  are unchanged as architectural boundaries.
- Client runtime must keep language, locale, timeZone, and hourCycle equal to
  the bootstrap presentation context.
- `FormattingContext.locale` and `LocaleContext.locale` stay aligned.

## Formatting ownership

`PlatformFormatter` is the presentation authority. Reachable production
date/number formatting now goes through it, including Timeline display dates
and times, Dashboard recent-event dates, and Quick Add number display helpers.

Deterministic calendar keys and medical conversion/normalization are unchanged.
Insulin stored values `12.125`, `125`, and `500` are not rounded. A comma
decimal is display-only.

## Translation integrity gates

CI tests assert:

- canonical locales are exactly EN/DE/UK/RU;
- `en-GB` is the platform default;
- production key parity for all four locales;
- DE/UK/RU closure bundles are `approved`, not draft;
- every reachable closure key is explicitly authored (not English-spread);
- English-identical values are limited to documented cognates (brand, units,
  product names, shared medical/technical labels). Ordinary sentences are
  not allowlisted, and `translation !== English` is not the production rule;
- no sibling-language fallback;
- `apps/web` locale defaults alias the catalog;
- Profile selector uses catalog metadata;
- Language, Auth, Dashboard, Timeline, and Account routes resolve metadata
  from the catalog;
- migrated surfaces do not add a second i18n library;
- hardcoded English UI strings — including `Metadata` and other user-facing
  TypeScript literals — and ad-hoc `Intl` / `toLocale*` formatting on
  migrated surfaces fail the AST/source guards.

The web unit suite runs those AST guards in the same Turbo `test` graph as
Happy DOM dialog tests. The `@diabetes-universe/web` test script uses
process isolation and `--test-concurrency=2` so files do not share one
growing heap. CI does not raise a global `NODE_OPTIONS` heap.

Allowlisted literals are limited to brand, technical identifiers, paths, and
fixed unit symbols. Cognate message keys such as `Insulin` or `Fiasp` may
legally match English.

## Future authenticated profile sync

Cloud or account-profile locale sync is out of scope. The cookie is the only
Web persistence for this wave. A later authenticated preference may become a
higher source, but that requires a separate contract.

## E2E matrix

`apps/web/e2e/platform-localization-closure.spec.ts` covers `en-GB`, `de-DE`,
`uk-UA`, and `ru-RU`:

select language → Dashboard → Quick Add glucose → Quick Add insulin → Timeline
→ Detail → Edit → reload → Dashboard.

Assertions include selected language, cookie persistence, `html lang`,
desktop-visible critical labels (`Last glucose` / `Letzte Glukose` /
`Останній рівень глюкози` / `Последняя глюкоза`, recent-events region,
Quick Add field labels, Timeline heading), locale-neutral IndexedDB
records, exact insulin doses, and no rewrite of medical events after
language change. Desktop Playwright uses those headings instead of the
`lg:hidden` mobile Home/Start nav labels. Timeline cards use the
localized `Open event` aria prefix.

Auth boundary: logout keeps the locale cookie; auth sign-in chrome and the next
Dashboard session stay on the selected language. Passkey enrollment chrome on
Account Security remains Russian hardcode and is excluded from the hardcoded-
string guard to avoid noisy CI. German, Ukrainian, and Russian Home chrome,
including greetings, Quick Add, and recent-events titles, is authored in the
selected language.

## Explicit non-scope

This wave does not include Nutrition or Activity architecture, new medical
features, new languages, `/de/...` routing, cloud preference sync, locale
database schema, Family locale preferences, native locale support, Profile or
Dashboard redesign, a new i18n library, medical API/schema changes, insulin or
glucose semantic changes, glucose-unit preference redesign, time-zone
architecture redesign, or dependency upgrades.

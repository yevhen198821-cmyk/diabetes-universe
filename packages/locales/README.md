# @diabetes-universe/locales

## Purpose

Canonical translation resource package for the Diabetes Universe Localization
Platform.

## Responsibility

- Own approved canonical messages for `en-GB`, `de-DE`, `uk-UA`, and `ru-RU`.
- Define stable namespaces and resource metadata contracts.
- Remain serializable, immutable, and framework-independent at the package
  boundary.

## Structure

```text
packages/locales/src/
├── contracts/     # TranslationMetadata, TranslationNamespace, TranslationResource
├── metadata/      # Bundle metadata per language
├── namespaces/    # Canonical namespace identifiers
└── resources/
    ├── en/        # Approved canonical English bundle
    ├── uk/        # Approved Ukrainian bundle
    ├── de/        # Approved German bundle
    └── ru/        # Approved Russian bundle
```

## Namespaces

Approved v1.0 namespaces:

- `common`
- `dashboard`
- `timeline`
- `quick-add`
- `validation`
- `errors`

Namespaces are stable kebab-case identifiers and do not depend on language.

## Production status

`en-GB`, `de-DE`, `uk-UA`, and `ru-RU` are marked `status: approved`. Reachable
closure namespaces are explicitly authored. English-identical values are limited
to documented cognates such as brand names, unit symbols, and product names.

English (`en-GB`) remains the canonical source for translation keys.

## Not implemented yet

- ICU runtime formatting
- resource loaders
- React Provider and hooks
- locale detection
- middleware and routing
- JSON import runtime
- Next.js integration
- language switcher
- Validation Platform

These are planned for future sprints.

# @diabetes-universe/locales

## Purpose

Canonical translation resource package for the Diabetes Universe Localization
Platform.

## Responsibility

- Own approved English canonical messages and draft bundles for `uk`, `de`, and
  `ru`.
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
    ├── uk/        # Draft bundle
    ├── de/        # Draft bundle
    └── ru/        # Draft bundle
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

## Draft status

Bundles for `uk`, `de`, and `ru` are marked `status: draft` in metadata. They may
contain incomplete message sets and currently use English placeholder values
until professional translation is added.

English (`en-GB`) is the approved canonical source for translation keys.

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

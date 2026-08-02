# ADR-0009 — Localization Platform

## Status

Approved

## Context

Diabetes Universe строит **Platform Foundation** — набор независимых платформенных
подсистем, обслуживающих presentation и cross-cutting concerns без привязки к
конкретному UI-фреймворку.

Локализация затрагивает все пользовательские поверхности (Web, Mobile, будущие
клиенты) и требует единых контрактов, канонического источника переводов и
предсказуемого runtime-поведения.

## Decision

### Localization Platform как часть Platform Foundation

**Localization Platform** — официальная платформенная подсистема Platform
Foundation. Она предоставляет контракты, runtime API и политики локализации;
конкретные loader-реализации и wiring выполняются через Infrastructure Layer и
Composition Root (см. ADR-0011).

### Localization Is Presentation

Локализация относится к **presentation layer concerns**: перевод пользовательских
строк, namespace-организация сообщений, locale-aware formatting context.
Локализация **не** содержит бизнес-правил, медицинской логики или domain
invariants.

### English Canonical Source

Английский язык (`en`) является **каноническим источником** переводимого
контента. Все новые ключи и сообщения создаются сначала на английском; остальные
локали являются производными.

### ICU Only

Все переводимые строки хранятся и обрабатываются как **ICU MessageFormat source
strings**. Альтернативные форматы шаблонов (mustache, custom placeholders без ICU)
не допускаются на уровне платформы.

> **Примечание к реализации v1.0:** ICU MessageFormat **runtime** (plural, select,
> interpolation) ещё не реализован. Контракт фиксирует формат хранения; runtime
> форматирования — отдельный этап.

### Localizable vs Non-Localizable Data

| Категория           | Примеры                                                                           | Правило                                         |
| ------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Localizable**     | UI labels, buttons, headings, empty states, validation messages для пользователя  | Хранятся в translation bundles; ключи стабильны |
| **Non-Localizable** | Entity IDs, API keys, medical codes, enum canonical values, audit log identifiers | Не переводятся; не попадают в bundles           |

### Stable Canonical Values

Канонические значения (ключи переводов, namespace names, locale codes,
`SupportedLanguageCode`) являются **стабильными контрактами**. Breaking changes
требуют ADR и версионирования.

### LocaleContext

`LocaleContext` — immutable value object, описывающий **состояние форматирования**
(locale, hour cycle и связанные presentation-параметры). Он **не** является
пользовательской настройкой fallback и **не** выводит time zone из language/locale
автоматически.

**Fallback** — отдельная платформенная политика (`FallbackPolicy`), не поле
`LocaleContext`.

### Translation Workflow, QA и Governance

1. **Authoring:** новые ключи добавляются в английский canonical bundle.
2. **Review:** изменения переводов проходят code review наравне с кодом.
3. **QA:** отсутствующие ключи и fallback-цепочки проверяются тестами и
   lint-правилами (по мере внедрения).
4. **Governance:** изменения контрактов локализации — через ADR (Architecture
   Lock).

## Consequences

### Positive

- Единая модель локализации для всех клиентов Platform Foundation.
- Чёткое разделение presentation (локализация) и domain (медицинская логика).
- ICU как единый формат сообщений упрощает tooling и QA.
- Стабильные ключи и namespaces обеспечивают предсказуемую эволюцию.

### Negative

- Требуется discipline при добавлении строк (сначала en, потом остальные локали).
- ICU runtime ещё не реализован — строки хранятся в ICU-формате, но
  интерполяция на этапе v1.0 ограничена.

### Neutral

- Физическое размещение пакетов (`i18n`, `locales`, `i18n-locales`) определяется
  реализацией, не данным ADR.

## Alternatives

### A. Per-app localization without platform contracts

Отклонён: дублирование, несовместимость между Web и Mobile.

### B. Non-ICU message templates

Отклонён: фрагментация tooling; нет стандартного plural/select.

### C. Localization Platform как часть Platform Foundation (принят)

Принят. См. Decision.

## Implementation notes

- **CR-01D (2026-08-02):** `LocalizationPlatform.whenReady()` реализован как
  публичный registry readiness contract. Метод завершается после загрузки
  `LocaleRegistry` во внутренний cache runtime и не гарантирует bundle или
  translation readiness. Composition Root обязан вызывать `whenReady()` перед
  registry-dependent методами и отдельно обеспечивать bundle preload для sync
  `translate()`.

## Date

2026-08-02

## Author

Platform Architecture

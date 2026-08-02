# ADR-0010 — Platform Formatting Library

## Status

Approved — архитектура утверждена; реализация FMT-01 ещё не выполнена

## Context

Diabetes Universe требует единообразного форматирования дат, времени, чисел и
единиц измерения для presentation layer на всех клиентах.

Форматирование и локализация — **соседние**, но **независимые** presentation-
подсистемы. Смешение их ответственности приводит к coupling и усложняет тестирование.

## Decision

### Platform Formatting Library

Вводится **Platform Formatting Library** — платформенная подсистема для
locale-aware форматирования presentation-значений (даты, время, числа, единицы
измерения для отображения).

### Независимый `packages/formatting`

Утверждённое физическое размещение: отдельный пакет **`@diabetes-universe/formatting`**
(`packages/formatting`).

> **Статус реализации:** пакет **ещё не создан**. Данный ADR фиксирует только
> архитектурное решение. Реализация — sprint FMT-01.

### Formatting Single Entry Point

Все вызовы форматирования в Application и UI проходят через **единую точку входа**
Platform Formatting Library. Прямое использование `Intl`, `date-fns` formatters или
аналогов вне библиотеки — запрещено на уровне архитектурных правил (enforcement
через lint/CI — отдельное решение).

### Formatting и Localization как соседние подсистемы

| Подсистема                                   | Ответственность                                          |
| -------------------------------------------- | -------------------------------------------------------- |
| **Localization Platform** (ADR-0009)         | Переводимые строки, bundles, `translate()`, ICU messages |
| **Platform Formatting Library** (данный ADR) | Форматирование дат, времени, чисел, display units        |

Обе подсистемы используют `LocaleContext` как shared presentation state, но **не
зависят** друг от друга на уровне runtime implementation.

### Отсутствие медицинской конвертации

Platform Formatting Library **не выполняет** медицинские конвертации (mmol/L ↔
mg/dL, insulin unit calculations, clinical dose computations). Такие преобразования
относятся к **Domain layer** и выполняются до передачи значения в formatting.

Formatting получает уже вычисленное display-ready значение и форматирует его для
пользователя согласно `LocaleContext`.

## Consequences

### Positive

- Единообразное форматирование на всех клиентах.
- Чёткая граница: localization = strings, formatting = values.
- Domain остаётся свободным от presentation formatting concerns.
- Независимая эволюция Localization и Formatting.

### Negative

- Дополнительный пакет и sprint FMT-01 до появления runtime.
- Требуется discipline: не обходить Single Entry Point.

### Neutral

- Конкретные API formatting library определяются при реализации FMT-01.
- Интеграция с React hooks — отдельное решение поверх formatting contracts.

## Alternatives

### A. Formatting внутри Localization Platform

Отклонён: смешение string translation и value formatting; coupling.

### B. Per-app Intl wrappers без platform package

Отклонён: дублирование; несогласованность между клиентами.

### C. Независимый `packages/formatting` (принят)

Принят. См. Decision.

## Date

2026-08-02

## Author

Platform Architecture

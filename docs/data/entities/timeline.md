# Timeline Entity

## Status

Approved

## Purpose

Define the canonical Timeline event contract shared by Dashboard derivations,
Timeline UI, demo data, and future API integration.

## TimelineEvent contract

```ts
interface TimelineEvent {
  readonly id: string;
  readonly kind: TimelineEventKind;
  readonly dateTime: string;
  readonly title: string;
  readonly value: string;
  readonly unit?: string;
  readonly context?: string;
  readonly note?: string;
  readonly source?: TimelineEventSource;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
```

`dateTime` is the single source of truth for event ordering and day grouping.
Display-only strings such as `displayTime`, `displayDate`, and relative labels
are derived in the presentation/model layer.

## TimelineEventKind

Approved kinds for the current architecture:

- `glucose`
- `insulin`
- `nutrition`
- `medication`
- `activity`
- `note`

`meal` is not a canonical kind. Historical demo data and UI mappings must use
`nutrition` only.

`reminder` and `ai_insight` are not `TimelineEventKind` values in the current
scope. Reminders belong to planning flows; AI insights are generated artifacts,
not user-authored journal entries.

## TimelineEventSource

```ts
type TimelineEventSource = 'manual' | 'demo' | 'device' | 'import';
```

- `manual` — created through Quick Add or future edit flows
- `demo` — seeded mock/demo data
- `device` — reserved for connected devices
- `import` — reserved for imported history

## Temporal model

- `dateTime` must be ISO 8601.
- Sorting uses parsed timestamps, never raw `HH:mm` string comparison.
- Invalid `dateTime` values sort after valid values and format to `--:--`.
- Invalid selected Quick Add time values throw during event creation.
- Browser-local timezone is used on the demo stage unless a caller supplies an
  explicit `timeZone` to formatter utilities.
- Dashboard summaries and Timeline grouping use the user's local calendar day.
  Account-level timezone settings are future scope.

## Field semantics

| Field       | Required | Meaning                                       |
| ----------- | -------- | --------------------------------------------- |
| `id`        | yes      | Stable event identifier                       |
| `kind`      | yes      | Event category                                |
| `dateTime`  | yes      | Canonical event timestamp                     |
| `title`     | yes      | Primary label shown in cards and details      |
| `value`     | yes      | Primary displayed value                       |
| `unit`      | no       | Measurement unit when not embedded in `value` |
| `context`   | no       | Secondary situational label                   |
| `note`      | no       | Optional free-text note on non-note events    |
| `source`    | no       | Origin of the record                          |
| `createdAt` | no       | Reserved for future persistence metadata      |
| `updatedAt` | no       | Reserved for future edit metadata             |

For `kind: 'note'`, the main journal content lives in `title` and `value`. The
optional `note` field is not used as a second body for note events.

## Invariants

- Every persisted or demo Timeline event has a valid `kind` from the approved set.
- `nutrition` is the only canonical nutrition/meal kind.
- UI must not store presentation-only time strings on the domain object.
- Dashboard recent-events preview excludes `glucose` and `note` by product rules,
  but both remain valid Timeline events.
- Type-specific medical payloads must not be flattened into unrelated optional
  fields on the base event.

## Relationships

- Dashboard derives Last Glucose, Day Summary, and Recent Events from collections
  of `TimelineEvent`.
- Timeline renders the full journal from the same event contract.
- Event cards consume mapped presentation props derived from `TimelineEvent`.
- During the demo stage, Dashboard and Timeline share one app-level in-memory
  Timeline store.

## API readiness

The contract is backend-agnostic and maps cleanly to future API responses:

- sort/filter/paginate by `dateTime`
- patch/delete by `id`
- preserve `source`, `createdAt`, and `updatedAt` when the API provides them

No API transport layer is implemented in the current stage.

## Future pagination API

Future Timeline pagination should use an opaque cursor contract:

```http
GET /timeline/events?cursor=<cursor>&limit=20&kind=<kind>&query=<query>
```

```ts
interface TimelinePage {
  readonly items: readonly TimelineEvent[];
  readonly nextCursor?: string;
  readonly hasMore: boolean;
}
```

The server applies search/filter before pagination, sorts descending by
`dateTime`, uses `id` as the stable tie-breaker, and owns cursor generation.
The client must not derive cursors from event fields.

## Editing semantics

Timeline editing operates on the base event fields used by the demo model:

- editable: `dateTime` through date/time inputs, `title`, `value`, `unit`,
  `context`, `note`;
- immutable: `id`, `kind`, `source`, `createdAt`;
- successful edits set `updatedAt`;
- `dateTime` remains ISO 8601 after save.

Current demo values are strings. The edit model therefore owns a safe
parse/format layer for numeric kinds instead of parsing display text in JSX.
Future API payloads can replace this with type-specific structured payloads.

## Migration notes

Stage 2 migration changes:

- removed legacy `time: HH:mm` from `TimelineEvent`
- removed `meal` from `TimelineEventKind`
- migrated demo `meal` records to `nutrition`
- added `activity` and `note` demo events
- introduced `TimelineEventSource`
- moved sorting/formatting to `apps/web/lib/timeline/timeline-date-time.ts`

Stage 3 migration changes:

- introduced a shared in-memory Timeline store;
- moved Dashboard and Timeline off local event arrays;
- added selectors for Dashboard derived data;
- Day Summary now counts only local-today events;
- duplicate `add` by ID replaces the existing event.

Stage 4 migration changes:

- Timeline list grouping moved into `TimelineListModel`;
- one group is created for every local calendar date;
- older events are no longer collapsed into one `Ранее` group;
- invalid `dateTime` values render in a stable fallback group.

Stage 6 migration changes:

- introduced event details without URL changes;
- introduced generic edit drafts with kind-specific validation;
- edit preserves `id`, `kind`, `source`, and `createdAt`;
- edit writes `updatedAt`;
- delete removes events through the shared Timeline store.

Stage 7 migration changes:

- introduced client-side demo pagination with Load More;
- page size is 20 events;
- search/filter happen before pagination;
- grouping happens after pagination;
- documented future cursor API without implementing backend transport.

## Out of scope

- reminder and `ai_insight` as Timeline events
- backend/API implementation
- type-specific nested payloads per event kind

## Quick Add mapping

### Activity

`ActivityQuickAddEntry` creates:

| Field      | Value                          |
| ---------- | ------------------------------ |
| `kind`     | `activity`                     |
| `source`   | `manual`                       |
| `title`    | selected activity type         |
| `value`    | duration as string             |
| `unit`     | `мин`                          |
| `note`     | optional user note             |
| `dateTime` | ISO 8601 from approved utility |

Validation: `activityType` required; `durationMinutes` integer in `1..1440`;
`time` required; `note` max 200 characters.

### Note

`NoteQuickAddEntry` creates:

| Field      | Value                           |
| ---------- | ------------------------------- |
| `kind`     | `note`                          |
| `source`   | `manual`                        |
| `title`    | user title or `Заметка`         |
| `value`    | note text                       |
| `note`     | omitted to avoid duplicate body |
| `dateTime` | ISO 8601 from approved utility  |

Validation: trimmed `text` required; `text` max 500; `title` max 80; `time`
required.

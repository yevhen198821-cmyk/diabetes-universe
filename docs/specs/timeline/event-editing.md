# Timeline Event Editing Spec

## Status

Approved

## Editable fields

- `date`
- `time`
- `title`
- `value`
- `unit`
- `context`
- `note`

Immutable fields:

- `id`
- `kind`
- `source`
- `createdAt`

## Validation

- Glucose: numeric value `> 0` and `<= 40`; unit is preserved.
- Insulin: numeric value `> 0` and `<= 100`; decimal comma and point are
  accepted.
- Nutrition: numeric value `> 0` and `<= 500`; unit remains carbohydrates.
- Medication: numeric value `> 0` and `<= 100000`; unit is required.
- Activity: title and value are required; no medical validation is added.
- Note: text value is required and limited to 500 characters.

## Save flow

1. Validate draft with `updateTimelineEventFromDraft`.
2. Convert local date/time to ISO `dateTime`.
3. Preserve immutable fields.
4. Set `updatedAt`.
5. Call shared store `updateEvent`.
6. Return to details view or close details when active search/filter criteria no
   longer match.

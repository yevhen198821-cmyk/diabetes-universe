import type {
  PreservedLegacyRaw,
  TimelineEvent,
  UnmappableLegacyField,
} from '@diabetes-universe/types';

export function createPreservedLegacyRaw(
  raw: TimelineEvent,
): PreservedLegacyRaw {
  return {
    context: raw.context,
    note: raw.note,
    title: raw.title,
    unit: raw.unit,
    value: raw.value,
  };
}

export function appendUnmappableField(
  fields: UnmappableLegacyField[],
  field: UnmappableLegacyField,
): UnmappableLegacyField[] {
  return [...fields, field];
}

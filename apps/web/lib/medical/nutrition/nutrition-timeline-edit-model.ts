import {
  classifyNutritionTimelineEvent,
  isNutritionMealType,
  validateNutritionItemSnapshot,
  validateNutritionTimelineEventV2,
} from '@diabetes-universe/medical-domain';
import type {
  NutritionItemSnapshot,
  NutritionMealType,
  NutritionTimelineEvent,
  SemanticTimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalDateAndTime } from '../../timeline/timeline-date-time';
import { parseNutritionManualCarbsInput } from './nutrition-manual-carbs-input';
import {
  adoptLegacyNutritionProductsToItemSnapshots,
  mapKnownLegacyNutritionMealType,
} from './nutrition-timeline-adoption';

export type NutritionTimelineEditOrigin = 'canonical_v2' | 'legacy_v1';

export type NutritionTimelineEditMealTypeSelection = NutritionMealType | '';

export interface NutritionTimelineEditItemDraft {
  readonly carbsEdited: boolean;
  readonly carbsPer100Edited: boolean;
  readonly carbsPer100Grams: string;
  readonly carbohydratesGrams: string;
  readonly historicalSnapshot: NutritionItemSnapshot | null;
  readonly itemId: string;
  readonly name: string;
  readonly nameEdited: boolean;
  readonly source: 'added' | 'adopted' | 'historical';
  readonly weightEdited: boolean;
  readonly weightGrams: string;
}

export interface NutritionTimelineEventEditDraft {
  readonly carbsEdited: boolean;
  readonly carbohydratesGrams: string;
  readonly date: string;
  readonly historicalMealType: string;
  readonly items: readonly NutritionTimelineEditItemDraft[];
  readonly itemsEdited: boolean;
  readonly mealType: NutritionTimelineEditMealTypeSelection;
  readonly mealTypeSource: 'canonical' | 'mapped' | 'unknown';
  readonly note: string;
  readonly origin: NutritionTimelineEditOrigin;
  readonly storedCarbohydratesGrams: number;
  readonly time: string;
  readonly variant: 'nutrition';
}

export type NutritionTimelineEditErrorField =
  'carbs' | 'date' | 'itemCarbs' | 'itemName' | 'mealType' | 'time';

export type NutritionTimelineEditErrors = Partial<
  Record<NutritionTimelineEditErrorField, string>
>;

export type NutritionTimelineEditCopy = Readonly<{
  readonly errors: Readonly<{
    readonly carbsPrecision: string;
    readonly carbsRange: string;
    readonly dateRequired: string;
    readonly itemCarbs: string;
    readonly itemNameRequired: string;
    readonly mealTypeRequired: string;
    readonly timeRequired: string;
  }>;
}>;

export interface NutritionTimelineEditResult {
  readonly errors: NutritionTimelineEditErrors;
  readonly event: Extract<SemanticTimelineEvent, { kind: 'nutrition' }> | null;
}

function formatStoredNumberForEdit(value: number): string {
  return value.toString();
}

export function isUnchangedNutritionNumericInput(
  raw: string,
  stored: number,
): boolean {
  return raw.trim().replace(',', '.') === stored.toString();
}

function optionalNumberInput(value: number | undefined): string {
  return value === undefined ? '' : formatStoredNumberForEdit(value);
}

function createItemDraftFromSnapshot(
  snapshot: NutritionItemSnapshot,
  source: NutritionTimelineEditItemDraft['source'],
): NutritionTimelineEditItemDraft {
  return {
    carbsEdited: false,
    carbsPer100Edited: false,
    carbsPer100Grams: optionalNumberInput(snapshot.carbsPer100Grams),
    carbohydratesGrams: formatStoredNumberForEdit(snapshot.carbohydratesGrams),
    historicalSnapshot: source === 'added' ? null : snapshot,
    itemId: snapshot.itemId,
    name: snapshot.name,
    nameEdited: false,
    source,
    weightEdited: false,
    weightGrams: optionalNumberInput(snapshot.weightGrams),
  };
}

export function createNutritionTimelineEventEditDraft(
  event: NutritionTimelineEvent,
  date: string,
  time: string,
): NutritionTimelineEventEditDraft {
  const classification = classifyNutritionTimelineEvent(event);

  if (classification.status === 'canonical_v2') {
    const mealType = classification.value.mealType;

    return {
      carbsEdited: false,
      carbohydratesGrams: formatStoredNumberForEdit(event.carbohydratesGrams),
      date,
      historicalMealType: event.mealType,
      items: (classification.value.items ?? []).map((item) =>
        createItemDraftFromSnapshot(item, 'historical'),
      ),
      itemsEdited: false,
      mealType,
      mealTypeSource: 'canonical',
      note: event.note ?? '',
      origin: 'canonical_v2',
      storedCarbohydratesGrams: event.carbohydratesGrams,
      time,
      variant: 'nutrition',
    };
  }

  const mappedMealType = mapKnownLegacyNutritionMealType(
    String(event.mealType),
  );
  const adoptedItems = adoptLegacyNutritionProductsToItemSnapshots(
    event.schemaVersion === 1 ? event.products : undefined,
  );

  return {
    carbsEdited: false,
    carbohydratesGrams: formatStoredNumberForEdit(event.carbohydratesGrams),
    date,
    historicalMealType: String(event.mealType),
    items: adoptedItems.map((item) =>
      createItemDraftFromSnapshot(item, 'adopted'),
    ),
    itemsEdited: adoptedItems.length > 0,
    mealType: mappedMealType ?? '',
    mealTypeSource: mappedMealType === null ? 'unknown' : 'mapped',
    note: event.note ?? '',
    origin: 'legacy_v1',
    storedCarbohydratesGrams: event.carbohydratesGrams,
    time,
    variant: 'nutrition',
  };
}

function resolveEditedCarbohydrates(
  draft: NutritionTimelineEventEditDraft,
): number | null {
  if (!draft.carbsEdited) {
    return draft.storedCarbohydratesGrams;
  }

  return parseNutritionManualCarbsInput(draft.carbohydratesGrams);
}

function resolveOptionalPositiveNumber(
  raw: string,
  edited: boolean,
  stored: number | undefined,
): number | undefined | null {
  if (!edited) {
    return stored;
  }

  if (raw.trim().length === 0) {
    return undefined;
  }

  return parseNutritionManualCarbsInput(raw);
}

function resolveEditedItem(
  item: NutritionTimelineEditItemDraft,
): NutritionItemSnapshot | null {
  if (
    item.source === 'historical' &&
    item.historicalSnapshot !== null &&
    !item.carbsEdited &&
    !item.nameEdited &&
    !item.weightEdited &&
    !item.carbsPer100Edited
  ) {
    return item.historicalSnapshot;
  }

  const name = item.name.trim();

  if (name.length === 0) {
    return null;
  }

  const carbohydratesGrams = item.carbsEdited
    ? parseNutritionManualCarbsInput(item.carbohydratesGrams)
    : (item.historicalSnapshot?.carbohydratesGrams ??
      parseNutritionManualCarbsInput(item.carbohydratesGrams));

  if (carbohydratesGrams === null) {
    return null;
  }

  const weightGrams = resolveOptionalPositiveNumber(
    item.weightGrams,
    item.weightEdited,
    item.historicalSnapshot?.weightGrams,
  );
  const carbsPer100Grams = resolveOptionalPositiveNumber(
    item.carbsPer100Grams,
    item.carbsPer100Edited,
    item.historicalSnapshot?.carbsPer100Grams,
  );

  if (weightGrams === null || carbsPer100Grams === null) {
    return null;
  }

  const snapshot: NutritionItemSnapshot = {
    carbohydratesGrams,
    itemId: item.itemId,
    name,
    ...(weightGrams === undefined ? {} : { weightGrams }),
    ...(carbsPer100Grams === undefined ? {} : { carbsPer100Grams }),
  };

  return validateNutritionItemSnapshot(snapshot).ok ? snapshot : null;
}

export function buildNutritionTimelineEventFromEditDraft(input: {
  readonly copy: NutritionTimelineEditCopy;
  readonly draft: NutritionTimelineEventEditDraft;
  readonly event: NutritionTimelineEvent;
  readonly now?: Date;
}): NutritionTimelineEditResult {
  const { copy, draft, event } = input;
  const errors: NutritionTimelineEditErrors = {};

  if (draft.date.trim().length === 0) {
    errors.date = copy.errors.dateRequired;
  }

  if (draft.time.trim().length === 0) {
    errors.time = copy.errors.timeRequired;
  }

  let occurredAt: string | null = null;

  try {
    occurredAt = createIsoDateTimeFromLocalDateAndTime(draft.date, draft.time);
  } catch {
    occurredAt = null;
  }

  if (!occurredAt) {
    errors.date = errors.date ?? copy.errors.dateRequired;
    errors.time = errors.time ?? copy.errors.timeRequired;
  }

  if (!isNutritionMealType(draft.mealType)) {
    errors.mealType = copy.errors.mealTypeRequired;
  }

  const carbohydratesGrams = resolveEditedCarbohydrates(draft);

  if (carbohydratesGrams === null) {
    errors.carbs =
      draft.carbohydratesGrams.trim().includes('.') &&
      draft.carbohydratesGrams.trim().split('.')[1]?.length > 2
        ? copy.errors.carbsPrecision
        : copy.errors.carbsRange;
  }

  const items: NutritionItemSnapshot[] = [];

  for (const item of draft.items) {
    const resolved = resolveEditedItem(item);

    if (resolved === null) {
      errors.itemName =
        item.name.trim().length === 0
          ? copy.errors.itemNameRequired
          : errors.itemName;
      errors.itemCarbs = copy.errors.itemCarbs;
      continue;
    }

    items.push(resolved);
  }

  if (Object.keys(errors).length > 0 || carbohydratesGrams === null) {
    return { errors, event: null };
  }

  const note = draft.note.trim();
  const payload = {
    carbohydratesGrams,
    kind: 'nutrition' as const,
    mealType: draft.mealType as NutritionMealType,
    schemaVersion: 2 as const,
    ...(items.length === 0 ? {} : { items }),
    ...(note.length === 0 ? {} : { note }),
  };
  const validated = validateNutritionTimelineEventV2(payload);

  if (!validated.ok) {
    return {
      errors: { carbs: copy.errors.carbsRange },
      event: null,
    };
  }

  const nextEvent: Extract<SemanticTimelineEvent, { kind: 'nutrition' }> = {
    createdAt: event.createdAt,
    id: event.id,
    kind: 'nutrition',
    occurredAt: occurredAt ?? event.occurredAt,
    schemaVersion: 2,
    source: event.source,
    updatedAt: (input.now ?? new Date()).toISOString(),
    carbohydratesGrams: validated.value.carbohydratesGrams,
    mealType: validated.value.mealType,
    ...(validated.value.items === undefined
      ? {}
      : { items: validated.value.items }),
    ...(validated.value.note === undefined
      ? {}
      : { note: validated.value.note }),
    ...(event.provenance === undefined ? {} : { provenance: event.provenance }),
  };

  return { errors: {}, event: nextEvent };
}

export function createAddedNutritionEditItem(input: {
  readonly carbohydratesGrams: string;
  readonly itemId: string;
  readonly name: string;
}): NutritionTimelineEditItemDraft {
  return {
    carbsEdited: true,
    carbsPer100Edited: false,
    carbsPer100Grams: '',
    carbohydratesGrams: input.carbohydratesGrams,
    historicalSnapshot: null,
    itemId: input.itemId,
    name: input.name,
    nameEdited: true,
    source: 'added',
    weightEdited: false,
    weightGrams: '',
  };
}

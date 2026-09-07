import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface NoteQuickAddSaveLabels {
  readonly saveErrorDescription: string;
  readonly saveErrorTitle: string;
  readonly saving: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

function translate(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export function resolveNoteQuickAddSaveLabels(
  localization: LocalizationPlatform,
): NoteQuickAddSaveLabels {
  return {
    saveErrorDescription: translate(
      localization,
      asTranslationKey('quick-add.note.saveError.description'),
    ),
    saveErrorTitle: translate(
      localization,
      asTranslationKey('quick-add.note.saveError.title'),
    ),
    saving: translate(localization, asTranslationKey('quick-add.note.saving')),
  };
}

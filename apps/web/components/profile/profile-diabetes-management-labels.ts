import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

import type { TargetEditorValidationIssue } from '../../lib/medical/client/diabetes-settings-target-validation';

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

function translate(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export interface ProfileDiabetesManagementLabels {
  readonly diabetesType: Readonly<{
    readonly description: string;
    readonly gestational: string;
    readonly other: string;
    readonly otherLabel: string;
    readonly selfReportedNote: string;
    readonly title: string;
    readonly type1: string;
    readonly type2: string;
    readonly unknown: string;
  }>;
  readonly disclaimer: string;
  readonly errors: Readonly<{
    readonly generic: string;
    readonly network: string;
    readonly rateLimited: string;
    readonly revisionConflict: string;
    readonly syncRequired: string;
    readonly unauthorized: string;
  }>;
  readonly glucose: Readonly<{
    readonly description: string;
    readonly title: string;
    readonly unconfigured: string;
    readonly unitMg: string;
    readonly unitMmol: string;
  }>;
  readonly loading: string;
  readonly page: Readonly<{
    readonly description: string;
    readonly title: string;
  }>;
  readonly saving: string;
  readonly target: Readonly<{
    readonly editAction: string;
    readonly notSet: string;
    readonly remove: string;
    readonly removeConfirm: Readonly<{
      readonly cancel: string;
      readonly confirm: string;
      readonly description: string;
      readonly title: string;
    }>;
    readonly dialog: Readonly<{
      readonly cancel: string;
      readonly lowerLabel: string;
      readonly save: string;
      readonly title: string;
      readonly upperLabel: string;
    }>;
    readonly title: string;
    readonly validation: Readonly<Record<TargetEditorValidationIssue, string>>;
  }>;
}

const KEYS = {
  pageDescription: asTranslationKey(
    'account.diabetesManagement.page.description',
  ),
  pageTitle: asTranslationKey('account.diabetesManagement.page.title'),
  glucoseDescription: asTranslationKey(
    'account.diabetesManagement.glucose.description',
  ),
  glucoseTitle: asTranslationKey('account.diabetesManagement.glucose.title'),
  glucoseUnconfigured: asTranslationKey(
    'account.diabetesManagement.glucose.unconfigured',
  ),
  glucoseUnitMg: asTranslationKey('account.diabetesManagement.glucose.unitMg'),
  glucoseUnitMmol: asTranslationKey(
    'account.diabetesManagement.glucose.unitMmol',
  ),
  diabetesTypeDescription: asTranslationKey(
    'account.diabetesManagement.diabetesType.description',
  ),
  diabetesTypeGestational: asTranslationKey(
    'account.diabetesManagement.diabetesType.gestational',
  ),
  diabetesTypeOther: asTranslationKey(
    'account.diabetesManagement.diabetesType.other',
  ),
  diabetesTypeOtherLabel: asTranslationKey(
    'account.diabetesManagement.diabetesType.otherLabel',
  ),
  diabetesTypeSelfReportedNote: asTranslationKey(
    'account.diabetesManagement.diabetesType.selfReportedNote',
  ),
  diabetesTypeTitle: asTranslationKey(
    'account.diabetesManagement.diabetesType.title',
  ),
  diabetesTypeType1: asTranslationKey(
    'account.diabetesManagement.diabetesType.type1',
  ),
  diabetesTypeType2: asTranslationKey(
    'account.diabetesManagement.diabetesType.type2',
  ),
  diabetesTypeUnknown: asTranslationKey(
    'account.diabetesManagement.diabetesType.unknown',
  ),
  disclaimer: asTranslationKey('account.diabetesManagement.disclaimer'),
  errorGeneric: asTranslationKey('account.diabetesManagement.errors.generic'),
  errorNetwork: asTranslationKey('account.diabetesManagement.errors.network'),
  errorRateLimited: asTranslationKey(
    'account.diabetesManagement.errors.rateLimited',
  ),
  errorRevisionConflict: asTranslationKey(
    'account.diabetesManagement.errors.revisionConflict',
  ),
  errorSyncRequired: asTranslationKey(
    'account.diabetesManagement.errors.syncRequired',
  ),
  errorUnauthorized: asTranslationKey(
    'account.diabetesManagement.errors.unauthorized',
  ),
  loading: asTranslationKey('account.diabetesManagement.loading'),
  saving: asTranslationKey('account.diabetesManagement.saving'),
  targetEditAction: asTranslationKey(
    'account.diabetesManagement.target.editAction',
  ),
  targetNotSet: asTranslationKey('account.diabetesManagement.target.notSet'),
  targetRemove: asTranslationKey('account.diabetesManagement.target.remove'),
  targetRemoveConfirmCancel: asTranslationKey(
    'account.diabetesManagement.target.removeConfirm.cancel',
  ),
  targetRemoveConfirmConfirm: asTranslationKey(
    'account.diabetesManagement.target.removeConfirm.confirm',
  ),
  targetRemoveConfirmDescription: asTranslationKey(
    'account.diabetesManagement.target.removeConfirm.description',
  ),
  targetRemoveConfirmTitle: asTranslationKey(
    'account.diabetesManagement.target.removeConfirm.title',
  ),
  targetDialogCancel: asTranslationKey(
    'account.diabetesManagement.target.dialog.cancel',
  ),
  targetDialogLowerLabel: asTranslationKey(
    'account.diabetesManagement.target.dialog.lowerLabel',
  ),
  targetDialogSave: asTranslationKey(
    'account.diabetesManagement.target.dialog.save',
  ),
  targetDialogTitle: asTranslationKey(
    'account.diabetesManagement.target.dialog.title',
  ),
  targetDialogUpperLabel: asTranslationKey(
    'account.diabetesManagement.target.dialog.upperLabel',
  ),
  targetTitle: asTranslationKey('account.diabetesManagement.target.title'),
  targetValidationEmpty: asTranslationKey(
    'account.diabetesManagement.target.validation.empty',
  ),
  targetValidationInvalidNumber: asTranslationKey(
    'account.diabetesManagement.target.validation.invalidNumber',
  ),
  targetValidationLowEqualHigh: asTranslationKey(
    'account.diabetesManagement.target.validation.lowEqualHigh',
  ),
  targetValidationLowGreaterThanHigh: asTranslationKey(
    'account.diabetesManagement.target.validation.lowGreaterThanHigh',
  ),
  targetValidationOutOfBounds: asTranslationKey(
    'account.diabetesManagement.target.validation.outOfBounds',
  ),
} as const;

export function resolveProfileDiabetesManagementLabels(
  localization: LocalizationPlatform,
): ProfileDiabetesManagementLabels {
  return {
    diabetesType: {
      description: translate(localization, KEYS.diabetesTypeDescription),
      gestational: translate(localization, KEYS.diabetesTypeGestational),
      other: translate(localization, KEYS.diabetesTypeOther),
      otherLabel: translate(localization, KEYS.diabetesTypeOtherLabel),
      selfReportedNote: translate(
        localization,
        KEYS.diabetesTypeSelfReportedNote,
      ),
      title: translate(localization, KEYS.diabetesTypeTitle),
      type1: translate(localization, KEYS.diabetesTypeType1),
      type2: translate(localization, KEYS.diabetesTypeType2),
      unknown: translate(localization, KEYS.diabetesTypeUnknown),
    },
    disclaimer: translate(localization, KEYS.disclaimer),
    errors: {
      generic: translate(localization, KEYS.errorGeneric),
      network: translate(localization, KEYS.errorNetwork),
      rateLimited: translate(localization, KEYS.errorRateLimited),
      revisionConflict: translate(localization, KEYS.errorRevisionConflict),
      syncRequired: translate(localization, KEYS.errorSyncRequired),
      unauthorized: translate(localization, KEYS.errorUnauthorized),
    },
    glucose: {
      description: translate(localization, KEYS.glucoseDescription),
      title: translate(localization, KEYS.glucoseTitle),
      unconfigured: translate(localization, KEYS.glucoseUnconfigured),
      unitMg: translate(localization, KEYS.glucoseUnitMg),
      unitMmol: translate(localization, KEYS.glucoseUnitMmol),
    },
    loading: translate(localization, KEYS.loading),
    page: {
      description: translate(localization, KEYS.pageDescription),
      title: translate(localization, KEYS.pageTitle),
    },
    saving: translate(localization, KEYS.saving),
    target: {
      editAction: translate(localization, KEYS.targetEditAction),
      notSet: translate(localization, KEYS.targetNotSet),
      remove: translate(localization, KEYS.targetRemove),
      removeConfirm: {
        cancel: translate(localization, KEYS.targetRemoveConfirmCancel),
        confirm: translate(localization, KEYS.targetRemoveConfirmConfirm),
        description: translate(
          localization,
          KEYS.targetRemoveConfirmDescription,
        ),
        title: translate(localization, KEYS.targetRemoveConfirmTitle),
      },
      dialog: {
        cancel: translate(localization, KEYS.targetDialogCancel),
        lowerLabel: translate(localization, KEYS.targetDialogLowerLabel),
        save: translate(localization, KEYS.targetDialogSave),
        title: translate(localization, KEYS.targetDialogTitle),
        upperLabel: translate(localization, KEYS.targetDialogUpperLabel),
      },
      title: translate(localization, KEYS.targetTitle),
      validation: {
        empty: translate(localization, KEYS.targetValidationEmpty),
        invalid_number: translate(
          localization,
          KEYS.targetValidationInvalidNumber,
        ),
        low_equal_high: translate(
          localization,
          KEYS.targetValidationLowEqualHigh,
        ),
        low_greater_than_high: translate(
          localization,
          KEYS.targetValidationLowGreaterThanHigh,
        ),
        out_of_bounds: translate(
          localization,
          KEYS.targetValidationOutOfBounds,
        ),
      },
    },
  };
}

export function resolveDiabetesTypeCategoryLabel(
  labels: ProfileDiabetesManagementLabels,
  category: string,
): string {
  switch (category) {
    case 'type_1':
      return labels.diabetesType.type1;
    case 'type_2':
      return labels.diabetesType.type2;
    case 'gestational':
      return labels.diabetesType.gestational;
    case 'other':
      return labels.diabetesType.other;
    default:
      return labels.diabetesType.unknown;
  }
}

export function buildDiabetesTypeClassification(
  category: string,
  otherDescriptor: string,
): {
  readonly category: 'type_1' | 'type_2' | 'gestational' | 'other' | 'unknown';
  readonly otherDescriptor?: string;
  readonly source: 'self_reported';
} {
  if (category === 'other') {
    const trimmed = otherDescriptor.trim();

    return {
      category: 'other',
      ...(trimmed ? { otherDescriptor: trimmed } : {}),
      source: 'self_reported',
    };
  }

  return {
    category: category as
      'type_1' | 'type_2' | 'gestational' | 'other' | 'unknown',
    source: 'self_reported',
  };
}

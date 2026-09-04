/**
 * Quick Add re-exports the shared manual insulin dose input policy.
 *
 * @see ../medical/insulin/insulin-manual-dose-input.ts
 */
export {
  INSULIN_MANUAL_DOSE_MAXIMUM_FRACTION_DIGITS as INSULIN_QUICK_ADD_MANUAL_DOSE_MAXIMUM_FRACTION_DIGITS,
  INSULIN_MANUAL_DOSE_UI_MAXIMUM as INSULIN_QUICK_ADD_UI_DOSE_MAXIMUM,
  parseInsulinManualDoseInput as parseInsulinQuickAddDoseInput,
} from '../medical/insulin/insulin-manual-dose-input';

export function openNativeTimePicker(input: HTMLInputElement): void {
  if ('showPicker' in input && typeof input.showPicker === 'function') {
    try {
      input.showPicker();
      return;
    } catch {
      // showPicker can throw if not supported in the current context.
    }
  }

  input.focus();
}

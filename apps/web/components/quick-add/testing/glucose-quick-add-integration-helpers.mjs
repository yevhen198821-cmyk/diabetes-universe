import assert from 'node:assert/strict';
import { act } from 'react';

export async function setControlledInputValue(input, value) {
  await act(async () => {
    input.focus();
    const descriptor = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    );
    descriptor?.set?.call(input, value);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

export async function setGlucoseQuickAddTime(hour, minute) {
  const timeTrigger = document.getElementById('quick-add-glucose-time');
  assert.notEqual(timeTrigger, null);

  await act(async () => {
    timeTrigger?.click();
  });

  const hourButton = [...document.querySelectorAll('button')].find(
    (button) =>
      button.textContent === hour && button.closest('[role="dialog"]'),
  );
  const minuteButton = [...document.querySelectorAll('button')].find(
    (button) =>
      button.textContent === minute &&
      button.closest('[role="dialog"]') &&
      button !== hourButton,
  );
  assert.notEqual(hourButton, undefined);
  assert.notEqual(minuteButton, undefined);

  await act(async () => {
    hourButton?.click();
    minuteButton?.click();
  });

  const doneButton = [...document.querySelectorAll('button')].find(
    (button) => button.textContent === 'Готово',
  );
  assert.notEqual(doneButton, undefined);

  await act(async () => {
    doneButton?.click();
  });
}

export async function dispatchEscapeKey() {
  await act(async () => {
    document.dispatchEvent(
      new window.KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
    );
  });
}

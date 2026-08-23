import assert from 'node:assert/strict';
import test from 'node:test';

import { formErrorClass, formFieldClass, formLabelClass } from './form.ts';

test('form field classes include aria-invalid and focus-visible semantics', () => {
  assert.match(formFieldClass, /aria-\[invalid=true\]/);
  assert.match(formFieldClass, /focus:ring-focus-ring/);
  assert.match(formFieldClass, /text-text-primary/);
  assert.match(formLabelClass, /text-text-secondary/);
  assert.match(formErrorClass, /text-status-danger/);
});

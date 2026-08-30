import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const panelSource = readFileSync(
  new URL(
    '../../../../packages/ui/src/components/quick-add/QuickAddPanel.tsx',
    import.meta.url,
  ),
  'utf8',
);

test('QuickAddPanel supports generic initial focus ref with panel fallback', () => {
  assert.match(panelSource, /initialFocusRef/);
  assert.match(panelSource, /initialFocusRef\?\.current\?\.isConnected/);
  assert.match(panelSource, /panelRef\.current\?\.focus\(\)/);
  assert.match(panelSource, /requestAnimationFrame/);
});

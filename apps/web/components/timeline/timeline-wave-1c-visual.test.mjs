import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const shellSource = readFileSync(
  fileURLToPath(new URL('./timeline-shell.tsx', import.meta.url)),
  'utf8',
);
const listSource = readFileSync(
  fileURLToPath(new URL('./timeline-list.tsx', import.meta.url)),
  'utf8',
);
const toolbarSource = readFileSync(
  fileURLToPath(new URL('./timeline-toolbar.tsx', import.meta.url)),
  'utf8',
);
const pageBackgroundSource = readFileSync(
  fileURLToPath(new URL('../shared/app-page-background.tsx', import.meta.url)),
  'utf8',
);

test('timeline shell reuses the home page colorful backdrop', () => {
  assert.match(shellSource, /AppPageBackground/);
  assert.match(shellSource, /appPageShellClassName/);
  assert.match(pageBackgroundSource, /bg-\[#f7fafd\]/);
  assert.match(shellSource, /DashboardMobileNav/);
  assert.match(shellSource, /activeTab="timeline"/);
});

test('timeline list uses vibrant frosted event cards', () => {
  assert.match(listSource, /frostedPanelClassName/);
  assert.match(listSource, /appearance="vibrant"/);
  assert.match(toolbarSource, /frostedPanelClassName/);
});

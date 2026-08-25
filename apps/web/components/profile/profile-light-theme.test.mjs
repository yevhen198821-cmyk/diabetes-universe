import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const currentDirectory = fileURLToPath(new URL('.', import.meta.url));

const profileSources = [
  'profile-menu.tsx',
  'profile-settings-panel.tsx',
  'profile-theme-control.tsx',
  'profile-user-card.tsx',
  'profile-shell.tsx',
  'profile-surface-styles.ts',
  '../shared/segmented-control.tsx',
].map((file) => readFileSync(join(currentDirectory, file), 'utf8'));

const combinedProfileSource = profileSources.join('\n');

test('profile light theme avoids global opacity washout on disabled rows', () => {
  assert.doesNotMatch(
    combinedProfileSource,
    /profileDisabledRowClassName[\s\S]*opacity-/,
  );
  assert.doesNotMatch(combinedProfileSource, /opacity-80/);
});

test('profile surfaces use semantic light tokens instead of dark-only slate overlays', () => {
  assert.match(combinedProfileSource, /bg-surface/);
  assert.match(combinedProfileSource, /text-text-primary/);
  assert.match(
    combinedProfileSource,
    /profileThemeControlActiveClassName\s*=\s*\n?\s*'[^']*teal[^']*'/,
  );
  assert.doesNotMatch(
    combinedProfileSource,
    /profileThemeControlActiveClassName\s*=\s*\n?\s*'[^']*amber[^']*'/,
  );
});

test('profile logout keeps readable destructive styling in light theme', () => {
  assert.match(
    combinedProfileSource,
    /profileLogoutButtonClassName[\s\S]*text-rose-800[\s\S]*dark:text-rose-100/,
  );
});

test('profile cards avoid backdrop blur in default light styling', () => {
  assert.match(combinedProfileSource, /profileCardClassName[\s\S]*bg-surface/);
  assert.match(
    combinedProfileSource,
    /profileCardClassName[\s\S]*dark:backdrop-blur-md/,
  );
});

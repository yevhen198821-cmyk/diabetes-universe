import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildDiabetesTypeClassification,
  resolveDiabetesTypeCategoryLabel,
} from './profile-diabetes-management-labels.ts';

const menuSource = readFileSync(
  fileURLToPath(new URL('./profile-menu.tsx', import.meta.url)),
  'utf8',
);
const menuLinkSource = readFileSync(
  fileURLToPath(new URL('./profile-menu-diabetes-link-row.tsx', import.meta.url)),
  'utf8',
);
const panelSource = readFileSync(
  fileURLToPath(
    new URL('./profile-diabetes-management-panel.tsx', import.meta.url),
  ),
  'utf8',
);
const pageSource = readFileSync(
  fileURLToPath(new URL('../../app/account/diabetes/page.tsx', import.meta.url)),
  'utf8',
);
const clientSource = readFileSync(
  fileURLToPath(
    new URL('../../lib/medical/client/diabetes-settings-client.ts', import.meta.url),
  ),
  'utf8',
);
const authConstantsSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../../../packages/identity/src/config/auth-constants.ts',
      import.meta.url,
    ),
  ),
  'utf8',
);

test('profile menu links to diabetes management route', () => {
  assert.match(menuSource, /ProfileMenuDiabetesLinkRow/);
  assert.match(menuLinkSource, /href="\/account\/diabetes"/);
  assert.doesNotMatch(menuSource, /ProfileMenuDisabledRow[\s\S]*diabetesSettings/);
});

test('diabetes management page renders dedicated panel', () => {
  assert.match(pageSource, /ProfileDiabetesManagementPanel/);
});

test('auth callback allow-list includes diabetes route', () => {
  assert.match(authConstantsSource, /'\/account\/diabetes'/);
});

test('panel handles unconfigured glucose unit without selecting mmol/L', () => {
  assert.match(panelSource, /displayUnit === null/);
  assert.match(panelSource, /labels\.glucose\.unconfigured/);
  assert.match(panelSource, /aria-pressed=\{isActive\}/);
  assert.match(panelSource, /settings\.glucoseDisplayUnit === option\.id/);
});

test('panel patches glucose units and diabetes type with revision tokens', () => {
  assert.match(panelSource, /patchDiabetesSettings\(settings\.revision/);
  assert.match(panelSource, /glucoseDisplayUnit: nextUnit/);
  assert.match(clientSource, /'If-Match': revision/);
  assert.match(clientSource, /credentials: 'include'/);
});

test('panel reloads resources on revision conflict and precondition required', () => {
  assert.match(panelSource, /revision_conflict/);
  assert.match(panelSource, /precondition_required/);
  assert.match(panelSource, /reloadResources\(\)/);
});

test('panel does not expose provenance selector and uses canonical target API', () => {
  assert.doesNotMatch(panelSource, /provenance/);
  assert.doesNotMatch(panelSource, /clinician_defined/);
  assert.match(panelSource, /putGlucoseTargetProfile\(/);
  assert.match(panelSource, /deleteGlucoseTargetProfile\(/);
  assert.match(panelSource, /SessionConfirmDialog/);
});

test('panel does not persist diabetes settings in localStorage', () => {
  assert.doesNotMatch(panelSource, /localStorage/);
});

test('buildDiabetesTypeClassification omits otherDescriptor for non-other categories', () => {
  const classification = buildDiabetesTypeClassification('type_1', 'stale');
  assert.equal(classification.category, 'type_1');
  assert.equal(classification.source, 'self_reported');
  assert.equal('otherDescriptor' in classification, false);
});

test('buildDiabetesTypeClassification trims other descriptor for other category', () => {
  const classification = buildDiabetesTypeClassification('other', '  LADA  ');
  assert.equal(classification.category, 'other');
  assert.equal(classification.otherDescriptor, 'LADA');
});

test('resolveDiabetesTypeCategoryLabel maps unknown to friendly label', () => {
  const label = resolveDiabetesTypeCategoryLabel(
    {
      diabetesType: { unknown: 'Not specified' },
    },
    'unknown',
  );
  assert.equal(label, 'Not specified');
});

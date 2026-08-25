import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PROFILE_SEGMENT_PATHS,
  resolveProfileSegmentFromPathname,
} from './profile-segment.ts';

test('resolveProfileSegmentFromPathname maps account routes to segments', () => {
  assert.equal(resolveProfileSegmentFromPathname('/account'), 'profile');
  assert.equal(
    resolveProfileSegmentFromPathname('/account/settings'),
    'settings',
  );
  assert.equal(
    resolveProfileSegmentFromPathname('/account/security'),
    'security',
  );
  assert.equal(
    resolveProfileSegmentFromPathname('/account/security/sessions'),
    'security',
  );
});

test('profile segment paths stay stable for segmented navigation', () => {
  assert.equal(PROFILE_SEGMENT_PATHS.profile, '/account');
  assert.equal(PROFILE_SEGMENT_PATHS.settings, '/account/settings');
  assert.equal(PROFILE_SEGMENT_PATHS.security, '/account/security');
});

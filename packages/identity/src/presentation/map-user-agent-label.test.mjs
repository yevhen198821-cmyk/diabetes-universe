import assert from 'node:assert/strict';
import test from 'node:test';

import { mapUserAgentLabel } from '../presentation/map-user-agent-label.ts';

test('user-agent mapper labels Chrome on macOS', () => {
  const result = mapUserAgentLabel(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );

  assert.equal(result.clientLabel, 'Chrome · macOS');
  assert.equal(result.clientKind, 'desktop');
});

test('user-agent mapper labels Safari on iPhone', () => {
  const result = mapUserAgentLabel(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  );

  assert.equal(result.clientLabel, 'Safari · iPhone');
  assert.equal(result.clientKind, 'mobile');
});

test('user-agent mapper labels Firefox on Windows', () => {
  const result = mapUserAgentLabel(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  );

  assert.equal(result.clientLabel, 'Firefox · Windows');
  assert.equal(result.clientKind, 'desktop');
});

test('user-agent mapper labels Edge on Windows', () => {
  const result = mapUserAgentLabel(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Edg/120.0.0.0',
  );

  assert.equal(result.clientLabel, 'Edge · Windows');
  assert.equal(result.clientKind, 'desktop');
});

test('user-agent mapper labels Android browser', () => {
  const result = mapUserAgentLabel(
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  );

  assert.equal(result.clientLabel, 'Chrome · Android');
  assert.equal(result.clientKind, 'mobile');
});

test('user-agent mapper handles missing user agent', () => {
  const result = mapUserAgentLabel(null);

  assert.equal(result.clientLabel, 'Unknown client');
  assert.equal(result.clientKind, 'unknown');
});

test('user-agent mapper handles unknown user agent', () => {
  const result = mapUserAgentLabel('custom-bot/1.0');

  assert.equal(result.clientLabel, 'Unknown browser');
  assert.equal(result.clientKind, 'unknown');
});

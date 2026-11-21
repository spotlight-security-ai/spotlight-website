import test from 'node:test';
import assert from 'node:assert/strict';
import {
  apiUrl, buildLeadPayload, buildLookupUrl, looksBinary, observedAtIso, secretWarnings, tokenFromHash,
  validateFiles, validateResponse,
} from '../assets/js/assessment-preview-core.mjs';

const file = (name, size) => ({ name, size });

test('lookup URL preserves exact make/model text and targets the configured API origin', () => {
  const url = buildLookupUrl(' Cisco ', ' Catalyst 9300 / 48P ', 'https://api.example.test', 'https://spotlightsecurity.ai');
  assert.equal(url.origin, 'https://api.example.test');
  assert.equal(url.pathname, '/api/public/device-lookup');
  assert.equal(url.searchParams.get('make'), 'Cisco');
  assert.equal(url.searchParams.get('model'), 'Catalyst 9300 / 48P');
  assert.equal(apiUrl('/api/public/config-preview', '', 'https://spotlightsecurity.ai').origin, 'https://spotlightsecurity.ai');
});

test('API base rejects non-HTTPS remote origins and credentials', () => {
  assert.throws(() => apiUrl('/api/public/config-preview', 'http://example.com', 'https://spotlightsecurity.ai'));
  assert.throws(() => apiUrl('/api/public/config-preview', 'https://user:pass@example.com', 'https://spotlightsecurity.ai'));
  assert.throws(() => apiUrl('/api/public/config-preview', 'https://example.com/private', 'https://spotlightsecurity.ai'));
  assert.throws(() => apiUrl('/other', '', 'https://spotlightsecurity.ai'));
});

test('file selection enforces text formats, count, size, and aggregate limit', () => {
  assert.equal(validateFiles([file('switch.CFG', 50)]).length, 1);
  assert.throws(() => validateFiles([]), /Choose 1 to 5/);
  assert.throws(() => validateFiles(Array.from({ length: 6 }, (_, i) => file(`${i}.txt`, 1))), /Choose 1 to 5/);
  assert.throws(() => validateFiles([file('archive.zip', 1024)]), /not a supported text export/);
  assert.throws(() => validateFiles([file('config.txt', 5 * 1024 * 1024 + 1)]), /5 MiB/);
  assert.throws(() => validateFiles(Array.from({ length: 5 }, (_, i) => file(`${i}.txt`, 5 * 1024 * 1024))), /20 MiB/);
});

test('collection time is optional but cannot be invalid or in the future', () => {
  assert.equal(observedAtIso(''), '');
  assert.equal(observedAtIso('2026-11-20T10:00', Date.parse('2026-11-21T12:00:00Z')).endsWith('Z'), true);
  assert.throws(() => observedAtIso('not-a-date'), /valid collection time/);
  assert.throws(() => observedAtIso('2030-01-01T10:00', Date.parse('2026-11-21T12:00:00Z')), /not in the future/);
});

test('common credentials and binary content stop local upload checks', () => {
  assert.deepEqual(secretWarnings('hostname edge-01\ninterface eth0'), []);
  assert.deepEqual(secretWarnings('password: <redacted>\napi_key=REDACTED'), []);
  assert.ok(secretWarnings('username admin password secretvalue').includes('configuration secret'));
  assert.ok(secretWarnings('Authorization: Bearer abcdefgh').includes('bearer token'));
  assert.ok(secretWarnings('-----BEGIN RSA PRIVATE KEY-----').includes('private key'));
  assert.equal(looksBinary('interface eth0\naddress 192.0.2.1'), false);
  assert.equal(looksBinary('abc\0def'), true);
});

test('response validation fails closed on missing core fields', () => {
  assert.equal(validateResponse({ schema_version: 1, summary: 'No match', devices: [] }, 'lookup').summary, 'No match');
  assert.equal(validateResponse({ schema_version: 1, summary: 'Partial', files: [], findings: [] }, 'preview').summary, 'Partial');
  assert.throws(() => validateResponse({ schema_version: 2, summary: '', devices: [] }, 'lookup'), /unsupported response/);
  assert.throws(() => validateResponse({ schema_version: 1, summary: '', files: [] }, 'preview'), /incomplete/);
});

test('lead payload maps direct and partner paths without sending an empty client label', () => {
  const values = { reportHandle: 'signed-handle', name: ' Ava ', email: 'ava@example.com', company: ' Example Utility ', consent: true };
  assert.deepEqual(buildLeadPayload({ ...values, path: 'direct', clientLabel: 'Ignored' }), {
    report_handle: 'signed-handle', name: 'Ava', email: 'ava@example.com', company: 'Example Utility', audience: 'company', consent: true,
  });
  assert.equal(buildLeadPayload({ ...values, path: 'partner', clientLabel: ' Plant A ' }).client_label, 'Plant A');
  assert.equal(buildLeadPayload({ ...values, path: 'partner' }).audience, 'msp');
});

test('lead requires a valid contact and explicit consent', () => {
  const values = { reportHandle: 'handle', name: 'Ava', email: 'ava@example.com', company: 'Utility', path: 'direct', consent: true };
  assert.throws(() => buildLeadPayload({ ...values, reportHandle: '' }), /new configuration preview/);
  assert.throws(() => buildLeadPayload({ ...values, email: 'invalid' }), /valid work email/);
  assert.throws(() => buildLeadPayload({ ...values, consent: false }), /Consent is required/);
});

test('lead accepts a signed report handle larger than 4096 characters up to the API limit', () => {
  const values = { name: 'Ava', email: 'ava@example.com', company: 'Utility', path: 'direct', consent: true };
  assert.equal(buildLeadPayload({ ...values, reportHandle: 'x'.repeat(5000) }).report_handle.length, 5000);
  assert.equal(buildLeadPayload({ ...values, reportHandle: 'x'.repeat(60000) }).report_handle.length, 60000);
  assert.throws(() => buildLeadPayload({ ...values, reportHandle: 'x'.repeat(60001) }), /new configuration preview/);
});

test('report token is read only from the URL fragment', () => {
  assert.equal(tokenFromHash('#token=abc%2E123'), 'abc.123');
  assert.equal(tokenFromHash('#other=abc'), '');
  assert.equal(tokenFromHash(`#token=${'x'.repeat(4097)}`), '');
});

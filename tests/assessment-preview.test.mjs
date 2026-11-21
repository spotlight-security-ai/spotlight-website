import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import {
  apiUrl, buildLeadPayload, buildLookupUrl, looksBinary, observedAtIso, sampleCandidates, secretWarnings, tokenFromHash,
  validateFiles, validateResponse, validateSampleFile, verificationMessage,
} from '../assets/js/assessment-preview-core.mjs';

const file = (name, size) => ({ name, size });

test('static preview configuration contains only a public origin and boolean feature flags', () => {
  const sandbox = { window: {} };
  runInNewContext(readFileSync(new URL('../assets/js/preview-config.js', import.meta.url), 'utf8'), sandbox);
  assert.deepEqual(Object.keys(sandbox.window).sort(), [
    'SPOTLIGHT_PREVIEW_API_BASE', 'SPOTLIGHT_PREVIEW_ENABLED', 'SPOTLIGHT_PREVIEW_SAMPLE_SHARING_ENABLED',
  ]);
  assert.equal(sandbox.window.SPOTLIGHT_PREVIEW_ENABLED, false);
  assert.equal(typeof sandbox.window.SPOTLIGHT_PREVIEW_SAMPLE_SHARING_ENABLED, 'boolean');
  assert.doesNotThrow(() => apiUrl(
    '/api/public/device-lookup', sandbox.window.SPOTLIGHT_PREVIEW_API_BASE, 'https://spotlightsecurity.ai',
  ));
  assert.equal(Object.keys(sandbox.window).some(key => /key|token|secret|credential/i.test(key)), false);
});

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
  assert.deepEqual(secretWarnings('password: <redacted>\napi_key=REDACTED\n"refresh_token":"masked"'), []);
  assert.ok(secretWarnings('username admin password secretvalue').includes('configuration secret'));
  assert.ok(secretWarnings('Authorization: Bearer abcdefgh').includes('bearer token'));
  assert.ok(secretWarnings('-----BEGIN RSA PRIVATE KEY-----').includes('private key'));
  for (const value of [
    '"refresh_token":"sensitive-value"',
    'access-token=sensitive-value',
    'client_secret: sensitive-value',
    'private_key=sensitive-value',
    'passphrase sensitive-value',
    'pre-shared-key=sensitive-value',
    'psk: sensitive-value',
    'secret=sensitive-value',
    'community=sensitive-value',
    'token=sensitive-value',
    'authorization: Basic ZGVtbzpwYXNzd29yZA==',
  ]) assert.ok(secretWarnings(value).includes('credential assignment'), value);
  assert.equal(looksBinary('interface eth0\naddress 192.0.2.1'), false);
  assert.equal(looksBinary('abc\0def'), true);
});

test('only partial or unsupported preview files can be offered for separate sharing', () => {
  const selected = [file('recognized.cfg', 100), file('unknown.txt', 200), file('partial.xml', 300), file('rejected.log', 400)];
  const reported = [
    { name: 'recognized.cfg', status: 'recognized' },
    { name: 'unknown.txt', status: 'unsupported' },
    { name: 'partial.xml', status: 'partial' },
    { name: 'rejected.log', status: 'rejected' },
  ];
  assert.deepEqual(sampleCandidates(selected, reported).map(({ file: candidate }) => candidate.name), ['unknown.txt', 'partial.xml']);
  assert.deepEqual(sampleCandidates(selected, reported.slice(0, 3)), []);
  assert.deepEqual(sampleCandidates([file('config (final).txt', 200)], [{ name: 'config__final_.txt', status: 'unsupported' }]).map(({ file: candidate }) => candidate.name), ['config (final).txt']);
});

test('separate sample sharing needs consent and a text-sized file', () => {
  assert.equal(validateSampleFile(file('unknown.txt', 1024 * 1024), true).size, 1024 * 1024);
  assert.throws(() => validateSampleFile(file('unknown.txt', 200), false), /Agree to share/);
  assert.throws(() => validateSampleFile(file('unknown.txt', 1024 * 1024 + 1), true), /1 MiB/);
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

test('confirmed and queued verification emails each show an accurate next step', () => {
  assert.match(verificationMessage('verification_sent'), /Check your inbox/);
  assert.match(verificationMessage('verification_pending'), /sending your verification link; check your inbox shortly/);
  assert.throws(() => verificationMessage('unexpected'), /status could not be confirmed/);
});

test('report token is read only from the URL fragment', () => {
  assert.equal(tokenFromHash('#token=abc%2E123'), 'abc.123');
  assert.equal(tokenFromHash('#other=abc'), '');
  assert.equal(tokenFromHash(`#token=${'x'.repeat(4097)}`), '');
});

test('preview and report pages expose concise accessibility state instead of live-reading full reports', () => {
  const preview = readFileSync(new URL('../assessment-preview.html', import.meta.url), 'utf8');
  const report = readFileSync(new URL('../assessment-report.html', import.meta.url), 'utf8');
  const interactions = readFileSync(new URL('../assets/js/main.js', import.meta.url), 'utf8');
  const renderer = readFileSync(new URL('../assets/js/assessment-preview.mjs', import.meta.url), 'utf8');

  assert.match(preview, /<noscript>/);
  assert.match(report, /<noscript>/);
  assert.equal(preview.match(/data-preview-submit disabled/g)?.length, 4);
  assert.doesNotMatch(preview, /id="(?:lookup|preview)-results"[^>]*aria-live/);
  assert.match(report, /id="verified-report"[^>]*aria-busy="true"[^>]*tabindex="-1"/);
  assert.match(preview, /aria-controls="preview-primary-navigation"/);
  assert.match(report, /aria-controls="report-primary-navigation"/);
  assert.match(interactions, /setAttribute\("aria-expanded", String\(open\)\)/);
  assert.match(renderer, /Configuration preview ready\./);
  assert.match(renderer, /focusRenderedResult/);
});

test('static preview activation, CI, and scoped CSP fail closed', () => {
  const config = readFileSync(new URL('../assets/js/preview-config.js', import.meta.url), 'utf8');
  const previewScript = readFileSync(new URL('../assets/js/assessment-preview.mjs', import.meta.url), 'utf8');
  const reportScript = readFileSync(new URL('../assets/js/assessment-report.mjs', import.meta.url), 'utf8');
  const netlify = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  const workflow = readFileSync(new URL('../.github/workflows/assessment-preview.yml', import.meta.url), 'utf8');

  assert.match(config, /SPOTLIGHT_PREVIEW_ENABLED = false/);
  assert.match(previewScript, /window\.SPOTLIGHT_PREVIEW_ENABLED === true/);
  assert.match(previewScript, /if \(!previewEnabled\)/);
  assert.match(reportScript, /SPOTLIGHT_PREVIEW_ENABLED !== true/);
  assert.match(netlify, /for = "\/assessment-preview\*"/);
  assert.match(netlify, /for = "\/assessment-report\*"/);
  assert.doesNotMatch(netlify, /for = "\/assessment-(?:preview|report)\.html"/);
  const policies = [...netlify.matchAll(/^\s*Content-Security-Policy = "([^"]+)"/gm)].map(match => match[1]);
  assert.equal(policies.length, 2);
  for (const policy of policies) {
    assert.match(policy, /default-src 'none'/);
    assert.match(policy, /connect-src 'self'/);
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /base-uri 'none'/);
    assert.match(policy, /form-action 'none'/);
    assert.match(policy, /frame-ancestors 'none'/);
    assert.doesNotMatch(policy, /unsafe-inline|\*/);
  }
  assert.match(workflow, /npm test/);
  assert.match(workflow, /node --check assets\/js\/assessment-preview\.mjs/);
  assert.match(workflow, /assets\/js\/assessment-report\.mjs/);
  assert.match(workflow, /git diff --check/);
});

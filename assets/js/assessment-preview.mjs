import { apiUrl, buildLeadPayload, buildLookupUrl, looksBinary, MAX_SAMPLE_BYTES, observedAtIso, sampleCandidates, secretWarnings, validateFiles, validateResponse, validateSampleFile, verificationMessage } from './assessment-preview-core.mjs';

const byId = id => document.getElementById(id);
const text = value => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const list = value => Array.isArray(value) ? value : [];
const node = (tag, className = '', content = '') => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== '') element.textContent = text(content);
  return element;
};
const add = (parent, tag, className, content) => parent.appendChild(node(tag, className, content));
const apiBase = window.SPOTLIGHT_PREVIEW_API_BASE || '';
const previewEnabled = window.SPOTLIGHT_PREVIEW_ENABLED === true;
const sampleSharingEnabled = window.SPOTLIGHT_PREVIEW_SAMPLE_SHARING_ENABLED === true;
const headingTag = level => `h${Math.min(6, Math.max(2, Number(level) || 4))}`;
const PREVIEW_UNAVAILABLE = 'The preview service is not enabled yet. You can still request a tailored assessment.';

function statusBadge(value) {
  const badge = node('span', 'preview-status', text(value).replaceAll('_', ' ') || 'Not verified');
  badge.dataset.status = text(value).toLowerCase();
  return badge;
}

function message(id, content, tone = 'info') {
  const element = byId(id);
  element.hidden = !content;
  element.dataset.tone = tone;
  element.textContent = content;
}

function resultGroup(parent, title, headingLevel = 5) {
  const group = node('div', 'preview-result-group');
  add(group, headingTag(headingLevel), 'preview-result-group-title', title);
  parent.appendChild(group);
  return group;
}

function card(parent, title, status, body, headingLevel = 6) {
  const element = node('article', 'preview-result-item');
  element.appendChild(statusBadge(status));
  add(element, headingTag(headingLevel), 'preview-result-item-title', title);
  if (body) add(element, 'p', '', body);
  parent.appendChild(element);
  return element;
}

function plainList(parent, heading, values, headingLevel = 5) {
  if (!list(values).length) return;
  const group = resultGroup(parent, heading, headingLevel);
  const ul = node('ul');
  for (const value of values) {
    const item = typeof value === 'object' && value !== null
      ? [value.title || value.name || value.label, value.detail || value.reason || value.action].map(text).filter(Boolean).join(': ')
      : value;
    if (text(item)) add(ul, 'li', '', item);
  }
  group.appendChild(ul);
}

function renderRoutes(parent, routes, headingLevel = 5) {
  if (!list(routes).length) return;
  const group = resultGroup(parent, 'What the evidence says about collection', headingLevel);
  for (const route of routes) {
    const label = text(route.label || route.mode || route.route).replaceAll('_', ' ') || 'Collection route';
    const itemLevel = Math.min(headingLevel + 1, 6);
    const entry = card(group, label, route.status, text(route.reason || route.detail), itemLevel);
    plainList(entry, 'Evidence', route.evidence, Math.min(itemLevel + 1, 6));
  }
}

function resetFormA11y(form) {
  form.removeAttribute('aria-busy');
  for (const field of form.querySelectorAll('[aria-invalid="true"]')) {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }
}

function setFormBusy(form, busy) {
  form.setAttribute('aria-busy', String(busy));
}

function focusFormError(form, messageId, preferredField = null) {
  const field = form.querySelector(':invalid') || preferredField;
  if (!field) return;
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', messageId);
  field.focus();
}

export function focusRenderedResult(target) {
  const focusTarget = target.querySelector('.preview-results-title') || target;
  focusTarget.setAttribute('tabindex', '-1');
  focusTarget.focus();
}

function renderLookup(payload) {
  const target = byId('lookup-results');
  target.replaceChildren();
  target.hidden = false;
  target.appendChild(statusBadge(payload.status));
  add(target, 'h4', 'preview-results-title', 'Device lookup');
  add(target, 'p', '', payload.summary);
  for (const device of payload.devices.slice(0, 20)) {
    const name = [device.make, device.model].map(text).filter(Boolean).join(' ') || 'Device record';
    const basis = device.match_basis === 'vendor_family'
      ? 'Evidence covers a vendor or export family. This exact model is not hardware qualified.'
      : 'The entered make and model have not been verified in the public catalog.';
    const item = card(target, name, payload.status, basis, 5);
    renderRoutes(item, device.routes, 6);
    if (list(device.capabilities).length) {
      const group = resultGroup(item, 'Recorded capabilities', 6);
      for (const capability of device.capabilities.slice(0, 20)) {
        card(group, text(capability.name || capability.label) || 'Capability', capability.status, text(capability.reason), 6);
      }
    }
  }
  plainList(target, 'What still needs verification', payload.limitations);
  if (!payload.devices.length) add(target, 'p', 'preview-result-caveat', 'No verified make and model match was returned. This does not mean the device is unsupported.');
}

export function renderPreview(payload, target = byId('preview-results'), options = {}) {
  const titleLevel = Math.min(4, Math.max(2, Number(options.headingLevel) || 4));
  const groupLevel = Math.min(titleLevel + 1, 6);
  const itemLevel = Math.min(groupLevel + 1, 6);
  target.replaceChildren();
  target.hidden = false;
  target.appendChild(statusBadge(payload.status));
  add(target, headingTag(titleLevel), 'preview-results-title', 'Your configuration preview');
  add(target, 'p', '', payload.summary);
  if (payload.files.length) {
    const group = resultGroup(target, 'Files reviewed', groupLevel);
    for (const file of payload.files.slice(0, 5)) {
      const name = text(file.name || file.filename) || 'File';
      card(group, name, file.status, [file.format, file.reason || file.detail].map(text).filter(Boolean).join(' · '), itemLevel);
    }
  }
  if (list(payload.findings).length) {
    const group = resultGroup(target, 'Prioritized findings', groupLevel);
    for (const finding of payload.findings.slice(0, 50)) {
      const entry = card(group, text(finding.title || finding.description || finding.type) || 'Finding', finding.severity || finding.status, text(finding.description), itemLevel);
      if (finding.evidence) add(entry, 'p', '', `Evidence: ${text(finding.evidence)}`);
      if (finding.recommendation) add(entry, 'p', '', `Next action: ${text(finding.recommendation)}`);
      if (finding.file_name || finding.source) add(entry, 'p', '', `Source: ${text(finding.file_name || finding.source)}`);
      if (finding.source_status) add(entry, 'p', '', `Source status: ${text(finding.source_status).replaceAll('_', ' ')}`);
      if (finding.evidence_status) add(entry, 'p', '', `Evidence age: ${text(finding.evidence_status).replaceAll('_', ' ')}`);
    }
  } else {
    add(target, 'p', 'preview-result-caveat', 'No findings were produced by the completed checks. Unassessed areas remain unknown.');
  }
  if (list(payload.devices).length) {
    const group = resultGroup(target, 'Observed devices', groupLevel);
    for (const device of payload.devices.slice(0, 20)) {
      const name = [device.make, device.model].map(text).filter(Boolean).join(' ') || text(device.name) || 'Observed device';
      const entry = card(group, name, device.status || 'not_verified', text(device.reason || device.match_basis), itemLevel);
      renderRoutes(entry, device.routes, Math.min(itemLevel + 1, 6));
    }
  }
  if (list(payload.coverage).length) {
    const group = resultGroup(target, 'Checks and coverage', groupLevel);
    for (const check of payload.coverage.slice(0, 50)) {
      card(group, text(check.check || check.name || check.method) || 'Check', check.status, text(check.reason || check.detail), itemLevel);
    }
  }
  if (list(payload.advisories).length) {
    const group = resultGroup(target, 'Advisory context', groupLevel);
    for (const advisory of payload.advisories.slice(0, 20)) {
      card(group, text(advisory.id || advisory.advisory_id) || 'Advisory', advisory.status,
        [advisory.basis || advisory.reason, advisory.source_status ? `Source status: ${advisory.source_status}` : ''].map(text).filter(Boolean).join(' · '), itemLevel);
    }
  }
  plainList(target, 'Recommended next steps', payload.recommendations, groupLevel);
  plainList(target, 'Limits of this preview', payload.limitations, groupLevel);
}

export async function fetchJson(url, options = {}, purpose = 'preview') {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, credentials: 'omit' });
    if (!response.ok) {
      if (purpose === 'verify' && response.status === 404) throw new Error('This report link is invalid or has expired. Start a new preview to request another.');
      if (purpose === 'lead' && response.status === 409) throw new Error('This preview has already been used to request an email report. Start a new preview to request another.');
      if (purpose === 'lead' && response.status === 422) throw new Error('This preview is no longer eligible for an email report. Start a new preview.');
      if (purpose === 'lead' && response.status === 503) throw new Error('Email delivery is unavailable right now. Your on-page results remain available.');
      if (purpose === 'sample' && [404, 503].includes(response.status)) throw new Error('Sample sharing is unavailable right now. Your preview remains available.');
      if (purpose === 'sample' && response.status === 413) throw new Error('The sample exceeds the 1 MiB limit.');
      if (purpose === 'sample' && [415, 422].includes(response.status)) throw new Error('The sample was not accepted. Use a sanitized UTF-8 text file.');
      if (purpose === 'sample' && response.status === 429) throw new Error('Too many sample requests. Please try again later.');
      if (response.status === 404 || response.status === 503) throw new Error('The preview service is not available yet. You can still request a reviewed assessment.');
      if (response.status === 413) throw new Error('The uploaded files exceed the service limit.');
      if (response.status === 422 || response.status === 400) throw new Error('The service could not analyze these files. Check the formats and remove any remaining secrets.');
      throw new Error('The preview service could not complete this request. Please try again.');
    }
    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('The preview timed out. Please try again.');
    if (error instanceof TypeError) throw new Error('The preview service could not be reached. Please try again later.');
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

const lookupForm = byId('lookup-form');
if (lookupForm) {
if (previewEnabled) {
  for (const button of document.querySelectorAll('[data-preview-submit]')) button.disabled = false;
} else {
  for (const form of document.querySelectorAll('.preview-panel form')) {
    form.setAttribute('aria-disabled', 'true');
    for (const control of form.querySelectorAll('input, select, textarea, button')) control.disabled = true;
  }
  message('lookup-message', PREVIEW_UNAVAILABLE);
  message('preview-message', PREVIEW_UNAVAILABLE);
}
let reportHandle = null;
let reportContext = null;
let shareableFiles = [];
const samplePanel = byId('sample-contribution');
const sampleForm = byId('sample-contribution-form');
function resetSample() {
  shareableFiles = [];
  samplePanel.hidden = true;
  sampleForm.hidden = false;
  byId('sample-file').replaceChildren();
  byId('sample-consent').checked = false;
  message('sample-message', '');
}

function showSampleOptions(files, reportedFiles) {
  if (!sampleSharingEnabled) return;
  const candidates = sampleCandidates(files, reportedFiles);
  if (!candidates.length) return;
  samplePanel.hidden = false;
  shareableFiles = candidates.filter(({ file }) => file.size <= MAX_SAMPLE_BYTES);
  if (!shareableFiles.length) {
    sampleForm.hidden = true;
    message('sample-message', 'Sample sharing accepts one text file up to 1 MiB. Create a smaller sanitized export and run a new preview.');
    return;
  }
  const select = byId('sample-file');
  for (const [index, candidate] of shareableFiles.entries()) {
    const option = node('option', '', `${candidate.file.name} · ${candidate.status}`);
    option.value = String(index);
    select.appendChild(option);
  }
}
lookupForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!previewEnabled) {
    message('lookup-message', PREVIEW_UNAVAILABLE);
    return;
  }
  const button = lookupForm.querySelector('button[type=submit]');
  resetFormA11y(lookupForm);
  setFormBusy(lookupForm, true);
  button.disabled = true;
  byId('lookup-results').hidden = true;
  message('lookup-message', 'Checking the recorded device evidence…');
  try {
    const url = buildLookupUrl(byId('device-make').value, byId('device-model').value, apiBase, window.location.origin);
    const payload = validateResponse(await fetchJson(url), 'lookup');
    renderLookup(payload);
    message('lookup-message', 'Device evidence loaded.');
    focusRenderedResult(byId('lookup-results'));
  } catch (error) {
    message('lookup-message', error instanceof Error ? error.message : 'Device lookup failed.', 'error');
    const blankField = [byId('device-make'), byId('device-model')].find(field => !field.value.trim());
    focusFormError(lookupForm, 'lookup-message', blankField);
  } finally {
    setFormBusy(lookupForm, false);
    button.disabled = false;
  }
});

for (const choice of document.querySelectorAll('input[name=path]')) {
  choice.addEventListener('change', () => { byId('client-label-wrap').hidden = document.querySelector('input[name=path]:checked')?.value !== 'partner'; });
}

const fileInput = byId('config-files');
fileInput.addEventListener('change', () => {
  resetSample();
  byId('preview-results').hidden = true;
  byId('report-delivery').hidden = true;
  reportHandle = null;
  reportContext = null;
  const listElement = byId('file-list');
  listElement.replaceChildren();
  for (const file of Array.from(fileInput.files || [])) {
    const item = node('li');
    add(item, 'span', '', file.name);
    add(item, 'span', '', `${(file.size / 1024).toFixed(0)} KiB`);
    listElement.appendChild(item);
  }
  try { if (fileInput.files?.length) validateFiles(fileInput.files); message('preview-message', ''); }
  catch (error) { message('preview-message', error.message, 'error'); }
});

const previewForm = byId('preview-form');
previewForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!previewEnabled) {
    message('preview-message', PREVIEW_UNAVAILABLE);
    return;
  }
  const button = previewForm.querySelector('button[type=submit]');
  resetFormA11y(previewForm);
  setFormBusy(previewForm, true);
  let errorField = fileInput;
  button.disabled = true;
  fileInput.disabled = true;
  byId('preview-results').hidden = true;
  byId('report-delivery').hidden = true;
  resetSample();
  reportHandle = null;
  reportContext = null;
  message('preview-message', 'Checking files before upload…');
  try {
    const files = validateFiles(fileInput.files);
    errorField = byId('sanitized-confirm');
    if (!errorField.checked) throw new Error('Confirm that these copies have been sanitized before upload.');
    errorField = byId('observed-at');
    const observedAt = observedAtIso(byId('observed-at').value);
    errorField = fileInput;
    for (const file of files) {
      const content = await file.text();
      if (looksBinary(content)) throw new Error(`${file.name} appears to be binary. Use a text export.`);
      const warnings = secretWarnings(content);
      if (warnings.length) throw new Error(`${file.name} may contain ${warnings.join(' or ')}. Remove it from a copy and try again.`);
    }
    const body = new FormData();
    for (const file of files) body.append('files', file, file.name);
    body.append('path', document.querySelector('input[name=path]:checked')?.value === 'partner' ? 'partner' : 'direct');
    const clientLabel = byId('client-label').value.trim();
    if (body.get('path') === 'partner' && clientLabel) body.append('client_label', clientLabel);
    if (observedAt) body.append('observed_at', observedAt);
    message('preview-message', 'Reviewing the supported evidence in your files…');
    const payload = validateResponse(await fetchJson(apiUrl('/api/public/config-preview', apiBase, window.location.origin), { method: 'POST', body }), 'preview');
    renderPreview(payload);
    message('preview-message', 'Configuration preview ready.');
    focusRenderedResult(byId('preview-results'));
    showSampleOptions(files, payload.files);
    reportHandle = typeof payload.report_handle === 'string' && payload.report_handle ? payload.report_handle : null;
    if (reportHandle) {
      reportContext = { path: payload.path, clientLabel: payload.client_label };
      byId('report-email-form').hidden = false;
      byId('report-delivery').hidden = false;
      message('report-email-message', '');
    }
    else add(byId('preview-results'), 'p', 'preview-result-caveat', 'Email delivery is unavailable for this preview. Your on-page results remain available.');
  } catch (error) {
    message('preview-message', error instanceof Error ? error.message : 'Configuration preview failed.', 'error');
    fileInput.disabled = false;
    focusFormError(previewForm, 'preview-message', errorField);
  } finally {
    setFormBusy(previewForm, false);
    button.disabled = false;
    fileInput.disabled = false;
  }
});

sampleForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!previewEnabled) {
    message('sample-message', PREVIEW_UNAVAILABLE);
    return;
  }
  const button = sampleForm.querySelector('button[type=submit]');
  resetFormA11y(sampleForm);
  setFormBusy(sampleForm, true);
  button.disabled = true;
  const previewButton = previewForm.querySelector('button[type=submit]');
  previewButton.disabled = true;
  fileInput.disabled = true;
  message('sample-message', 'Checking the selected sample…');
  try {
    const choice = Number(byId('sample-file').value);
    const candidate = Number.isInteger(choice) ? shareableFiles[choice] : null;
    const file = validateSampleFile(candidate?.file, byId('sample-consent').checked);
    let content;
    try { content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); }
    catch { throw new Error('The selected sample must be UTF-8 text.'); }
    if (looksBinary(content)) throw new Error('The selected sample appears to be binary. Use a text export.');
    const warnings = secretWarnings(content);
    if (warnings.length) throw new Error(`The selected sample may contain ${warnings.join(' or ')}. Remove it from a copy and try again.`);
    const body = new FormData();
    body.append('file', file, file.name);
    body.append('consent', 'true');
    message('sample-message', 'Sharing your sanitized sample for manual review…');
    const response = await fetchJson(apiUrl('/api/public/preview-sample', apiBase, window.location.origin), { method: 'POST', body }, 'sample');
    if (response?.status !== 'accepted') throw new Error('Sample sharing could not be confirmed. Please try again later.');
    sampleForm.hidden = true;
    message('sample-message', 'Sample received for manual review. It will not change this preview or create an automatic report or follow-up.');
  } catch (error) {
    message('sample-message', error instanceof Error ? error.message : 'Sample sharing failed.', 'error');
    focusFormError(sampleForm, 'sample-message', byId('sample-consent'));
  } finally {
    setFormBusy(sampleForm, false);
    button.disabled = false;
    previewButton.disabled = false;
    fileInput.disabled = false;
  }
});

const emailForm = byId('report-email-form');
emailForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!previewEnabled) {
    message('report-email-message', PREVIEW_UNAVAILABLE);
    return;
  }
  const button = emailForm.querySelector('button[type=submit]');
  resetFormA11y(emailForm);
  setFormBusy(emailForm, true);
  button.disabled = true;
  message('report-email-message', 'Requesting a verification email…');
  try {
    const body = buildLeadPayload({
      reportHandle, name: byId('lead-name').value, email: byId('lead-email').value,
      company: byId('lead-company').value,
      path: reportContext?.path,
      clientLabel: reportContext?.clientLabel, consent: byId('lead-consent').checked,
    });
    const response = await fetchJson(apiUrl('/api/public/preview-lead', apiBase, window.location.origin), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }, 'lead');
    const confirmation = verificationMessage(response?.status);
    reportHandle = null;
    emailForm.hidden = true;
    message('report-email-message', confirmation);
  } catch (error) {
    message('report-email-message', error instanceof Error ? error.message : 'Email request failed.', 'error');
    const email = byId('lead-email');
    const invalidContact = !byId('lead-name').value.trim() ? byId('lead-name')
      : !email.value.trim() || !email.validity.valid ? email
        : !byId('lead-company').value.trim() ? byId('lead-company')
          : !byId('lead-consent').checked ? byId('lead-consent') : null;
    focusFormError(emailForm, 'report-email-message', invalidContact);
  } finally {
    setFormBusy(emailForm, false);
    button.disabled = false;
  }
});
}

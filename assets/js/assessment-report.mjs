import { apiUrl, tokenFromHash, validateResponse } from './assessment-preview-core.mjs';
import { fetchJson, focusRenderedResult, renderPreview } from './assessment-preview.mjs';

const status = document.getElementById('report-status');
const target = document.getElementById('verified-report');
const contactTarget = document.getElementById('report-contact');
const token = tokenFromHash(window.location.hash);
if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);

async function loadReport() {
  if (!token) {
    target.setAttribute('aria-busy', 'false');
    status.dataset.tone = 'error';
    status.textContent = 'Open the verification link from your email, or start a new preview.';
    status.setAttribute('tabindex', '-1');
    status.focus();
    return;
  }
  try {
    const base = window.SPOTLIGHT_PREVIEW_API_BASE || '';
    const response = await fetchJson(apiUrl('/api/public/preview-report/verify', base, window.location.origin), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
    }, 'verify');
    if (response?.status !== 'verified') throw new Error('This report could not be verified. Start a new preview.');
    const report = validateResponse(response.report, 'preview');
    renderPreview(report, target, { headingLevel: 2 });
    const contact = response.contact;
    if (contact && typeof contact === 'object') {
      const parts = [contact.name, contact.company, contact.client_label].filter(value => typeof value === 'string' && value.trim());
      if (parts.length) {
        contactTarget.textContent = `Prepared for ${parts.join(' · ')}`;
        contactTarget.hidden = false;
      }
    }
    target.setAttribute('aria-busy', 'false');
    status.dataset.tone = 'info';
    status.textContent = 'Preview report verified.';
    focusRenderedResult(target);
  } catch (error) {
    target.setAttribute('aria-busy', 'false');
    status.dataset.tone = 'error';
    status.textContent = error instanceof Error ? error.message : 'This report could not be verified. Start a new preview.';
    status.setAttribute('tabindex', '-1');
    status.focus();
  }
}

void loadReport();

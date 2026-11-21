export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
export const MAX_REPORT_HANDLE_CHARS = 60_000;
export const ALLOWED_EXTENSIONS = new Set(['txt', 'cfg', 'conf', 'json', 'xml', 'csv', 'tsv', 'rsc', 'exp', 'nessus', 'log']);

export function apiUrl(path, configuredBase = '', pageOrigin = globalThis.location?.origin) {
  if (!path.startsWith('/api/public/')) throw new Error('Invalid preview API path.');
  if (!pageOrigin) throw new Error('Preview page origin is unavailable.');
  const base = new URL(configuredBase || pageOrigin, pageOrigin);
  if ((base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname)) ||
      base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('The preview API base must be an HTTPS origin.');
  }
  return new URL(path, base.origin);
}

export function buildLookupUrl(make, model, configuredBase = '', pageOrigin) {
  const trimmedMake = make.trim();
  const trimmedModel = model.trim();
  if (!trimmedMake || !trimmedModel || trimmedMake.length > 80 || trimmedModel.length > 120) {
    throw new Error('Enter a make and exact model to search.');
  }
  const url = apiUrl('/api/public/device-lookup', configuredBase, pageOrigin);
  url.searchParams.set('make', trimmedMake);
  url.searchParams.set('model', trimmedModel);
  return url;
}

export function validateFiles(input) {
  const files = Array.from(input || []);
  if (files.length < 1 || files.length > MAX_FILES) throw new Error(`Choose 1 to ${MAX_FILES} files.`);
  let total = 0;
  for (const file of files) {
    const name = String(file.name || '');
    const extension = name.split('.').at(-1)?.toLowerCase() || '';
    if (!name || name.length > 180 || !ALLOWED_EXTENSIONS.has(extension)) {
      throw new Error(`${name || 'A file'} is not a supported text export.`);
    }
    if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > MAX_FILE_BYTES) {
      throw new Error(`${name} must be between 1 byte and 5 MiB.`);
    }
    total += file.size;
  }
  if (total > MAX_TOTAL_BYTES) throw new Error('The files exceed the combined 20 MiB limit.');
  return files;
}

export function observedAtIso(localValue, nowMs = Date.now()) {
  if (!localValue) return '';
  const parsed = new Date(localValue);
  if (Number.isNaN(parsed.getTime()) || parsed.getTime() > nowMs + 5 * 60 * 1000) {
    throw new Error('Enter a valid collection time that is not in the future, or leave it blank.');
  }
  return parsed.toISOString();
}

function redacted(value) {
  return /^(?:<redacted>|redacted|removed|masked|x{4,}|\*{3,}|\[redacted\])$/i.test(value.replace(/^['"]|['"]$/g, ''));
}

export function secretWarnings(content) {
  const warnings = new Set();
  if (/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/i.test(content)) warnings.add('private key');
  if (/\bAuthorization\s*:\s*Bearer\s+\S+/i.test(content)) warnings.add('bearer token');
  const assignments = /\b(password|passwd|passphrase|api[_-]?key|access[_-]?token|client[_-]?secret|shared[_-]?secret)\b\s*(?:=|:)\s*([^\s#;]+)/gi;
  for (const match of content.matchAll(assignments)) if (!redacted(match[2])) warnings.add('credential assignment');
  const commands = /(?:^|\n)\s*(?:enable\s+secret|username\s+\S+\s+(?:password|secret)|snmp-server\s+community)\s+(\S+)/gi;
  for (const match of content.matchAll(commands)) if (!redacted(match[1])) warnings.add('configuration secret');
  return [...warnings];
}

export function looksBinary(content) {
  const head = content.slice(0, 4096);
  if (head.includes('\0')) return true;
  const controls = [...head].filter(char => { const code = char.charCodeAt(0); return code < 32 && ![9, 10, 13].includes(code); }).length;
  return head.length > 0 && controls / head.length > .02;
}

export function validateResponse(payload, kind) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.schema_version !== 1) {
    throw new Error('The preview service returned an unsupported response.');
  }
  if (typeof payload.summary !== 'string') throw new Error('The preview response is missing its summary.');
  if (kind === 'lookup' && !Array.isArray(payload.devices)) throw new Error('The device lookup response is incomplete.');
  if (kind === 'preview' && (!Array.isArray(payload.files) || !Array.isArray(payload.findings))) {
    throw new Error('The configuration preview response is incomplete.');
  }
  return payload;
}

export function buildLeadPayload({ reportHandle, name, email, company, path, clientLabel = '', consent }) {
  const trimmedName = String(name || '').trim();
  const trimmedEmail = String(email || '').trim();
  const trimmedCompany = String(company || '').trim();
  const trimmedClient = String(clientLabel || '').trim();
  if (typeof reportHandle !== 'string' || !reportHandle || reportHandle.length > MAX_REPORT_HANDLE_CHARS) {
    throw new Error('Run a new configuration preview before requesting an email report.');
  }
  if (!trimmedName || trimmedName.length > 100 || !trimmedCompany || trimmedCompany.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 254) {
    throw new Error('Enter your name, organization, and a valid work email.');
  }
  if (!consent) throw new Error('Consent is required to email this report.');
  if (trimmedClient.length > 100) throw new Error('Use a client label of 100 characters or fewer.');
  const audience = path === 'partner' ? 'msp' : 'company';
  return {
    report_handle: reportHandle, name: trimmedName, email: trimmedEmail,
    company: trimmedCompany, audience, consent: true,
    ...(audience === 'msp' && trimmedClient ? { client_label: trimmedClient } : {}),
  };
}

export function tokenFromHash(hash) {
  const token = new URLSearchParams(String(hash || '').replace(/^#/, '')).get('token') || '';
  return token.length <= 4096 ? token : '';
}

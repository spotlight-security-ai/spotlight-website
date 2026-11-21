# Public assessment preview contract

This is the public, deterministic API consumed by `assessment-preview.html`. The
UI defaults to the site origin. `assets/js/preview-config.js` can select a separate
HTTPS origin; the API must then allow the site origin with CORS. The configured
base is an origin, without a path or credential. Nothing in this contract grants
device access or starts a scan.

## Device lookup

`GET /api/public/device-lookup?make=<text>&model=<text>` returns JSON:

```json
{
  "schema_version": 1,
  "catalog_version": "public-preview-1",
  "status": "matched",
  "summary": "Vendor-family export information is available; exact model qualification is unverified.",
  "devices": [{
    "make": "Example vendor",
    "model": "Example model",
    "match_basis": "vendor_family",
    "identity_confidence": "user_supplied",
    "routes": [{
      "mode": "agentless",
      "status": "fixture_validated",
      "label": "Configuration export",
      "reason": "A parser was tested with an export fixture; hardware was not qualified.",
      "evidence": ["Fixture replay"]
    }],
    "capabilities": []
  }],
  "limitations": ["Make and model are user supplied; no device was contacted."]
}
```

`status` is `matched`, `needs_detail`, or `not_verified`. A route status is
`not_verified`, `candidate`, or `fixture_validated`. These statuses never imply
production enrollment, continuous monitoring, device writes, or vendor approval.

## Configuration preview

`POST /api/public/config-preview` accepts multipart form data:

| Field | Meaning |
| --- | --- |
| `files` | 1–5 text exports, each at most 5 MiB and 20 MiB combined. Repeat the field for multiple files. |
| `path` | `direct` or `partner`; defaults to `direct`. |
| `client_label` | Optional partner label, at most 100 characters. |
| `observed_at` | Optional ISO 8601 collection timestamp. Missing or stale time limits confidence. |

Allowed filename extensions: `.txt`, `.cfg`, `.conf`, `.json`, `.xml`, `.csv`,
`.tsv`, `.rsc`, `.exp`, `.nessus`, `.log`. The API rejects binary files and
archives. Visitors must use redacted copies; both client and server perform
best-effort secret checks. The UI never sends configuration files to the
Pipedrive form or chatbot.

The JSON response has this shape (content below is illustrative):

```json
{
  "schema_version": 1,
  "catalog_version": "public-preview-1",
  "status": "partial",
  "summary": "One file was recognized; two checks need more evidence.",
  "path": "direct",
  "client_label": null,
  "observed_at": null,
  "files": [{"name": "redacted.cfg", "format": "example", "status": "recognized", "reason": "Text export recognized."}],
  "devices": [],
  "findings": [{
    "id": "example-1", "kind": "configuration_posture", "severity": "medium",
    "title": "Example finding", "description": "A supported setting was observed.",
    "evidence": "Redacted evidence summary", "recommendation": "Review with the network owner.",
    "file_name": "redacted.cfg", "source_status": "undated", "evidence_status": "undated"
  }],
  "advisories": [],
  "coverage": [{"check": "management settings", "status": "completed", "reason": "Explicit setting found."}],
  "recommendations": [{"title": "Confirm collection date", "detail": "Supply the export's actual collection time."}],
  "limitations": ["A file does not prove network exposure or continuous monitoring."],
  "report_handle": null
}
```

Top-level `status` is `complete`, `partial`, or `unsupported`; file status is
`recognized`, `partial`, `unsupported`, or `rejected`. `report_handle` is a
short-lived signed handoff only when the server has report signing configured.
The site shows email delivery only when this handle is present.
Findings include `evidence_status` (`current`, `stale`, or `undated`) and
`source_status` (`observed`, `undated`, or `imported_assertion`) so an old export
or imported scanner claim is not presented as a fresh observation.

## Verified email report

When a report handle exists, the optional form sends
`POST /api/public/preview-lead` as JSON:

```json
{"report_handle":"opaque","name":"Ava","email":"ava@example.com","company":"Example Utility","audience":"company","consent":true}
```

`audience` is `company` or `msp`. MSP requests may include `client_label`.
HTTP 202 returns `{"status":"verification_sent","expires_at":"..."}`.
HTTP 409 means the handle was already used; 422 means it is invalid; 503 means
delivery is unavailable. The on-page result remains available in all cases.

Email links open `assessment-report.html#token=<opaque>`. The page removes the
fragment from the address bar and sends `{ "token": "opaque" }` to
`POST /api/public/preview-report/verify`. HTTP 200 returns
`{"status":"verified","report":<sanitized preview response>,"contact":<name/company/audience/client_label>,"expires_at":"..."}`.
Invalid or expired tokens return 404. The page and API report responses must
be `no-store`; the page is also `noindex`. The report page reuses the same
finding and coverage renderer as the instant preview.

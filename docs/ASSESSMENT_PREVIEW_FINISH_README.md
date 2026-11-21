# Spotlight Assessment Preview

## Co-founder finish and launch README

Last verified: November 21, 2026

This is the shared checklist for finishing and launching Spotlight's public device and configuration assessment preview. It is written so product, sales, operations, and engineering can use the same plan.

## The two-minute version

The first working version is built. The website code is on `main`, and the complete backend stack is on Sentinel's `dev` branch. Both are deployed in a deliberately disabled state; this is a dark deployment, not a public launch.

- Website: [spotlight-website PR #33](https://github.com/spotlight-security-ai/spotlight-website/pull/33) merged into `main` on November 21, 2026
- Assessment foundation: [Sentinel PR #392](https://github.com/spotlight-security-ai/sentinel/pull/392), merged into `dev`
- Assessment/intelligence dependency: [Sentinel PR #492](https://github.com/spotlight-security-ai/sentinel/pull/492), merged into `dev`
- Assessment API: [Sentinel PR #491](https://github.com/spotlight-security-ai/sentinel/pull/491), merged into `dev`
- Website validation: 16 tests passed, plus desktop/mobile review and accessibility hardening
- Backend validation: every PR passed its integrated full-QA gate before merge. The final stack passed the complete Sentinel suite, the public-preview focused and PostgreSQL jobs, cross-engine PostgreSQL checks, container builds, and the Ubuntu/Windows assessment package matrix.
- Backend deployment: each merge passed the staging ECS canary before deploying the same image to dev. The API, liveness worker, process-metrics worker, and process-anomaly worker are green.
- The production assessment pages and the staging/dev backend are deployed, but the assessment feature has not launched
- All public features are off by default
- No AI is used today

The production [assessment page](https://spotlightsecurity.ai/assessment-preview.html) is available for visual review. It is fail-closed: the website switch is `false`, the API base is empty, and optional sample sharing is `false`. The backend is now dark-deployed, but live assessment actions still will not work until the site is deliberately connected and both sides are enabled.

Before launch, the team must choose the public API address or proxy, finish the environment and provider configuration, connect the website, approve the public data notice, and complete one end-to-end staging test. No feature gate should be enabled before those steps pass.

## Known release blockers

These are unfinished release tasks, not optional improvements:

1. **Website-to-API connection:** the Netlify site has no API proxy, its configured API base is currently empty, and its explicit core switch is off.
2. **Environment and provider configuration:** the team still needs approved origins, ingress limits, production signing/encryption secrets, an advisory bundle, email delivery, Pipedrive, and Slack settings. Keep credentials server-side; the website configuration must never contain a key.
3. **Public data notice:** the site explains sanitization beside the upload, but it does not currently provide a general privacy-policy or terms page/link covering the report, CRM, Slack, and optional sample flows. The founders must approve and publish the appropriate notice before collecting contact details or samples.
4. **End-to-end acceptance:** make/model search, configuration analysis, private reports, expiry/cleanup, and any enabled lead delivery still need a controlled staging pass using team-owned data.

Engineering has fixed case-insensitive vendor-name normalization and added regression coverage. Uploads now remain inside route-bounded memory, parser failures cannot log uploaded values, browser origins must match an exact allowlist, and report verification no longer waits for CRM or Slack. The website also stays inert until its separate core switch is enabled. The optional sample panel remains hidden by default at both the website and backend gates, so the core preview can launch without presenting a dead sample-retention flow.

## Start here: the seven finish steps

If you do not need the technical detail yet, use this list and assign one owner to each item.

- [x] Merge PRs #392, #492, and #491 into Sentinel `dev` in dependency order.
- [x] Pass full backend CI on each integrated head and dark-deploy staging/dev.
- [ ] Approve the customer claims, consent text, and privacy/terms notice.
- [ ] Finish the dark-deployment configuration: origins, ingress limits, advisory data, secrets, and providers.
- [ ] Connect the Netlify website to the HTTPS API and pass staging tests.
- [ ] Pass the verified email, Pipedrive, and Slack test.
- [ ] Launch the core preview, monitor it, and leave sample collection off until it has a named owner.

The rest of this file is the detailed runbook for those seven steps.

## What a visitor can do

1. Search by device make and model, or upload one to five sanitized text configuration files.
2. Receive an immediate result showing recognized devices, security findings, possible vulnerability matches, gaps, evidence, and coverage limits.
3. See whether an export, possible sidecar, or native agent path is known for that vendor family.
4. Optionally request a private report by email.
5. After opening the email link, become a verified Pipedrive lead and trigger a short Slack alert.
6. Separately opt in to contribute one sanitized unsupported-format sample for manual review.

Normal preview uploads are analyzed in memory and are not retained. Only the separate, explicit sample contribution flow stores file content.

## Decisions the founders need to make

Fill these in before asking engineering to launch.

| Decision | Choice | Owner |
| --- | --- | --- |
| Final Sentinel release branch and merge path | `dev`: PR #392, then #492, then #491 | Engineering |
| Public API address, such as `https://api.example.com` or a same-origin proxy | ____________________ | ____________________ |
| Email service: AWS SES or TLS SMTP | ____________________ | ____________________ |
| Verified sender address | ____________________ | ____________________ |
| Pipedrive account and Leads Inbox/ownership process | ____________________ | ____________________ |
| Slack channel for verified leads | ____________________ | ____________________ |
| Launch both direct-company and MSP paths? | Yes / No | ____________________ |
| Collect unsupported samples at launch? Recommended: No | Yes / No | ____________________ |
| Privacy/terms wording and public link | ____________________ | ____________________ |
| Person responsible for contributed-sample review | ____________________ | ____________________ |
| Person responsible for launch monitoring and shutoff | ____________________ | ____________________ |
| Launch date and time | ____________________ | ____________________ |

## Backend landing order

The website PR was merged directly into the website's `main` branch. The backend dependency chain is also merged:

```text
Sentinel PR #392: agentless assessments (merged into dev)
             ↓
Sentinel PR #492: assessment and intelligence handoff (merged into dev)
             ↓
Sentinel PR #491: public preview API (merged into dev)
```

PR #491 is the public-preview layer on top of PR #492. PR #492 contains the parser, device-intelligence, and advisory work the preview uses. PR #392 provides the assessment foundation. All three now share the `dev` release line.

Engineering retargeted each PR to the current `dev`, ran the complete required CI set, merged it in dependency order, and verified staging and dev after every merge. These PR branches are historical now; do not re-stack or cherry-pick them for launch.

## Recommended finish and launch order

### Stage 1: Review and prepare the release

- [ ] Assign the owners in the decision table.
- [ ] Review the customer wording and the claims in this README.
- [x] Merge PR #392 into Sentinel `dev` with the required checks passing.
- [x] Validate and merge PR #492 into `dev`.
- [x] Retarget, validate, and merge PR #491 into `dev`.
- [x] Fix case-insensitive vendor-name normalization and add regression tests.
- [x] Add a dedicated public-preview GitHub CI workflow for draft and stacked PRs.
- [x] Confirm the new focused and PostgreSQL workflow jobs pass.
- [x] Run full Sentinel GitHub CI on the final integration branch.
- [ ] Approve and publish the applicable privacy/terms notice.
- [x] Review, merge, and deploy website PR #33 with all public switches off.
- [x] Review and approve the final backend PR.
- [x] Keep every public feature switch off.

### Stage 2: Dark-deploy the backend

A dark deployment installs the code without exposing the feature. Staging and dev are deployed and green; the remaining items below are the production-readiness configuration and verification work.

- [x] Deploy the backend and scheduler to staging and dev with all public switches set to `false`.
- [ ] Back up the target database using the normal deployment procedure.
- [x] Apply migrations through revision `20261121_0066` in staging and dev through the normal deployment path.
- [ ] Configure a current advisory bundle.
- [ ] Put the API behind HTTPS.
- [ ] Set edge request-size and rate limits.
- [ ] Ensure the proxy forwards the real client address only from trusted proxy hops.
- [ ] Set `SPOTLIGHT_PUBLIC_PREVIEW_ALLOWED_ORIGINS` to the exact approved website origin or origins.
- [ ] Restrict browser access to the approved website origin, or use a same-origin proxy.
- [ ] Confirm the cleanup and delivery-retry scheduler is running.

The current Sentinel application retains permissive CORS for legacy routes, but the public-preview middleware rejects browser requests outside `SPOTLIGHT_PUBLIC_PREVIEW_ALLOWED_ORIGINS` and returns the approved origin exactly. Keep edge limits too; the application allowlist is not a replacement for ingress abuse controls.

### Stage 3: Connect and test the website in staging

The website currently has its core switch off. Its empty API base means same-origin only after that switch is enabled. Netlify does not currently proxy `/api/public/*`.

- [ ] Set `assets/js/preview-config.js` to the approved HTTPS API origin with no path, key, or credential; or install a trusted same-origin proxy.
- [ ] If using a separate API origin, add that exact origin to `connect-src` for both assessment pages in `netlify.toml`.
- [ ] Put the staging website origin in `SPOTLIGHT_PUBLIC_PREVIEW_ALLOWED_ORIGINS` and allow it at the API edge.
- [ ] Enable only `SPOTLIGHT_PUBLIC_PREVIEW_ENABLED` in staging.
- [ ] Set `window.SPOTLIGHT_PREVIEW_ENABLED = true` and deploy the static site to staging only after the API and CSP are ready.
- [ ] Test make/model lookup.
- [ ] Test supported, partial, unsupported, stale, multi-file, and rejected-secret uploads.
- [ ] Confirm configuration bytes do not appear in logs, Pipedrive, or Slack.
- [ ] Confirm the page works on a phone-sized screen.
- [ ] Run `uv run python tools/public-preview-smoke.py https://approved-api-origin.example` from the reviewed backend checkout.

### Stage 4: Test email reports and lead delivery

- [ ] Verify the sender identity and move the email service out of any test sandbox.
- [ ] Configure SES or SMTP.
- [ ] Configure the Pipedrive account slug and API token.
- [ ] Configure the Slack incoming webhook.
- [ ] Generate production report-signing and encryption keys.
- [ ] Enable `SPOTLIGHT_PREVIEW_LEADS_ENABLED` in staging.
- [ ] Request a report with a real team-controlled email address.
- [ ] Open the private link and confirm the report loads.
- [ ] Allow up to one two-minute scheduler tick, then confirm exactly the expected Person and Lead appear in Pipedrive.
- [ ] After that scheduler tick, confirm Slack receives only the short signup summary.
- [ ] Confirm uploaded file content and finding evidence are absent from Pipedrive and Slack.
- [ ] Exercise one controlled delivery failure and confirm the retry recovers.
- [ ] Confirm report access and local contact data expire after 24 hours.

Delivery is designed for at-least-once behavior. A rare duplicate email, CRM request, or Slack alert is possible if a provider accepts a request but its acknowledgement is lost. The stable preview reference should be used to reconcile duplicates.

### Stage 5: Launch the core preview

- [ ] Deploy the backend before exposing the website entry point.
- [ ] Run the production smoke test in the next section with team-owned data only.
- [ ] Enable `SPOTLIGHT_PUBLIC_PREVIEW_ENABLED` in production.
- [ ] Set `window.SPOTLIGHT_PREVIEW_ENABLED = true` in the reviewed production website configuration.
- [x] Merge and deploy website PR #33 with its core switch off.
- [ ] Confirm the production homepage link and assessment page work.
- [ ] Enable `SPOTLIGHT_PREVIEW_LEADS_ENABLED` only after the manual staging lead-flow test in Stage 4 passes.
- [ ] Monitor errors, rate limits, retries, email delivery, and lead creation during the launch window.

### Stage 6: Decide whether to enable sample collection

The recommended initial launch leaves sample collection off. Turn it on only when a named person owns review and deletion.

- [ ] Approve the consent and 30-day retention wording.
- [ ] Confirm only platform operators can list or download samples.
- [ ] Confirm the server encrypts accepted samples.
- [x] Confirm duplicate-content rejection and database-backed per-IP/global capacity limits have automated coverage.
- [ ] Confirm the hourly purge job is running.
- [ ] Test 30-day access expiry and deletion in staging.
- [ ] Document the internal review procedure.
- [ ] Enable `SPOTLIGHT_PREVIEW_SAMPLE_COLLECTION_ENABLED`.
- [ ] Set `window.SPOTLIGHT_PREVIEW_SAMPLE_SHARING_ENABLED = true` in the website's `assets/js/preview-config.js` and redeploy the site.

## Server configuration checklist

These values belong in the server's secret/configuration system. Never put a secret in HTML, website JavaScript, `preview-config.js`, a Netlify public variable, a screenshot, this README, or chat.

### Core preview

```dotenv
SPOTLIGHT_PUBLIC_PREVIEW_ENABLED=false
SPOTLIGHT_PUBLIC_PREVIEW_ALLOWED_ORIGINS=https://spotlightsecurity.ai
SPOTLIGHT_PREVIEW_REPORT_SIGNING_KEY=<random secret, at least 32 characters>
SENTINEL_SECRETS_KEY=<production encryption key>
SPOTLIGHT_ADVISORY_BUNDLE=<absolute server path to the current advisory bundle>
```

The corresponding public website settings contain no credential:

```js
window.SPOTLIGHT_PREVIEW_ENABLED = false;
window.SPOTLIGHT_PREVIEW_API_BASE = '';
window.SPOTLIGHT_PREVIEW_SAMPLE_SHARING_ENABLED = false;
```

Change the first value only when the selected API path, exact-origin CSP, and
backend gate are ready. The third value stays off until the separate sample
retention process is approved.

### Verified email reports and leads

```dotenv
SPOTLIGHT_PREVIEW_LEADS_ENABLED=false
SPOTLIGHT_PREVIEW_WEBSITE_ORIGIN=https://spotlightsecurity.ai
SPOTLIGHT_PREVIEW_EMAIL_SENDER=<verified sender>
SPOTLIGHT_PREVIEW_EMAIL_TRANSPORT=ses
SPOTLIGHT_PREVIEW_AWS_REGION=us-east-2

# Use these when SMTP is selected instead of SES:
SPOTLIGHT_PREVIEW_SMTP_HOST=
SPOTLIGHT_PREVIEW_SMTP_PORT=587
SPOTLIGHT_PREVIEW_SMTP_USERNAME=
SPOTLIGHT_PREVIEW_SMTP_PASSWORD=

SPOTLIGHT_PREVIEW_PIPEDRIVE_DOMAIN=<account slug>
SPOTLIGHT_PREVIEW_PIPEDRIVE_API_TOKEN=<server-only token>
SPOTLIGHT_PREVIEW_SLACK_WEBHOOK_URL=<server-only incoming webhook>
```

### Optional sample contribution

```dotenv
SPOTLIGHT_PREVIEW_SAMPLE_COLLECTION_ENABLED=false
```

### Reserved key slot for future AI

AI is not implemented or called by this preview. Keep it disabled for this launch.

```dotenv
SPOTLIGHT_PREVIEW_AI_ENABLED=false
SPOTLIGHT_PREVIEW_AI_PROVIDER=
SPOTLIGHT_PREVIEW_AI_BASE_URL=
SPOTLIGHT_PREVIEW_AI_API_KEY=
```

These names are provider-neutral. A future reviewed integration can use OpenAI, Anthropic, an OpenAI-compatible endpoint, or another provider. The key always stays on the server; there is no public API-key field.

## Production smoke test

Use sanitized synthetic fixtures or team-created demonstration files. Do not use a customer configuration for launch testing.

- [ ] Search for `Cisco` / `Catalyst 9300` and verify the result says vendor-family support, not model qualification.
- [ ] Search for known vendors using lowercase, normal capitalization, and a common alias; verify the result is consistent.
- [ ] Search for an unknown make/model and verify Spotlight does not claim support.
- [ ] Upload one recognized sanitized fixture.
- [ ] Upload several supported files within the limits.
- [ ] Upload an unsupported text file.
- [ ] Upload a file containing an obvious fake test credential and confirm rejection.
- [ ] Confirm binary, archive, oversized, and excessive file-count requests are rejected.
- [ ] Review findings, evidence age, coverage, gaps, recommendations, and limitations.
- [ ] Test both direct-company and MSP paths if both are launching.
- [ ] Request a report using a real team-controlled email address.
- [ ] Open the link and confirm the report is marked `no-store` and `noindex`.
- [ ] Confirm one expected Pipedrive lead and one Slack summary appear.
- [ ] Confirm raw configuration text and finding evidence do not appear in those systems.
- [ ] Review application, proxy, scheduler, and delivery logs for unexpected errors.
- [ ] Repeat the visitor flow on desktop and mobile.

## Go/no-go checklist

Launch only when every applicable item is checked.

- [ ] Both code changes have been reviewed against the final release branches.
- [ ] Full Sentinel CI passes on the final integration branch.
- [ ] Vendor lookup returns consistent results regardless of letter case.
- [ ] HTTPS, trusted proxy behavior, request-size limits, and public rate limits are active.
- [ ] Browser access is limited to the intended website origin or same-origin proxy.
- [ ] The assessment-page CSP allows only the selected API origin.
- [ ] No secret or key is present in the browser or static website files.
- [ ] Migrations completed and the scheduler is healthy.
- [ ] A real email report completed from upload through verification.
- [ ] Pipedrive and Slack delivery passed.
- [ ] The retention and consent wording has founder approval.
- [ ] The live page links to the approved privacy/terms notice.
- [ ] A named person owns leads, support, abuse monitoring, and launch shutoff.
- [ ] A named reviewer and procedure exist before sample collection is enabled.
- [ ] The customer-facing claims match the evidence the product can currently provide.

Do not launch if the API address or proxy is unset, the website core switch is off, the exact API origin is absent from CSP, email is still in a provider sandbox, production ingress limits are missing, secrets are visible to the browser, full backend CI has not run, or the team cannot verify expiry and cleanup behavior.

## Claims we can make

Spotlight can accurately say that the preview:

- Accepts sanitized text exports from a growing set of platforms.
- Recognizes supported security settings, gaps, and imported findings.
- Shows the evidence, age, source, and limits behind its result.
- Compares exact reported product/version data with the deployment's advisory bundle when enough evidence exists.
- Identifies possible export, sidecar, and agent paths for review.
- Can improve format coverage from separately consented, manually reviewed samples.

## Claims to avoid

Do not say that:

- Every make and model is supported.
- A listed model is lab-qualified unless that exact testing happened.
- A sidecar is deployed because the lookup labels it a candidate.
- The preview finds every vulnerability.
- An uploaded file is guaranteed to contain no secrets.
- Dragos native exports are verified; current examples use Spotlight-mapped CSV.
- Imported scanner findings were independently proven by Spotlight.
- AI analyzed the configuration.
- A normal preview upload is stored for later use.

Make/model results describe vendor-family possibilities. Secret detection is best effort. Old or undated evidence produces candidate results, and imported scanner claims remain imported assertions.

## Retention and privacy summary

| Information | Handling |
| --- | --- |
| Normal configuration upload | Analyzed in memory; raw bytes are not stored |
| Requested report and local contact record | Accessible for up to 24 hours |
| Email report link | Private and time-limited |
| Consented unsupported-format sample | Encrypted and accessible for up to 30 days |
| Pipedrive lead | Follows the company's Pipedrive retention policy |
| Slack alert | Short signup summary only; no uploaded content or finding evidence |

Access stops at the stated expiry even if a scheduler outage delays physical deletion. The privacy notice should disclose the applicable report, CRM, Slack, and optional sample handling before launch.

## Emergency shutoff

The team can stop new public requests without rolling back code:

1. Turn off `SPOTLIGHT_PREVIEW_SAMPLE_COLLECTION_ENABLED`.
2. Turn off `SPOTLIGHT_PREVIEW_LEADS_ENABLED`.
3. Turn off `SPOTLIGHT_PUBLIC_PREVIEW_ENABLED`.
4. Set `window.SPOTLIGHT_PREVIEW_ENABLED = false` and redeploy the website, or hide the public link while the incident is active.

Disabling a feature does not instantly delete records already accepted. Existing records remain subject to their expiry and purge process. Do not rotate or discard `SENTINEL_SECRETS_KEY` while retained reports or samples still need to be decrypted.

Do not downgrade the database as an incident response. Disable the gates, keep the retry/purge scheduler running for existing records, and perform any code rollback through the normal release procedure.

If the core assessment is unavailable for more than a brief incident, remove or hide the public website link until service is restored.

## Engineering verification commands

Run these from the final Sentinel checkout after the branch dependency has been resolved. Use a test database/configuration, not production, for the test commands.

```powershell
uv sync

$env:JWT_SIGNING_SECRET='local-test-secret-at-least-32-characters'
uv run pytest pkgs/sentinel/tests/public_preview pkgs/sentinel/tests/storage/test_db.py::test_upgrade_database pkgs/sentinel/tests/storage/test_api_keys_schema.py::test_exactly_one_alembic_head -q

$previewPaths = @(
  'pkgs/sentinel/src/sentinel/public_preview'
  'pkgs/sentinel/src/sentinel/web/routes/public_preview.py'
  'pkgs/sentinel/src/sentinel/web/routes/public_preview_leads.py'
  'pkgs/sentinel/src/sentinel/web/routes/public_preview_samples.py'
  'pkgs/sentinel/src/sentinel/database/public_preview_models.py'
  'pkgs/sentinel/src/sentinel/database/public_preview_sample_models.py'
  'pkgs/sentinel/src/sentinel/database/alembic/env.py'
  'pkgs/sentinel/src/sentinel/database/alembic/versions/20261121_0065_public_preview_leads.py'
  'pkgs/sentinel/src/sentinel/database/alembic/versions/20261121_0066_public_preview_samples.py'
  'pkgs/sentinel/src/sentinel/web/api.py'
  'pkgs/sentinel/src/sentinel/web/api_scheduler.py'
  'pkgs/sentinel/tests/public_preview'
  'tools/public-preview-smoke.py'
)
uv run ruff format --check @previewPaths
uv run ruff check @previewPaths
git diff --check
```

Apply the production migration through the normal deployment process. If the deployment uses the Sentinel CLI directly, the command is:

```powershell
uv run sentinel db alembic upgrade -c config.yaml -r head
```

Run the website tests from the final website checkout:

```powershell
npm test
node --check assets/js/main.js
node --check assets/js/assessment-preview-core.mjs
node --check assets/js/assessment-preview.mjs
node --check assets/js/assessment-report.mjs
git diff --check
```

## Definition of done

The initial launch is finished when:

- The backend preview is integrated into the agreed Sentinel release line and full CI is green.
- The backend, scheduler, migrations, limits, and website are deployed.
- The core assessment works from the production domain on desktop and mobile.
- The verified email, Pipedrive, and Slack flow passes end to end if enabled.
- Public limits, retry jobs, expiry, and cleanup are operating.
- Product/privacy wording has founder approval.
- Named people own leads, support, monitoring, shutoff, and any contributed samples.

## Source references

- [Website PR #33](https://github.com/spotlight-security-ai/spotlight-website/pull/33)
- [Backend PR #491](https://github.com/spotlight-security-ai/sentinel/pull/491)
- [Assessment/intelligence PR #492](https://github.com/spotlight-security-ai/sentinel/pull/492)
- [Assessment prerequisite PR #392](https://github.com/spotlight-security-ai/sentinel/pull/392)
- [Backend preview deployment notes](https://github.com/spotlight-security-ai/sentinel/blob/dev/docs/PUBLIC_PREVIEW.md)
- [Optional sample handling notes](https://github.com/spotlight-security-ai/sentinel/blob/dev/docs/PUBLIC_PREVIEW_SAMPLES.md)
- [Website/API contract](https://github.com/spotlight-security-ai/spotlight-website/blob/main/docs/public-preview-api.md)

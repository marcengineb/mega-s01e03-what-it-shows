# [4471 split] booking-v3 date hint conflicts with tenant input order — 33 reports

## Scope and count

**33 unique reports** in the course export, all merged into original desk ticket #4471. This is a snapshot exported 2026-10-04 and reviewed 2026-10-28, not a live queue count. The original ticket is a source-system ticket, not issue #4471 in this GitHub repository.

Channels: app 0; email 0; form 33. Affected tenants: alder.physio, copper.studio, pale.harbour. Received dates: 2026-04-17 through 2026-09-22, using dates as written in source timestamps.

## Problem

For day-first tenants using booking-v3, the form prints MM/DD/YYYY but reads the value in the tenant’s order. Following the hint changes the date.

The product implementation is not in this export. Classification is established by the executable KB rule and tenant directory; fix suggestions below are engineering acceptance criteria.

## Expected / observed

Expected: the date selected or entered according to the tenant’s displayed contract is preserved in the stored booking and invite. Observed: the report examples describe a changed calendar date.

## Source examples

- **R-41230**: copper.studio; tenant locale es-ES; booking-v3; channel form; intake tag parser.
  Received 2026-04-17T22:44:00+02:00; merged 2026-07-02T09:56:00+02:00.
  > My client came on 1 June instead of 6 January. We sorted it out.
- **R-41251**: pale.harbour; tenant locale pt-PT; booking-v3; channel form; intake tag parser.
  Received 2026-04-25T20:48:00+01:00; merged 2026-07-02T10:30:00+02:00.
  > Wednesday 7 January showed as Wednesday 1 July. I moved it myself.

## How the count was verified

Read reports-4471.json; deduplicate by id after checking duplicate content; filter mergedInto === 4471; look up tenant locale and form; apply causes.ts causeOf. Do not count by subject, browserLocale or intakeTag. The original groupByCause and an independent per-ID classifier agree. See evidence/report-ledger.csv for every assigned ID and evidence/audit-summary.json for the exact source hashes and group membership. All UTC offsets shown above are preserved from the data; no geographic timezone is inferred.

## Acceptance criteria

- Render a date-format hint that agrees with the actual tenant-aware form parser.
- Test booking-v3 for alder.physio, copper.studio and pale.harbour.
- Enter an ambiguous date following the displayed hint and verify the stored date and invite.
- Confirm the shared-parser fix alone is not used as evidence that this form contract is fixed.

## Related material

- KB source: src/routes/kb/incidents/4471-analysis/+page.svx
- Rendered page: rendered/kb/incidents/4471-analysis/index.html
- Other cause: tickets/parser.md
- Original classification: src/lib/kb/causes.ts and src/lib/data/tenants/

Prepared by marcengineb · S01E03 · Codex. Status: draft for human approval.

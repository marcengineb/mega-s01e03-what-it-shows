# [4471 split] Shared month-first parser reverses tenant dates — 379 reports

## Scope and count

**379 unique reports** in the course export, all merged into original desk ticket #4471. This is a snapshot exported 2026-10-04 and reviewed 2026-10-28, not a live queue count. The original ticket is a source-system ticket, not issue #4471 in this GitHub repository.

Channels: app 204; email 150; form 25. Affected tenants: alder.physio, copper.studio, harbour.dental, kettle.books, lantern.row, long.table, morrow.tax, nine.lanterns, pale.harbour, ridge.clinic, stone.and.sons. Received dates: 2026-04-01 through 2026-10-04, using dates as written in source timestamps.

## Problem

The shared parser reads month/day while these tenants write day/month. In the supplied rule this covers app and email, plus booking-v2 form reports.

The product implementation is not in this export. Classification is established by the executable KB rule and tenant directory; fix suggestions below are engineering acceptance criteria.

## Expected / observed

Expected: the date selected or entered according to the tenant’s displayed contract is preserved in the stored booking and invite. Observed: the report examples describe a changed calendar date.

## Source examples

- **R-41200**: harbour.dental; tenant locale en-GB; booking-v2; channel app; intake tag parser.
  Received 2026-04-01T09:12:00+01:00; merged 2026-07-02T09:03:00+02:00.
  > Our 7 April reminder went out on 4 July. Is this a joke. It is not April Fools where we are.
- **R-41205**: morrow.tax; tenant locale fr-FR; booking-v2; channel app; intake tag hint.
  Received 2026-04-05T12:29:00+02:00; merged 2026-07-02T09:13:00+02:00.
  > Customer booked 3 October and got an invite for 10 March. Please look at this.

## How the count was verified

Read reports-4471.json; deduplicate by id after checking duplicate content; filter mergedInto === 4471; look up tenant locale and form; apply causes.ts causeOf. Do not count by subject, browserLocale or intakeTag. The original groupByCause and an independent per-ID classifier agree. See evidence/report-ledger.csv for every assigned ID and evidence/audit-summary.json for the exact source hashes and group membership. All UTC offsets shown above are preserved from the data; no geographic timezone is inferred.

## Uncertainty

Five of these reports (R-41202, R-41209, R-41236, R-41344, R-41620) are annotated by the desk as reading like a one-day move. They remain included once in this rule-assigned count, but their text does not establish a month/day inversion. Investigate original date/time and timezone conversion before treating them as confirmed parser reproductions. This export does not prove a third cause.

## Acceptance criteria

- Interpret each tenant’s date contract consistently across app, email and booking-v2 form paths.
- Test 07/04 and 04/07 against explicit expected dates, plus an unambiguous date such as 22/11.
- Confirm stored dates and outgoing invites agree.
- Investigate the desk’s one-day-move notes separately; do not mark them resolved from a month/day fix alone.

## Related material

- KB source: src/routes/kb/incidents/4471-analysis/+page.svx
- Rendered page: rendered/kb/incidents/4471-analysis/index.html
- Other cause: tickets/hint.md
- Original classification: src/lib/kb/causes.ts and src/lib/data/tenants/

Prepared by marcengineb · S01E03 · Codex. Status: draft for human approval.

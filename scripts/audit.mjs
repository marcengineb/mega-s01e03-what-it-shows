import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { compile } from 'mdsvex';
import { analyse } from '../src/lib/kb/analysis.ts';
import { deskRef } from '../src/lib/kb/desk-ref.ts';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const reports = read('src/lib/data/reports-4471.json');
const tenants = fs.readdirSync('src/lib/data/tenants').sort().map(f => read('src/lib/data/tenants/' + f));
const notes = read('src/lib/data/desk-notes.json');
const audit = analyse(reports, tenants, notes.oneDayMove);
assert.deepEqual(audit.conflicts, [], 'Conflicting repeats must be resolved before counting');
assert.equal(audit.unplaced, 0, 'New unplaced reports need explicit investigation');
assert.equal(audit.groups.reduce((n, g) => n + g.reports.length, 0), audit.merged, 'Groups must cover the merged ticket');
assert.equal(new Set(audit.groups.flatMap(g => g.reports.map(r => r.id))).size, audit.merged, 'Groups must be disjoint');
assert.equal(audit.ledger.length, audit.merged);
assert.equal(audit.raw - audit.duplicateRows, audit.unique);
assert.ok(audit.ledger.every(r => !r.mergedAt || Date.parse(r.mergedAt) >= Date.parse(r.receivedAt)), 'Merge must follow receipt');
assert.ok(notes.oneDayMove.every(id => audit.ledger.some(r => r.id === id)), 'Every desk note must link to a counted report');

// Independent route: classify raw rows using tenant input-format compatibility,
// not groupByCause(), intake tags, report subjects, or browser locale.
const unique = new Map();
for (const r of reports) unique.set(r.id, r);
const expected = new Map();
const lookup = new Map(tenants.map(t => [t.handle, t]));
for (const r of unique.values()) {
  if (r.mergedInto !== 4471) continue;
  const t = lookup.get(r.tenant);
  const formatted = t ? new Intl.DateTimeFormat(t.locale).formatToParts(new Date('2026-11-22T12:00:00Z')) : [];
  const parts = formatted.filter(p => p.type === 'month' || p.type === 'day').map(p => p.type);
  const cause = !t || parts[0] !== 'day' ? 'unplaced' : r.channel === 'form' && t.form === 'booking-v3' ? 'hint' : 'parser';
  expected.set(r.id, cause);
}
for (const r of audit.ledger) assert.equal(r.cause, expected.get(r.id), 'Independent classifier: ' + r.id);

const output = 'evidence';
fs.mkdirSync(output, { recursive: true });
const { groups, ledger, ...summary } = audit;
const signature = 'marcengineb · S01E03 · Codex';
const signatureSource = 'src/routes/kb/incidents/4471-analysis/+page.svx';
const page = await compile(fs.readFileSync(signatureSource, 'utf8'), {
  filename: path.resolve(signatureSource), layout: { runbook: path.resolve('src/lib/layouts/runbook.svelte') },
});
const pageSignature = page?.data?.fm?.signature;
assert.ok(typeof pageSignature === 'string' && pageSignature.length > 0, 'Page frontmatter must contain the course signature');
const counts = groups.map(g => ({ cause: g.cause, count: g.reports.length, tenants: g.tenants,
  firstSeen: g.firstSeen, lastSeen: g.lastSeen, intakeTags: g.taggedAs, ids: g.reports.map(r => r.id) }));
const sourcePaths = ['src/lib/data/reports-4471.json', 'src/lib/data/desk-notes.json',
  ...fs.readdirSync('src/lib/data/tenants').sort().map(f => 'src/lib/data/tenants/' + f),
  'src/lib/kb/causes.ts', 'src/lib/kb/locales.ts'];
const sources = Object.fromEntries(sourcePaths.map(p => [p, crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
fs.writeFileSync(output + '/audit-summary.json', JSON.stringify({ snapshotExported: '2026-10-04', reviewed: '2026-10-28',
  author: signature, signatureSource, deskRef: deskRef(pageSignature), sources, ...summary, groups: counts }, null, 2) + '\n');
const fields = Object.keys(ledger[0]);
const cell = x => '"' + String(x ?? '').replaceAll('"', '""') + '"';
fs.writeFileSync(output + '/report-ledger.csv', [fields, ...ledger.map(r => fields.map(k => r[k]))].map(row => row.map(cell).join(',')).join('\n') + '\n');
fs.writeFileSync(output + '/verification.txt', [
  'Source: exported report rows, tenant directory, desk notes and original causes.ts.',
  `PASS raw ${audit.raw} - duplicate rows ${audit.duplicateRows} = unique ${audit.unique}.`,
  'PASS duplicate content checked field by field; no conflicting duplicate IDs.',
  `PASS ${audit.merged} unique reports belong to #4471.`,
  'PASS cause groups disjoint and complete; no unplaced reports.',
  'PASS independently classified every ID using tenant date order / channel / form.',
  'PASS every merge instant is at or after receipt, comparing the explicit UTC offsets.',
  'PASS all desk-note IDs link to counted reports; they are not an extra count.',
  ...counts.map(g => `${g.cause}: ${g.count}`),
  `Attribution: ${signature}`, `Signature source: ${signatureSource} frontmatter (proof value omitted)`,
  `Computed desk ref: ${deskRef(pageSignature)}`,
].join('\n') + '\n');

// Draft bodies are generated snapshots, never submitted by this script.
fs.mkdirSync('tickets', { recursive: true });
for (const g of groups) {
  const parser = g.cause === 'parser';
  assert.ok(parser || g.cause === 'hint', 'Write a reviewed issue for a new cause');
  const title = parser ? `[4471 split] Shared month-first parser reverses tenant dates — ${g.reports.length} reports`
    : `[4471 split] booking-v3 date hint conflicts with tenant input order — ${g.reports.length} reports`;
  const mechanism = parser
    ? 'The shared parser reads month/day while these tenants write day/month. In the supplied rule this covers app and email, plus booking-v2 form reports.'
    : 'For day-first tenants using booking-v3, the form prints MM/DD/YYYY but reads the value in the tenant’s order. Following the hint changes the date.';
  const selected = parser ? ['R-41200', 'R-41205'] : ['R-41230', 'R-41251'];
  const examples = selected.map(id => {
    const r = unique.get(id), t = lookup.get(r.tenant);
    return `- **${id}**: ${r.tenant}; tenant locale ${t.locale}; ${t.form}; channel ${r.channel}; intake tag ${r.meta.intakeTag}.\n  Received ${r.receivedAt}; merged ${r.mergedAt}.\n  > ${r.body}`;
  }).join('\n');
  const byChannel = Object.fromEntries(['app', 'email', 'form'].map(c => [c, g.reports.filter(r => r.channel === c).length]));
  const affected = [...new Set(g.reports.map(r => r.tenant))].sort();
  const note = parser ? `\n## Uncertainty\n\nFive of these reports (${notes.oneDayMove.join(', ')}) are annotated by the desk as reading like a one-day move. They remain included once in this rule-assigned count, but their text does not establish a month/day inversion. Investigate original date/time and timezone conversion before treating them as confirmed parser reproductions. This export does not prove a third cause.\n` : '';
  const acceptance = parser
    ? '- Interpret each tenant’s date contract consistently across app, email and booking-v2 form paths.\n- Test 07/04 and 04/07 against explicit expected dates, plus an unambiguous date such as 22/11.\n- Confirm stored dates and outgoing invites agree.\n- Investigate the desk’s one-day-move notes separately; do not mark them resolved from a month/day fix alone.'
    : '- Render a date-format hint that agrees with the actual tenant-aware form parser.\n- Test booking-v3 for alder.physio, copper.studio and pale.harbour.\n- Enter an ambiguous date following the displayed hint and verify the stored date and invite.\n- Confirm the shared-parser fix alone is not used as evidence that this form contract is fixed.';
  fs.writeFileSync(`tickets/${g.cause}.md`, `# ${title}\n\n## Scope and count\n\n**${g.reports.length} unique reports** in the course export, all merged into original desk ticket #4471. This is a snapshot exported 2026-10-04 and reviewed 2026-10-28, not a live queue count. The original ticket is a source-system ticket, not issue #4471 in this GitHub repository.\n\nChannels: ${Object.entries(byChannel).map(([c,n]) => `${c} ${n}`).join('; ')}. Affected tenants: ${affected.join(', ')}. Received dates: ${g.firstSeen} through ${g.lastSeen}, using dates as written in source timestamps.\n\n## Problem\n\n${mechanism}\n\nThe product implementation is not in this export. Classification is established by the executable KB rule and tenant directory; fix suggestions below are engineering acceptance criteria.\n\n## Expected / observed\n\nExpected: the date selected or entered according to the tenant’s displayed contract is preserved in the stored booking and invite. Observed: the report examples describe a changed calendar date.\n\n## Source examples\n\n${examples}\n\n## How the count was verified\n\nRead reports-4471.json; deduplicate by id after checking duplicate content; filter mergedInto === 4471; look up tenant locale and form; apply causes.ts causeOf. Do not count by subject, browserLocale or intakeTag. The original groupByCause and an independent per-ID classifier agree. See evidence/report-ledger.csv for every assigned ID and evidence/audit-summary.json for the exact source hashes and group membership. All UTC offsets shown above are preserved from the data; no geographic timezone is inferred.\n${note}\n## Acceptance criteria\n\n${acceptance}\n\n## Related material\n\n- KB source: src/routes/kb/incidents/4471-analysis/+page.svx\n- Rendered page: rendered/kb/incidents/4471-analysis/index.html\n- Other cause: tickets/${parser ? 'hint' : 'parser'}.md\n- Original classification: src/lib/kb/causes.ts and src/lib/data/tenants/\n\nPrepared by ${signature}. Status: draft for human approval.\n`);
}
console.log(fs.readFileSync(output + '/verification.txt', 'utf8'));

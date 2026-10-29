<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { analyse } from '#lib/kb/analysis';
  import type { Report, Tenant } from '#lib/kb/causes';
  const tenants = Object.values(import.meta.glob<Tenant>('/src/lib/data/tenants/*.json', { eager: true, import: 'default' }));
  const audit = analyse(reports as Report[], tenants, notes.oneDayMove);
</script>

<h2>Count checks</h2>
<p>{audit.raw} export rows − {audit.duplicateRows} repeated rows = <strong>{audit.unique} unique report IDs</strong>.
  {audit.merged} belong to #4471; {audit.conflicts.length} duplicate IDs have conflicting content;
  {audit.unplaced} reports are unplaced.</p>
<p>Classification uses the tenant directory, the tenant's date order, the form version and the channel.
  It disagrees with intake tags for <strong>{audit.intakeDisagreements}</strong> reports.
  Browser locale differs from tenant locale for {audit.browserDisagreements} reports.</p>
<table>
  <thead><tr><th>computed cause</th><th>count</th><th>report IDs / full draft issue</th></tr></thead>
  <tbody>
    {#each audit.groups as group (group.cause)}
      <tr><td>{group.cause}</td><td>{group.reports.length}</td><td><a href={'/tickets/' + group.cause + '.md'}>{group.cause} ticket draft</a></td></tr>
    {/each}
  </tbody>
</table>
<p><a href="/evidence/report-ledger.csv">One row per report: count ledger</a> ·
  <a href="/evidence/audit-summary.json">Machine-readable audit</a></p>

<h2>Uncertainty kept in the count</h2>
<p>The desk marks {audit.notes.length} reports as reading like a one-day move. They are already included in the
  computed groups above. Their text alone does not establish a month/day parsing bug or a separate proven cause.
  Investigate their original timestamps and timezone conversions; do not count them twice.</p>
<table>
  <thead><tr><th>ID</th><th>assigned cause</th><th>reported symptom (source text)</th></tr></thead>
  <tbody>
    {#each audit.notes as note (note.id)}
      <tr><td>{note.id}</td><td>{note.cause}</td><td>{reports.find(r => r.id === note.id)?.body}</td></tr>
    {/each}
  </tbody>
</table>

<h2>Arrivals and desk activity are different events</h2>
<p>First received: <code>{audit.receivedFirst}</code>. Last received: <code>{audit.receivedLast}</code>.</p>
<p>First merged: <code>{audit.mergedFirst}</code>. Last merged: <code>{audit.mergedLast}</code>.</p>
{#if audit.mergePeak}
  <p>The largest merge day is {audit.mergePeak.day}: {audit.mergePeak.merged} reports merged, while
    {audit.mergePeak.received} reports were received on that written date. This is desk activity, not evidence
    that all those failures started that day.</p>
{/if}
<table>
  <thead><tr><th>received month</th><th>unique reports</th></tr></thead>
  <tbody>{#each audit.months as [month, count] (month)}<tr><td>{month}</td><td>{count}</td></tr>{/each}</tbody>
</table>
<p>These are the timestamps and UTC offsets stored in the export. The chart groups by each timestamp's written
  date, as QueueTimeline does; it does not convert all events to one timezone. No geographic timezone is inferred.
  The export ends on 4 October 2026. It is a snapshot, not a claim about the current support queue.</p>

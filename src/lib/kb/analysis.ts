import { causeOf, dayFirst, groupByCause, uniqueById, type Report, type Tenant } from './causes.ts';

export function analyse(reports: Report[], tenants: Tenant[], oneDayMove: string[]) {
  const directory = new Map(tenants.map(t => [t.handle, t]));
  const unique = uniqueById(reports);
  const merged = unique.filter(r => r.mergedInto === 4471);
  const groups = groupByCause(merged, r => directory.get(r.tenant));
  const frequencies = new Map<string, number>();
  for (const r of reports) frequencies.set(r.id, (frequencies.get(r.id) ?? 0) + 1);
  const duplicateIds = [...frequencies].filter(([, n]) => n > 1).map(([id, occurrences]) => ({ id, occurrences }));
  const stable = (x: unknown): string => Array.isArray(x) ? `[${x.map(stable).join(',')}]`
    : x && typeof x === 'object' ? `{${Object.entries(x).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`
    : JSON.stringify(x);
  const conflicts = duplicateIds.filter(({ id }) => new Set(reports.filter(r => r.id === id).map(stable)).size > 1).map(r => r.id);
  const ledger = merged.map(r => {
    const tenant = directory.get(r.tenant);
    return { id: r.id, tenant: r.tenant, locale: tenant?.locale ?? null, form: tenant?.form ?? null,
      dayFirst: tenant ? dayFirst(tenant.locale) : null, channel: r.channel,
      cause: causeOf(r, tenant) ?? 'unplaced', intakeTag: r.meta.intakeTag,
      browserLocale: r.meta.browserLocale, oneDayMove: oneDayMove.includes(r.id),
      receivedAt: r.receivedAt, mergedAt: r.mergedAt };
  });
  const months = new Map<string, number>();
  const mergeDays = new Map<string, number>();
  const receivedDays = new Map<string, number>();
  for (const r of merged) {
    const month = r.receivedAt.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + 1);
    const received = r.receivedAt.slice(0, 10);
    receivedDays.set(received, (receivedDays.get(received) ?? 0) + 1);
    if (r.mergedAt) {
      const day = r.mergedAt.slice(0, 10);
      mergeDays.set(day, (mergeDays.get(day) ?? 0) + 1);
    }
  }
  const mergePeak = [...mergeDays].sort((a, b) => b[1] - a[1])[0];
  return { raw: reports.length, unique: unique.length, merged: merged.length,
    duplicateRows: reports.length - unique.length, duplicateIds, conflicts,
    groups, ledger, intakeDisagreements: ledger.filter(r => r.cause !== r.intakeTag).length,
    browserDisagreements: ledger.filter(r => r.locale !== r.browserLocale).length,
    unplaced: ledger.filter(r => r.cause === 'unplaced').length,
    notes: ledger.filter(r => r.oneDayMove),
    months: [...months].sort(([a], [b]) => a.localeCompare(b)),
    mergePeak: mergePeak ? { day: mergePeak[0], merged: mergePeak[1], received: receivedDays.get(mergePeak[0]) ?? 0 } : null,
    receivedFirst: [...merged].sort((a, b) => Date.parse(a.receivedAt) - Date.parse(b.receivedAt))[0]?.receivedAt,
    receivedLast: [...merged].sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))[0]?.receivedAt,
    mergedFirst: merged.flatMap(r => r.mergedAt ? [r.mergedAt] : []).sort((a, b) => Date.parse(a) - Date.parse(b))[0],
    mergedLast: merged.flatMap(r => r.mergedAt ? [r.mergedAt] : []).sort((a, b) => Date.parse(b) - Date.parse(a))[0],
  };
}

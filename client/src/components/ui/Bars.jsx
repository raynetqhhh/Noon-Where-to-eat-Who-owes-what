/** Horizontal bars, e.g. cuisines. rows: [{ label, value, display? }] */
export function BarList({ rows, emptyText = 'Nothing yet' }) {
  if (!rows.length) return <p className="text-sm text-muted">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate">{r.label}</span>
            <span className="tabular-nums text-muted">{r.display ?? r.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div className="h-full rounded-full bg-brand" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical columns, e.g. spend by month. Includes an accessible table. */
export function ColumnChart({ rows, caption }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <figure>
      <div className="flex h-40 items-end gap-2" aria-hidden>
        {rows.map((r) => (
          <div key={r.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] tabular-nums text-muted">{r.value ? r.display ?? r.value : ''}</span>
            <div
              className="w-full max-w-10 rounded-t-lg bg-brand/85 transition-all"
              style={{ height: `${Math.max((r.value / max) * 100, r.value ? 4 : 1)}%` }}
            />
            <span className="text-[11px] text-muted">{r.label}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th>{r.label}</th>
              <td>{r.display ?? r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

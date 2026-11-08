// Sharing helpers: WhatsApp links, clipboard, CSV export.

export const whatsappUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export const sessionUrl = (code) => `${window.location.origin}/s/${code}`;

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Use the phone's share sheet when available, else copy. */
export async function shareOrCopy({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch {
      /* user cancelled: fall through to copy */
    }
  }
  return (await copyText(url ? `${text}\n${url}` : text)) ? 'copied' : 'failed';
}

const csvCell = (value) => {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** rows: array of objects. Columns come from the first row's keys. */
export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers, ...rows.map((r) => headers.map((h) => r[h]))]
    .map((line) => line.map(csvCell).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

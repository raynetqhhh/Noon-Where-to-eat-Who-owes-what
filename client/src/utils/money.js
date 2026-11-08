const formatter = new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' });

/** 1290 -> "S$12.90" */
export const formatCents = (cents) => formatter.format((cents ?? 0) / 100);

/** "12.90" -> 1290. Returns NaN for invalid input. */
export const toCents = (value) => {
  const n = Number.parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

/** 1290 -> "12.90" for prefilling inputs. */
export const centsToInput = (cents) => (cents == null ? '' : (cents / 100).toFixed(2));

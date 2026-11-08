const dateFmt = new Intl.DateTimeFormat('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDateFmt = new Intl.DateTimeFormat('en-SG', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-SG', { hour: 'numeric', minute: '2-digit' });
const monthFmt = new Intl.DateTimeFormat('en-SG', { month: 'short' });

export const formatDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '');
export const formatShortDate = (iso) => (iso ? shortDateFmt.format(new Date(iso)) : '');
export const formatTime = (date) => timeFmt.format(new Date(date));
export const formatMonth = (yyyyMm) => monthFmt.format(new Date(`${yyyyMm}-01T00:00:00`));

/** 125 -> "2:05" */
export function formatCountdown(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 11) return 'Good morning';
  if (h < 14) return "It's nearly noon";
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

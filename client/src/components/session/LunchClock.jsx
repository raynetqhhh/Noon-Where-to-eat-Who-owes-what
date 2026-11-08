import { Clock, Timer } from 'lucide-react';
import { useNow } from '../../hooks/useNow.js';
import { formatCountdown, formatTime } from '../../utils/date.js';

function lunchHourText(now) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = 12 * 60;
  const end = 13 * 60;
  if (minutes < start) {
    const left = start - minutes;
    return left > 180 ? 'Planning ahead' : `Lunch in ${left >= 60 ? `${Math.floor(left / 60)}h ` : ''}${left % 60}m`;
  }
  if (minutes < end) return `${end - minutes} min of lunch hour left`;
  return 'Late lunch!';
}

/** Lunch clock + voting countdown. */
export default function LunchClock({ deadline, votingOpen }) {
  const now = useNow(1000);
  const secondsLeft = deadline ? (new Date(deadline) - now) / 1000 : null;
  const urgent = secondsLeft !== null && secondsLeft > 0 && secondsLeft < 60;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1">
        <Clock size={14} aria-hidden /> <span className="tabular-nums">{formatTime(now)}</span>
        <span className="text-muted">· {lunchHourText(now)}</span>
      </span>
      {secondsLeft !== null && votingOpen !== false && (
        <span
          role="timer"
          aria-live={urgent ? 'assertive' : 'off'}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold tabular-nums ${
            secondsLeft <= 0 ? 'bg-bad-soft text-bad' : urgent ? 'animate-pulse bg-bad-soft text-bad' : 'bg-brand-soft text-brand'
          }`}
        >
          <Timer size={14} aria-hidden />
          {secondsLeft <= 0 ? "Time's up" : `${formatCountdown(secondsLeft)} to vote`}
        </span>
      )}
    </div>
  );
}

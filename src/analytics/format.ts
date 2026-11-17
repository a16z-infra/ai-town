const DAY = 24 * 60 * 60 * 1000;

export function clockTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function dateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function dayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function duration(ms: number): string {
  if (ms <= 0) {
    return '—';
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function relativeTime(ts: number, now: number): string {
  const delta = now - ts;
  if (delta < 60_000) {
    return 'just now';
  }
  if (delta < 60 * 60_000) {
    return `${Math.floor(delta / 60_000)}m ago`;
  }
  if (delta < DAY) {
    return `${Math.floor(delta / (60 * 60_000))}h ago`;
  }
  return `${Math.floor(delta / DAY)}d ago`;
}

export function compact(n: number): string {
  return n >= 10_000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();
}

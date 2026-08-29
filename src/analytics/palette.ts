/**
 * Speaker and chart colours, from the validated dark palette (surface #1a1a19).
 *
 * Slots are assigned in fixed order and follow the *character*, never their rank in the current
 * view, so filtering the conversation list never repaints anyone. Past eight characters the palette
 * is not extended with generated hues — the remainder share the muted "other" ink.
 *
 * Scope matters here. These eight are UI *chips*, not a chart encoding: a swatch is only ever drawn
 * immediately beside the character's name, so it reinforces identity rather than carrying it. That
 * is deliberate — the eight hues clear every adjacent-pair CVD gate on this surface, but with all
 * eight visible at once (as in the sidebar) the worst arbitrary pair does not, and no eight-hue set
 * would. Charts therefore never use this palette to distinguish series: single-series charts use
 * SERIES[0], and magnitude uses the SEQUENTIAL ramp below.
 */
export const SERIES = [
  '#3987e5', // blue
  '#d95926', // orange
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
] as const;

export const OTHER = '#898781';

/** Single-hue blue ramp for magnitude (heatmap cells). Light -> dark, 100 .. 700. */
export const SEQUENTIAL = [
  '#cde2fb',
  '#b7d3f6',
  '#9ec5f4',
  '#86b6ef',
  '#6da7ec',
  '#5598e7',
  '#3987e5',
  '#2a78d6',
  '#256abf',
  '#1c5cab',
  '#184f95',
] as const;

/**
 * Assigns a stable colour to each character. Ordering is by the numeric part of the game id, which
 * never changes for a given world, so a character keeps their colour across tabs and reloads.
 */
export function assignColors(playerIds: string[]): Map<string, string> {
  const ordered = [...new Set(playerIds)].sort((a, b) => {
    const na = Number.parseInt(a.slice(2), 10);
    const nb = Number.parseInt(b.slice(2), 10);
    if (Number.isNaN(na) || Number.isNaN(nb)) {
      return a.localeCompare(b);
    }
    return na - nb;
  });
  return new Map(ordered.map((id, i) => [id, i < SERIES.length ? SERIES[i] : OTHER]));
}

/** Picks a sequential step for `value` within `[0, max]`. Zero stays at the lightest step. */
export function sequentialStep(value: number, max: number): string {
  if (max <= 0) {
    return SEQUENTIAL[0];
  }
  const t = Math.min(1, Math.max(0, value / max));
  return SEQUENTIAL[Math.round(t * (SEQUENTIAL.length - 1))];
}

/** Cell ink must stay legible as the fill darkens. */
export function inkOn(step: string): string {
  return SEQUENTIAL.indexOf(step as (typeof SEQUENTIAL)[number]) >= 6 ? '#ffffff' : '#0b0b0b';
}

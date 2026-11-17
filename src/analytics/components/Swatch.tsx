import { OTHER } from '../palette';

/**
 * The colour chip that carries character identity. It always sits beside the character's name, so
 * colour is never the only channel.
 */
export default function Swatch({ color, size = 10 }: { color?: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: color ?? OTHER,
        // 2px surface ring keeps adjacent chips from touching.
        boxShadow: '0 0 0 2px var(--surface-1)',
      }}
    />
  );
}

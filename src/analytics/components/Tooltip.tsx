import { ReactNode, useCallback, useState } from 'react';

type TooltipState = { x: number; y: number; content: ReactNode } | null;

/**
 * Hover layer shared by the charts. Every mark gets a tooltip, and the hit target is the whole row
 * or column rather than the drawn bar, so short bars stay reachable.
 */
export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const show = useCallback((event: React.MouseEvent, content: ReactNode) => {
    setTooltip({ x: event.clientX, y: event.clientY, content });
  }, []);
  const hide = useCallback(() => setTooltip(null), []);

  const bind = useCallback(
    (content: ReactNode) => ({
      onMouseEnter: (event: React.MouseEvent) => show(event, content),
      onMouseMove: (event: React.MouseEvent) => show(event, content),
      onMouseLeave: hide,
    }),
    [show, hide],
  );

  const node = tooltip ? (
    <div
      className="chart-tooltip"
      style={{
        left: Math.max(8, Math.min(tooltip.x + 12, window.innerWidth - 220)),
        top: tooltip.y + 14,
      }}
    >
      {tooltip.content}
    </div>
  ) : null;

  return { bind, node };
}

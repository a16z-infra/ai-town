import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import uPlot, { AlignedData, Options } from 'uplot';

export function BufferHealth(props: { bufferHealth: number; width: number; height: number }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [plot, setPlot] = useState<uPlot>();

  const bufferHealth = useRef(props.bufferHealth);
  bufferHealth.current = props.bufferHealth;

  useLayoutEffect(() => {
    if (!el) return;
    const opts: Options = {
      width: props.width - 20,
      height: props.height - 20,
      series: [{}],
      scales: {
        y: { distr: 1 },
      },
      axes: [
        {
          side: 0,
          show: false,
        },
        {
          ticks: { size: 0 },
          side: 1,
          stroke: 'white',
        },
      ],
      legend: {
        show: false,
      },
    };
    const data: AlignedData = [[], []];
    const plot = new uPlot(opts, data, el);
    plot.addSeries({
      stroke: 'white',
      spanGaps: true,
      pxAlign: 0,
      points: { show: false },
    });
    setPlot(plot);
  }, [el, props.width, props.height]);

  useEffect(() => {
    let reqId: ReturnType<typeof requestAnimationFrame> = 0;
    const data = {
      t: [] as number[],
      y: [] as number[],
    };
    const update = () => {
      if (plot) {
        if (data.t.length > 100000) {
          data.t = data.t.slice(-100000);
          data.y = data.y.slice(-100000);
        }
        const now = Date.now();
        data.t.push(now);
        data.y.push(bufferHealth.current);
        plot.setData([data.t, data.y], true);
        plot.setScale('x', { min: now - 10000, max: now });
      }
      reqId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(reqId);
  }, [plot, bufferHealth]);
  return (
    <div
      ref={setEl}
      style={{
        height: props.height,
        width: props.width,
        background: 'rgb(53, 59, 89)',
        position: 'fixed',
        top: '20px',
        left: '20px',
        padding: '10px',
        border: '1px solid rgb(23, 20, 33)',
      }}
    />
  );
}

// D3's Tableau10
export const COLORS = (
  '4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab'.match(/.{6}/g) as string[]
).map((x) => `#${x}`);

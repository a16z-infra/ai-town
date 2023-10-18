import { HistoricalTimeManager } from '@/hooks/useHistoricalTime';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import uPlot, { AlignedData, Options } from 'uplot';

const MAX_DATA_POINTS = 10000;

export function DebugTimeManager(props: {
  timeManager: HistoricalTimeManager;
  width: number;
  height: number;
}) {
  const [plotElement, setPlotElement] = useState<HTMLDivElement | null>(null);
  const [plot, setPlot] = useState<uPlot>();

  useLayoutEffect(() => {
    if (!plotElement) {
      return;
    }
    const opts: Options = {
      width: props.width,
      height: props.height,
      series: [
        {},
        {
          stroke: 'white',
          spanGaps: true,
          pxAlign: 0,
          points: { show: false },
          label: 'Buffer health',
        },
      ],
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
    const plot = new uPlot(opts, data, plotElement);
    setPlot(plot);
  }, [plotElement, props.width, props.height]);

  const timeManager = props.timeManager;
  const [intervals, setIntervals] = useState([...timeManager.intervals]);
  useEffect(() => {
    let reqId: ReturnType<typeof requestAnimationFrame> = 0;
    const data = {
      t: [] as number[],
      bufferHealth: [] as number[],
    };
    const update = () => {
      if (plot) {
        if (data.t.length > MAX_DATA_POINTS) {
          data.t = data.t.slice(-MAX_DATA_POINTS);
          data.bufferHealth = data.bufferHealth.slice(-MAX_DATA_POINTS);
        }
        const now = Date.now() / 1000;
        data.t.push(now);
        data.bufferHealth.push(timeManager.bufferHealth());
        setIntervals([...timeManager.intervals]);
        plot.setData([data.t, data.bufferHealth], true);
        plot.setScale('x', { min: now - 10, max: now });
      }
      reqId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(reqId);
  }, [plot, timeManager]);

  let intervalNode: React.ReactNode | null = null;
  if (intervals.length > 0) {
    const base = intervals[0].startTs;
    const baseAge = Date.now() - base;

    intervalNode = (
      <div style={{ fontSize: '12px' }}>
        {intervals.length} {intervals.length > 1 ? 'intervals' : 'interval'}:
        <div style={{ fontSize: '9px', height: '48px' }}>
          <p>Base: {toSeconds(baseAge)}s ago</p>
          {intervals.map((interval) => {
            const containsServerTs =
              timeManager.prevServerTs &&
              interval.startTs < timeManager.prevServerTs &&
              timeManager.prevServerTs <= interval.endTs;
            let serverTs = null;
            if (containsServerTs) {
              serverTs = ` (server: ${toSeconds((timeManager.prevServerTs ?? base) - base)})`;
            }
            return (
              <div
                key={interval.startTs}
                style={{ paddingRight: '3px', fontWeight: containsServerTs ? 'bold' : '' }}
              >
                {toSeconds(interval.startTs - base)} - {toSeconds(interval.endTs - base)}
                {serverTs}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  let statusNode: React.ReactNode | null = null;
  if (timeManager.latestEngineStatus) {
    const status = timeManager.latestEngineStatus;
    let statusMsg = status.running ? 'Running' : 'Stopped';
    statusNode = (
      <div style={{ fontSize: '12px', paddingTop: '8px' }}>
        <p>Generation number: {status.generationNumber}</p>
        <p>Input number: {status.processedInputNumber}</p>
        <p>Status: {statusMsg}</p>
        <p>Client skew: {toSeconds(timeManager.clockSkew())}s</p>
      </div>
    );
  }
  timeManager.latestEngineStatus?.generationNumber;

  return (
    <div
      style={{
        background: 'rgb(53, 59, 89)',
        position: 'fixed',
        top: '20px',
        left: '20px',
        padding: '10px',
        border: '1px solid rgb(23, 20, 33)',
        color: 'white',
        zIndex: 1,
      }}
    >
      <div style={{ height: '20px', width: '100%', textAlign: 'center' }}>Engine stats</div>
      {statusNode}
      <div ref={setPlotElement} />
      {intervalNode}
    </div>
  );
}

// D3's Tableau10
export const COLORS = (
  '4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab'.match(/.{6}/g) as string[]
).map((x) => `#${x}`);

const toSeconds = (n: number) => (n / 1000).toFixed(2);

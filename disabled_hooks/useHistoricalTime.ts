import { Doc } from '../../convex/_generated/dataModel';
import { useEffect, useRef, useState } from 'react';

export function useHistoricalTime(engineStatus?: Doc<'engines'>) {
  const timeManager = useRef(new HistoricalTimeManager());
  const rafRef = useRef<number>();
  const [historicalTime, setHistoricalTime] = useState<number | undefined>(undefined);
  if (engineStatus) {
    timeManager.current.receive(engineStatus);
  }
  const updateTime = (performanceNow: number) => {
    // We don't need sub-millisecond precision for interpolation, so just use `Date.now()`.
    const now = Date.now();
    setHistoricalTime(timeManager.current.historicalServerTime(now));
    rafRef.current = requestAnimationFrame(updateTime);
  };
  useEffect(() => {
    rafRef.current = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(rafRef.current!);
  }, []);
  return { historicalTime, timeManager: timeManager.current };
}

type ServerTimeInterval = {
  startTs: number;
  endTs: number;
};

export class HistoricalTimeManager {
  intervals: Array<ServerTimeInterval> = [];
  prevClientTs?: number;
  prevServerTs?: number;
  totalDuration: number = 0;

  latestEngineStatus?: Doc<'engines'>;

  receive(engineStatus: Doc<'engines'>) {
    this.latestEngineStatus = engineStatus;
    if (!engineStatus.currentTime || !engineStatus.lastStepTs) {
      return;
    }
    const latest = this.intervals[this.intervals.length - 1];
    if (latest) {
      if (latest.endTs === engineStatus.currentTime) {
        return;
      }
      if (latest.endTs > engineStatus.currentTime) {
        throw new Error(`Received out-of-order engine status`);
      }
    }
    const newInterval = {
      startTs: engineStatus.lastStepTs,
      endTs: engineStatus.currentTime,
    };
    this.intervals.push(newInterval);
    this.totalDuration += newInterval.endTs - newInterval.startTs;
  }

  historicalServerTime(clientNow: number): number | undefined {
    if (this.intervals.length == 0) {
      return undefined;
    }
    if (clientNow === this.prevClientTs) {
      return this.prevServerTs;
    }
    // If this is our first time simulating, start at the beginning of the buffer.
    const prevClientTs = this.prevClientTs ?? clientNow;
    const prevServerTs = this.prevServerTs ?? this.intervals[0].startTs;
    const lastServerTs = this.intervals[this.intervals.length - 1].endTs;

    // Simple rate adjustment: run time at 1.2 speed if we're more than 1s behind and
    // 0.8 speed if we only have 100ms of buffer left. A more sophisticated approach
    // would be to continuously adjust the rate based on the size of the buffer.
    const bufferDuration = lastServerTs - prevServerTs;
    let rate = 1;
    if (bufferDuration < SOFT_MIN_SERVER_BUFFER_AGE) {
      rate = 0.8;
    } else if (bufferDuration > SOFT_MAX_SERVER_BUFFER_AGE) {
      rate = 1.2;
    }
    let serverTs = Math.max(
      prevServerTs + (clientNow - prevClientTs) * rate,
      // Jump forward if we're too far behind.
      lastServerTs - MAX_SERVER_BUFFER_AGE,
    );

    let chosen = null;
    for (let i = 0; i < this.intervals.length; i++) {
      const snapshot = this.intervals[i];
      // We're past this snapshot, continue to the next one.
      if (snapshot.endTs < serverTs) {
        continue;
      }
      // We're cleanly within this snapshot.
      if (serverTs >= snapshot.startTs) {
        chosen = i;
        break;
      }
      // We've gone past the desired timestamp, which implies a gap in our server state.
      // Jump time forward to the beginning of this snapshot.
      if (serverTs < snapshot.startTs) {
        serverTs = snapshot.startTs;
        chosen = i;
      }
    }
    if (chosen === null) {
      serverTs = this.intervals.at(-1)!.endTs;
      chosen = this.intervals.length - 1;
    }
    // Time only moves forward, so we can trim all of the snapshots before our chosen one.
    const toTrim = Math.max(chosen - 1, 0);
    if (toTrim > 0) {
      for (const snapshot of this.intervals.slice(0, toTrim)) {
        this.totalDuration -= snapshot.endTs - snapshot.startTs;
      }
      this.intervals = this.intervals.slice(toTrim);
    }

    this.prevClientTs = clientNow;
    this.prevServerTs = serverTs;

    return serverTs;
  }

  bufferHealth(): number {
    if (!this.intervals.length) {
      return 0;
    }
    const lastServerTs = this.prevServerTs ?? this.intervals[0].startTs;
    return this.intervals[this.intervals.length - 1].endTs - lastServerTs;
  }

  clockSkew(): number {
    if (!this.prevClientTs || !this.prevServerTs) {
      return 0;
    }
    return this.prevClientTs - this.prevServerTs;
  }
}

const MAX_SERVER_BUFFER_AGE = 1500;
const SOFT_MAX_SERVER_BUFFER_AGE = 1250;
const SOFT_MIN_SERVER_BUFFER_AGE = 250;

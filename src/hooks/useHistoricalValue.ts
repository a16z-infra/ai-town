import { WithoutSystemFields } from 'convex/server';
import { Doc, TableNames } from '../../convex/_generated/dataModel';
import { History, unpackSampleRecord } from '../../convex/engine/historicalTable';
import { useMemo, useRef } from 'react';

export function useHistoricalValue<Name extends TableNames>(
  historicalTime: number | undefined,
  value: Doc<Name> | undefined,
): WithoutSystemFields<Doc<Name>> | undefined {
  const manager = useRef(new HistoryManager());
  const sampleRecord: Record<string, History> | undefined = useMemo(() => {
    if (!value || !value.history) {
      return undefined;
    }
    if (!(value.history instanceof ArrayBuffer)) {
      throw new Error(`Expected ArrayBuffer, found ${typeof value.history}`);
    }
    return unpackSampleRecord(value.history as ArrayBuffer);
  }, [value && value.history]);
  if (sampleRecord) {
    manager.current.receive(sampleRecord);
  }
  if (value === undefined) {
    return undefined;
  }
  const { _id, _creationTime, history, ...latest } = value;
  if (!historicalTime) {
    return latest as any;
  }
  const historicalFields = manager.current.query(historicalTime);
  for (const [fieldName, value] of Object.entries(historicalFields)) {
    (latest as any)[fieldName] = value;
  }
  return latest as any;
}

class HistoryManager {
  histories: Record<string, History[]> = {};

  receive(sampleRecord: Record<string, History>) {
    for (const [fieldName, history] of Object.entries(sampleRecord)) {
      let histories = this.histories[fieldName];
      if (!histories) {
        histories = [];
        this.histories[fieldName] = histories;
      }
      if (histories[histories.length - 1] == history) {
        continue;
      }
      histories.push(history);
    }
  }

  query(historicalTime: number): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [fieldName, histories] of Object.entries(this.histories)) {
      if (histories.length == 0) {
        continue;
      }
      let foundIndex = null;
      let currentValue = histories[0].initialValue;
      for (let i = 0; i < histories.length; i++) {
        const history = histories[i];
        for (const sample of history.samples) {
          if (sample.time > historicalTime) {
            foundIndex = i;
            break;
          }
          currentValue = sample.value;
        }
        if (foundIndex !== null) {
          break;
        }
      }
      if (foundIndex !== null) {
        this.histories[fieldName] = histories.slice(foundIndex);
      }
      result[fieldName] = currentValue;
    }
    return result;
  }
}

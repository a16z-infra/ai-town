import { WithoutSystemFields } from 'convex/server';
import { Doc, TableNames } from '../../convex/_generated/dataModel';
import { FieldConfig, History, unpackSampleRecord } from '../../convex/engine/historicalTable';
import { useMemo, useRef } from 'react';

export function useHistoricalValue<Name extends TableNames>(
  fields: FieldConfig,
  historicalTime: number | undefined,
  value: WithoutSystemFields<Doc<Name>> | undefined,
  history: ArrayBuffer | undefined,
): WithoutSystemFields<Doc<Name>> | undefined {
  const manager = useRef(new HistoryManager());
  const sampleRecord: Record<string, History> | undefined = useMemo(() => {
    if (!value || !history) {
      return undefined;
    }
    if (!(history instanceof ArrayBuffer)) {
      throw new Error(`Expected ArrayBuffer, found ${typeof history}`);
    }
    return unpackSampleRecord(fields, history);
  }, [value && history]);
  if (sampleRecord) {
    manager.current.receive(sampleRecord);
  }
  if (value === undefined) {
    return undefined;
  }
  if (!historicalTime) {
    return value;
  }
  const historicalFields = manager.current.query(historicalTime);
  for (const [fieldName, historicalValue] of Object.entries(historicalFields)) {
    (value as any)[fieldName] = historicalValue;
  }
  return value;
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

import { ConvexReactClient, useConvex } from 'convex/react';
import { InputArgs, InputReturnValue, Inputs } from '../../convex/aiTown/inputs';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export async function waitForInput(convex: ConvexReactClient, inputId: Id<'inputs'>) {
  const watch = convex.watchQuery(api.aiTown.main.inputStatus, { inputId });
  let result = watch.localQueryResult();
  // The result's undefined if the query's loading and null if the input hasn't
  // been processed yet.
  if (result === undefined || result === null) {
    let dispose: undefined | (() => void);
    try {
      await new Promise<void>((resolve, reject) => {
        dispose = watch.onUpdate(() => {
          try {
            result = watch.localQueryResult();
          } catch (e: any) {
            reject(e);
            return;
          }
          if (result !== undefined && result !== null) {
            resolve();
          }
        });
      });
    } finally {
      if (dispose) {
        dispose();
      }
    }
  }
  if (!result) {
    throw new Error(`Input ${inputId} was never processed.`);
  }
  if (result.kind === 'error') {
    throw new Error(result.message);
  }
  return result.value;
}

export function useSendInput<Name extends keyof Inputs>(
  engineId: Id<'engines'>,
  name: Name,
): (args: InputArgs<Name>) => Promise<InputReturnValue<Name>> {
  const convex = useConvex();
  return async (args) => {
    const inputId = await convex.mutation(api.world.sendWorldInput, { engineId, name, args });
    return await waitForInput(convex, inputId);
  };
}

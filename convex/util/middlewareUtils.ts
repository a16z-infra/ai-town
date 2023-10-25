import { ObjectType, PropertyValidators } from 'convex/values';
import { ArgsArray, UnvalidatedFunction, ValidatedFunction } from 'convex/server';

export type MergeArgs<Args extends ArgsArray, Other extends { [k: string]: any }> = Args extends []
  ? [Other]
  : [Args[0] & Other];

export type MergeArgsForRegistered<
  Args extends ArgsArray,
  Other extends { [k: string]: any },
> = MergeArgs<Args, Other>[0];

export function splitArgs<
  ConsumedArgsValidator extends PropertyValidators,
  Args extends Record<string, any>,
>(
  consumedArgsValidator: ConsumedArgsValidator,
  args: Args & ObjectType<ConsumedArgsValidator>,
): { rest: Args; consumed: ObjectType<ConsumedArgsValidator> } {
  const rest: Record<string, any> = {};
  const consumed: Record<string, any> = {};
  for (const arg in args) {
    if (arg in consumedArgsValidator) {
      consumed[arg] = args[arg];
    } else {
      rest[arg] = args[arg];
    }
  }

  return {
    rest,
    consumed,
  } as any;
}

export const generateMiddleware = <
  RequiredCtx extends Record<string, any>,
  TransformedCtx extends Record<string, any>,
  ConsumedArgsValidator extends PropertyValidators,
>(
  consumedArgsValidator: ConsumedArgsValidator,
  transformContext: (
    ctx: RequiredCtx,
    args: ObjectType<ConsumedArgsValidator>,
  ) => Promise<TransformedCtx>,
) => {
  // Have two overloads -- one for validated functions and one for unvalidated functions
  function withFoo<ExistingArgsValidator extends PropertyValidators, Output, Ctx>(
    fn: ValidatedFunction<Ctx & TransformedCtx, ExistingArgsValidator, Promise<Output>>,
  ): ValidatedFunction<
    Ctx & RequiredCtx,
    ConsumedArgsValidator & ExistingArgsValidator,
    Promise<Output>
  >;

  function withFoo<ExistingArgs extends ArgsArray, Output, Ctx>(
    fn: UnvalidatedFunction<Ctx & TransformedCtx, ExistingArgs, Promise<Output>>,
  ): UnvalidatedFunction<
    Ctx & RequiredCtx,
    MergeArgs<ExistingArgs, ObjectType<ConsumedArgsValidator>>,
    Promise<Output>
  >;
  function withFoo(fn: any): any {
    if (fn.args) {
      const handler = fn.handler;
      return {
        args: {
          ...fn.args,
          ...consumedArgsValidator,
        },
        handler: async (ctx: any, allArgs: any) => {
          const { rest, consumed } = splitArgs(consumedArgsValidator, allArgs);
          const transformedCtx = await transformContext(ctx, consumed);
          return await handler(transformedCtx, rest);
        },
      };
    }
    const handler = fn.handler ?? fn;
    return {
      handler: async (ctx: any, allArgs: any) => {
        const { rest, consumed } = splitArgs(consumedArgsValidator, allArgs);
        const transformedCtx = await transformContext(ctx, consumed);
        return await handler(transformedCtx, rest);
      },
    };
  }

  return withFoo;
};

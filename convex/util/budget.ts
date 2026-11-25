import { components } from '../_generated/api';
import type { ActionCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

export type Attribution = {
  ctx: ActionCtx;
  worldId?: Id<'worlds'>;
  feature: 'dialogue' | 'summary' | 'importance' | 'reflection' | 'diagnostic';
};

interface GatewayUsage {
  cost?: number;
  prompt_tokens: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

export async function readProviderJson<T extends { usage?: GatewayUsage }>(
  request: () => Promise<Response>,
  model: string,
  attribution?: Attribution,
): Promise<T> {
  if (!attribution) return (await request()).json();
  const { ctx, worldId, feature } = attribution;
  const budget = components.aiBudget.lib;
  const reservation = await ctx.runMutation(budget.startRequest, {
    model,
    messages: [],
    userId: worldId ?? 'diagnostic',
    actionName: feature,
    tags: worldId ? [{ dimension: 'world', value: worldId }] : [],
  });
  if (!reservation.allowed) throw new Error(reservation.reason);
  const requestId = reservation.requestId;
  const start = Date.now();
  let response: Response;
  try {
    response = await request();
  } catch (error) {
    await ctx.runMutation(budget.finishRequest, {
      requestId,
      error: 'Gateway request failed',
      latencyMs: Date.now() - start,
    });
    throw error;
  }
  // Once the gateway accepts the request it may already be billable. Leave
  // an unreadable response or a failed settlement to the component reconciler.
  const json: T = await response.json();
  const usage = json.usage;
  const cost = usage?.cost;
  await ctx.runMutation(budget.finishRequest, {
    requestId,
    latencyMs: Date.now() - start,
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    cachedTokens: usage?.prompt_tokens_details?.cached_tokens,
    costNanos:
      typeof cost === 'number' && Number.isFinite(cost) && cost >= 0
        ? Math.round(cost * 1e9)
        : undefined,
  });
  return json;
}

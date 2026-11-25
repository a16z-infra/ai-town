import { convexTest } from 'convex-test';
import { expect, test, vi } from 'vitest';
import budget from '@convex-dev/ai-budget/test';
import schema from '../convex/schema';
import { components } from '../convex/_generated/api';
import { readProviderJson } from '../convex/util/budget';

test('attributes actual gateway charges and enforces a world limit before calling the provider', async () => {
  const t = convexTest(schema, import.meta.glob('../convex/**/*.ts'));
  budget.register(t, 'aiBudget');
  const worldId = await t.run(({ db }) =>
    db.insert('worlds', { players: [], agents: [], conversations: [], nextId: 0 }),
  );
  const body = {
    choices: ['private dialogue'],
    usage: {
      cost: 0.000004,
      prompt_tokens: 40,
      completion_tokens: 8,
      prompt_tokens_details: { cached_tokens: 10 },
    },
  };
  const request = vi.fn(async () => Response.json(body));
  const call = () =>
    t.action((ctx) =>
      readProviderJson(request, 'test-model', { ctx, worldId, feature: 'dialogue' }),
    );
  expect(await call()).toEqual(body);
  const lib = components.aiBudget.lib;
  const [row] = await t.query(lib.listRequests, { dimension: 'world', value: worldId });
  expect(row).toMatchObject({
    actionName: 'dialogue',
    costNanos: 4000,
    promptTokens: 40,
    completionTokens: 8,
    cachedTokens: 10,
  });
  const stored = await t.query(lib.getRequest, { requestId: row._id });
  expect(stored?.messages).toEqual([]);
  expect(stored?.responseText).toBeUndefined();
  await t.mutation(lib.setBucketLimits, { dimension: 'world', value: worldId, blocked: true });
  await expect(call()).rejects.toThrow();
  expect(request).toHaveBeenCalledTimes(1);
});

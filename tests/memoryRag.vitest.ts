import { expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import rag from '@convex-dev/rag/test';
import schema from '../convex/schema';
import { internal } from '../convex/_generated/api';
import { memoryIndex, memoryNamespace } from '../convex/agent/memoryIndex';
import { searchMemories } from '../convex/agent/memory';
import { parseGameId } from '../convex/aiTown/ids';
import type { Id } from '../convex/_generated/dataModel';

const player = parseGameId('players', 'p:1');
const vector = (x: number) => [x, Math.sqrt(1 - x * x), ...Array(1534).fill(0)];
const world = { players: [], agents: [], conversations: [], nextId: 2 };
const memory = {
  agentId: 'a:2',
  playerId: player,
  data: { type: 'conversation' as const, conversationId: 'c:3', playerIds: ['p:4'] },
  lastAccess: Date.now(),
  description: 'a memory',
  importance: 9,
  embedding: vector(1),
};
async function setup() {
  const t = convexTest(schema, import.meta.glob('../convex/**/*.ts'));
  rag.register(t);
  const [a, b] = await t.run(async ({ db }) => [
    await db.insert('worlds', world),
    await db.insert('worlds', world),
  ]);
  const recall = (id: Id<'worlds'>, n = 1) =>
    t.action((ctx) => searchMemories(ctx, id, player, vector(1), n));
  return { t, a, b, recall };
}

test('RAG weights importance during candidate selection, isolates worlds, and balances recency', async () => {
  const { t, a, b, recall } = await setup();
  const save = (
    worldId: Id<'worlds'>,
    description: string,
    relevance: number,
    importance: number,
    lastAccess: number,
  ) =>
    t.mutation(internal.agent.memory.insertMemory, {
      ...memory,
      worldId,
      description,
      embedding: vector(relevance),
      importance,
      lastAccess,
    });
  const now = Date.now();
  for (let i = 0; i < 11; i++) await save(a, 'mundane ' + i, 1, 0, now);
  await save(a, 'important', 0.98, 9, now - 3600_000);
  await save(b, 'other world', 1, 9, now);
  expect((await recall(a))[0].description).toBe('important');
  expect((await recall(b))[0].description).toBe('other world');
  await save(a, 'old exact match', 1, 9, now - 1000 * 3600_000);
  expect((await recall(a))[0].description).toBe('important');
  const older = await t.run(({ db }) => db.query('memories').order('desc').first());
  expect(older?.lastAccess).toBe(now - 1000 * 3600_000);
  await expect(
    t.mutation(internal.agent.memory.insertReflectionMemories, {
      worldId: b,
      playerId: player,
      reflections: [
        {
          description: 'invalid',
          relatedMemoryIds: [older!._id],
          importance: 9,
          embedding: vector(1),
        },
      ],
    }),
  ).rejects.toThrow('Invalid reflection source');
});

test('backfill is repeatable, skips ambiguous ownership, and removes expired RAG entries', async () => {
  const { t, a, b, recall } = await setup();
  await t.mutation(internal.agent.memory.insertMemory, memory);
  const run = () => t.mutation(internal.agent.migrateMemories.backfill, { cursor: null });
  expect(await run()).toMatchObject({ unresolved: 1, indexed: 0 });
  const archive = {
    id: 'c:3',
    creator: player,
    created: 0,
    ended: 1,
    numMessages: 1,
    participants: [player, 'p:4'],
  };
  const extra = await t.run(async ({ db }) => {
    await db.insert('archivedConversations', { ...archive, worldId: a });
    return db.insert('archivedConversations', { ...archive, worldId: b });
  });
  expect(await run()).toMatchObject({ unresolved: 1, indexed: 0 });
  await t.run(({ db }) => db.delete(extra));
  expect(await run()).toMatchObject({ unresolved: 0, indexed: 1 });
  expect(await run()).toMatchObject({ unresolved: 0, indexed: 0 });
  expect(await recall(a)).toHaveLength(1);
  expect(await recall(b)).toHaveLength(0);
  await t.mutation(internal.crons.vacuumTable, {
    tableName: 'memories',
    before: Date.now() + 10000,
    cursor: null,
    soFar: 0,
  });
  expect(await recall(a)).toHaveLength(0);
  const raw = await t.action((ctx) =>
    memoryIndex.search(ctx, { namespace: memoryNamespace(a, player), query: vector(1) }),
  );
  expect(raw.results).toHaveLength(0);
});

test('backfill carries provenance to a reflection on a later page and counts missing vectors', async () => {
  const { t, a } = await setup();
  const ids = await t.run(async ({ db }) => {
    await db.insert('archivedConversations', {
      worldId: a,
      id: 'c:3',
      creator: player,
      created: 0,
      ended: 1,
      numMessages: 1,
      participants: [player, 'p:4'],
    });
    const ids = [];
    for (let i = 0; i < 8; i++) {
      const embeddingId = await db.insert('memoryEmbeddings', {
        playerId: player,
        embedding: vector(1),
      });
      ids.push(
        await db.insert('memories', {
          playerId: player,
          description: 'source',
          lastAccess: 1,
          importance: 5,
          data: memory.data,
          embeddingId,
        }),
      );
      if (i === 7) await db.delete(embeddingId);
    }
    const embeddingId = await db.insert('memoryEmbeddings', {
      playerId: player,
      embedding: vector(1),
    });
    const reflection = await db.insert('memories', {
      playerId: player,
      description: 'reflection',
      lastAccess: 1,
      importance: 5,
      data: { type: 'reflection', relatedMemoryIds: [ids[0]] },
      embeddingId,
    });
    return { reflection, missing: ids[7] };
  });
  const first = await t.mutation(internal.agent.migrateMemories.backfill, { cursor: null });
  expect(first).toMatchObject({ indexed: 7, missingVector: 1, done: false });
  const second = await t.mutation(internal.agent.migrateMemories.backfill, {
    cursor: first.cursor,
  });
  expect(second).toMatchObject({ indexed: 1, done: true });
  expect(await t.run(({ db }) => db.get(ids.reflection))).toMatchObject({
    worldId: a,
    ragEntryId: expect.any(String),
  });
  expect((await t.run(({ db }) => db.get(ids.missing)))?.ragEntryId).toBeUndefined();
});

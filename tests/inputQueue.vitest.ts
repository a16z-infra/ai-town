import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import { Game } from '../convex/aiTown/game';
import schema from '../convex/schema';
import { internal } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { engineInsertInput } from '../convex/engine/abstractGame';

const modules = import.meta.glob('../convex/**/*.ts');
const game = internal.aiTown.game;
const queue = internal.engine.abstractGame;
const emptyWorld = { players: [], conversations: [], agents: [], nextId: 0 };
const ok = { kind: 'ok' as const, value: null };
async function setup() {
  const t = convexTest(schema, modules);
  const [engineId, worldId] = await t.run(
    async ({ db }) =>
      [
        await db.insert('engines', { running: true, generationNumber: 0, processedInputNumber: 7 }),
        await db.insert('worlds', emptyWorld),
      ] as const,
  );
  const input = { engineId, name: 'example', args: {}, received: 1 };
  const read = (generationNumber = 0) =>
    t.query(queue.loadPendingInputs, { engineId, generationNumber, max: 32 });
  const save = (generation: number, cursor: number, ids: Id<'inputs'>[]) =>
    t.mutation(game.saveWorld, {
      worldId,
      engineId,
      worldDiff: { world: { ...emptyWorld, nextId: generation + 1 }, agentOperations: [] },
      engineUpdate: {
        expectedGenerationNumber: generation,
        engine: { running: true, generationNumber: generation + 1, processedInputNumber: cursor },
        completedInputs: ids.map((inputId) => ({ inputId, returnValue: ok })),
      },
    });
  const append = (count: number) =>
    t.run(async ({ db }) => {
      const ids = [];
      for (let i = 0; i < count; i++) {
        ids.push(await db.insert('inputs', { ...input, enqueueCommitTs: db.vars.commitTs }));
      }
      return ids;
    });
  return { t, engineId, worldId, input, read, save, append };
}

test('drains old rows first and resumes within a single commit across three pages', async () => {
  const { t, engineId, input, read, save, append } = await setup();
  const committed = await append(70);
  const commitTimes = await t.run(async ({ db }) =>
    Promise.all(
      committed.map(async (id) => {
        const doc = await db.get(id);
        if (!doc || !('enqueueCommitTs' in doc)) throw new Error('Missing commit timestamp');
        return doc.enqueueCommitTs;
      }),
    ),
  );
  expect(typeof commitTimes[0]).toBe('bigint');
  expect(new Set(commitTimes).size).toBe(1);
  const legacy = await t.run(async ({ db }) => {
    await db.insert('inputs', { ...input, number: 7, returnValue: ok });
    return await db.insert('inputs', { ...input, number: 8 });
  });
  expect(
    (await t.query(queue.loadInputs, { engineId, processedInputNumber: 7, max: 32 })).map(
      (x) => x._id,
    ),
  ).toEqual([legacy]);
  const consumed = [];
  for (let gen = 0; gen < 3; gen++) {
    const page = await read(gen);
    const ids = page.map((x) => x._id);
    consumed.push(...ids);
    await save(gen, 8, ids);
  }
  expect(consumed).toEqual([legacy, ...committed]);
  expect(await read(3)).toEqual([]);
});

test('a producer between read and save survives two competing saves', async () => {
  const { t, worldId, engineId, read, save, append } = await setup();
  await append(1);
  const [a, b] = await Promise.all([read(), read()]);
  const later = await append(1);
  const saves = await Promise.allSettled(
    [a, b].map((page) =>
      save(
        0,
        7,
        page.map((i) => i._id),
      ),
    ),
  );
  expect(saves.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(saves.flatMap((r) => (r.status === 'rejected' ? [String(r.reason)] : []))).toEqual([
    expect.stringContaining('Generation number mismatch'),
  ]);
  expect((await read(1)).map((i) => i._id)).toEqual(later);
  expect(await t.run(({ db }) => db.get(worldId))).toMatchObject({ nextId: 1 });
  expect(await t.run(({ db }) => db.get(engineId))).toMatchObject({
    generationNumber: 1,
    processedInputNumber: 7,
  });
});

test('vacuum keeps pending inputs and numbered inserts resume after a vacuumed tail', async () => {
  const { t, engineId, input, append, read } = await setup();
  const [pending] = await append(1);
  const done = await t.run(({ db }) =>
    db.insert('inputs', { ...input, number: 7, returnValue: ok }),
  );
  await t.mutation(internal.crons.vacuumTable, {
    tableName: 'inputs',
    before: Date.now() + 60000,
    cursor: null,
    soFar: 0,
  });
  expect(await t.run(({ db }) => db.get(done))).toBeNull();
  const numbered = await t.run((ctx) => engineInsertInput(ctx, engineId, 'example', {}));
  expect(await t.run(({ db }) => db.get(numbered))).toMatchObject({ number: 8 });
  expect((await read()).map((i) => i._id)).toEqual([numbered, pending]);
});

test('engine ticks preserve the legacy cursor and leave future inputs pending', async () => {
  const { t, engineId, worldId, input, read } = await setup();
  const [due, future] = await t.run(async ({ db }) => [
    await db.insert('inputs', { ...input, enqueueCommitTs: db.vars.commitTs }),
    await db.insert('inputs', { ...input, received: 101, enqueueCommitTs: db.vars.commitTs }),
  ]);
  const engine = await t.run(({ db }) => db.get(engineId));
  const runner = new Game(engine!, worldId, {
    world: emptyWorld,
    playerDescriptions: [],
    agentDescriptions: [],
    worldMap: {
      width: 1,
      height: 1,
      tileSetUrl: '',
      tileSetDimX: 1,
      tileSetDimY: 1,
      tileDim: 1,
      bgTiles: [],
      objectTiles: [],
      animatedSprites: [],
    },
  });
  await t.action((ctx) => runner.runStep(ctx, 100));
  expect((await read(1)).map((i) => i._id)).toEqual([future]);
  // A handler error is still an acknowledged input.
  expect(await t.run(({ db }) => db.get(due))).toMatchObject({ returnValue: { kind: 'error' } });
  expect(await t.run(({ db }) => db.get(engineId))).toMatchObject({
    processedInputNumber: 7,
    generationNumber: 1,
  });
  await t.action((ctx) => runner.runStep(ctx, 116));
  expect(await read(2)).toEqual([]);
});

test('a new generation sees an append after an empty snapshot', async () => {
  const { read, append, save } = await setup();
  expect(await read()).toEqual([]);
  const ids = await append(1);
  await save(0, 7, []);
  await expect(read(0)).rejects.toThrow('Generation number mismatch');
  expect((await read(1)).map((i) => i._id)).toEqual(ids);
});

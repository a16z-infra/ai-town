import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import { api, internal } from '../convex/_generated/api';
import { Conversation, conversationInputs } from '../convex/aiTown/conversation';
import type { Game } from '../convex/aiTown/game';
import schema from '../convex/schema';

const modules = import.meta.glob('../convex/**/*.ts');
const tokenIdentifier = 'issuer|alice';
const human = {
  id: 'p:1',
  human: tokenIdentifier,
  lastInput: 0,
  position: { x: 0, y: 0 },
  facing: { dx: 1, dy: 0 },
  speed: 0,
};
const npc = { ...human, id: 'p:2', human: undefined };
const conversation = {
  id: 'c:3',
  creator: human.id,
  created: 0,
  numMessages: 0,
  participants: [human, npc].map((p) => ({
    playerId: p.id,
    invited: 0,
    status: { kind: 'participating' as const, started: 0 },
  })),
};
const messageUuid = 'agent-turn';
const operation = { name: 'agentGenerateMessage', operationId: 'o:5', started: 0, messageUuid };
const agent = { id: 'a:4', playerId: npc.id, inProgressOperation: operation };
const world = { nextId: 6, players: [human, npc], conversations: [conversation], agents: [agent] };
const agentSend = internal.aiTown.agent.agentSendMessage;
const humanSend = api.messages.writeMessage;

async function setup() {
  const t = convexTest(schema, modules);
  const { worldId, engineId, statusId } = await t.run(async ({ db }) => {
    const worldId = await db.insert('worlds', world);
    const engineId = await db.insert('engines', { running: true, generationNumber: 0 });
    const statusId = await db.insert('worldStatus', {
      worldId,
      engineId,
      isDefault: true,
      lastViewed: 0,
      status: 'running',
    });
    return { worldId, engineId, statusId };
  });
  const alice = t.withIdentity({ tokenIdentifier });
  const draft = {
    worldId,
    conversationId: conversation.id,
    playerId: human.id,
    messageUuid: 'human-draft',
    text: 'Hello',
  };
  const reply = {
    ...draft,
    playerId: npc.id,
    messageUuid,
    agentId: agent.id,
    operationId: operation.operationId,
    leaveConversation: false,
    text: 'Good morning',
  };
  const records = () =>
    t.run(async ({ db }) => ({
      messages: await db.query('messages').collect(),
      inputs: await db.query('inputs').collect(),
    }));
  return { t, worldId, engineId, statusId, alice, draft, reply, records };
}

test('concurrent human retries publish once, and a lost response can be retried after leaving', async () => {
  const { t, worldId, alice, draft, records } = await setup();
  await Promise.all(Array.from({ length: 8 }, () => alice.mutation(humanSend, draft)));
  await alice.mutation(humanSend, { ...draft, messageUuid: 'second-draft' });
  await expect(alice.mutation(humanSend, { ...draft, text: 'another message' })).rejects.toThrow(
    'already used',
  );
  await t.run(async ({ db }) => {
    await db.insert('archivedPlayers', { worldId, ...human });
    await db.patch(worldId, { conversations: [], players: [npc] });
  });
  await alice.mutation(humanSend, draft);
  const { messages, inputs } = await records();
  expect(messages.map((m) => m.messageUuid)).toEqual(['human-draft', 'second-draft']);
  expect(inputs.map((i) => [i.name, i.args.messageUuid])).toEqual([
    ['finishSendingMessage', 'human-draft'],
    ['finishSendingMessage', 'second-draft'],
  ]);
});

test('a regenerated agent reply preserves the winning text and leave decision', async () => {
  const { t, worldId, reply, records } = await setup();
  await Promise.all(
    ['First', 'Regenerated'].map((text, i) =>
      t.mutation(agentSend, { ...reply, text, leaveConversation: i === 1 }),
    ),
  );
  await t.run(({ db }) => db.patch(worldId, { conversations: [], agents: [] }));
  await t.mutation(agentSend, reply);
  const { messages, inputs } = await records();
  expect(messages).toHaveLength(1);
  expect(inputs).toHaveLength(1);
  expect(inputs[0]).toMatchObject({
    name: 'agentFinishSendingMessage',
    args: {
      messageUuid,
      operationId: operation.operationId,
      leaveConversation: messages[0].text === 'Regenerated',
    },
  });
});

test('a closed conversation, nonparticipant, replaced typing turn or obsolete operation cannot publish', async () => {
  const { t, worldId, reply, records } = await setup();
  await t.mutation(agentSend, { ...reply, operationId: 'o:0' });
  await t.mutation(agentSend, { ...reply, messageUuid: 'different' });
  await t.mutation(agentSend, { ...reply, playerId: human.id });
  await t.run(({ db }) =>
    db.patch(worldId, {
      conversations: [
        { ...conversation, isTyping: { playerId: human.id, messageUuid: 'human-turn', since: 1 } },
      ],
    }),
  );
  await t.mutation(agentSend, reply);
  await t.run(({ db }) =>
    db.patch(worldId, { conversations: [{ ...conversation, participants: [] }] }),
  );
  await t.mutation(agentSend, reply);
  await t.run(({ db }) => db.patch(worldId, { conversations: [] }));
  await t.mutation(agentSend, reply);
  expect(await records()).toEqual({ messages: [], inputs: [] });
});

test('an existing generation can finish using its pre-upgrade typing UUID', async () => {
  const { t, worldId, reply, records } = await setup();
  const { messageUuid: uuid, ...oldOperation } = operation;
  await t.run(({ db }) =>
    db.patch(worldId, {
      agents: [{ ...agent, inProgressOperation: oldOperation }],
      conversations: [
        { ...conversation, isTyping: { playerId: npc.id, messageUuid: uuid, since: 1 } },
      ],
    }),
  );
  await t.mutation(agentSend, reply);
  expect((await records()).messages).toHaveLength(1);
});

test('a slow pre-upgrade generation survives expiry of its typing indicator', async () => {
  const { t, worldId, reply, records } = await setup();
  const { name, operationId, started } = operation;
  await t.run(({ db }) =>
    db.patch(worldId, {
      agents: [{ ...agent, inProgressOperation: { name, operationId, started } }],
    }),
  );
  await t.mutation(agentSend, reply);
  await t.mutation(agentSend, reply);
  expect((await records()).inputs).toHaveLength(1);
});

test('a human cannot claim the agent typing UUID but can publish an independent draft', async () => {
  const { t, worldId, alice, draft, reply, records } = await setup();
  await t.run(({ db }) =>
    db.patch(worldId, {
      conversations: [{ ...conversation, isTyping: { playerId: npc.id, messageUuid, since: 0 } }],
    }),
  );
  await expect(alice.mutation(humanSend, { ...draft, messageUuid })).rejects.toThrow(
    'other participant',
  );
  await alice.mutation(humanSend, draft);
  await t.mutation(agentSend, reply);
  expect((await records()).messages.map((m) => m.author)).toEqual([human.id, npc.id]);
});

test('only the signed-in owner can publish an active human turn', async () => {
  const { t, alice, worldId, draft, engineId, records } = await setup();
  await expect(t.mutation(humanSend, draft)).rejects.toThrow('Not logged in');
  await expect(
    t.withIdentity({ tokenIdentifier: 'someone else' }).mutation(humanSend, draft),
  ).rejects.toThrow('Not the human');
  await expect(alice.mutation(humanSend, { ...draft, playerId: npc.id })).rejects.toThrow(
    'Not the human',
  );
  await t.run(({ db }) => db.patch(worldId, { conversations: [] }));
  await expect(alice.mutation(humanSend, draft)).rejects.toThrow('participating');
  for (const name of ['finishSendingMessage', 'agentFinishSendingMessage']) {
    await expect(
      alice.mutation(api.world.sendWorldInput, { engineId, name, args: {} }),
    ).rejects.toThrow('queued by the publisher');
  }
  expect(await records()).toEqual({ messages: [], inputs: [] });
});

test('UUID lookup is scoped to the world and a failed enqueue rolls back the message', async () => {
  const { t, alice, statusId, draft, records } = await setup();
  await t.run(async ({ db }) => {
    const worldId = await db.insert('worlds', world);
    await db.insert('messages', {
      worldId,
      conversationId: conversation.id,
      author: npc.id,
      text: 'Other town',
      messageUuid: draft.messageUuid,
    });
    await db.delete(statusId);
  });
  await expect(alice.mutation(humanSend, draft)).rejects.toThrow('not found');
  expect((await records()).messages.map((m) => m.text)).toEqual(['Other town']);
  expect((await records()).inputs).toHaveLength(0);
});

test('delayed acknowledgement preserves a newer typing indicator and accepts legacy inputs', () => {
  const c = new Conversation({
    ...conversation,
    isTyping: { playerId: human.id, messageUuid: 'new', since: 0 },
  });
  const game = { world: { conversations: new Map([[c.id, c]]) } } as Game;
  const finish = (messageUuid?: string) =>
    conversationInputs.finishSendingMessage.handler(game, 2, {
      playerId: human.id,
      conversationId: c.id,
      timestamp: 1,
      messageUuid,
    });
  finish('old');
  expect(c.isTyping?.messageUuid).toBe('new');
  finish();
  expect(c.isTyping).toBeUndefined();
  expect(c.numMessages).toBe(2);
});

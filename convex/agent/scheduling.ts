import { FunctionReference, defineTable } from 'convex/server';
import { Doc, Id } from '../_generated/dataModel';
import { DatabaseWriter, MutationCtx } from '../_generated/server';
import { assertNever } from '../util/assertNever';
import { v, Infer } from 'convex/values';

export type AgentRunReference = FunctionReference<
  'mutation',
  'internal',
  { agentId: Id<'agents'>; generationNumber: number }
>;

export const agentWaitingOn = v.union(
  // The agent isn't waiting on anything and is scheduled to run.
  v.object({
    kind: v.literal('idle'),
    nextRun: v.number(),
  }),
  // The agent is waiting on an action (e.g. to remember a conversation)
  // to complete.
  v.object({
    kind: v.literal('actionCompleted'),
    timeoutDeadline: v.number(),
  }),
  v.object({
    kind: v.literal('inputCompleted'),
    inputId: v.id('inputs'),
  }),
  // The agent has an active pathfinding state and is waiting for it
  // to complete.
  v.object({
    kind: v.literal('movementCompleted'),
    inputId: v.optional(v.id('inputs')),
  }),
  // Wake up if the agent is in a conversation.
  v.object({
    kind: v.literal('inConversation'),
  }),
  // The agent is waiting on them to be participating in a conversation.
  v.object({
    kind: v.literal('conversationParticipating'),
    conversationId: v.id('conversations'),
    deadline: v.number(),
  }),
  // The agent is waiting them to have left the conversation.
  v.object({
    kind: v.literal('conversationLeft'),
    conversationId: v.id('conversations'),
  }),
  // When in a conversation, the agent waits for nobody to be typing
  // before "grabbing the lock" themselves.
  v.object({
    kind: v.literal('nobodyTyping'),
    conversationId: v.id('conversations'),
  }),
  // The agent is waiting for the other player to say something.
  v.object({
    kind: v.literal('waitingForNewMessage'),
    until: v.number(),
    conversationId: v.id('conversations'),
    lastMessageId: v.optional(v.id('messages')),
  }),
  // The agent spends at most `MAX_CONVERSATION_DURATION` in a conversation.
  v.object({
    kind: v.literal('conversationTooLong'),
    deadline: v.number(),
  }),
  // The agent waits for `CONVERSATION_COOLDOWN` after having a conversation
  // before trying to invite someone again.
  v.object({
    kind: v.literal('nextConversationAttempt'),
    nextAttempt: v.number(),
  }),
);
export type WaitingOn = Infer<typeof agentWaitingOn>;

export function eventDeadline(event: WaitingOn): number | null {
  switch (event.kind) {
    case 'idle': {
      return event.nextRun;
    }
    case 'actionCompleted': {
      return event.timeoutDeadline;
    }
    case 'conversationParticipating': {
      return event.deadline;
    }
    case 'waitingForNewMessage': {
      return event.until;
    }
    case 'conversationTooLong': {
      return event.deadline;
    }
    case 'nextConversationAttempt': {
      return event.nextAttempt;
    }
    case 'inputCompleted':
    case 'movementCompleted':
    case 'inConversation':
    case 'conversationLeft':
    case 'nobodyTyping': {
      return null;
    }
    default: {
      assertNever(event);
    }
  }
}

export async function updateSubscriptions(
  db: DatabaseWriter,
  agentId: Id<'agents'>,
  playerId: Id<'players'>,
  waitingOn: WaitingOn[],
) {
  // First clear all of the agent's current waits.
  await clearSubscriptions(db, agentId);

  for (const event of waitingOn) {
    switch (event.kind) {
      case 'idle':
      case 'actionCompleted':
      case 'conversationTooLong':
      case 'nextConversationAttempt':
        break;
      case 'inputCompleted': {
        await db.insert('waitingOnInput', {
          agentId,
          inputId: event.inputId,
          waitingOn: 'inputCompleted',
        });
        break;
      }
      case 'movementCompleted': {
        await db.insert('waitingOnPlayer', {
          agentId,
          playerId,
          waitingOn: 'movementCompleted',
        });
        break;
      }
      case 'inConversation': {
        await db.insert('waitingOnConversationMember', {
          agentId,
          playerId,
          waitingOn: 'inConversation',
        });
        break;
      }
      case 'conversationParticipating': {
        await db.insert('waitingOnConversationMember', {
          agentId,
          playerId,
          conversationId: event.conversationId,
          waitingOn: 'conversationParticipating',
        });
        break;
      }
      case 'conversationLeft': {
        await db.insert('waitingOnConversationMember', {
          agentId,
          playerId,
          conversationId: event.conversationId,
          waitingOn: 'conversationLeft',
        });
        break;
      }
      case 'nobodyTyping': {
        await db.insert('waitingOnTypingIndicator', {
          agentId,
          conversationId: event.conversationId,
          waitingOn: 'nobodyTyping',
        });
        break;
      }
      case 'waitingForNewMessage': {
        await db.insert('waitingOnMessages', {
          agentId,
          conversationId: event.conversationId,
          lastMessageId: event.lastMessageId,
          waitingOn: 'waitingForNewMessage',
        });
        break;
      }
      default: {
        assertNever(event);
      }
    }
  }
}

export async function clearSubscriptions(db: DatabaseWriter, agentId: Id<'agents'>) {
  const tables = [
    'waitingOnInput',
    'waitingOnPlayer',
    'waitingOnConversationMember',
    'waitingOnTypingIndicator',
    'waitingOnMessages',
  ] as const;

  for (const table of tables) {
    const waits = await db
      .query(table)
      .withIndex('agentId', (q) => q.eq('agentId', agentId))
      .collect();
    for (const wait of waits) {
      await db.delete(wait._id);
    }
  }
}

// NB: We have to pass in `runReference` throughout this file to prevent
// an import cycle, where importing `internal` imports `AiTown`, which
// then wants to be able to import us.
export async function wakeupAgent(
  ctx: MutationCtx,
  runReference: AgentRunReference,
  agentId: Id<'agents'>,
  reason: string,
  allowStopped?: boolean,
) {
  const agent = await ctx.db.get(agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }
  if (agent.state.kind === 'stopped' && !allowStopped) {
    console.warn(`Not waking up stopped agent ${agentId}`);
    return;
  }
  if (agent.state.kind === 'scheduled') {
    return;
  }
  console.log(`Waking up agent ${agentId} (${reason})`);
  const generationNumber = agent.generationNumber + 1;
  agent.generationNumber = generationNumber;
  agent.state = { kind: 'scheduled' };
  await ctx.db.replace(agent._id, agent);
  await clearSubscriptions(ctx.db, agent._id);
  await ctx.scheduler.runAfter(0, runReference, {
    agentId: agent._id,
    generationNumber,
  });
}

async function wakeupWaiters(
  ctx: MutationCtx,
  runReference: AgentRunReference,
  waiters: { agentId: Id<'agents'> }[],
  reason: string,
) {
  for (const waiter of waiters) {
    await wakeupAgent(ctx, runReference, waiter.agentId, reason);
  }
}

export async function wakeupInput(
  ctx: MutationCtx,
  runReference: AgentRunReference,
  input: Doc<'inputs'>,
) {
  // Wakeup all agents who are waiting on an input being completed.
  if (!input.returnValue) {
    return;
  }
  const waiters = await ctx.db
    .query('waitingOnInput')
    .withIndex('inputId', (q) => q.eq('inputId', input._id))
    .collect();
  await wakeupWaiters(ctx, runReference, waiters, 'inputCompleted');
}

export async function wakeupPlayer(
  ctx: MutationCtx,
  runReference: AgentRunReference,
  player: Doc<'players'>,
) {
  // Wakeup all agents who are waiting on "movementCompleted" => !player.pathfinding
  if (player.pathfinding) {
    return;
  }
  const waiters = await ctx.db
    .query('waitingOnPlayer')
    .withIndex('playerId', (q) => q.eq('playerId', player._id))
    .collect();
  await wakeupWaiters(ctx, runReference, waiters, 'movementCompleted');
}

export async function wakeupConversationMember(
  ctx: MutationCtx,
  runReference: AgentRunReference,
  member: Doc<'conversationMembers'>,
) {
  // Wakeup all agents who are waiting on "inConversation" => member.status.kind != 'left'
  if (member.status.kind !== 'left') {
    const waiters = await ctx.db
      .query('waitingOnConversationMember')
      .withIndex('playerId', (q) =>
        q.eq('playerId', member.playerId).eq('waitingOn', 'inConversation'),
      )
      .collect();
    await wakeupWaiters(ctx, runReference, waiters, 'inConversation');
  }

  // Wakeup all agents who are waiting on "conversationParticipating" => member.status.kind === 'participating'
  if (member.status.kind === 'participating') {
    const waiters = await ctx.db
      .query('waitingOnConversationMember')
      .withIndex('playerId', (q) =>
        q
          .eq('playerId', member.playerId)
          .eq('waitingOn', 'conversationParticipating')
          .eq('conversationId', member.conversationId),
      )
      .collect();
    await wakeupWaiters(ctx, runReference, waiters, 'conversationParticipating');
  }

  // Wakeup all agents who are waiting on "conversationLeft" => member.status.kind === 'left'
  if (member.status.kind === 'left') {
    const waiters = await ctx.db
      .query('waitingOnConversationMember')
      .withIndex('playerId', (q) =>
        q
          .eq('playerId', member.playerId)
          .eq('waitingOn', 'conversationLeft')
          .eq('conversationId', member.conversationId),
      )
      .collect();
    await wakeupWaiters(ctx, runReference, waiters, 'conversationLeft');
  }
}

export async function wakeupTypingIndicatorCleared(
  ctx: MutationCtx,
  runReference: AgentRunReference,
  conversationId: Id<'conversations'>,
) {
  // Wakeup all agents who are waiting on "nobodyTyping".
  const waiters = await ctx.db
    .query('waitingOnTypingIndicator')
    .withIndex('conversationId', (q) => q.eq('conversationId', conversationId))
    .collect();
  await wakeupWaiters(ctx, runReference, waiters, 'nobodyTyping');
}

export async function wakeupNewMessage(
  ctx: MutationCtx,
  runReference: AgentRunReference,
  conversationId: Id<'conversations'>,
) {
  // Wakeup all agents who are waiting on "waitingForNewMessage".
  const waiters = await ctx.db
    .query('waitingOnMessages')
    .withIndex('conversationId', (q) => q.eq('conversationId', conversationId))
    .collect();
  await wakeupWaiters(ctx, runReference, waiters, 'waitingForNewMessage');
}

const waitingOnInput = {
  agentId: v.id('agents'),
  inputId: v.id('inputs'),
  waitingOn: v.literal('inputCompleted'),
};

const waitingOnPlayer = {
  agentId: v.id('agents'),
  playerId: v.id('players'),
  waitingOn: v.literal('movementCompleted'),
};

const waitingOnConversationMember = {
  agentId: v.id('agents'),
  playerId: v.id('players'),
  conversationId: v.optional(v.id('conversations')),
  waitingOn: v.union(
    v.literal('inConversation'),
    v.literal('conversationParticipating'),
    v.literal('conversationLeft'),
  ),
};

const waitingOnTypingIndicator = {
  agentId: v.id('agents'),
  conversationId: v.id('conversations'),
  waitingOn: v.literal('nobodyTyping'),
};

const waitingOnMessages = {
  agentId: v.id('agents'),
  conversationId: v.id('conversations'),
  lastMessageId: v.optional(v.id('messages')),
  waitingOn: v.literal('waitingForNewMessage'),
};

export const schedulingTables = {
  waitingOnInput: defineTable(waitingOnInput)
    .index('agentId', ['agentId'])
    .index('inputId', ['inputId']),
  waitingOnPlayer: defineTable(waitingOnPlayer)
    .index('agentId', ['agentId'])
    .index('playerId', ['playerId']),
  waitingOnConversationMember: defineTable(waitingOnConversationMember)
    .index('agentId', ['agentId'])
    .index('playerId', ['playerId', 'waitingOn', 'conversationId']),
  waitingOnTypingIndicator: defineTable(waitingOnTypingIndicator)
    .index('agentId', ['agentId'])
    .index('conversationId', ['conversationId']),
  waitingOnMessages: defineTable(waitingOnMessages)
    .index('agentId', ['agentId'])
    .index('conversationId', ['conversationId']),
};

import { FunctionReference } from 'convex/server';
import { Id } from '../_generated/dataModel';
import { MutationCtx } from '../_generated/server';
import { assertNever } from '../util/assertNever';
import { Agent } from './main';
import { v, Infer } from 'convex/values';
import { conversationMember } from '../game/conversationMembers';
import { getCurrentlyTyping } from '../messages';

type RunReference = FunctionReference<
  'mutation',
  'internal',
  { agentId: Id<'agents'>; generationNumber: number }
>;

export async function runAgent(
  ctx: MutationCtx,
  runReference: RunReference,
  agentId: Id<'agents'>,
  generationNumber: number,
) {
  const agentClass = await Agent.load(ctx, agentId, generationNumber);
  if (!agentClass) {
    return;
  }
  const waitingOn = await agentClass.run();

  let nextRun = null;
  for (const event of waitingOn) {
    const eventDeadline = deadline(event);
    if (eventDeadline !== null) {
      nextRun = Math.min(eventDeadline, nextRun ?? eventDeadline);
    }
  }

  const agent = agentClass.agent;
  agent.generationNumber = agentClass.nextGenerationNumber;
  agent.state = { kind: 'running', waitingOn: waitingOn };
  await ctx.db.replace(agent._id, agent);

  // If we have a timing based wakeup (from the deadlines computed above),
  // schedule ourselves to run in the future. We may run before then if
  // something else wakes us up, like a completed action or a database
  // write that overlaps with something in `waitingOn`.
  if (nextRun) {
    const deltaSeconds = (nextRun - Date.now()) / 1000;
    console.debug(`Scheduling next run ${deltaSeconds.toFixed(2)}s in the future.`);
    await ctx.scheduler.runAt(nextRun, runReference, {
      agentId,
      generationNumber: agentClass.nextGenerationNumber,
    });
  }
}

export async function wakeupAgents(ctx: MutationCtx, runReference: RunReference) {
  const agents = await ctx.db.query('agents').collect();
  const now = Date.now();
  for (const agent of agents) {
    if (agent.state.kind === 'stopped') {
      continue;
    }
    let wakeup: null | string = null;
    const player = await ctx.db.get(agent.playerId);
    if (!player) {
      throw new Error(`Agent ${agent._id} has no player ${agent.playerId}`);
    }
    for (const event of agent.state.waitingOn) {
      switch (event.kind) {
        case 'idle':
        case 'actionCompleted':
        case 'conversationTooLong':
        case 'nextConversationAttempt':
          break;
        case 'inputCompleted': {
          const input = await ctx.db.get(event.inputId);
          if (!input || input.returnValue) {
            wakeup = event.kind;
          }
          break;
        }
        case 'movementCompleted': {
          if (!player.pathfinding) {
            wakeup = event.kind;
          }
          break;
        }
        case 'inConversation': {
          const member = await conversationMember(ctx.db, agent.playerId);
          if (member) {
            wakeup = event.kind;
          }
          break;
        }
        case 'conversationParticipating': {
          const member = await ctx.db
            .query('conversationMembers')
            .withIndex('conversationId', (q) =>
              q.eq('conversationId', event.conversationId).eq('playerId', agent.playerId),
            )
            .first();
          if (member && member.status.kind === 'participating') {
            wakeup = event.kind;
          }
          break;
        }
        case 'conversationLeft': {
          const member = await ctx.db
            .query('conversationMembers')
            .withIndex('conversationId', (q) =>
              q.eq('conversationId', event.conversationId).eq('playerId', agent.playerId),
            )
            .first();
          if (member && member.status.kind === 'left') {
            wakeup = event.kind;
          }
          break;
        }
        case 'nobodyTyping': {
          const typing = await getCurrentlyTyping(ctx.db, event.conversationId);
          if (typing) {
            wakeup = event.kind;
          }
          break;
        }
        case 'waitingForNewMessage': {
          const lastMessage = await ctx.db
            .query('messages')
            .withIndex('conversationId', (q) => q.eq('conversationId', event.conversationId))
            .order('desc')
            .first();
          const lastMessageId = lastMessage?._id ?? undefined;
          if (event.lastMessageId !== lastMessageId) {
            wakeup = event.kind;
          }
          break;
        }
        default: {
          assertNever(event);
        }
      }
      if (wakeup) {
        break;
      }
    }
    if (wakeup) {
      console.log(`Waking up agent ${agent._id} for event ${wakeup}`);
      const generationNumber = agent.generationNumber + 1;
      agent.generationNumber = generationNumber;
      agent.state = { kind: 'running', waitingOn: [] };
      await ctx.db.replace(agent._id, agent);
      await ctx.scheduler.runAfter(0, runReference, { agentId: agent._id, generationNumber });
    }
  }
}

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

function deadline(event: WaitingOn): number | null {
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

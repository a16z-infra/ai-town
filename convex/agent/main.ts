'use node';

import { v } from 'convex/values';
import { ActionCtx, internalAction } from '../_generated/server';
import { ConvexClient } from 'convex/browser';
import { api, internal } from '../_generated/api';
import { AgentDecision } from './decisions';
import { assertNever } from '../util/assertNever';
import { sendInput } from './helpers';
import { ConversationDecision } from './decisions';
import { rememberConversation } from './memory';
import { Id } from '../_generated/dataModel';
import { continueConversation, leaveConversation, startConversation } from './conversation';
import { HandlerReturn, SubscriptionLoop } from './subscription';

class AgentLoop extends SubscriptionLoop<{ agentId: Id<'agents'> }, AgentDecision> {
  constructor(
    private ctx: ActionCtx,
    client: ConvexClient,
    deadline: number,
    private agentId: Id<'agents'>,
    private playerId: Id<'players'>,
  ) {
    super(client, deadline, api.agent.decisions.agentDecide, { agentId });
  }

  async handleValue(decision: AgentDecision): Promise<HandlerReturn> {
    const { ctx, agentId, playerId } = this;
    switch (decision.kind) {
      case 'completeInputs': {
        for (const input of decision.inputs) {
          switch (input.returnValue.kind) {
            case 'ok':
              console.log('Input completed', JSON.stringify(input.returnValue.value));
              break;
            case 'error':
              console.error(`Input failed: ${input.returnValue.message}`);
              break;
            default:
              assertNever(input.returnValue);
          }
        }
        await ctx.runMutation(internal.agent.helpers.removeInProgressInputs, {
          agentId,
          inputIds: decision.inputs.map((input) => input.inputId),
        });
        break;
      }
      case 'waitOnInputs':
      case 'conversationCooldown':
      case 'waitForPartnerRetry':
      case 'waitForInviteTimeout': {
        return { kind: 'sleepUntil', when: decision.deadline };
      }
      case 'moveTo': {
        await sendInput(ctx, agentId, 'moveTo', {
          playerId,
          destination: decision.destination,
        });
        break;
      }
      case 'rememberConversation': {
        await rememberConversation(ctx, agentId, playerId, decision.conversationId);
        break;
      }
      case 'sendInvite': {
        await sendInput(ctx, agentId, 'startConversation', {
          playerId,
          invitee: decision.playerId,
        });
        break;
      }
      case 'acceptInvite': {
        await sendInput(ctx, agentId, 'acceptInvite', {
          playerId,
          conversationId: decision.conversationId,
        });
        break;
      }
      case 'rejectInvite': {
        await sendInput(ctx, agentId, 'rejectInvite', {
          playerId,
          conversationId: decision.conversationId,
        });
        break;
      }
      case 'leaveConversation': {
        await sendInput(ctx, agentId, 'leaveConversation', {
          playerId,
          conversationId: decision.conversationId,
        });
        break;
      }
      case 'participateInConversation': {
        const conversationLoop = new ConversationLoop(
          ctx,
          this.client,
          this.deadline,
          agentId,
          playerId,
          decision.conversationId,
          decision.otherPlayerId,
          decision.lastConversationId,
        );
        await conversationLoop.run();
        break;
      }
      default:
        assertNever(decision);
    }
  }
}

class ConversationLoop extends SubscriptionLoop<
  { agentId: Id<'agents'>; conversationId: Id<'conversations'> },
  ConversationDecision
> {
  constructor(
    private ctx: ActionCtx,
    client: ConvexClient,
    deadline: number,
    private agentId: Id<'agents'>,
    private playerId: Id<'players'>,
    private conversationId: Id<'conversations'>,
    private otherPlayerId: Id<'players'>,
    private lastConversationId: Id<'conversations'> | null,
  ) {
    super(client, deadline, api.agent.decisions.conversationDecide, { agentId, conversationId });
  }

  async handleValue(decision: ConversationDecision): Promise<HandlerReturn> {
    const { ctx, agentId, playerId, conversationId, otherPlayerId, lastConversationId } = this;
    switch (decision.kind) {
      case 'noLongerParticipating': {
        return { kind: 'exit' };
      }
      case 'waitForTypingIndicator':
      case 'waitForMessage':
      case 'waitForCooldown': {
        return { kind: 'sleepUntil', when: decision.deadline };
      }
      case 'sendMessage': {
        const hasLock = await ctx.runMutation(internal.agent.helpers.agentStartTyping, {
          agentId,
          conversationId,
        });
        if (!hasLock) {
          break;
        }
        let generateText;
        switch (decision.messageKind) {
          case 'start': {
            generateText = startConversation;
            break;
          }
          case 'continue': {
            generateText = continueConversation;
            break;
          }
          case 'finish': {
            generateText = leaveConversation;
            break;
          }
        }
        const completion = await generateText(
          ctx,
          conversationId,
          playerId,
          otherPlayerId,
          lastConversationId,
        );
        const text = await completion.readAll();
        try {
          await ctx.runMutation(api.messages.writeMessage, {
            conversationId,
            playerId,
            text,
          });
        } catch (e: any) {
          console.error(`Failed to write message: ${e.message}`);
          return;
        }
        if (decision.messageKind === 'finish') {
          await sendInput(ctx, agentId, 'leaveConversation', { playerId, conversationId });
        }
        break;
      }
      default: {
        assertNever(decision);
      }
    }
  }
}

export const runAgentLoop = internalAction({
  args: {
    agentId: v.id('agents'),
    maxRuntime: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    await runAgent(ctx, args);
    await ctx.scheduler.runAfter(0, internal.agent.main.runAgentLoop, args);
  },
});

export const runAgent = internalAction({
  args: {
    agentId: v.id('agents'),
    maxRuntime: v.number(),
  },
  handler: async (ctx, args) => {
    const { playerId } = await ctx.runQuery(internal.agent.helpers.loadState, {
      agentId: args.agentId,
    });
    const client = new ConvexClient(process.env.CONVEX_CLOUD_URL!);
    const loop = new AgentLoop(ctx, client, Date.now() + args.maxRuntime, args.agentId, playerId);
    await loop.run();
  },
});

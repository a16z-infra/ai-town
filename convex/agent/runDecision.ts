import { ActionCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { rememberConversation } from './memory';
import { api, internal } from '../_generated/api';
import { assertNever } from '../util/assertNever';
import { sendInput } from './helpers';
import { continueConversation, leaveConversation, startConversation } from './conversation';
import { AgentDecision } from './agentDecision';

export async function runDecision(
  ctx: ActionCtx,
  agentId: Id<'agents'>,
  generationNumber: number,
  playerId: Id<'players'>,
  decision: AgentDecision,
) {
  switch (decision.kind) {
    case 'completeInputs': {
      for (const input of decision.inputs) {
        switch (input.returnValue.kind) {
          case 'ok':
            console.log(
              `Input ${input.name} completed: ${JSON.stringify(input.returnValue.value)}`,
            );
            break;
          case 'error':
            console.error(`Input ${input.name} failed: ${input.returnValue.message}`);
            break;
          default:
            assertNever(input.returnValue);
        }
      }
      await ctx.runMutation(internal.agent.helpers.removeInProgressInputs, {
        agentId,
        generationNumber,
        inputIds: decision.inputs.map((input) => input.inputId),
      });
      break;
    }
    case 'waitOnInputs':
    case 'conversationCooldown':
    case 'waitForPartnerRetry':
    case 'waitForInviteTimeout': {
      return decision.deadline;
    }
    case 'moveTo': {
      await sendInput(ctx, agentId, generationNumber, 'moveTo', {
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
      await sendInput(ctx, agentId, generationNumber, 'startConversation', {
        playerId,
        invitee: decision.playerId,
      });
      break;
    }
    case 'acceptInvite': {
      await sendInput(ctx, agentId, generationNumber, 'acceptInvite', {
        playerId,
        conversationId: decision.conversationId,
      });
      break;
    }
    case 'rejectInvite': {
      await sendInput(ctx, agentId, generationNumber, 'rejectInvite', {
        playerId,
        conversationId: decision.conversationId,
      });
      break;
    }
    case 'leaveConversation': {
      await sendInput(ctx, agentId, generationNumber, 'leaveConversation', {
        playerId,
        conversationId: decision.conversationId,
      });
      break;
    }
    case 'participateInConversation':
      {
        const { conversationId, otherPlayerId, lastConversationId, conversationDecision } =
          decision;
        switch (conversationDecision.kind) {
          case 'noLongerParticipating': {
            return;
          }
          case 'waitForTypingIndicator':
          case 'waitForMessage':
          case 'waitForCooldown': {
            return conversationDecision.deadline;
          }
          case 'sendMessage': {
            const hasLock = await ctx.runMutation(internal.agent.helpers.agentStartTyping, {
              agentId,
              generationNumber,
              conversationId,
            });
            if (!hasLock) {
              break;
            }
            let generateText;
            switch (conversationDecision.messageKind) {
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
              await ctx.runMutation(internal.agent.helpers.agentWriteMessage, {
                agentId,
                generationNumber,
                conversationId,
                text,
              });
            } catch (e: any) {
              console.error(`Failed to write message: ${e.message}`);
              return;
            }
            if (conversationDecision.messageKind === 'finish') {
              await sendInput(ctx, agentId, generationNumber, 'leaveConversation', {
                playerId,
                conversationId,
              });
            }
            break;
          }
          default: {
            assertNever(conversationDecision);
          }
        }
      }
      break;
    default:
      assertNever(decision);
  }
}

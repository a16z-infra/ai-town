import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { WorldMap, serializedWorldMap } from './worldMap';
import { rememberConversation } from '../agent/memory';
import { GameId, agentId, conversationId, playerId } from './ids';
import {
  continueConversationMessage,
  leaveConversationMessage,
  startConversationMessage,
} from '../agent/conversation';
import { assertNever } from '../util/assertNever';
import { serializedAgent } from './agent';
import {
  CONVERSATION_COOLDOWN,
  ENERGY_EMERGENCY_THRESHOLD,
  ENERGY_SLEEP_THRESHOLD,
  HUNGER_EAT_THRESHOLD,
  WORK_MIN_ENERGY,
  WORK_COOLDOWN_MS,
  EAT_RECOVER,
  SLEEP_RECOVER,
  WORK_ENERGY_COST,
  WORK_HUNGER_COST,
  WORK_GOLD_REWARD,
  EAT_GOLD_COST,
  WELFARE_GOLD,
  HELP_GOLD_AMOUNT,
  SECURITY_THRESHOLD,
  SOCIAL_THRESHOLD,
  ESTEEM_THRESHOLD,
  FULFILLMENT_THRESHOLD,
  MASLOW_GATE_THRESHOLD,
  SOCIAL_CHAT_RECOVER,
  ESTEEM_WORK_RECOVER,
  ESTEEM_HELP_RECOVER,
  FULFILLMENT_CREATE_RECOVER,
  FULFILLMENT_EXPLORE_RECOVER,
  ESTEEM_TRADE_RECOVER,
} from '../constants';
import { api, internal } from '../_generated/api';
import { sleep } from '../util/sleep';
import { serializedPlayer } from './player';
import { getPoiById, getPoisByType, pickPointInPoi } from './pois';
import { serializedAgentDescription } from './agentDescription';
import { chatCompletion } from '../util/llm';

export const agentRememberConversation = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    await rememberConversation(
      ctx,
      args.worldId,
      args.agentId as GameId<'agents'>,
      args.playerId as GameId<'players'>,
      args.conversationId as GameId<'conversations'>,
    );
    await sleep(Math.random() * 1000);
    await ctx.runMutation(api.aiTown.main.sendInput, {
      worldId: args.worldId,
      name: 'finishRememberConversation',
      args: {
        agentId: args.agentId,
        operationId: args.operationId,
      },
    });
  },
});

export const agentGenerateMessage = internalAction({
  args: {
    worldId: v.id('worlds'),
    playerId,
    agentId,
    conversationId,
    otherPlayerId: playerId,
    operationId: v.string(),
    type: v.union(v.literal('start'), v.literal('continue'), v.literal('leave')),
    messageUuid: v.string(),
  },
  handler: async (ctx, args) => {
    let completionFn;
    switch (args.type) {
      case 'start':
        completionFn = startConversationMessage;
        break;
      case 'continue':
        completionFn = continueConversationMessage;
        break;
      case 'leave':
        completionFn = leaveConversationMessage;
        break;
      default:
        assertNever(args.type);
    }
    const text = await completionFn(
      ctx,
      args.worldId,
      args.conversationId as GameId<'conversations'>,
      args.playerId as GameId<'players'>,
      args.otherPlayerId as GameId<'players'>,
    );

    await ctx.runMutation(internal.aiTown.agent.agentSendMessage, {
      worldId: args.worldId,
      conversationId: args.conversationId,
      agentId: args.agentId,
      playerId: args.playerId,
      text,
      messageUuid: args.messageUuid,
      leaveConversation: args.type === 'leave',
      operationId: args.operationId,
    });
  },
});

export const agentDoSomething = internalAction({
  args: {
    worldId: v.id('worlds'),
    player: v.object(serializedPlayer),
    agent: v.object(serializedAgent),
    agentDescription: v.optional(v.object(serializedAgentDescription)),
    map: v.object(serializedWorldMap),
    otherFreePlayers: v.array(v.object(serializedPlayer)),
    operationId: v.string(),
  },
  handler: async (ctx, args) => {
    const { player, agent, agentDescription } = args;
    const map = new WorldMap(args.map);
    const now = Date.now();

    const needs = player.needs ?? { hunger: 100, energy: 100, security: 80, social: 70, esteem: 60, fulfillment: 50 };
    const gold = player.gold ?? 20;
    const homePoiId = player.homePoiId;
    const archetype = agentDescription?.archetype ?? 'normal';
    const stats = agentDescription?.stats ?? { sociability: 5, diligence: 5, cunning: 5, justice: 5, creativity: 5, resilience: 5 };
    const agentName = agentDescription?.identity?.split(' is ')[0] ?? `Agent ${agent.id}`;
    const mbti = agentDescription?.mbti ?? 'ENFP';
    const mbtiScores = agentDescription?.personality?.mbtiScores ?? {};

    // Maslow gate checks: higher needs only pursued when lower layers satisfied
    const physiologicalOk = needs.hunger > MASLOW_GATE_THRESHOLD && needs.energy > MASLOW_GATE_THRESHOLD;
    const safetyOk = needs.security > MASLOW_GATE_THRESHOLD;
    const socialOk = needs.social > MASLOW_GATE_THRESHOLD;
    const esteemOk = needs.esteem > MASLOW_GATE_THRESHOLD;

    // MBTI dimension helpers: convert E/I, S/N, T/F, J/P to 0-10 scores
    // E=8 means strongly extroverted; I=8 means strongly introverted (extroversionScore=2)
    const extroversionScore = mbtiScores.E != null ? mbtiScores.E : mbtiScores.I != null ? 10 - mbtiScores.I : 5;
    const sensingScore = mbtiScores.S != null ? mbtiScores.S : mbtiScores.N != null ? 10 - mbtiScores.N : 5;
    const thinkingScore = mbtiScores.T != null ? mbtiScores.T : mbtiScores.F != null ? 10 - mbtiScores.F : 5;
    const judgingScore = mbtiScores.J != null ? mbtiScores.J : mbtiScores.P != null ? 10 - mbtiScores.P : 5;
    const isExtrovert = extroversionScore > 5;
    const isSensor = sensingScore > 5;
    const isThinker = thinkingScore > 5;
    const isJudger = judgingScore > 5;

    // Helper: log activity event + write STM
    const logEvent = async (type: string, detail: string, importance?: number, relatedPlayerId?: string, sentiment?: number) => {
      await ctx.runMutation(internal.townNews.insertActivityEvent, {
        worldId: args.worldId,
        agentId: agent.id,
        playerId: player.id,
        type,
        detail,
        createdAt: now,
      });
      // Also write to short-term memory
      await ctx.runMutation(internal.agent.memory.insertShortTermMemory, {
        playerId: player.id,
        type,
        content: detail,
        importance: importance ?? 3,
        timestamp: now,
        relatedPlayerId,
        sentiment,
      });
    };

    // Priority 1: Emergency sleep (energy < 10)
    if (needs.energy < ENERGY_EMERGENCY_THRESHOLD && homePoiId) {
      const homePoi = getPoiById(homePoiId);
      if (homePoi) {
        const dest = pickPointInPoi(homePoi);
        console.log(`[${mbti}] ${agentName} EMERGENCY SLEEP (energy=${needs.energy.toFixed(1)})`);
        await logEvent('sleep', `${agentName} collapsed from exhaustion and fell asleep at ${homePoi.name}`);
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            destination: dest,
            activity: { description: 'sleeping (emergency)', emoji: '😴', until: now + 120_000 },
            needsUpdate: { hunger: 0, energy: SLEEP_RECOVER },
          },
        });
        return;
      }
    }

    // Priority 2: Sleep (energy < 20)
    if (needs.energy < ENERGY_SLEEP_THRESHOLD && homePoiId) {
      const homePoi = getPoiById(homePoiId);
      if (homePoi) {
        const dest = pickPointInPoi(homePoi);
        console.log(`[${mbti}] ${agentName} going to sleep (energy=${needs.energy.toFixed(1)})`);
        await logEvent('sleep', `${agentName} went home to ${homePoi.name} for a nap`);
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            destination: dest,
            activity: { description: 'sleeping', emoji: '😴', until: now + 120_000 },
            needsUpdate: { hunger: 0, energy: SLEEP_RECOVER },
          },
        });
        return;
      }
    }

    // Priority 3: Eat (hunger < 30)
    if (needs.hunger < HUNGER_EAT_THRESHOLD) {
      // Can afford food? Go to restaurant. Broke? Go to welfare office.
      if (gold >= EAT_GOLD_COST) {
        const restaurants = getPoisByType('restaurant');
        if (restaurants.length > 0) {
          const restaurant = restaurants[0];
          const dest = pickPointInPoi(restaurant);
          console.log(`[${mbti}] ${agentName} buying meal (gold=${gold}, hunger=${needs.hunger.toFixed(1)})`);
          await logEvent('eat', `${agentName} (${mbti}) bought a meal at ${restaurant.name} for ${EAT_GOLD_COST} gold`);
          await sleep(Math.random() * 1000);
          await ctx.runMutation(api.aiTown.main.sendInput, {
            worldId: args.worldId,
            name: 'finishDoSomething',
            args: {
              operationId: args.operationId,
              agentId: agent.id,
              destination: dest,
              activity: { description: 'eating', emoji: '🍜', until: now + 60_000 },
              needsUpdate: { hunger: EAT_RECOVER, energy: 0 },
              goldChange: -EAT_GOLD_COST,
            },
          });
          return;
        }
      } else {
        // Broke — go to welfare office for free food
        const welfareOffices = getPoisByType('welfare');
        if (welfareOffices.length > 0) {
          const welfare = welfareOffices[0];
          const dest = pickPointInPoi(welfare);
          console.log(`[${mbti}] ${agentName} going to welfare (gold=${gold})`);
          await logEvent('welfare', `${agentName} (${mbti}) went to ${welfare.name} for free food (broke)`);
          await sleep(Math.random() * 1000);
          await ctx.runMutation(api.aiTown.main.sendInput, {
            worldId: args.worldId,
            name: 'finishDoSomething',
            args: {
              operationId: args.operationId,
              agentId: agent.id,
              destination: dest,
              activity: { description: 'getting welfare food', emoji: '🆓', until: now + 45_000 },
              needsUpdate: { hunger: 30, energy: 0 },
              goldChange: WELFARE_GOLD,
            },
          });
          return;
        }
      }
    }

    // Priority 3.5: Security (Layer 2) — seek safety when insecure
    if (needs.security < SECURITY_THRESHOLD && physiologicalOk) {
      // Go home for safety, or prioritize earning gold if broke
      if (gold < 5) {
        // Broke and insecure — work to build a safety cushion
        const squares = getPoisByType('square');
        if (squares.length > 0 && needs.energy > WORK_MIN_ENERGY) {
          const square = squares[0];
          const dest = pickPointInPoi(square);
          const goldEarned = Math.round(WORK_GOLD_REWARD * (isThinker ? 1.3 : 0.9));
          console.log(`[${mbti}] ${agentName} working for SECURITY (gold=${gold}, security=${needs.security.toFixed(1)})`);
          await logEvent('work', `${agentName} worked urgently for financial security (gold=${gold})`);
          await sleep(Math.random() * 1000);
          await ctx.runMutation(api.aiTown.main.sendInput, {
            worldId: args.worldId,
            name: 'finishDoSomething',
            args: {
              operationId: args.operationId,
              agentId: agent.id,
              destination: dest,
              activity: { description: 'working (need security)', emoji: '🔒', until: now + 90_000 },
              needsUpdate: { hunger: -WORK_HUNGER_COST, energy: -WORK_ENERGY_COST, security: 10 },
              goldChange: goldEarned,
            },
          });
          return;
        }
      } else if (homePoiId) {
        // Has gold but feels unsafe — go home
        const homePoi = getPoiById(homePoiId);
        if (homePoi) {
          const dest = pickPointInPoi(homePoi);
          console.log(`[${mbti}] ${agentName} retreating home for SECURITY (security=${needs.security.toFixed(1)})`);
          await logEvent('security', `${agentName} went home to feel safe (security=${needs.security.toFixed(1)})`);
          await sleep(Math.random() * 1000);
          await ctx.runMutation(api.aiTown.main.sendInput, {
            worldId: args.worldId,
            name: 'finishDoSomething',
            args: {
              operationId: args.operationId,
              agentId: agent.id,
              destination: dest,
              activity: { description: 'resting at home (feeling unsafe)', emoji: '🏠', until: now + 60_000 },
              needsUpdate: { security: 15 },
            },
          });
          return;
        }
      }
    }

    // Priority 4: Work — J/P and diligence influence work ethic
    const lastWorkedAt = player.lastWorkedAt ?? 0;
    // J types are more disciplined (shorter cooldown), P types are more spontaneous
    const workCooldown = WORK_COOLDOWN_MS * (isJudger ? 0.7 : 1.3) * (1.5 - stats.diligence / 10);
    // Villain with high cunning or P types may skip work
    const villainSkipsWork = archetype === 'villain' && Math.random() < stats.cunning / 15;

    if (!villainSkipsWork && now > lastWorkedAt + workCooldown && needs.energy > WORK_MIN_ENERGY) {
      const squares = getPoisByType('square');
      if (squares.length > 0) {
        const square = squares[0];
        const dest = pickPointInPoi(square);
        // T types earn more gold (more efficient workers)
        const goldEarned = Math.round(WORK_GOLD_REWARD * (isThinker ? 1.3 : 0.9));
        console.log(`[${mbti}] ${agentName} going to work (energy=${needs.energy.toFixed(1)}, gold=${gold}, +${goldEarned})`);
        await logEvent('work', `${agentName} (${mbti}) worked at ${square.name} and earned ${goldEarned} gold`);
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            destination: dest,
            activity: { description: `working (+${goldEarned}g)`, emoji: '💼', until: now + 90_000 },
            needsUpdate: { hunger: -WORK_HUNGER_COST, energy: -WORK_ENERGY_COST, esteem: ESTEEM_WORK_RECOVER },
            goldChange: goldEarned,
          },
        });
        return;
      }
    }

    // Priority 4.5: Social NEED — when social need is critical, force socializing (ignore E/I)
    const justLeftConversation =
      agent.lastConversation && now < agent.lastConversation + CONVERSATION_COOLDOWN;
    const recentlyAttemptedInvite =
      agent.lastInviteAttempt && now < agent.lastInviteAttempt + CONVERSATION_COOLDOWN;

    if (needs.social < SOCIAL_THRESHOLD && physiologicalOk && safetyOk && !justLeftConversation && !recentlyAttemptedInvite) {
      // Social need is critical — force socialization regardless of personality
      const invitee = await ctx.runQuery(internal.aiTown.agent.findConversationCandidate, {
        now, worldId: args.worldId, player: args.player,
        otherFreePlayers: args.otherFreePlayers, archetype,
      });
      if (invitee) {
        console.log(`[${mbti}] ${agentName} SOCIAL NEED forcing conversation (social=${needs.social.toFixed(1)})`);
        await logEvent('social_need', `${agentName} felt lonely and sought out company (social=${needs.social.toFixed(1)})`);
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: args.agent.id,
            invitee,
            needsUpdate: { social: SOCIAL_CHAT_RECOVER },
          },
        });
        return;
      }
      // No one available — go to a social POI (square/park) to find people
      const socialPois = [...getPoisByType('square'), ...getPoisByType('park')];
      if (socialPois.length > 0) {
        const poi = socialPois[Math.floor(Math.random() * socialPois.length)];
        const dest = pickPointInPoi(poi);
        await logEvent('social_need', `${agentName} went to ${poi.name} looking for company`);
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            destination: dest,
            activity: { description: 'looking for friends', emoji: '🫂', until: now + 30_000 },
            needsUpdate: { social: 5 },
          },
        });
        return;
      }
    }

    // Priority 5: Social — archetype influences who to talk to (casual, non-urgent)
    // E/I dimension: extroverts more eager to socialize, introverts may skip
    const socialEagerness = isExtrovert ? extroversionScore / 10 : stats.sociability / 15;
    const skipSocial = Math.random() > socialEagerness;

    if (!justLeftConversation && !recentlyAttemptedInvite && !skipSocial) {
      const invitee = await ctx.runQuery(internal.aiTown.agent.findConversationCandidate, {
        now,
        worldId: args.worldId,
        player: args.player,
        otherFreePlayers: args.otherFreePlayers,
        archetype,
      });
      if (invitee) {
        await logEvent('invite', `${agentName} struck up a conversation with a neighbor`);
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: args.agent.id,
            invitee,
          },
        });
        return;
      }
    }

    // Priority 5.3: Trust-driven behavior — help trusted friends or villain scam
    const relationships = await ctx.runQuery(internal.townNews.getPlayerRelationships, {
      worldId: args.worldId,
      playerId: player.id,
    });

    // Feeler score (F dimension): high F = more empathetic, more likely to help
    const feelingScore = mbtiScores.F != null ? mbtiScores.F : mbtiScores.T != null ? 10 - mbtiScores.T : 5;

    if (archetype === 'villain') {
      // Villain scam: if trust > 30 toward a target AND target has gold > 50,
      // there's a cunning/20 chance the villain scams them
      for (const rel of relationships) {
        if (rel.trustValue > 30) {
          const target = args.otherFreePlayers.find((p) => p.id === rel.otherPlayerId);
          if (target && (target.gold ?? 20) > 50 && Math.random() < stats.cunning / 20) {
            const scamAmount = HELP_GOLD_AMOUNT;
            console.log(`[VILLAIN] ${agentName} scamming ${target.id} for ${scamAmount} gold (trust: ${rel.trustValue})`);
            await logEvent('scam', `${agentName} convinced ${target.id} to "invest" ${scamAmount} gold (scam! trust: ${rel.trustValue})`, 8, target.id, -8);
            // Transfer gold from target to villain via game engine input
            await ctx.runMutation(api.aiTown.main.sendInput, {
              worldId: args.worldId,
              name: 'transferGold',
              args: {
                fromPlayerId: target.id,
                toPlayerId: player.id,
                amount: scamAmount,
              },
            });
            // Walk toward the target to make the scam visible
            await sleep(Math.random() * 1000);
            await ctx.runMutation(api.aiTown.main.sendInput, {
              worldId: args.worldId,
              name: 'finishDoSomething',
              args: {
                operationId: args.operationId,
                agentId: agent.id,
                destination: { x: Math.floor(target.position.x), y: Math.floor(target.position.y) },
                activity: { description: `scammed ${scamAmount}g from a "friend"`, emoji: '🎭', until: now + 30_000 },
              },
            });
            return;
          }
        }
      }
    } else {
      // Non-villain: if trust > 50 toward another agent AND that agent is hungry AND we have gold > 30 AND high F score
      if (gold > 30 && feelingScore > 5) {
        for (const rel of relationships) {
          if (rel.trustValue > 50) {
            const friend = args.otherFreePlayers.find((p) => p.id === rel.otherPlayerId);
            if (friend && (friend.needs?.hunger ?? 100) < 30) {
              const helpAmount = HELP_GOLD_AMOUNT;
              console.log(`[HELP] ${agentName} helping ${friend.id} with ${helpAmount} gold (trust: ${rel.trustValue}, F=${feelingScore})`);
              await logEvent('help', `${agentName} helped ${friend.id} with ${helpAmount} gold (trust: ${rel.trustValue})`, 7, friend.id, 7);
              // Transfer gold via game engine input (handles both sides atomically)
              await ctx.runMutation(api.aiTown.main.sendInput, {
                worldId: args.worldId,
                name: 'transferGold',
                args: {
                  fromPlayerId: player.id,
                  toPlayerId: friend.id,
                  amount: helpAmount,
                },
              });
              // Walk toward the friend
              await sleep(Math.random() * 1000);
              await ctx.runMutation(api.aiTown.main.sendInput, {
                worldId: args.worldId,
                name: 'finishDoSomething',
                args: {
                  operationId: args.operationId,
                  agentId: agent.id,
                  destination: { x: Math.floor(friend.position.x), y: Math.floor(friend.position.y) },
                  activity: { description: `gave ${helpAmount}g to a friend`, emoji: '🤝', until: now + 30_000 },
                  needsUpdate: { esteem: ESTEEM_HELP_RECOVER, social: 10 },
                },
              });
              return;
            }
          }
        }
      }
    }

    // Priority 5.5: User Prompt — LLM-driven interpretation of player-set goals
    const userPrompt = await ctx.runQuery(internal.townNews.getActiveUserPrompt, {
      worldId: args.worldId,
      playerId: player.id,
    });
    if (userPrompt && needs.hunger > 40 && needs.energy > 30) {
      try {
        const llmPrompt = `You are an AI agent named ${agentName} (${mbti}, archetype: ${archetype}).
Personality stats: sociability=${stats.sociability}, diligence=${stats.diligence}, cunning=${stats.cunning}, justice=${stats.justice}, creativity=${stats.creativity}, resilience=${stats.resilience}.
Current needs (0-100): hunger=${needs.hunger.toFixed(0)}, energy=${needs.energy.toFixed(0)}, security=${needs.security.toFixed(0)}, social=${needs.social.toFixed(0)}, esteem=${needs.esteem.toFixed(0)}, fulfillment=${needs.fulfillment.toFixed(0)}.
Gold: ${gold}. Inventory: wood=${(player.inventory as any)?.wood ?? 0}, herbs=${(player.inventory as any)?.herbs ?? 0}.

The player has set this life goal for you: "${userPrompt.prompt}"
Based on your personality, stats, and current needs, decide your next action.
Respond with EXACTLY ONE of these actions in JSON:
{"action": "work"} - go earn gold
{"action": "socialize"} - find someone to talk to
{"action": "rest"} - go home and sleep
{"action": "explore"} - wander and explore
{"action": "create"} - do a creative activity (painting, writing, composing)
{"action": "gather"} - go collect resources in nature
{"action": "refuse", "reason": "..."} - reject the goal (explain why based on personality)`;

        const { content: llmResponse } = await chatCompletion({
          messages: [{ role: 'user', content: llmPrompt }],
          max_tokens: 150,
        });

        // Parse JSON from response (handle possible markdown wrapping)
        const jsonMatch = llmResponse.match(/\{[^}]+\}/);
        if (!jsonMatch) {
          console.error(`[UserPrompt] Failed to parse LLM response: ${llmResponse}`);
          // Fall through to default behavior
        } else {
          const decision = JSON.parse(jsonMatch[0]) as {
            action: string;
            reason?: string;
          };
          console.log(`[${mbti}] ${agentName} LLM decided: ${decision.action} for goal "${userPrompt.prompt}"`);

          if (decision.action === 'refuse') {
            await ctx.runMutation(internal.townNews.updatePromptStatus, {
              promptId: userPrompt._id,
              status: 'rejected',
              rejectReason: decision.reason ?? 'Agent declined based on personality',
            });
            await logEvent('user_prompt', `${agentName} rejected player's goal: "${userPrompt.prompt}" — ${decision.reason ?? 'personality conflict'}`);
            // Fall through to default behavior
          } else if (decision.action === 'socialize') {
            if (!justLeftConversation && !recentlyAttemptedInvite) {
              const invitee = await ctx.runQuery(internal.aiTown.agent.findConversationCandidate, {
                now, worldId: args.worldId, player: args.player,
                otherFreePlayers: args.otherFreePlayers, archetype,
              });
              if (invitee) {
                await ctx.runMutation(internal.townNews.updatePromptStatus, {
                  promptId: userPrompt._id,
                  status: 'executing',
                });
                await logEvent('user_prompt', `${agentName} followed player's goal: "${userPrompt.prompt}" — socializing`);
                await sleep(Math.random() * 1000);
                await ctx.runMutation(api.aiTown.main.sendInput, {
                  worldId: args.worldId, name: 'finishDoSomething',
                  args: { operationId: args.operationId, agentId: args.agent.id, invitee },
                });
                return;
              }
            }
          } else if (decision.action === 'work') {
            const squares = getPoisByType('square');
            if (squares.length > 0 && needs.energy > WORK_MIN_ENERGY) {
              const square = squares[0];
              const promptDest = pickPointInPoi(square);
              const goldEarned = Math.round(WORK_GOLD_REWARD * (isThinker ? 1.3 : 0.9));
              await ctx.runMutation(internal.townNews.updatePromptStatus, {
                promptId: userPrompt._id,
                status: 'executing',
              });
              await logEvent('user_prompt', `${agentName} followed player's goal: "${userPrompt.prompt}" — working`);
              await sleep(Math.random() * 1000);
              await ctx.runMutation(api.aiTown.main.sendInput, {
                worldId: args.worldId, name: 'finishDoSomething',
                args: {
                  operationId: args.operationId, agentId: agent.id, destination: promptDest,
                  activity: { description: `working (goal: ${userPrompt.prompt})`, emoji: '🎯', until: now + 90_000 },
                  needsUpdate: { hunger: -WORK_HUNGER_COST, energy: -WORK_ENERGY_COST },
                  goldChange: goldEarned,
                },
              });
              return;
            }
          } else if (decision.action === 'rest') {
            if (homePoiId) {
              const homePoi = getPoiById(homePoiId);
              if (homePoi) {
                const promptDest = pickPointInPoi(homePoi);
                await ctx.runMutation(internal.townNews.updatePromptStatus, {
                  promptId: userPrompt._id,
                  status: 'executing',
                });
                await logEvent('user_prompt', `${agentName} followed player's goal: "${userPrompt.prompt}" — resting`);
                await sleep(Math.random() * 1000);
                await ctx.runMutation(api.aiTown.main.sendInput, {
                  worldId: args.worldId, name: 'finishDoSomething',
                  args: {
                    operationId: args.operationId, agentId: agent.id, destination: promptDest,
                    activity: { description: 'resting (player goal)', emoji: '🎯', until: now + 120_000 },
                    needsUpdate: { hunger: 0, energy: SLEEP_RECOVER },
                  },
                });
                return;
              }
            }
          } else if (decision.action === 'explore') {
            const exploreDest = wanderDestination(map);
            await ctx.runMutation(internal.townNews.updatePromptStatus, {
              promptId: userPrompt._id,
              status: 'executing',
            });
            await logEvent('user_prompt', `${agentName} followed player's goal: "${userPrompt.prompt}" — exploring`);
            await sleep(Math.random() * 1000);
            await ctx.runMutation(api.aiTown.main.sendInput, {
              worldId: args.worldId, name: 'finishDoSomething',
              args: {
                operationId: args.operationId, agentId: agent.id, destination: exploreDest,
                activity: { description: `exploring (goal: ${userPrompt.prompt})`, emoji: '🎯', until: now + 30_000 },
              },
            });
            return;
          }
        }
      } catch (e) {
        console.error(`[UserPrompt] LLM call failed for ${agentName}:`, e);
        // Fall through to default behavior on LLM failure
      }
    }

    // Priority 5.7: Esteem (Layer 4) — seek recognition through work/help
    if (needs.esteem < ESTEEM_THRESHOLD && physiologicalOk && safetyOk && socialOk) {
      // Work harder for recognition
      const lastWorkedAt2 = player.lastWorkedAt ?? 0;
      if (now > lastWorkedAt2 + 30_000 && needs.energy > WORK_MIN_ENERGY) {
        const squares = getPoisByType('square');
        if (squares.length > 0) {
          const square = squares[0];
          const dest = pickPointInPoi(square);
          const goldEarned = Math.round(WORK_GOLD_REWARD * (isThinker ? 1.3 : 0.9));
          console.log(`[${mbti}] ${agentName} working for ESTEEM (esteem=${needs.esteem.toFixed(1)})`);
          await logEvent('esteem', `${agentName} worked extra hard seeking recognition (esteem=${needs.esteem.toFixed(1)})`);
          await sleep(Math.random() * 1000);
          await ctx.runMutation(api.aiTown.main.sendInput, {
            worldId: args.worldId,
            name: 'finishDoSomething',
            args: {
              operationId: args.operationId,
              agentId: agent.id,
              destination: dest,
              activity: { description: 'working hard (seeking respect)', emoji: '⭐', until: now + 90_000 },
              needsUpdate: { hunger: -WORK_HUNGER_COST, energy: -WORK_ENERGY_COST, esteem: ESTEEM_WORK_RECOVER + 5 },
              goldChange: goldEarned,
            },
          });
          return;
        }
      }
    }

    // Priority 5.8: Self-actualization (Layer 5) — creative pursuits & exploration
    if (needs.fulfillment < FULFILLMENT_THRESHOLD && physiologicalOk && safetyOk && socialOk && esteemOk) {
      // Only agents with creativity > 5 can do creative activities
      if (stats.creativity > 5) {
        const creativeActivities = [
          { description: 'painting a landscape', emoji: '🎨', recover: FULFILLMENT_CREATE_RECOVER },
          { description: 'writing poetry', emoji: '✍️', recover: FULFILLMENT_CREATE_RECOVER },
          { description: 'composing a melody', emoji: '🎵', recover: FULFILLMENT_CREATE_RECOVER },
          { description: 'designing something new', emoji: '💡', recover: FULFILLMENT_CREATE_RECOVER },
        ];
        const chosen = creativeActivities[Math.floor(Math.random() * creativeActivities.length)];
        // Scale recovery by creativity
        const scaledRecover = Math.round(chosen.recover * (stats.creativity / 7));
        const parks = getPoisByType('park');
        const creativeDest = parks.length > 0 ? pickPointInPoi(parks[0]) : wanderDestination(map);
        console.log(`[${mbti}] ${agentName} pursuing SELF-ACTUALIZATION: ${chosen.description} (fulfillment=${needs.fulfillment.toFixed(1)})`);
        await logEvent('create', `${agentName} ${chosen.description} (fulfillment=${needs.fulfillment.toFixed(1)}, creativity=${stats.creativity})`);
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            destination: creativeDest,
            activity: { description: chosen.description, emoji: chosen.emoji, until: now + 90_000 },
            needsUpdate: { fulfillment: scaledRecover, energy: -5 },
          },
        });
        return;
      } else {
        // Low creativity — explore for fulfillment instead
        const exploreDest = wanderDestination(map);
        console.log(`[${mbti}] ${agentName} exploring for FULFILLMENT (fulfillment=${needs.fulfillment.toFixed(1)})`);
        await logEvent('explore', `${agentName} explored new areas seeking purpose (fulfillment=${needs.fulfillment.toFixed(1)})`);
        await sleep(Math.random() * 1000);
        await ctx.runMutation(api.aiTown.main.sendInput, {
          worldId: args.worldId,
          name: 'finishDoSomething',
          args: {
            operationId: args.operationId,
            agentId: agent.id,
            destination: exploreDest,
            activity: { description: 'exploring (seeking purpose)', emoji: '🔭', until: now + 45_000 },
            needsUpdate: { fulfillment: FULFILLMENT_EXPLORE_RECOVER },
          },
        });
        return;
      }
    }

    // Priority 5.9: Gathering — collect resources at gathering POIs
    const gatheringPois = getPoisByType('gathering');
    const hasLowResources = !player.inventory || Object.values(player.inventory ?? {}).every((v) => (v ?? 0) < 3);
    if (gatheringPois.length > 0 && hasLowResources && needs.energy > 30 && Math.random() < 0.3) {
      const gatherPoi = gatheringPois[Math.floor(Math.random() * gatheringPois.length)];
      const dest = pickPointInPoi(gatherPoi);
      const resource = gatherPoi.gatherResource ?? 'herbs';
      const amount = Math.round((gatherPoi.gatherAmount ?? 2) * (1 + stats.creativity / 15));
      console.log(`[${mbti}] ${agentName} gathering ${resource} at ${gatherPoi.name}`);
      await logEvent('gather', `${agentName} gathered ${amount} ${resource} at ${gatherPoi.name}`);
      // Add resources via game input
      await ctx.runMutation(api.aiTown.main.sendInput, {
        worldId: args.worldId,
        name: 'gatherResource',
        args: { playerId: player.id, resource, amount },
      });
      await sleep(Math.random() * 1000);
      await ctx.runMutation(api.aiTown.main.sendInput, {
        worldId: args.worldId,
        name: 'finishDoSomething',
        args: {
          operationId: args.operationId,
          agentId: agent.id,
          destination: dest,
          activity: { description: `gathering ${resource}`, emoji: '🌿', until: now + 90_000 },
          needsUpdate: { energy: -10, fulfillment: 5 },
        },
      });
      return;
    }

    // Priority 5.95: Trade — if we have resources and see someone nearby who might want them
    const inventory = player.inventory ?? { wood: 0, ore: 0, herbs: 0, food: 0 };
    const totalResources = Object.values(inventory).reduce((a, b) => a + (b ?? 0), 0);
    if (totalResources > 5 && relationships.length > 0 && Math.random() < 0.2) {
      // Find a trusted player to trade with
      const tradePartners = relationships
        .filter((r) => r.trustValue > 10)
        .sort((a, b) => b.trustValue - a.trustValue);
      if (tradePartners.length > 0) {
        const partner = tradePartners[0];
        const partnerPlayer = args.otherFreePlayers.find((p) => p.id === partner.otherPlayerId);
        if (partnerPlayer) {
          // Find our most abundant resource
          const bestResource = (Object.entries(inventory) as [string, number][])
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])[0];
          if (bestResource) {
            const [resource, amount] = bestResource;
            const tradeAmount = Math.min(amount, 3);
            const goldValue = tradeAmount * 3; // 3 gold per resource unit
            console.log(`[${mbti}] ${agentName} trading ${tradeAmount} ${resource} with ${partnerPlayer.id} for ${goldValue} gold`);
            await logEvent('trade', `${agentName} traded ${tradeAmount} ${resource} for ${goldValue} gold`, 5, partnerPlayer.id, 5);
            await ctx.runMutation(api.aiTown.main.sendInput, {
              worldId: args.worldId,
              name: 'executeTrade',
              args: {
                fromPlayerId: player.id,
                toPlayerId: partnerPlayer.id,
                toGold: goldValue,
                fromResource: resource,
                fromResourceAmount: tradeAmount,
              },
            });
            await sleep(Math.random() * 1000);
            await ctx.runMutation(api.aiTown.main.sendInput, {
              worldId: args.worldId,
              name: 'finishDoSomething',
              args: {
                operationId: args.operationId,
                agentId: agent.id,
                destination: { x: Math.floor(partnerPlayer.position.x), y: Math.floor(partnerPlayer.position.y) },
                activity: { description: `trading ${resource}`, emoji: '🤝', until: now + 30_000 },
                needsUpdate: { esteem: ESTEEM_TRADE_RECOVER, social: 10 },
              },
            });
            return;
          }
        }
      }
    }

    // Priority 6: Wander — MBTI + archetype influence destination
    let dest;
    let wanderActivity;
    // Guardians patrol public areas (J types more consistently)
    if (archetype === 'guardian' && Math.random() < stats.justice / 10) {
      const squares = getPoisByType('square');
      if (squares.length > 0) {
        dest = pickPointInPoi(squares[0]);
        wanderActivity = { description: 'patrolling', emoji: '🛡️', until: now + 30_000 };
        console.log(`[${mbti}] ${agentName} patrolling near Town Square`);
        await logEvent('patrol', `${agentName} (${mbti}) patrolled near ${squares[0].name}`);
      }
    }
    // S types prefer familiar POIs, N types explore randomly
    if (!dest && isSensor && Math.random() < sensingScore / 10) {
      const allPois = [...getPoisByType('restaurant'), ...getPoisByType('square')];
      if (allPois.length > 0) {
        const poi = allPois[Math.floor(Math.random() * allPois.length)];
        dest = pickPointInPoi(poi);
        wanderActivity = { description: `visiting ${poi.name}`, emoji: '🏠', until: now + 25_000 };
        await logEvent('visit', `${agentName} (${mbti}) visited ${poi.name}`);
      }
    }
    // Trust-biased wander: if there's a trusted agent (trust > 40), bias toward their position
    if (!dest && relationships.length > 0) {
      const trustedFriends = relationships
        .filter((r) => r.trustValue > 40)
        .sort((a, b) => b.trustValue - a.trustValue);
      if (trustedFriends.length > 0) {
        // Pick the most trusted friend and try to wander toward them
        const bestFriend = trustedFriends[0];
        const friendPlayer = args.otherFreePlayers.find((p) => p.id === bestFriend.otherPlayerId);
        if (friendPlayer && Math.random() < 0.5) {
          // Bias destination toward friend's position (not exact, add some randomness)
          dest = {
            x: Math.floor(friendPlayer.position.x + (Math.random() - 0.5) * 4),
            y: Math.floor(friendPlayer.position.y + (Math.random() - 0.5) * 4),
          };
          // Clamp to map bounds
          dest.x = Math.max(1, Math.min(map.width - 2, dest.x));
          dest.y = Math.max(1, Math.min(map.height - 2, dest.y));
          wanderActivity = { description: 'seeking a friend', emoji: '👋', until: now + 25_000 };
          await logEvent('social_seek', `${agentName} (${mbti}) wandered toward a trusted friend (trust: ${bestFriend.trustValue})`);
        }
      }
    }
    if (!dest) {
      dest = wanderDestination(map);
      wanderActivity = { description: 'exploring', emoji: '🚶', until: now + 20_000 };
      await logEvent('wander', `${agentName} (${mbti}) went exploring around town`);
    }
    await sleep(Math.random() * 1000);
    await ctx.runMutation(api.aiTown.main.sendInput, {
      worldId: args.worldId,
      name: 'finishDoSomething',
      args: {
        operationId: args.operationId,
        agentId: agent.id,
        destination: dest,
        activity: wanderActivity,
      },
    });
  },
});

function wanderDestination(worldMap: WorldMap) {
  // Wander someonewhere at least one tile away from the edge.
  return {
    x: 1 + Math.floor(Math.random() * (worldMap.width - 2)),
    y: 1 + Math.floor(Math.random() * (worldMap.height - 2)),
  };
}

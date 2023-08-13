// Future: can use node
// 'use node';
// ^ This tells Convex to run this in a `node` environment.
// Read more: https://docs.convex.dev/functions/runtimes
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';

import { ActionCtx, internalAction } from './_generated/server';
import { MemoryDB } from './lib/memory';
import { Message, Player } from './schema';
import {
  chatHistoryFromMessages,
  decideWhoSpeaksNext,
  converse,
  startConversation,
  walkAway,
} from './conversation';
import { getNearbyPlayers } from './lib/physics';
import { CONVERSATION_TIME_LIMIT } from './config';

export const runAgentBatch = internalAction({
  args: {
    playerIds: v.array(v.id('players')),
    noSchedule: v.optional(v.boolean()),
  },
  handler: async (ctx, { playerIds, noSchedule }) => {
    const memory = MemoryDB(ctx);
    // TODO: single-flight done & action API to avoid write contention.
    const done: DoneFn = handleDone(ctx, noSchedule);
    // Get the current state of the world
    const { players } = await ctx.runQuery(internal.journal.getSnapshot, { playerIds });
    // Segment users by location
    const { groups, solos } = divideIntoGroups(players);
    // Run a conversation for each group.
    const groupPromises = groups.map(async (group) => {
      const finished = new Set<Id<'agents'>>();
      try {
        await handleAgentInteraction(ctx, group, memory, (agentId, activity) => {
          if (agentId) finished.add(agentId);
          return done(agentId, activity);
        });
      } catch (e) {
        console.error(
          'group failed, going for a walk: ',
          group.map((p) => p.agentId),
        );
        for (const player of group) {
          if (player.agentId && !finished.has(player.agentId)) {
            await done(player.agentId, { type: 'walk', ignore: group.map((p) => p.id) });
          }
        }
        throw e;
      }
    });
    // For those not in a group, run the solo agent loop.
    const soloPromises = solos.map(async (player) => {
      try {
        if (player.agentId) {
          await handleAgentSolo(ctx, player, memory, done);
        }
      } catch (e) {
        console.error('agent failed, going for a walk: ', player.agentId);
        await done(player.agentId!, { type: 'walk', ignore: [] });
        throw e;
      }
    });

    // Make a structure that resolves when the agent yields.
    // It should fail to do any actions if the agent has already yielded.

    const start = Date.now();
    // While testing if you want failures to show up more loudly, use this instead:
    await Promise.all([...groupPromises, ...soloPromises]);
    // Otherwise, this will allow each group / solo to complete:
    // const results = await Promise.allSettled([...groupPromises, ...soloPromises]);
    // for (const result of results) {
    //   if (result.status === 'rejected') {
    //     console.error(result.reason, playerIds);
    //   }
    // }

    console.debug(
      `agent batch (${groups.length}g ${solos.length}s) finished: ${Date.now() - start}ms`,
    );
  },
});

function divideIntoGroups(players: Player[]) {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const groups: Player[][] = [];
  const solos: Player[] = [];
  while (playerById.size > 0) {
    const player = playerById.values().next().value;
    playerById.delete(player.id);
    const nearbyPlayers = getNearbyPlayers(player.motion, [...playerById.values()]);
    if (nearbyPlayers.length > 0) {
      // If you only want to do 1:1 conversations, use this:
      // groups.push([player, nearbyPlayers[0]]);
      // playerById.delete(nearbyPlayers[0].id);
      // otherwise, do more than 1:1 conversations by adding them all:
      groups.push([player, ...nearbyPlayers]);
      for (const nearbyPlayer of nearbyPlayers) {
        playerById.delete(nearbyPlayer.id);
      }
    } else {
      solos.push(player);
    }
  }
  return { groups, solos };
}

async function handleAgentSolo(ctx: ActionCtx, player: Player, memory: MemoryDB, done: DoneFn) {
  // console.debug('handleAgentSolo: ', player.name, player.id);
  // Handle new observations: it can look at the agent's lastWakeTs for a delta.
  //   Calculate scores
  // Run reflection on memories once in a while
  await memory.reflectOnMemories(player.id, player.name);
  // Future: Store observations about seeing players in conversation
  //  might include new observations -> add to memory with openai embeddings
  // Later: handle object ownership?
  // Based on plan and observations, determine next action:
  //   if so, add new memory for new plan, and return new action
  const walk = player.motion.type === 'stopped' || player.motion.targetEndTs < Date.now();
  // Ignore everyone we last said something to.
  const ignore =
    player.motion.type === 'walking' ? player.motion.ignore : player.lastChat?.message.to ?? [];
  await done(player.agentId, { type: walk ? 'walk' : 'continue', ignore });
}

export async function handleAgentInteraction(
  ctx: ActionCtx,
  players: Player[],
  memory: MemoryDB,
  done: DoneFn,
) {
  // TODO: pick a better conversation starter
  const leader = players[0];
  for (const player of players) {
    const imWalkingHere =
      player.motion.type === 'walking' && player.motion.targetEndTs > Date.now();
    // Get players to walk together and face each other
    if (player.agentId) {
      if (player === leader) {
        if (imWalkingHere) {
          await ctx.runMutation(internal.journal.stop, {
            playerId: player.id,
          });
        }
      } else {
        await ctx.runMutation(internal.journal.walk, {
          agentId: player.agentId,
          target: leader.id,
          ignore: players.map((p) => p.id),
        });
        // TODO: collect collisions and pass them into the engine to wake up
        // other players to avoid these ones in conversation.
      }
    }
  }

  const conversationId = await ctx.runMutation(internal.journal.makeConversation, {
    playerId: leader.id,
    audience: players.slice(1).map((p) => p.id),
  });

  const playerById = new Map(players.map((p) => [p.id, p]));
  const relations = await ctx.runQuery(internal.journal.getRelationships, {
    playerIds: players.map((p) => p.id),
  });
  const relationshipsByPlayerId = new Map(
    relations.map(({ playerId, relations }) => [
      playerId,
      relations.map((r) => ({ ...playerById.get(playerId)!, relationship: r.relationship })),
    ]),
  );

  const messages: Message[] = [];

  // TODO: real logic. this just sends one message each!

  const endAfterTs = Date.now() + CONVERSATION_TIME_LIMIT;
  // Choose who should speak next:
  let endConversation = false;
  let lastSpeakerId = leader.id;
  let remainingPlayers = players;

  while (!endConversation) {
    // leader speaks first
    const chatHistory = chatHistoryFromMessages(messages);
    const speaker =
      messages.length === 0
        ? leader
        : await decideWhoSpeaksNext(
            remainingPlayers.filter((p) => p.id !== lastSpeakerId),
            chatHistory,
          );
    lastSpeakerId = speaker.id;
    const audiencePlayers = players.filter((p) => p.id !== speaker.id);
    const audience = players.filter((p) => p.id !== speaker.id).map((p) => p.id);
    const shouldWalkAway = audience.length === 0 || (await walkAway(chatHistory, speaker));

    // Decide if we keep talking.
    if (shouldWalkAway || Date.now() > endAfterTs) {
      // It's to chatty here, let's go somewhere else.
      await ctx.runMutation(internal.journal.leaveConversation, {
        playerId: speaker.id,
        audience,
        conversationId,
      });
      // Update remaining players
      remainingPlayers = remainingPlayers.filter((p) => p.id !== speaker.id);
      // End the interaction if there's no one left to talk to.
      endConversation = audience.length === 0;

      // TODO: remove this player from the audience list
      break;
    }

    // TODO - playerRelations is not used today because of https://github.com/a16z-infra/ai-town/issues/56
    const playerRelations = relationshipsByPlayerId.get(speaker.id) ?? [];
    let playerCompletion;
    if (messages.length === 0) {
      playerCompletion = await startConversation(ctx, audiencePlayers, memory, speaker);
    } else {
      // TODO: stream the response and write to the mutation for every sentence.
      playerCompletion = await converse(ctx, chatHistory, speaker, audiencePlayers, memory);
    }

    const message = await ctx.runMutation(internal.journal.talk, {
      playerId: speaker.id,
      audience,
      content: playerCompletion.content,
      relatedMemoryIds: playerCompletion.memoryIds,
      conversationId,
    });

    if (message) {
      messages.push(message);
    }
  }

  if (messages.length > 0) {
    for (const player of players) {
      await memory.rememberConversation(player.name, player.id, player.identity, conversationId);
      await done(player.agentId, { type: 'walk', ignore: players.map((p) => p.id) });
    }
  }
}

type DoneFn = (
  agentId: Id<'agents'> | undefined,
  activity:
    | { type: 'walk'; ignore: Id<'players'>[] }
    | { type: 'continue'; ignore: Id<'players'>[] },
) => Promise<void>;

function handleDone(ctx: ActionCtx, noSchedule?: boolean): DoneFn {
  const doIt: DoneFn = async (agentId, activity) => {
    // console.debug('handleDone: ', agentId, activity);
    if (!agentId) return;
    let walkResult;
    switch (activity.type) {
      case 'walk':
        walkResult = await ctx.runMutation(internal.journal.walk, {
          agentId,
          ignore: activity.ignore,
        });
        break;
      case 'continue':
        walkResult = await ctx.runQuery(internal.journal.nextCollision, {
          agentId,
          ignore: activity.ignore,
        });
        break;
      default:
        const _exhaustiveCheck: never = activity;
        throw new Error(`Unhandled activity: ${JSON.stringify(activity)}`);
    }
    await ctx.runMutation(internal.engine.agentDone, {
      agentId,
      otherAgentIds: walkResult.nextCollision?.agentIds,
      wakeTs: walkResult.nextCollision?.ts ?? walkResult.targetEndTs,
      noSchedule,
    });
  };
  // Simple serialization: only one agent finishes at a time.
  let queue = new Set<Promise<unknown>>();
  return async (agentId, activity) => {
    let unlock;
    const wait = new Promise((resolve) => (unlock = resolve));
    const toAwait = [...queue];
    queue.add(wait);
    try {
      await Promise.allSettled(toAwait);
      await doIt(agentId, activity);
    } finally {
      unlock!();
      queue.delete(wait);
    }
  };
}

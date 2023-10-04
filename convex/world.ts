import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { characters } from '../data/characters';
import { sendInput } from './game/main';
import { IDLE_WORLD_TIMEOUT } from './constants';
import { restartAgents, stopAgents } from './agent/init';
import { restartWorld } from './init';
import { Doc, Id } from './_generated/dataModel';

export const defaultWorld = query({
  handler: async (ctx) => {
    const world = await ctx.db
      .query('worlds')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
    if (!world) {
      return null;
    }
    const map = await ctx.db.get(world.mapId);
    if (!map) {
      throw new Error(`Invalid map ID: ${world.mapId}`);
    }
    return { map, ...world };
  },
});

export const heartbeatWorld = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    const now = Date.now();
    world.lastViewed = Math.max(world.lastViewed ?? now, now);
    await ctx.db.replace(world._id, world);

    // Restart the engine if it's stopped.
    const engine = await ctx.db.get(world.engineId);
    if (!engine) {
      throw new Error(`Invalid engine ID: ${world.engineId}`);
    }
    if (!engine.active) {
      return;
    }
    await restartWorld(ctx, args.worldId);
    await restartAgents(ctx, { worldId: args.worldId });
  },
});

export const stopInactiveWorlds = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - IDLE_WORLD_TIMEOUT;
    const worlds = await ctx.db.query('worlds').collect();
    for (const world of worlds) {
      if (cutoff < world.lastViewed) {
        continue;
      }
      console.log(`Stopping inactive world ${world._id}`);
      const engine = await ctx.db.get(world.engineId);
      if (!engine) {
        throw new Error(`Invalid engine ID: ${world.engineId}`);
      }
      if (!engine.active) {
        continue;
      }
      // TODO: When we can cancel scheduled jobs, do that transactionally here. For now,
      // just bump the generation number to cancel future runs.
      await stopAgents(ctx, { worldId: world._id });
      engine.generationNumber = engine.generationNumber + 1;
      await ctx.db.replace(engine._id, engine);
    }
  },
});

export const engineStatus = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    const engine = await ctx.db.get(world.engineId);
    if (!engine) {
      throw new Error(`Invalid engine ID: ${world.engineId}`);
    }
    return engine;
  },
});

export const userStatus = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    const player = await ctx.db
      .query('players')
      .withIndex('active', (q) =>
        q.eq('worldId', world._id).eq('active', true).eq('human', identity.tokenIdentifier),
      )
      .first();
    return player?._id ?? null;
  },
});

export const joinWorld = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(`Not logged in`);
    }
    if (!identity.givenName) {
      throw new Error(`Missing givenName on ${JSON.stringify(identity)}`);
    }
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    const { tokenIdentifier } = identity;
    const existingPlayer = await ctx.db
      .query('players')
      .withIndex('active', (q) =>
        q.eq('worldId', world._id).eq('active', true).eq('human', identity.tokenIdentifier),
      )
      .first();
    if (existingPlayer) {
      throw new Error(`Already joined as ${existingPlayer._id}`);
    }
    await sendInput(ctx, {
      worldId: world._id,
      name: 'join',
      args: {
        name: identity.givenName,
        character: characters[Math.floor(Math.random() * characters.length)].name,
        description: `${identity.givenName} is a human player`,
        tokenIdentifier,
      },
    });
  },
});

export const leaveWorld = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(`Not logged in`);
    }
    const { tokenIdentifier } = identity;
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    const existingPlayer = await ctx.db
      .query('players')
      .withIndex('active', (q) =>
        q.eq('worldId', world._id).eq('active', true).eq('human', tokenIdentifier),
      )
      .first();
    if (!existingPlayer) {
      return;
    }
    await sendInput(ctx, {
      worldId: world._id,
      name: 'leave',
      args: {
        playerId: existingPlayer._id,
      },
    });
  },
});

export const sendWorldInput = mutation({
  args: {
    worldId: v.id('worlds'),
    name: v.string(),
    args: v.any(),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    return await sendInput(ctx, {
      worldId: world._id,
      name: args.name,
      args: args.args,
    });
  },
});

export type PlayerMetadata = Doc<'players'> & {
  location: Doc<'locations'>;
  isSpeaking: boolean;
  isThinking: boolean;
};

export const activePlayers = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args): Promise<PlayerMetadata[]> => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    const out = [];
    const players = await ctx.db
      .query('players')
      .withIndex('active', (q) => q.eq('worldId', world._id).eq('active', true))
      .collect();
    for (const player of players) {
      const location = await ctx.db.get(player.locationId);
      if (!location) {
        throw new Error(`Invalid location ID: ${player.locationId}`);
      }
      let isSpeaking = false;
      const member = await ctx.db
        .query('conversationMembers')
        .withIndex('playerId', (q) =>
          q.eq('playerId', player._id).eq('status.kind', 'participating'),
        )
        .first();
      if (member) {
        const indicator = await ctx.db
          .query('typingIndicator')
          .withIndex('conversationId', (q) => q.eq('conversationId', member.conversationId))
          .first();
        isSpeaking = !!indicator && indicator.typing?.playerId === player._id;
      }
      const agent = await ctx.db
        .query('agents')
        .withIndex('playerId', (q) => q.eq('playerId', player._id))
        .first();
      const isThinking = !!agent && agent.isThinking !== undefined;
      out.push({ ...player, isSpeaking, isThinking, location });
    }
    return out;
  },
});

export type ConversationState = Doc<'conversations'> & {
  member: Doc<'conversationMembers'>;
  otherPlayerId: Id<'players'>;
};

export const loadConversationState = query({
  args: {
    playerId: v.id('players'),
  },
  handler: async (ctx, args): Promise<null | ConversationState> => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error(`Invalid player ID: ${args.playerId}`);
    }
    // TODO: We could combine these queries if we had `.neq()` in our index query API.
    const invited = await ctx.db
      .query('conversationMembers')
      .withIndex('playerId', (q) => q.eq('playerId', player._id).eq('status.kind', 'invited'))
      .unique();
    const walkingOver = await ctx.db
      .query('conversationMembers')
      .withIndex('playerId', (q) => q.eq('playerId', player._id).eq('status.kind', 'walkingOver'))
      .unique();
    const participating = await ctx.db
      .query('conversationMembers')
      .withIndex('playerId', (q) => q.eq('playerId', player._id).eq('status.kind', 'participating'))
      .unique();

    if ([invited, walkingOver, participating].filter(Boolean).length > 1) {
      throw new Error(`Player ${player._id} is in multiple conversations`);
    }
    const member = invited ?? walkingOver ?? participating;
    if (!member) {
      return null;
    }
    const conversation = await ctx.db.get(member.conversationId);
    if (!conversation) {
      throw new Error(`Invalid conversation ID: ${member.conversationId}`);
    }

    const members = await ctx.db
      .query('conversationMembers')
      .withIndex('conversationId', (q) => q.eq('conversationId', conversation._id))
      .collect();
    const otherMember = members.find((m) => m.playerId !== player._id);
    if (!otherMember) {
      throw new Error(`Conversation ${conversation._id} has no other member`);
    }
    const otherPlayerId = otherMember.playerId;

    return { member, otherPlayerId, ...conversation };
  },
});

export const previousConversation = query({
  args: {
    playerId: v.id('players'),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query('conversationMembers')
      .withIndex('playerId', (q) => q.eq('playerId', args.playerId).eq('status.kind', 'left'))
      .order('desc');

    for await (const member of members) {
      const conversation = await ctx.db.get(member.conversationId);
      if (!conversation) {
        throw new Error(`Invalid conversation ID: ${member.conversationId}`);
      }
      const firstMessage = await ctx.db
        .query('messages')
        .withIndex('conversationId', (q) => q.eq('conversationId', conversation._id))
        .order('asc')
        .first();
      if (!firstMessage) {
        continue;
      }
      return conversation;
    }
    return null;
  },
});

export const conversationMembers = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query('conversationMembers')
      .withIndex('conversationId', (q) => q.eq('conversationId', args.conversationId))
      .collect();
    const out = [];
    for (const member of members) {
      const player = await ctx.db.get(member.playerId);
      if (!player) {
        throw new Error(`Invalid player ID: ${member.playerId}`);
      }
      out.push({ playerName: player.name, ...member });
    }
    return out;
  },
});

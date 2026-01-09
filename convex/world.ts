import { ConvexError, v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { characters } from '../data/characters';
import { insertInput } from './aiTown/insertInput';
import {
  DEFAULT_NAME,
  ENGINE_ACTION_DURATION,
  IDLE_WORLD_TIMEOUT,
  WORLD_HEARTBEAT_INTERVAL,
} from './constants';
import { playerId } from './aiTown/ids';
import { kickEngine, startEngine, stopEngine } from './aiTown/main';
import { engineInsertInput } from './engine/abstractGame';

export const defaultWorldStatus = query({
  handler: async (ctx: any) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .filter((q: any) => q.eq(q.field('isDefault'), true))
      .first();
    return worldStatus;
  },
});

export const heartbeatWorld = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx: any, args: any) => {
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId', (q: any) => q.eq('worldId', args.worldId))
      .first();
    if (!worldStatus) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    const now = Date.now();

    // Skip the update (and then potentially make the transaction readonly)
    // if it's been viewed sufficiently recently..
    if (!worldStatus.lastViewed || worldStatus.lastViewed < now - WORLD_HEARTBEAT_INTERVAL / 2) {
      await ctx.db.patch(worldStatus._id, {
        lastViewed: Math.max(worldStatus.lastViewed ?? now, now),
      });
    }

    // Restart inactive worlds, but leave worlds explicitly stopped by the developer alone.
    if (worldStatus.status === 'stoppedByDeveloper') {
      console.debug(`World ${worldStatus._id} is stopped by developer, not restarting.`);
    }
    if (worldStatus.status === 'inactive') {
      console.log(`Restarting inactive world ${worldStatus._id}...`);
      await ctx.db.patch(worldStatus._id, { status: 'running' });
      await startEngine(ctx, worldStatus.worldId);
      await ctx.scheduler.runAfter(0, internal.aiTown.agentTick.restartAgents, { worldId: worldStatus.worldId });
    }
  },
});

export const stopInactiveWorlds = internalMutation({
  handler: async (ctx: any) => {
    const cutoff = Date.now() - IDLE_WORLD_TIMEOUT;
    const worlds = await ctx.db.query('worldStatus').collect();
    for (const worldStatus of worlds) {
      if (cutoff < worldStatus.lastViewed || worldStatus.status !== 'running') {
        continue;
      }
      console.log(`Stopping inactive world ${worldStatus._id}`);
      await ctx.db.patch(worldStatus._id, { status: 'inactive' });
      await stopEngine(ctx, worldStatus.worldId);
    }
  },
});

export const restartDeadWorlds = internalMutation({
  handler: async (ctx: any) => {
    const now = Date.now();

    // Restart an engine if it hasn't run for 2x its action duration.
    const engineTimeout = now - ENGINE_ACTION_DURATION * 2;
    const worlds = await ctx.db.query('worldStatus').collect();
    for (const worldStatus of worlds) {
      if (worldStatus.status !== 'running') {
        continue;
      }
      const engine = await ctx.db.get(worldStatus.engineId);
      if (!engine) {
        throw new Error(`Invalid engine ID: ${worldStatus.engineId}`);
      }
      if (engine.currentTime && engine.currentTime < engineTimeout) {
        console.warn(`Restarting dead engine ${engine._id}...`);
        await kickEngine(ctx, worldStatus.worldId);
      }
    }
  },
});

export const userStatus = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx: any, args: any) => {
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   return null;
    // }
    // return identity.tokenIdentifier;
    return DEFAULT_NAME;
  },
});

export const joinWorld = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx: any, args: any) => {
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new ConvexError(`Not logged in`);
    // }
    // const name =
    //   identity.givenName || identity.nickname || (identity.email && identity.email.split('@')[0]);
    const name = DEFAULT_NAME;

    // if (!name) {
    //   throw new ConvexError(`Missing name on ${JSON.stringify(identity)}`);
    // }
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new ConvexError(`Invalid world ID: ${args.worldId}`);
    }
    // const { tokenIdentifier } = identity;
    return await insertInput(ctx, world._id, 'join', {
      name,
      character: characters[Math.floor(Math.random() * characters.length)].name,
      description: `${DEFAULT_NAME} is a human player`,
      // description: `${identity.givenName} is a human player`,
      tokenIdentifier: DEFAULT_NAME,
    });
  },
});

export const leaveWorld = mutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx: any, args: any) => {
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new Error(`Not logged in`);
    // }
    // const { tokenIdentifier } = identity;
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    // const existingPlayer = world.players.find((p) => p.human === tokenIdentifier);
    const existingPlayer = world.players.find((p: any) => p.human === DEFAULT_NAME);
    if (!existingPlayer) {
      return;
    }
    await insertInput(ctx, world._id, 'leave', {
      playerId: existingPlayer.id,
    });
  },
});

export const sendWorldInput = mutation({
  args: {
    engineId: v.id('engines'),
    name: v.string(),
    args: v.any(),
  },
  handler: async (ctx: any, args: any) => {
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new Error(`Not logged in`);
    // }
    return await engineInsertInput(ctx, args.engineId, args.name as any, args.args);
  },
});

export const worldState = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx: any, args: any) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`Invalid world ID: ${args.worldId}`);
    }
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId', (q: any) => q.eq('worldId', world._id))
      .unique();
    if (!worldStatus) {
      throw new Error(`Invalid world status ID: ${world._id}`);
    }
    const engine = await ctx.db.get(worldStatus.engineId);
    if (!engine) {
      throw new Error(`Invalid engine ID: ${worldStatus.engineId}`);
    }

    // --- Frontend Adapter Start ---
    // Fetch distributed data to reconstruct the monolithic view
    const playersStatic = await ctx.db.query('agents_static').withIndex('by_world', (q: any) => q.eq('worldId', world._id)).collect();
    const playersDynamic = await ctx.db.query('agents_dynamic').withIndex('by_world', (q: any) => q.eq('worldId', world._id)).collect();
    const agentsState = await ctx.db.query('agents_state').withIndex('worldId', (q: any) => q.eq('worldId', world._id)).collect();

    // Map for fast lookup
    const dynMap = new Map(playersDynamic.map((d: any) => [d.playerId, d]));
    const stateMap = new Map(agentsState.map((s: any) => [s.playerId, s]));

    // Reconstruct 'players' array
    const players = playersStatic.map((p: any) => {
        const dyn = dynMap.get(p.playerId) as any;
        if (!dyn) return null; 
        
        // Reconstruct SerializedPlayer
        return {
            id: p.playerId,
            human: p.isHuman ? p.playerId : undefined, // Simplification
            pathfinding: dyn.pathfinding,
            activity: dyn.activity,
            lastInput: dyn.lastInput,
            position: dyn.position,
            facing: dyn.facing,
            speed: dyn.speed,
            // Add other missing fields if SerializedPlayer requires them
        }; 
    }).filter((p: any) => p !== null);

    // Reconstruct 'agents' array (SerializedAgent)
    const agents = playersStatic.filter((p: any) => !p.isHuman).map((p: any) => {
         const state = stateMap.get(p.playerId) as any;
         if (!state || !state.agentId) return null;
         
         return {
             id: state.agentId,
             playerId: p.playerId,
             toRemember: state.toRemember,
             lastConversation: state.lastConversation,
             lastInviteAttempt: state.lastInviteAttempt,
             inProgressOperation: state.inProgressOperation,
         };
    }).filter((a: any) => a !== null);

    // Patch world object with reconstructed arrays
    const worldWithAdapter = {
        ...world,
        players: players as any, // Cast to any to satisfy type checker for now
        agents: agents as any,
    };
    // --- Frontend Adapter End ---

    return { world: worldWithAdapter, engine } as any;
  },
});

export const gameDescriptions = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx: any, args: any) => {
    const playerDescriptions = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q: any) => q.eq('worldId', args.worldId))
      .collect();
    const agentDescriptions = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q: any) => q.eq('worldId', args.worldId))
      .collect();
    const worldMap = await ctx.db
      .query('maps')
      .withIndex('worldId', (q: any) => q.eq('worldId', args.worldId))
      .first();
    if (!worldMap) {
      throw new Error(`No map for world: ${args.worldId}`);
    }
    return { worldMap, playerDescriptions, agentDescriptions };
  },
});

export const previousConversation = query({
  args: {
    worldId: v.id('worlds'),
    playerId,
  },
  handler: async (ctx: any, args: any) => {
    // Walk the player's history in descending order, looking for a nonempty
    // conversation.
    const members = ctx.db
      .query('participatedTogether')
      .withIndex('playerHistory', (q: any) => q.eq('worldId', args.worldId).eq('player1', args.playerId))
      .order('desc');

    for await (const member of members) {
      const conversation = await ctx.db
        .query('archivedConversations')
        .withIndex('worldId', (q: any) => q.eq('worldId', args.worldId).eq('id', member.conversationId))
        .unique();
      if (!conversation) {
        throw new Error(`Invalid conversation ID: ${member.conversationId}`);
      }
      if (conversation.numMessages > 0) {
        return conversation;
      }
    }
    return null;
  },
});

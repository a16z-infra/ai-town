

import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
import { agentId, playerId } from './ids';
import { pathPosition, pointsEqual } from '../util/geometry';
import { AGENT_STATES, transition } from './fsm';

export const agentTick = internalMutation({
  args: {
    agentId: v.id('agents'),
  },
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const { agentId } = args;

    // 1. Load Agent State
    const agentState = await ctx.db
      .query('agents_state')
      .withIndex('by_agentId', (q: any) => q.eq('agentId', agentId))
      .first();

    if (!agentState) {
        // console.log(`Agent ${agentId} not found, stopping tick.`);
        return;
    }

    const worldStatus = await ctx.db
        .query('worldStatus')
        .withIndex('worldId', (q: any) => q.eq('worldId', worldId))
        .unique();

    if (!worldStatus || worldStatus.status !== 'running') {
        return;
    }

    const { worldId, playerId } = agentState;
    const dynamic = await ctx.db
        .query('agents_dynamic')
        .withIndex('by_player', (q: any) => q.eq('worldId', worldId).eq('playerId', playerId))
        .unique();

    if (!dynamic) return;

    let nextState = agentState.state || 'IDLE';

    // 2. FSM & Timeout Logic
    if (agentState.inProgressOperation) {
        if (now > agentState.inProgressOperation.started + 60000) {
             console.log(`Operation ${agentState.inProgressOperation.name} timed out for ${agentId}`);
             await ctx.db.patch(agentState._id, { inProgressOperation: undefined });
             if (nextState === 'PLANNING') {
                 nextState = transition(nextState, 'DONE');
                 await ctx.db.patch(agentState._id, { state: nextState });
             }
        }
    }

    if (nextState === 'MOVING') {
        if (dynamic.pathfinding && dynamic.pathfinding.state.kind === 'moving' && dynamic.destination) {
             const { position } = pathPosition(dynamic.pathfinding.state.path, (now - dynamic.pathfinding.started) / 1000 * dynamic.speed); // Time in seconds
             if (pointsEqual(position, dynamic.destination)) {
                 await ctx.db.patch(dynamic._id, { pathfinding: undefined, destination: undefined, position });
                 nextState = transition(nextState, 'ARRIVED'); 
                 await ctx.db.patch(agentState._id, { state: nextState });
             } else {
                 // Update position
                 await ctx.db.patch(dynamic._id, { position });
             }
        } else if (!dynamic.pathfinding) {
             // Lost path?
             nextState = 'IDLE';
             await ctx.db.patch(agentState._id, { state: nextState });
         }
    } else if (nextState === 'COOLDOWN') {
        if (dynamic.activity) {
            if (dynamic.activity.until <= now) {
                await ctx.db.patch(dynamic._id, { activity: undefined });
                nextState = transition(nextState, 'READY');
                await ctx.db.patch(agentState._id, { state: nextState });
            }
        } else {
            nextState = 'IDLE';
            await ctx.db.patch(agentState._id, { state: nextState });
        }
    }
    
    // IDLE -> PLANNING
    if (nextState === 'IDLE' && !agentState.inProgressOperation) {
         const operationId = crypto.randomUUID();
         await ctx.db.patch(agentState._id, {
             inProgressOperation: {
                 name: 'agentDoSomething',
                 operationId,
                 started: now,
             },
             state: 'PLANNING',
         });
         
         await ctx.scheduler.runAfter(0, internal.aiTown.agentOperations.agentDoSomething, {
             worldId,
             playerId,
             agentId,
             operationId,
         });
    }

    // 3. Movement execution (redundant if handled above, but essential for smooth updates)
    // Handled in MOVING block.

    // 4. Schedule Next Tick
    await ctx.scheduler.runAfter(1000, internal.aiTown.agentTick.agentTick, { agentId });
  },
});

export const restartAgents = internalMutation({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx: any, args: any) => {
    const agents = await ctx.db
      .query('agents_state')
      .withIndex('worldId', (q: any) => q.eq('worldId', args.worldId))
      .collect();

    for (const agent of agents) {
        await ctx.scheduler.runAfter(Math.random() * 1000, internal.aiTown.agentTick.agentTick, { agentId: agent.agentId });
    }
  },
});

export const handlePlan = internalMutation({
  args: {
    worldId: v.id('worlds'),
    playerId: playerId,
    agentId: agentId,
    operationId: v.string(),
    destination: v.optional(v.object({ x: v.number(), y: v.number() })),
    activity: v.optional(v.object({
        description: v.string(),
        emoji: v.string(),
        until: v.number(),
    })),
    invitee: v.optional(playerId),
  },
  handler: async (ctx: any, args: any) => {
      const dynamic = await ctx.db
        .query('agents_dynamic')
        .withIndex('by_player', (q: any) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
        .first();
      const state = await ctx.db
        .query('agents_state')
        .withIndex('worldId', (q: any) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
        .first();
      
      if (!dynamic || !state) throw new Error("Agent data not found");

      // Clear operation
      await ctx.db.patch(state._id, { inProgressOperation: undefined });

      if (args.destination) {
          await ctx.db.patch(dynamic._id, {
              destination: args.destination,
              pathfinding: {
                  destination: args.destination,
                  started: Date.now(),
                  state: { kind: 'needsPath' },
              }
          });
          // State transition handled by pathfinding? No, FSM should update to MOVING?
          // But `agentTick` handles IDLE -> MOVING if it sees pathfinding?
          // Or wait, `handlePlan` sets `needsPath`.
          // `agentTick` should see `needsPath` and schedule `findPath`.
          // When `findPath` returns (Action), it updates `pathfinding` to `moving`.
          // `agentTick` should check `pathfinding.state.kind === 'moving'` to transition FSM to `MOVING`.
          // So FSM stays PLANNING or IDLE until path is found?
          // Actually, `handlePlan` should set state to something intermediate like 'MOVING' (anticipatory) or keep 'PLANNING'.
          // If we set 'MOVING', `agentTick` might clear it if no path.
          // Let's set 'MOVING' and let agentTick handle 'needsPath'.
          await ctx.db.patch(state._id, { state: 'MOVING' });
      }

      if (args.activity) {
           await ctx.db.patch(dynamic._id, { activity: args.activity });
           await ctx.db.patch(state._id, { state: 'COOLDOWN' }); 
      }
      
      if (args.invitee) {
          console.log(`Agent ${args.agentId} wants to invite ${args.invitee}`);
          // Set state to CONVERSING?
          // Needs Distributed Conversation Logic.
          // For now, minimal.
          await ctx.db.patch(state._id, { state: 'CONVERSING' }); // Placeholder
      }
  }
});

export const updatePath = internalMutation({
  args: {
    worldId: v.id('worlds'),
    playerId: playerId,
    path: v.array(v.object({ x: v.number(), y: v.number() })),
  },
  handler: async (ctx: any, args: any) => {
    // Update agents_dynamic with the new path
    const dynamic = await ctx.db
        .query('agents_dynamic')
        .withIndex('by_player', (q: any) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
        .unique();
        
    if (dynamic) {
        // Construct the expected pathfinding object state
        const pathfinding = {
            state: {
                kind: 'moving',
                path: args.path,
            },
            started: Date.now(),
            destination: args.path[args.path.length - 1],
        };
        
        await ctx.db.patch(dynamic._id, {
            pathfinding: pathfinding as any, // Cast to match schema if needed
        });
    }
  },
});

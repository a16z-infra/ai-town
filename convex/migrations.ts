import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const migrateToRefactoredSchema = internalMutation({
  args: {},
  handler: async (ctx) => {
    const worlds = await ctx.db.query("worlds").collect();
    
    for (const world of worlds) {
      console.log(`Migrating world: ${world._id}`);

      // 1. Process Players (Static + Dynamic)
      for (const player of world.players) {
        // Find existing description to backfill static data
        const desc = await ctx.db
          .query("playerDescriptions")
          .withIndex("worldId", (q) => q.eq("worldId", world._id).eq("playerId", player.id))
          .first();

        const name = desc?.name ?? "Unknown";
        const description = desc?.description ?? "";
        const character = desc?.character ?? "human";

        // Insert into agents_static
        await ctx.db.insert("agents_static", {
          worldId: world._id,
          playerId: player.id,
          // agentId will be backfilled in the next loop if this player is an agent
          name,
          description,
          character,
          isHuman: !!player.human,
        });

        // Insert into agents_dynamic
        const gridKey = `${Math.floor(player.position.x)}_${Math.floor(player.position.y)}`;
        await ctx.db.insert("agents_dynamic", {
          worldId: world._id,
          playerId: player.id,
          position: player.position,
          facing: player.facing,
          speed: player.speed,
          gridKey,
          lastInput: player.lastInput,
          // We can carry over pathfinding state or reset it. 
          // Resetting is safer for a major engine refactor.
          pathfinding: undefined, 
        });
      }

      // 2. Process Agents (State)
      for (const agent of world.agents) {
        // Create a row in the 'agents' table to get a valid, persistent Id<'agents'>
        const newAgentId = await ctx.db.insert("agents", {
            worldId: world._id,
            playerId: agent.playerId,
            doc: "migrated",
        });

        // Insert into agents_state
        await ctx.db.insert("agents_state", {
            worldId: world._id,
            agentId: newAgentId,
            playerId: agent.playerId,
            toRemember: agent.toRemember,
            lastConversation: agent.lastConversation,
            lastInviteAttempt: agent.lastInviteAttempt,
            inProgressOperation: agent.inProgressOperation,
            state: "IDLE", // Initialize state to IDLE
        });
        
        // Link agentId in agents_static
        // accessing the index 'by_player' defined in schema for agents_static
        // agents_static index: .index('worldId', ['worldId', 'playerId'])
        // Warning: The index name in schema.ts is 'worldId' (on field 'worldId', 'playerId').
        // Let's verify schema.ts index name.
        
        const staticEntry = await ctx.db
            .query("agents_static")
            .withIndex("worldId", (q) => q.eq("worldId", world._id).eq("playerId", agent.playerId))
            .first();
        
        if (staticEntry) {
            await ctx.db.patch(staticEntry._id, { agentId: newAgentId });
        }
      }

      // 3. Clear arrays in the world document
      // We keep the fields but make them empty to satisfy the current schema constraints
      // until we fully deprecate them in the schema.
      await ctx.db.patch(world._id, {
        players: [],
        agents: [],
      });
      
      console.log(`World ${world._id} migrated successfully.`);
    }
  }
});

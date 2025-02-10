import { ActionCtx, DatabaseReader, internalMutation, internalQuery } from '../_generated/server';
import { GameId, agentId, conversationId, playerId } from '../aiTown/ids';
import { v } from 'convex/values';

export const updateImpressionScore = internalMutation({
    args: {
      playerId: playerId,
      otherPlayerId: playerId,
      scoreChange: v.number()
    },
    handler: async (ctx, args) => {
      const existingImpression = await ctx.db
        .query('playerImpressions')
        .withIndex('players', q => 
          q.eq('playerA', args.playerId)
           .eq('playerB', args.otherPlayerId)
        )
        .first();
  
      if (existingImpression) {
        // from -100 to 100 impression score
        const newScore = Math.max(-100, 
          Math.min(100, existingImpression.score + args.scoreChange)
        );
        await ctx.db.patch(existingImpression._id, {
          score: newScore,
          lastUpdate: Date.now()
        });
      } else {
        // new impression record
        await ctx.db.insert('playerImpressions', {
          playerA: args.playerId,
          playerB: args.otherPlayerId,
          score: Math.max(-100, Math.min(100, args.scoreChange)),
          lastUpdate: Date.now()
        });
      }
    }
  });
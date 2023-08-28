
import { v } from 'convex/values';
import { query, internalMutation } from './_generated/server';


export const createMusic = internalMutation({
    args: {
        storageId: v.string(),
        type: v.union(v.literal("background"), v.literal("player")),
    },
    handler: async (ctx, { storageId, type, ...args }) => {
        const music = await ctx.db.insert('music', {
            storageId,
            type,
        });
        return music;
    },
});

export const getBackgroundMusic = query({
    args: {},
    handler: async (ctx, args) => {
        const music = await ctx.db.query('music')
            .filter((entry) => entry.eq(entry.field("type"), "background"))
            .order('desc')
            .first();
        if (music) {
            return { url: await ctx.storage.getUrl(music.storageId) }
        } else {
            return { url: "/assets/background.mp3" }
        }
    }
});

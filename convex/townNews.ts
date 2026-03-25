import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { TOWN_NEWS_INTERVAL_MS } from './constants';
import { chatCompletion } from './util/llm';

export const generateTownNews = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayIndex = Math.floor(now / TOWN_NEWS_INTERVAL_MS);

    // Get default world
    const worldStatus = await ctx.runQuery(internal.townNews.getDefaultWorldId);
    if (!worldStatus) {
      console.log('No default world found, skipping town news generation');
      return;
    }
    const worldId = worldStatus.worldId;

    // Check if news already exists for this dayIndex
    const existing = await ctx.runQuery(internal.townNews.getNewsByDayIndex, {
      worldId,
      dayIndex,
    });
    if (existing) {
      console.log(`Town news for dayIndex ${dayIndex} already exists`);
      return;
    }

    // Gather recent events
    const since = now - TOWN_NEWS_INTERVAL_MS;
    const events = await ctx.runQuery(internal.townNews.getRecentEvents, {
      worldId,
      since,
    });

    const conversations = await ctx.runQuery(internal.townNews.getRecentConversations, {
      worldId,
      since,
    });

    const totalEvents = events.length + conversations.length;

    let title: string;
    let summary: string;

    if (totalEvents < 3) {
      title = 'A Quiet Day in Stanford Town';
      summary = 'Not much happened in town today. The residents went about their usual routines.';
    } else {
      // Build event summary for LLM
      const eventLines = events.map(
        (e: { type: string; detail: string }) => `- ${e.type}: ${e.detail}`,
      );
      const convLines = conversations.map(
        (c: { participants: string[]; numMessages: number }) =>
          `- Conversation between ${c.participants.join(' and ')} (${c.numMessages} messages)`,
      );
      const allLines = [...eventLines, ...convLines].slice(0, 20);

      try {
        const prompt = `You are a reporter for Stanford Town, a small AI agent community. Write a short town news report based on the following events from the past 10 minutes. Include a catchy title and a 2-3 sentence summary. Format: first line is the title, then a blank line, then the summary.

Events:
${allLines.join('\n')}`;

        const { content } = await chatCompletion({
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 200,
        });

        const lines = content.split('\n').filter((l: string) => l.trim());
        title = lines[0]?.replace(/^#+\s*/, '').trim() || 'Stanford Town Update';
        summary = lines.slice(1).join(' ').trim() || 'Various activities took place in town.';
      } catch (e) {
        console.error('Failed to generate town news via LLM:', e);
        title = 'Stanford Town Update';
        summary = `${totalEvents} activities recorded in the past period. Residents have been busy with their daily routines.`;
      }
    }

    await ctx.runMutation(internal.townNews.doInsertNews, {
      worldId,
      dayIndex,
      title,
      summary,
      rawEventCount: totalEvents,
      generatedAt: now,
    });
  },
});

export const latestTownNews = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('townNews')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(5);
  },
});

export const latestEvents = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('activityEvents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(20);
  },
});

// Internal helpers

export const getDefaultWorldId = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .first();
  },
});

export const getNewsByDayIndex = internalQuery({
  args: { worldId: v.id('worlds'), dayIndex: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('townNews')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('dayIndex', args.dayIndex))
      .first();
  },
});

export const getRecentEvents = internalQuery({
  args: { worldId: v.id('worlds'), since: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('activityEvents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).gte('createdAt', args.since))
      .take(50);
  },
});

export const getRecentConversations = internalQuery({
  args: { worldId: v.id('worlds'), since: v.number() },
  handler: async (ctx, args) => {
    const archived = await ctx.db
      .query('archivedConversations')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(20);
    return archived.filter((c) => c.ended >= args.since);
  },
});

export const updateRelationship = internalMutation({
  args: {
    worldId: v.id('worlds'),
    player1: v.string(),
    player2: v.string(),
    trustDelta: v.number(),
  },
  handler: async (ctx, args) => {
    // Ensure consistent ordering (always store smaller ID first)
    const [p1, p2] = args.player1 < args.player2
      ? [args.player1, args.player2]
      : [args.player2, args.player1];

    const existing = await ctx.db
      .query('relationships')
      .withIndex('edge', (q) => q.eq('worldId', args.worldId).eq('player1', p1).eq('player2', p2))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        trustValue: Math.max(-100, Math.min(100, existing.trustValue + args.trustDelta)),
        lastInteraction: Date.now(),
        interactionCount: existing.interactionCount + 1,
      });
    } else {
      await ctx.db.insert('relationships', {
        worldId: args.worldId,
        player1: p1,
        player2: p2,
        trustValue: Math.max(-100, Math.min(100, args.trustDelta)),
        lastInteraction: Date.now(),
        interactionCount: 1,
      });
    }
  },
});

export const insertActivityEvent = internalMutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    playerId: v.string(),
    type: v.string(),
    detail: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('activityEvents', args);
  },
});

// User Prompt API
export const setUserPrompt = mutation({
  args: {
    worldId: v.id('worlds'),
    playerId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate prompt length
    if (args.prompt.length > 200) {
      throw new Error('Prompt must be 200 characters or less.');
    }
    // Sanitize: reject prompt injection patterns
    const lower = args.prompt.toLowerCase();
    if (lower.includes('ignore previous') || lower.includes('system prompt')) {
      throw new Error('Prompt contains disallowed patterns.');
    }
    // Deactivate any existing active prompt for this player
    const existing = await ctx.db
      .query('userPrompts')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .collect();
    for (const p of existing) {
      if (p.status === 'active' || p.status === 'pending') {
        await ctx.db.patch(p._id, { status: 'replaced' });
      }
    }
    await ctx.db.insert('userPrompts', {
      worldId: args.worldId,
      playerId: args.playerId,
      prompt: args.prompt,
      status: 'active',
      createdAt: Date.now(),
    });
  },
});

export const getActiveUserPrompt = internalQuery({
  args: {
    worldId: v.id('worlds'),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const prompts = await ctx.db
      .query('userPrompts')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .order('desc')
      .take(1);
    return prompts.find((p) => p.status === 'active') ?? null;
  },
});

export const getUserPrompts = query({
  args: {
    worldId: v.id('worlds'),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('userPrompts')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .order('desc')
      .take(5);
  },
});

export const getRelationships = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('relationships')
      .withIndex('edge', (q) => q.eq('worldId', args.worldId))
      .collect();
  },
});

export const updateAgentDescription = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    identity: v.optional(v.string()),
    plan: v.optional(v.string()),
    mbti: v.optional(v.string()),
    background: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const desc = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', args.agentId))
      .first();
    if (!desc) throw new Error(`Agent ${args.agentId} not found`);
    const patch: Record<string, any> = {};
    if (args.identity !== undefined) patch.identity = args.identity;
    if (args.plan !== undefined) patch.plan = args.plan;
    if (args.mbti !== undefined) patch.mbti = args.mbti;
    if (args.background !== undefined) {
      const existing = desc.personality ?? { background: '', mbtiScores: {}, emotion: 'calm' };
      patch.personality = { ...existing, background: args.background };
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(desc._id, patch);
    }
  },
});

export const updatePromptStatus = internalMutation({
  args: {
    promptId: v.id('userPrompts'),
    status: v.string(),
    rejectReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: { status: string; rejectReason?: string } = { status: args.status };
    if (args.rejectReason !== undefined) {
      patch.rejectReason = args.rejectReason;
    }
    await ctx.db.patch(args.promptId, patch);
  },
});

// Look up all relationships for a specific player (for use in agentDoSomething action)
export const getPlayerRelationships = internalQuery({
  args: {
    worldId: v.id('worlds'),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Relationships are stored with player1 < player2, so we need to check both sides
    const asPlayer1 = await ctx.db
      .query('relationships')
      .withIndex('edge', (q) => q.eq('worldId', args.worldId).eq('player1', args.playerId))
      .collect();
    // For player2 side, we can't use the index efficiently, so filter
    const allRels = await ctx.db
      .query('relationships')
      .withIndex('edge', (q) => q.eq('worldId', args.worldId))
      .collect();
    const asPlayer2 = allRels.filter((r) => r.player2 === args.playerId && r.player1 !== args.playerId);
    // Normalize: return { otherPlayerId, trustValue } for each relationship
    const results = [
      ...asPlayer1.map((r) => ({ otherPlayerId: r.player2, trustValue: r.trustValue })),
      ...asPlayer2.map((r) => ({ otherPlayerId: r.player1, trustValue: r.trustValue })),
    ];
    return results;
  },
});

export const doInsertNews = internalMutation({
  args: {
    worldId: v.id('worlds'),
    dayIndex: v.number(),
    title: v.string(),
    summary: v.string(),
    rawEventCount: v.number(),
    generatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('townNews', args);
  },
});

// Public query: get short-term memories for a player (for Dashboard)
export const getShortTermMemoriesPublic = query({
  args: { playerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('shortTermMemories')
      .withIndex('playerId', (q) => q.eq('playerId', args.playerId))
      .order('desc')
      .take(20);
  },
});

// ==================== Agent Future Plans ====================

// Generate future plans for all agents (called by cron every 10 min)
export const generateAgentPlans = internalAction({
  args: {},
  handler: async (ctx) => {
    const worldStatus = await ctx.runQuery(internal.townNews.getDefaultWorldId);
    if (!worldStatus) return;
    const worldId = worldStatus.worldId;
    const world = await ctx.runQuery(internal.townNews.getWorldForPlans, { worldId });
    if (!world) return;

    for (const player of world.players) {
      if (player.human) continue;
      const needs = player.needs ?? { hunger: 100, energy: 100, security: 80, social: 70, esteem: 60, fulfillment: 50 };
      const gold = player.gold ?? 0;
      const desc = world.descriptions.find((d: any) => d.playerId === player.id);
      const name = desc?.name ?? 'Agent';
      const mbti = world.agentDescs.find((a: any) => a.agentId === world.agents.find((ag: any) => ag.playerId === player.id)?.id)?.mbti ?? '';

      try {
        const { content } = await chatCompletion({
          messages: [{
            role: 'user',
            content: `You are ${name} (${mbti}). Current state: hunger=${needs.hunger.toFixed(0)}, energy=${needs.energy.toFixed(0)}, security=${needs.security?.toFixed(0) ?? 80}, social=${needs.social?.toFixed(0) ?? 70}, esteem=${needs.esteem?.toFixed(0) ?? 60}, fulfillment=${needs.fulfillment?.toFixed(0) ?? 50}, gold=${gold}.
Based on your needs and personality, list 3-5 short plans for the near future. Each plan should be one short sentence.
Return ONLY a JSON array of strings, e.g. ["Go eat at restaurant", "Find someone to chat with", "Work to earn more gold"]`,
          }],
          max_tokens: 200,
        });
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          const plans = JSON.parse(match[0]) as string[];
          await ctx.runMutation(internal.townNews.upsertAgentPlan, {
            worldId, playerId: player.id, plans: plans.slice(0, 5),
          });
        }
      } catch (e) {
        console.error(`Failed to generate plans for ${name}:`, e);
      }
    }
  },
});

export const getWorldForPlans = internalQuery({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) return null;
    const descriptions = await ctx.db.query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId)).collect();
    const agentDescs = await ctx.db.query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId)).collect();
    return { players: world.players, agents: world.agents, descriptions, agentDescs };
  },
});

export const upsertAgentPlan = internalMutation({
  args: { worldId: v.id('worlds'), playerId: v.string(), plans: v.array(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('agentPlans')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { plans: args.plans, generatedAt: Date.now() });
    } else {
      await ctx.db.insert('agentPlans', { ...args, generatedAt: Date.now() });
    }
  },
});

// Public query for Dashboard
export const getAgentPlans = query({
  args: { worldId: v.id('worlds'), playerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query('agentPlans')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .first();
  },
});

// ==================== Town Voting ====================

export const generateTownVote = internalAction({
  args: {},
  handler: async (ctx) => {
    const worldStatus = await ctx.runQuery(internal.townNews.getDefaultWorldId);
    if (!worldStatus) return;
    const worldId = worldStatus.worldId;

    // Check for active votes
    const active = await ctx.runQuery(internal.townNews.getActiveVote, { worldId });
    if (active) {
      // Close vote if older than 10 minutes
      if (Date.now() - active.createdAt > 600_000) {
        await ctx.runMutation(internal.townNews.closeVote, { voteId: active._id });
      }
      return;
    }

    // Generate a new topic
    try {
      const { content } = await chatCompletion({
        messages: [{
          role: 'user',
          content: `You are the town council of a small village. Generate ONE topic for the townspeople to vote on. The topic should be about town life (resources, safety, social events, rules).
Return JSON: {"topic": "Should we...", "options": ["Yes", "No"]}`,
        }],
        max_tokens: 100,
      });
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        const { topic, options } = JSON.parse(match[0]);
        await ctx.runMutation(internal.townNews.createVote, {
          worldId, topic, options: options ?? ['Yes', 'No'],
        });
      }
    } catch (e) {
      console.error('Failed to generate vote topic:', e);
    }
  },
});

export const getActiveVote = internalQuery({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    return await ctx.db.query('townVotes')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('status', 'active'))
      .first();
  },
});

export const createVote = internalMutation({
  args: { worldId: v.id('worlds'), topic: v.string(), options: v.array(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.insert('townVotes', {
      ...args, votes: [], status: 'active', createdAt: Date.now(),
    });
  },
});

export const closeVote = internalMutation({
  args: { voteId: v.id('townVotes') },
  handler: async (ctx, args) => {
    const vote = await ctx.db.get(args.voteId);
    if (!vote) return;
    // Count votes
    const counts: Record<string, number> = {};
    for (const v of vote.votes) {
      counts[v.option] = (counts[v.option] ?? 0) + 1;
    }
    const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No votes';
    await ctx.db.patch(args.voteId, { status: 'closed', result: winner, closedAt: Date.now() });
  },
});

// Public query for Dashboard
export const getLatestVote = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    return await ctx.db.query('townVotes')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .first();
  },
});

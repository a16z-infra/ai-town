// Read-only queries backing the analytics client (`src/analytics`).
//
// Nothing here writes to the database or submits inputs: the analytics page is a pure observer of
// the town. Every query is bounded — either paginated or capped with `.take()` — and returns a
// `truncated` flag where a cap could hide data, so the UI can say so rather than silently lying.
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { query } from './_generated/server';
import { QueryCtx } from './_generated/server';
import { Doc, Id } from './_generated/dataModel';
import { conversationId, playerId } from './aiTown/ids';

// A world's cast is small (a few dozen characters at most), but cap it so a runaway world can't
// blow up the transaction.
const MAX_CHARACTERS = 256;

// How many archived conversations a single aggregate query will scan. Conversation documents are
// tiny (no message text), so this is cheap, but it does bound how far back stats reach.
const MAX_AGGREGATE_SCAN = 2000;

// Transcripts are read in full; conversations in AI Town are short (tens of messages).
const MAX_TRANSCRIPT = 1000;

const MAX_SEARCH_RESULTS = 100;
const MAX_TAIL_MESSAGES = 200;

// How many of a character's recent conversations the filtered live feed pulls messages from.
const MAX_TAIL_CONVERSATIONS = 40;

type NameMap = Map<string, string>;

async function characterNames(ctx: QueryCtx, worldId: Id<'worlds'>): Promise<NameMap> {
  const descriptions = await ctx.db
    .query('playerDescriptions')
    .withIndex('worldId', (q) => q.eq('worldId', worldId))
    .take(MAX_CHARACTERS);
  return new Map(descriptions.map((d) => [d.playerId, d.name]));
}

function named(names: NameMap, id: string) {
  return { playerId: id, name: names.get(id) ?? id };
}

/**
 * Every world we know about, for the world picker. The default world is listed first.
 */
export const worlds = query({
  args: {},
  handler: async (ctx) => {
    const statuses = await ctx.db.query('worldStatus').take(50);
    const out = statuses.map((s) => ({
      worldId: s.worldId,
      engineId: s.engineId,
      isDefault: s.isDefault,
      status: s.status,
      lastViewed: s.lastViewed,
    }));
    out.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.lastViewed - a.lastViewed);
    return out;
  },
});

/**
 * The full cast of a world — including characters who have since left, since `playerDescriptions`
 * rows are never deleted. Conversation and message totals come from one bounded pass over the
 * conversation archive rather than a per-character scan.
 */
export const characters = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const descriptions = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .take(MAX_CHARACTERS);

    const world = await ctx.db.get(args.worldId);
    const activePlayerIds = new Set((world?.players ?? []).map((p) => p.id));

    // Agent identity/plan lives on `agentDescriptions`, keyed by agent rather than player, so we
    // need the agent -> player mapping from the live world plus the archive.
    const agentToPlayer = new Map<string, string>();
    for (const agent of world?.agents ?? []) {
      agentToPlayer.set(agent.id, agent.playerId);
    }
    const archivedAgents = await ctx.db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .take(MAX_CHARACTERS);
    for (const agent of archivedAgents) {
      agentToPlayer.set(agent.id, agent.playerId);
    }
    const agentDescriptions = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .take(MAX_CHARACTERS);
    const agentInfo = new Map<string, { identity: string; plan: string }>();
    for (const description of agentDescriptions) {
      const player = agentToPlayer.get(description.agentId);
      if (player) {
        agentInfo.set(player, { identity: description.identity, plan: description.plan });
      }
    }

    const conversations = await ctx.db
      .query('archivedConversations')
      .withIndex('worldId_ended', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(MAX_AGGREGATE_SCAN);

    const totals = new Map<
      string,
      { conversations: number; messages: number; lastEnded: number }
    >();
    for (const conversation of conversations) {
      for (const participant of conversation.participants) {
        const entry = totals.get(participant) ?? { conversations: 0, messages: 0, lastEnded: 0 };
        entry.conversations += 1;
        entry.messages += conversation.numMessages;
        entry.lastEnded = Math.max(entry.lastEnded, conversation.ended);
        totals.set(participant, entry);
      }
    }

    const out = descriptions.map((description) => {
      const entry = totals.get(description.playerId);
      const agent = agentInfo.get(description.playerId);
      return {
        playerId: description.playerId,
        name: description.name,
        description: description.description,
        character: description.character,
        isActive: activePlayerIds.has(description.playerId),
        isAgent: agent !== undefined,
        identity: agent?.identity,
        plan: agent?.plan,
        conversations: entry?.conversations ?? 0,
        messages: entry?.messages ?? 0,
        lastEnded: entry?.lastEnded ?? 0,
      };
    });
    out.sort((a, b) => b.messages - a.messages || a.name.localeCompare(b.name));
    return {
      characters: out,
      truncated: conversations.length === MAX_AGGREGATE_SCAN,
    };
  },
});

/**
 * Conversations currently in progress. These live inside the world document rather than the
 * archive, so they are not reachable through the paginated history below.
 */
export const activeConversations = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      return [];
    }
    const names = await characterNames(ctx, args.worldId);
    return world.conversations.map((conversation) => ({
      id: conversation.id,
      created: conversation.created,
      creator: conversation.creator,
      numMessages: conversation.numMessages,
      lastMessage: conversation.lastMessage,
      typingPlayerId: conversation.isTyping?.playerId,
      participants: conversation.participants.map((p) => ({
        ...named(names, p.playerId),
        status: p.status.kind,
      })),
    }));
  },
});

type ConversationSummary = {
  id: string;
  created: number;
  ended: number | null;
  numMessages: number;
  participants: { playerId: string; name: string }[];
};

function summarize(
  conversation: Doc<'archivedConversations'>,
  names: NameMap,
): ConversationSummary {
  return {
    id: conversation.id,
    created: conversation.created,
    ended: conversation.ended,
    numMessages: conversation.numMessages,
    participants: conversation.participants.map((p) => named(names, p)),
  };
}

/**
 * Paginated conversation history, either town-wide or for a single character. Most recent first.
 *
 * The per-character path walks `participatedTogether`, which stores one row per ordered pair, so a
 * conversation with more than two participants yields several rows for the same character; the
 * page is de-duplicated by conversation id.
 */
export const conversations = query({
  args: {
    worldId: v.id('worlds'),
    playerId: v.optional(playerId),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const names = await characterNames(ctx, args.worldId);
    const forPlayer = args.playerId;

    if (forPlayer === undefined) {
      const result = await ctx.db
        .query('archivedConversations')
        .withIndex('worldId_ended', (q) => q.eq('worldId', args.worldId))
        .order('desc')
        .paginate(args.paginationOpts);
      return { ...result, page: result.page.map((c) => summarize(c, names)) };
    }

    const result = await ctx.db
      .query('participatedTogether')
      .withIndex('playerHistory', (q) => q.eq('worldId', args.worldId).eq('player1', forPlayer))
      .order('desc')
      .paginate(args.paginationOpts);

    const page: ConversationSummary[] = [];
    const seen = new Set<string>();
    for (const edge of result.page) {
      if (seen.has(edge.conversationId)) {
        continue;
      }
      seen.add(edge.conversationId);
      const conversation = await ctx.db
        .query('archivedConversations')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('id', edge.conversationId))
        .unique();
      if (conversation) {
        page.push(summarize(conversation, names));
      }
    }
    return { ...result, page };
  },
});

/**
 * A conversation's full transcript plus its metadata, resolving the conversation from either the
 * archive or the live world document so in-progress conversations are readable too.
 */
export const transcript = query({
  args: { worldId: v.id('worlds'), conversationId },
  handler: async (ctx, args) => {
    const names = await characterNames(ctx, args.worldId);

    const messages = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) =>
        q.eq('worldId', args.worldId).eq('conversationId', args.conversationId),
      )
      .take(MAX_TRANSCRIPT);

    const archived = await ctx.db
      .query('archivedConversations')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('id', args.conversationId))
      .unique();

    let conversation: (ConversationSummary & { isActive: boolean }) | null = null;
    if (archived) {
      conversation = { ...summarize(archived, names), isActive: false };
    } else {
      const world = await ctx.db.get(args.worldId);
      const live = world?.conversations.find((c) => c.id === args.conversationId);
      if (live) {
        conversation = {
          id: live.id,
          created: live.created,
          ended: null,
          numMessages: live.numMessages,
          participants: live.participants.map((p) => named(names, p.playerId)),
          isActive: true,
        };
      }
    }

    return {
      conversation,
      messages: messages.map((m) => ({
        _id: m._id,
        _creationTime: m._creationTime,
        text: m.text,
        ...named(names, m.author),
      })),
      truncated: messages.length === MAX_TRANSCRIPT,
    };
  },
});

/**
 * A feed of the most recent messages, oldest first so it reads top to bottom. Reactive: Convex
 * pushes new messages to subscribers, so the UI never polls.
 *
 * With `playerId` the feed narrows to conversations that character took part in — both what they
 * said and what was said to them. That can't be done by filtering on `author`, so this path walks
 * their recent conversations and collects the messages of each.
 */
export const recentMessages = query({
  args: {
    worldId: v.id('worlds'),
    limit: v.optional(v.number()),
    playerId: v.optional(playerId),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 80, MAX_TAIL_MESSAGES);
    const names = await characterNames(ctx, args.worldId);
    const decorate = (m: Doc<'messages'>) => ({
      _id: m._id,
      _creationTime: m._creationTime,
      conversationId: m.conversationId,
      text: m.text,
      ...named(names, m.author),
    });

    const forPlayer = args.playerId;
    if (forPlayer === undefined) {
      const messages = await ctx.db
        .query('messages')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
        .order('desc')
        .take(limit);
      messages.reverse();
      return messages.map(decorate);
    }

    // Newest conversations first: any in-progress one (not yet archived) leads, then the archive
    // in descending end time. `endedAt` is the upper bound on when a message in it could have been
    // sent, which is what makes the early exit below sound.
    const ordered: { id: string; endedAt: number }[] = [];
    const seen = new Set<string>();
    const world = await ctx.db.get(args.worldId);
    for (const conversation of world?.conversations ?? []) {
      if (conversation.participants.some((p) => p.playerId === forPlayer)) {
        seen.add(conversation.id);
        ordered.push({ id: conversation.id, endedAt: Number.POSITIVE_INFINITY });
      }
    }
    const edges = await ctx.db
      .query('participatedTogether')
      .withIndex('playerHistory', (q) => q.eq('worldId', args.worldId).eq('player1', forPlayer))
      .order('desc')
      .take(MAX_TAIL_CONVERSATIONS);
    for (const edge of edges) {
      if (!seen.has(edge.conversationId)) {
        seen.add(edge.conversationId);
        ordered.push({ id: edge.conversationId, endedAt: edge.ended });
      }
    }

    let collected: Doc<'messages'>[] = [];
    let oldestKept = Number.NEGATIVE_INFINITY;
    for (const entry of ordered) {
      // Conversations arrive newest-first and no message outlives its conversation, so once the
      // page is full and this conversation ended before the oldest message we're still keeping,
      // neither it nor anything behind it can displace a result. Stop reading.
      if (collected.length >= limit && entry.endedAt <= oldestKept) {
        break;
      }
      // Taking `limit` per conversation is enough: a message only survives the merge if it is
      // among its own conversation's newest `limit`.
      const messages = await ctx.db
        .query('messages')
        .withIndex('conversationId', (q) =>
          q.eq('worldId', args.worldId).eq('conversationId', entry.id),
        )
        .order('desc')
        .take(limit);
      collected.push(...messages);
      collected.sort((a, b) => b._creationTime - a._creationTime);
      if (collected.length > limit) {
        collected = collected.slice(0, limit);
      }
      if (collected.length >= limit) {
        oldestKept = collected[collected.length - 1]._creationTime;
      }
    }
    collected.reverse();
    return collected.map(decorate);
  },
});

/**
 * Full-text search across every message ever sent in a world, optionally narrowed to one author.
 */
export const searchMessages = query({
  args: {
    worldId: v.id('worlds'),
    query: v.string(),
    playerId: v.optional(playerId),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const search = args.query.trim();
    if (!search) {
      return { results: [], truncated: false, limit: 0 };
    }
    const limit = Math.min(args.limit ?? 50, MAX_SEARCH_RESULTS);
    const author = args.playerId;
    const messages = await ctx.db
      .query('messages')
      .withSearchIndex('text', (q) => {
        const scoped = q.search('text', search).eq('worldId', args.worldId);
        return author === undefined ? scoped : scoped.eq('author', author);
      })
      .take(limit);
    const names = await characterNames(ctx, args.worldId);
    return {
      results: messages.map((m) => ({
        _id: m._id,
        _creationTime: m._creationTime,
        conversationId: m.conversationId,
        text: m.text,
        ...named(names, m.author),
      })),
      // A full page means the search index had more to give; the count shown is a floor, not a
      // total, and the UI must say so rather than implying these are all the matches.
      truncated: messages.length === limit,
      limit,
    };
  },
});

/**
 * A character's memories, newest first. Relationship memories name the other character, and
 * conversation memories link back to the transcript they summarize.
 *
 * Note: the `memories` table has no `worldId` column, and game ids like `p:3` restart per world, so
 * with several worlds in one deployment these results can mix worlds. Single-world deployments —
 * the normal case — are unaffected.
 */
export const memories = query({
  args: {
    worldId: v.id('worlds'),
    playerId,
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('memories')
      .withIndex('playerId', (q) => q.eq('playerId', args.playerId))
      .order('desc')
      .paginate(args.paginationOpts);
    const names = await characterNames(ctx, args.worldId);
    return {
      ...result,
      page: result.page.map((memory) => ({
        _id: memory._id,
        _creationTime: memory._creationTime,
        description: memory.description,
        importance: memory.importance,
        lastAccess: memory.lastAccess,
        type: memory.data.type,
        about: memory.data.type === 'relationship' ? named(names, memory.data.playerId) : null,
        conversationId: memory.data.type === 'conversation' ? memory.data.conversationId : null,
        withPlayers:
          memory.data.type === 'conversation'
            ? memory.data.playerIds.map((p) => named(names, p))
            : [],
        reflectionSize:
          memory.data.type === 'reflection' ? memory.data.relatedMemoryIds.length : null,
      })),
    };
  },
});

/**
 * Aggregate statistics over a world's conversation archive: daily volume, per-character totals, and
 * the who-talks-to-whom pair matrix.
 *
 * Derived from `archivedConversations` (which carries `numMessages`) rather than scanning the
 * message table, so one bounded pass covers the whole town.
 */
export const stats = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query('archivedConversations')
      .withIndex('worldId_ended', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(MAX_AGGREGATE_SCAN);
    const names = await characterNames(ctx, args.worldId);

    const DAY = 24 * 60 * 60 * 1000;
    const daily = new Map<number, { conversations: number; messages: number }>();
    const pairs = new Map<
      string,
      { a: string; b: string; conversations: number; messages: number }
    >();
    const durations: number[] = [];
    let totalMessages = 0;
    let emptyConversations = 0;

    for (const conversation of conversations) {
      totalMessages += conversation.numMessages;
      if (conversation.numMessages === 0) {
        emptyConversations += 1;
      }

      const day = Math.floor(conversation.created / DAY) * DAY;
      const bucket = daily.get(day) ?? { conversations: 0, messages: 0 };
      bucket.conversations += 1;
      bucket.messages += conversation.numMessages;
      daily.set(day, bucket);

      if (conversation.ended > conversation.created) {
        durations.push(conversation.ended - conversation.created);
      }

      // `participants` is unordered, so sort each pair to collapse both directions into one cell.
      const participants = [...conversation.participants].sort();
      for (let i = 0; i < participants.length; i++) {
        for (let j = i + 1; j < participants.length; j++) {
          const key = `${participants[i]}\u0000${participants[j]}`;
          const pair = pairs.get(key) ?? {
            a: participants[i],
            b: participants[j],
            conversations: 0,
            messages: 0,
          };
          pair.conversations += 1;
          pair.messages += conversation.numMessages;
          pairs.set(key, pair);
        }
      }
    }

    durations.sort((x, y) => x - y);
    const median = durations.length ? durations[Math.floor(durations.length / 2)] : 0;

    return {
      totals: {
        conversations: conversations.length,
        messages: totalMessages,
        emptyConversations,
        medianDurationMs: median,
        earliest: conversations.length ? conversations[conversations.length - 1].created : null,
        latest: conversations.length ? conversations[0].ended : null,
      },
      daily: [...daily.entries()]
        .map(([day, value]) => ({ day, ...value }))
        .sort((x, y) => x.day - y.day),
      pairs: [...pairs.values()]
        .map((pair) => ({
          ...pair,
          aName: names.get(pair.a) ?? pair.a,
          bName: names.get(pair.b) ?? pair.b,
        }))
        .sort((x, y) => y.messages - x.messages),
      truncated: conversations.length === MAX_AGGREGATE_SCAN,
    };
  },
});

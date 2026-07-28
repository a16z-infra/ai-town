import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Character } from '../types';
import { dateTime } from '../format';
import Swatch from './Swatch';

const TYPE_LABEL: Record<string, string> = {
  conversation: 'Conversation summary',
  relationship: 'Opinion',
  reflection: 'Reflection',
};

/**
 * What a character remembers: the summaries written after each conversation, their opinions of
 * other characters, and periodic reflections. This is the material the agent retrieves by vector
 * search when deciding what to say, so it explains a lot of otherwise puzzling behaviour.
 */
export default function MemoriesView({
  worldId,
  playerId,
  characters,
  colors,
  onOpenConversation,
}: {
  worldId: Id<'worlds'>;
  playerId: string | undefined;
  characters: Character[] | undefined;
  colors: Map<string, string>;
  onOpenConversation: (id: string) => void;
}) {
  const memories = usePaginatedQuery(
    api.analytics.memories,
    playerId ? { worldId, playerId } : 'skip',
    { initialNumItems: 20 },
  );

  // The `memories` table has no worldId column and game ids restart per world, so this list cannot
  // be scoped to the selected world. It only matters with more than one world in a deployment, so
  // say so exactly then rather than crying wolf in the normal single-world case.
  const worlds = useQuery(api.analytics.worlds);
  const mayMixWorlds = (worlds?.length ?? 1) > 1;

  if (!playerId) {
    return (
      <div
        className="flex-1 grid place-items-center p-8 text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        <p className="max-w-sm text-sm">
          Select a character in the sidebar to read their memories.
        </p>
      </div>
    );
  }

  const character = characters?.find((c) => c.playerId === playerId);

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Swatch color={colors.get(playerId)} />
          <h2 className="font-medium">{character?.name ?? playerId}</h2>
        </div>
        {character?.plan && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Plan: {character.plan}
          </p>
        )}
      </div>

      <div className="scroll-y flex-1 px-4 py-4">
        {mayMixWorlds && (
          <p
            className="panel p-2 mb-3 max-w-3xl text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            This deployment has more than one world. Memories aren’t stored with a world id, and
            character ids repeat across worlds, so this list may include memories from another
            world.
          </p>
        )}
        {memories.status === 'LoadingFirstPage' && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Loading…
          </p>
        )}
        {memories.status === 'Exhausted' && memories.results.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No memories recorded yet. Agents write these after a conversation ends.
          </p>
        )}

        {memories.results.map((memory) => (
          <article key={memory._id} className="panel p-3 mb-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span
                className="px-1.5 py-0.5 rounded"
                style={{ background: 'var(--raised)', color: 'var(--text-secondary)' }}
              >
                {TYPE_LABEL[memory.type] ?? memory.type}
              </span>

              {memory.about && (
                <span className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-muted)' }}>about</span>
                  <Swatch color={colors.get(memory.about.playerId)} size={8} />
                  <span>{memory.about.name}</span>
                </span>
              )}

              {memory.withPlayers.map((other) => (
                <span key={other.playerId} className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-muted)' }}>with</span>
                  <Swatch color={colors.get(other.playerId)} size={8} />
                  <span>{other.name}</span>
                </span>
              ))}

              {memory.reflectionSize !== null && (
                <span style={{ color: 'var(--text-muted)' }}>
                  from {memory.reflectionSize} memories
                </span>
              )}

              <span className="tabular ml-auto" style={{ color: 'var(--text-muted)' }}>
                importance {memory.importance} · {dateTime(memory._creationTime)}
              </span>
            </div>

            <p
              className="text-sm whitespace-pre-wrap mt-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {memory.description}
            </p>

            {memory.conversationId && (
              <button
                className="text-xs mt-2 hover:underline"
                style={{ color: 'var(--accent)' }}
                onClick={() => onOpenConversation(memory.conversationId!)}
              >
                Read the conversation this came from →
              </button>
            )}
          </article>
        ))}

        {memories.status === 'CanLoadMore' && (
          <button
            className="text-sm py-2"
            style={{ color: 'var(--accent)' }}
            onClick={() => memories.loadMore(20)}
          >
            Load 20 more
          </button>
        )}
      </div>
    </div>
  );
}

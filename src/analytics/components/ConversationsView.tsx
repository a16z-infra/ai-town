import { useEffect, useState } from 'react';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { compact, dateTime, duration } from '../format';
import Swatch from './Swatch';
import Transcript from './Transcript';

/** Debounces the search box so every keystroke doesn't hit the search index. */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export default function ConversationsView({
  worldId,
  playerId,
  colors,
  conversationId,
  onOpenConversation,
}: {
  worldId: Id<'worlds'>;
  playerId: string | undefined;
  colors: Map<string, string>;
  conversationId: string | undefined;
  onOpenConversation: (id: string) => void;
}) {
  const [rawQuery, setRawQuery] = useState('');
  const search = useDebounced(rawQuery.trim(), 250);

  const active = useQuery(api.analytics.activeConversations, { worldId });
  const history = usePaginatedQuery(
    api.analytics.conversations,
    { worldId, playerId },
    { initialNumItems: 30 },
  );
  const hits = useQuery(
    api.analytics.searchMessages,
    search ? { worldId, query: search, playerId } : 'skip',
  );

  const visibleActive = (active ?? []).filter(
    (conversation) => !playerId || conversation.participants.some((p) => p.playerId === playerId),
  );

  return (
    <>
      <div
        className="w-[26rem] shrink-0 flex flex-col min-h-0"
        style={{ borderRight: '1px solid var(--border)', background: 'var(--surface-1)' }}
      >
        <div className="p-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <input
            className="field w-full text-sm"
            placeholder={playerId ? 'Search this character’s messages…' : 'Search all messages…'}
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
          />
        </div>

        <div className="scroll-y flex-1">
          {search ? (
            <SearchResults
              hits={hits}
              search={search}
              colors={colors}
              selected={conversationId}
              onOpen={onOpenConversation}
            />
          ) : (
            <>
              {visibleActive.map((conversation) => (
                <button
                  key={conversation.id}
                  className="row-button"
                  aria-selected={conversationId === conversation.id}
                  onClick={() => onOpenConversation(conversation.id)}
                >
                  <Participants
                    participants={conversation.participants}
                    colors={colors}
                    trailing={
                      <span
                        className="text-[10px] px-1.5 rounded-full"
                        style={{ background: 'rgba(12,163,12,0.18)', color: '#0ca30c' }}
                      >
                        in progress
                      </span>
                    }
                  />
                  <div className="text-xs tabular mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    started {dateTime(conversation.created)} · {conversation.numMessages} msgs
                  </div>
                </button>
              ))}

              {history.results.map((conversation) => (
                <button
                  key={conversation.id}
                  className="row-button"
                  aria-selected={conversationId === conversation.id}
                  onClick={() => onOpenConversation(conversation.id)}
                >
                  <Participants participants={conversation.participants} colors={colors} />
                  <div className="text-xs tabular mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {dateTime(conversation.created)} · {conversation.numMessages} msgs ·{' '}
                    {duration((conversation.ended ?? conversation.created) - conversation.created)}
                  </div>
                </button>
              ))}

              {history.status === 'CanLoadMore' && (
                <button
                  className="w-full py-3 text-sm"
                  style={{ color: 'var(--accent)' }}
                  onClick={() => history.loadMore(30)}
                >
                  Load 30 more
                </button>
              )}
              {history.status === 'LoadingMore' && (
                <div className="py-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  Loading…
                </div>
              )}
              {history.status === 'Exhausted' &&
                history.results.length === 0 &&
                visibleActive.length === 0 && (
                  <div className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    No conversations recorded yet.
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <Transcript worldId={worldId} conversationId={conversationId} colors={colors} />
      </div>
    </>
  );
}

function Participants({
  participants,
  colors,
  trailing,
}: {
  participants: { playerId: string; name: string }[];
  colors: Map<string, string>;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {participants.map((participant, i) => (
        <span key={participant.playerId} className="flex items-center gap-1.5">
          {i > 0 && (
            <span style={{ color: 'var(--text-muted)' }} aria-hidden="true">
              ↔
            </span>
          )}
          <Swatch color={colors.get(participant.playerId)} size={8} />
          <span className="text-sm">{participant.name}</span>
        </span>
      ))}
      {trailing}
    </div>
  );
}

function SearchResults({
  hits,
  search,
  colors,
  selected,
  onOpen,
}: {
  hits:
    | {
        _id: string;
        _creationTime: number;
        conversationId: string;
        text: string;
        playerId: string;
        name: string;
      }[]
    | undefined;
  search: string;
  colors: Map<string, string>;
  selected: string | undefined;
  onOpen: (id: string) => void;
}) {
  if (hits === undefined) {
    return (
      <div className="p-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        Searching…
      </div>
    );
  }
  if (hits.length === 0) {
    return (
      <div className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        No messages match “{search}”.
      </div>
    );
  }
  return (
    <>
      <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        {compact(hits.length)} matching {hits.length === 1 ? 'message' : 'messages'}
      </div>
      {hits.map((hit) => (
        <button
          key={hit._id}
          className="row-button"
          aria-selected={selected === hit.conversationId}
          onClick={() => onOpen(hit.conversationId)}
        >
          <div className="flex items-center gap-1.5">
            <Swatch color={colors.get(hit.playerId)} size={8} />
            <span className="text-sm font-medium">{hit.name}</span>
            <span className="text-xs tabular ml-auto" style={{ color: 'var(--text-muted)' }}>
              {dateTime(hit._creationTime)}
            </span>
          </div>
          <p className="text-xs mt-1 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
            <Highlighted text={hit.text} search={search} />
          </p>
        </button>
      ))}
    </>
  );
}

/** Highlights whole search terms in a result snippet. */
export function Highlighted({ text, search }: { text: string; search: string }) {
  const terms = search.split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return <>{text}</>;
  }
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  const lowered = new Set(terms.map((t) => t.toLowerCase()));
  return (
    <>
      {parts.map((part, i) =>
        lowered.has(part.toLowerCase()) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

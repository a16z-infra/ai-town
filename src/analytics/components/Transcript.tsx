import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { clockTime, dateTime, duration } from '../format';
import Swatch from './Swatch';

/**
 * A conversation, read in full.
 *
 * Unlike the in-game panel this pane is driven purely by explicit selection: it never clears itself
 * because a character wandered off or started talking to someone else. An in-progress conversation
 * keeps streaming in new messages, but ending it only swaps the "in progress" badge for a duration.
 */
export default function Transcript({
  worldId,
  conversationId,
  colors,
}: {
  worldId: Id<'worlds'>;
  conversationId: string | undefined;
  colors: Map<string, string>;
}) {
  const result = useQuery(
    api.analytics.transcript,
    conversationId ? { worldId, conversationId } : 'skip',
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);
  const messageCount = result?.messages.length ?? 0;
  const isActive = result?.conversation?.isActive ?? false;

  // Jump to the top whenever a different conversation is opened — you want to read it from the
  // beginning, which is exactly what the game UI never let you do.
  useEffect(() => {
    pinnedToBottom.current = false;
    scrollRef.current?.scrollTo({ top: 0 });
  }, [conversationId]);

  // Only a live conversation follows new messages, and only while the reader is already at the
  // bottom, so scrolling back to re-read something isn't yanked away.
  useEffect(() => {
    if (isActive && pinnedToBottom.current) {
      const el = scrollRef.current;
      el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messageCount, isActive]);

  if (!conversationId) {
    return (
      <div
        className="h-full grid place-items-center p-8 text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="max-w-sm">
          <p className="text-base mb-1" style={{ color: 'var(--text-secondary)' }}>
            Pick a conversation
          </p>
          <p className="text-sm">
            Every conversation is kept, including in-progress ones. Nothing disappears while you
            read it.
          </p>
        </div>
      </div>
    );
  }

  if (result === undefined) {
    return (
      <div className="h-full grid place-items-center" style={{ color: 'var(--text-muted)' }}>
        Loading…
      </div>
    );
  }

  const { conversation, messages, truncated } = result;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          {conversation?.participants.map((participant, i) => (
            <span key={participant.playerId} className="flex items-center gap-1.5">
              {i > 0 && (
                <span style={{ color: 'var(--text-muted)' }} aria-hidden="true">
                  ↔
                </span>
              )}
              <Swatch color={colors.get(participant.playerId)} />
              <span className="font-medium">{participant.name}</span>
            </span>
          ))}
          {conversation?.isActive && (
            <span
              className="text-[10px] px-1.5 rounded-full"
              style={{ background: 'rgba(12,163,12,0.18)', color: '#0ca30c' }}
            >
              in progress
            </span>
          )}
        </div>
        <div className="text-xs tabular mt-1" style={{ color: 'var(--text-muted)' }}>
          {conversation ? (
            <>
              {dateTime(conversation.created)}
              {conversation.ended !== null && (
                <> · lasted {duration(conversation.ended - conversation.created)}</>
              )}
              {' · '}
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </>
          ) : (
            <>Conversation {conversationId} — metadata unavailable</>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="scroll-y flex-1 px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            This conversation ended before anyone said anything.
          </p>
        )}
        {messages.map((message) => (
          <article key={message._id} className="mb-4 max-w-3xl">
            <div className="flex items-baseline gap-2">
              <Swatch color={colors.get(message.playerId)} size={8} />
              <span className="text-sm font-medium">{message.name}</span>
              <time
                className="text-xs tabular"
                style={{ color: 'var(--text-muted)' }}
                dateTime={new Date(message._creationTime).toISOString()}
              >
                {clockTime(message._creationTime)}
              </time>
            </div>
            <p
              className="text-sm whitespace-pre-wrap mt-1 pl-[18px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {message.text}
            </p>
          </article>
        ))}
        {truncated && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Only the first 1,000 messages of this conversation are shown.
          </p>
        )}
      </div>
    </div>
  );
}

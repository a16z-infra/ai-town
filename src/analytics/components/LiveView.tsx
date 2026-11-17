import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { clockTime, duration, relativeTime } from '../format';
import Swatch from './Swatch';

/**
 * Everything being said in the town right now, in one stream.
 *
 * Convex pushes new messages to the subscription, so there is no polling here — the only timer is
 * the one keeping the "2m ago" labels honest.
 */
export default function LiveView({
  worldId,
  colors,
  playerId,
  characterName,
  onOpenConversation,
  onSelectCharacter,
}: {
  worldId: Id<'worlds'>;
  colors: Map<string, string>;
  playerId: string | undefined;
  characterName: string | undefined;
  onOpenConversation: (id: string) => void;
  onSelectCharacter: (playerId: string | undefined) => void;
}) {
  const active = useQuery(api.analytics.activeConversations, { worldId });
  const messages = useQuery(api.analytics.recentMessages, { worldId, limit: 120, playerId });

  // With a character selected the rail narrows too, so it can't contradict the feed beside it.
  const visibleActive = (active ?? []).filter(
    (conversation) => !playerId || conversation.participants.some((p) => p.playerId === playerId),
  );

  // Relative timestamps need a clock; the message data itself is pushed, not polled.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [follow, setFollow] = useState(true);

  // Switching filter swaps the whole feed, so start following the new one from the bottom.
  useEffect(() => {
    setFollow(true);
  }, [playerId]);

  useEffect(() => {
    if (!follow) {
      return;
    }
    const el = scrollRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, follow]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    setFollow(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  };

  return (
    <div className="flex-1 flex min-w-0">
      <div className="flex-1 min-w-0 flex flex-col">
        <div
          className="px-4 py-2 flex items-center gap-3 flex-wrap"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-medium flex items-center gap-1.5">
            {playerId && <Swatch color={colors.get(playerId)} size={8} />}
            {characterName ? `${characterName} feed` : 'Town feed'}
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {messages === undefined ? 'loading…' : `last ${messages.length} messages`}
            {characterName && <> · all conversations involving {characterName}</>}
          </span>
          {playerId && (
            <button
              className="text-xs"
              style={{ color: 'var(--accent)' }}
              onClick={() => onSelectCharacter(undefined)}
            >
              clear
            </button>
          )}
          {!follow && (
            <button
              className="text-xs ml-auto"
              style={{ color: 'var(--accent)' }}
              onClick={() => setFollow(true)}
            >
              ↓ Jump to latest
            </button>
          )}
        </div>

        <div ref={scrollRef} onScroll={onScroll} className="scroll-y flex-1 px-4 py-3">
          {messages === undefined && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Loading…
            </p>
          )}
          {messages?.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {characterName
                ? `${characterName} hasn’t been in a conversation with any messages yet.`
                : 'Nobody has said anything yet. If the town is frozen, unfreeze it in the game window.'}
            </p>
          )}
          {messages?.map((message) => (
            <article key={message._id} className="mb-3 max-w-3xl">
              <div className="flex items-baseline gap-2">
                <Swatch color={colors.get(message.playerId)} size={8} />
                <button
                  className="text-sm font-medium hover:underline"
                  onClick={() => onSelectCharacter(message.playerId)}
                >
                  {message.name}
                </button>
                <time className="text-xs tabular" style={{ color: 'var(--text-muted)' }}>
                  {clockTime(message._creationTime)}
                </time>
                <button
                  className="text-xs ml-auto hover:underline"
                  style={{ color: 'var(--accent)' }}
                  onClick={() => onOpenConversation(message.conversationId)}
                >
                  open transcript
                </button>
              </div>
              <p
                className="text-sm whitespace-pre-wrap mt-0.5 pl-[18px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {message.text}
              </p>
            </article>
          ))}
        </div>
      </div>

      <aside
        className="w-72 shrink-0 flex flex-col"
        style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface-1)' }}
      >
        <div
          className="px-3 py-2 text-xs uppercase tracking-wide"
          style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
        >
          Happening now
        </div>
        <div className="scroll-y flex-1">
          {active !== undefined && visibleActive.length === 0 && (
            <p className="p-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              {characterName
                ? `${characterName} isn’t in a conversation right now.`
                : 'No conversations in progress.'}
            </p>
          )}
          {visibleActive.map((conversation) => (
            <button
              key={conversation.id}
              className="row-button"
              onClick={() => onOpenConversation(conversation.id)}
            >
              <div className="flex flex-col gap-1">
                {conversation.participants.map((participant) => (
                  <span key={participant.playerId} className="flex items-center gap-1.5">
                    <Swatch color={colors.get(participant.playerId)} size={8} />
                    <span className="text-sm">{participant.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {conversation.typingPlayerId === participant.playerId
                        ? 'typing…'
                        : participant.status}
                    </span>
                  </span>
                ))}
              </div>
              <div className="text-xs tabular mt-1" style={{ color: 'var(--text-muted)' }}>
                {conversation.numMessages} msgs · {duration(now - conversation.created)} in
                {conversation.lastMessage && (
                  <> · last {relativeTime(conversation.lastMessage.timestamp, now)}</>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

import clsx from 'clsx';
import { Doc, Id } from '../../convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { MessageInput } from './MessageInput';

export function Messages({
  worldId,
  conversation,
  inConversationWithMe,
  humanPlayer,
}: {
  worldId: Id<'worlds'>;
  conversation: Doc<'conversations'>;
  inConversationWithMe: boolean;
  humanPlayer?: Doc<'players'>;
}) {
  const humanPlayerId = humanPlayer?._id;
  const messages = useQuery(api.messages.listMessages, { conversationId: conversation._id });
  const currentlyTyping = useQuery(api.messages.currentlyTyping, {
    conversationId: conversation._id,
  });

  if (messages === undefined || currentlyTyping === undefined) {
    return null;
  }
  if (messages.length === 0 && !inConversationWithMe) {
    return null;
  }
  return (
    <div className="chats">
      <div className="bg-brown-200 text-black p-2">
        {messages.length > 0 &&
          messages.map((m) => (
            <div key={m._id} className="leading-tight mb-6">
              <div className="flex gap-4">
                <span className="uppercase flex-grow">{m.authorName}</span>
                <time dateTime={m._creationTime.toString()}>
                  {new Date(m._creationTime).toLocaleString()}
                </time>
              </div>
              <div className={clsx('bubble', m.author === humanPlayerId && 'bubble-mine')}>
                <p className="bg-white -mx-3 -my-1">{m.text}</p>
              </div>
            </div>
          ))}
        {currentlyTyping && currentlyTyping.playerId !== humanPlayerId && (
          <div key="typing" className="leading-tight mb-6">
            <div className="flex gap-4">
              <span className="uppercase flex-grow">{currentlyTyping.playerName}</span>
              <time dateTime={currentlyTyping.since.toString()}>
                {new Date(currentlyTyping.since).toLocaleString()}
              </time>
            </div>
            <div className={clsx('bubble')}>
              <p className="bg-white -mx-3 -my-1">
                <i>typing...</i>
              </p>
            </div>
          </div>
        )}
        {humanPlayer && inConversationWithMe && !conversation.finished && (
          <MessageInput conversation={conversation} humanPlayer={humanPlayer} />
        )}
      </div>
    </div>
  );
}

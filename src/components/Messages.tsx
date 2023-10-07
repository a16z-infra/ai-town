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
  const members = useQuery(api.world.conversationMembers, { conversationId: conversation._id });

  if (messages === undefined || currentlyTyping === undefined || members === undefined) {
    return null;
  }
  if (messages.length === 0 && !inConversationWithMe) {
    return null;
  }
  const messageNodes: { time: number; node: React.ReactNode }[] = messages.map((m) => {
    const node = (
      <div key={`text-${m._id}`} className="leading-tight mb-6">
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
    );
    return { node, time: m._creationTime };
  });
  const lastMessageTs = messages.map((m) => m._creationTime).reduce((a, b) => Math.max(a, b), 0);

  const membershipNodes: typeof messageNodes = members.flatMap((m) => {
    let started;
    if (m.status.kind === 'participating' || m.status.kind === 'left') {
      started = m.status.started;
    }
    const ended = m.status.kind === 'left' ? m.status.ended : undefined;
    const out = [];
    if (started) {
      out.push({
        node: (
          <div key={`joined-${m._id}`} className="leading-tight mb-6">
            <p className="text-brown-700 text-center">{m.playerName} joined the conversation.</p>
          </div>
        ),
        time: started,
      });
    }
    if (ended) {
      out.push({
        node: (
          <div key={`left-${m._id}`} className="leading-tight mb-6">
            <p className="text-brown-700 text-center">{m.playerName} left the conversation.</p>
          </div>
        ),
        // Always sort all "left" messages after the last message.
        // TODO: We can remove this once we want to support more than two participants per conversation.
        time: Math.max(lastMessageTs + 1, ended),
      });
    }
    return out;
  });
  const nodes = [...messageNodes, ...membershipNodes];
  nodes.sort((a, b) => a.time - b.time);
  return (
    <div className="chats">
      <div className="bg-brown-200 text-black p-2">
        {nodes.length > 0 && nodes.map((n) => n.node)}
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

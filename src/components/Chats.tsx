import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import type { Player as PlayerState } from '../../convex/schema';
import clsx from 'clsx';

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ');
}

function Messages({
  conversationId,
  currentPlayerId,
}: {
  conversationId: Id<'conversations'>;
  currentPlayerId: Id<'players'>;
}) {
  const messages =
    useQuery(api.chat.listMessages, {
      conversationId,
    }) || [];
  return (
    <>
      {[...messages]
        .reverse()
        // We can filter out the "started" and "left" conversations with this:
        // .filter((m) => m.data.type === 'responded')
        .map((message) => (
          <div className="leading-tight mb-6" key={message.ts}>
            {message.type === 'responded' ? (
              <>
                <div className="flex gap-4">
                  <span className="uppercase flex-grow">{message.fromName}</span>
                  <time dateTime={message.ts.toString()}>
                    {new Date(message.ts).toLocaleString()}
                  </time>
                </div>
                <p className={clsx('bubble', message.from === currentPlayerId && 'bubble-mine')}>
                  <div className="bg-white -mx-3 -my-1">{message.content}</div>
                </p>
              </>
            ) : (
              <p className="text-brown-700 text-center">
                {message.fromName} {message.type === 'left' ? 'left' : 'started'}
                {' the conversation.'}
              </p>
            )}
          </div>
        ))}
    </>
  );
}

export default function Chats({ playerState }: { playerState: PlayerState | undefined }) {
  return (
    <div>
      {!playerState ? (
        <div className="relative pb-8">Click on an agent on the map to see chat history</div>
      ) : (
        <ul role="list" className="-mb-8 overflow-auto">
          <li className="mb-5">
            <div className="box mb-4">
              <h2 className="bg-brown-700 p-2 font-display text-4xl tracking-wider shadow-solid text-center">
                {playerState.name}
              </h2>
            </div>
            <p className="text-sm">
              <span>{playerState.identity}</span>
            </p>
          </li>
          {playerState.lastChat?.conversationId && (
            <div className="bg-brown-200 text-black p-6">
              <Messages
                conversationId={playerState.lastChat?.conversationId}
                currentPlayerId={playerState.id}
              />
            </div>
          )}
        </ul>
      )}
    </div>
  );
}

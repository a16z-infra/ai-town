import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import type { Player as PlayerState } from '../../convex/schema';

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ');
}

function Messages({ conversationId }: { conversationId: Id<'conversations'> }) {
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
        .map((message, messageIdx) => (
          <div key={message.ts}>
            <div className="relative pb-8">
              <div className="relative flex space-x-3">
                <div className="flex flex-col min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div className="whitespace-nowrap text-top text-sm">
                    <time dateTime={message.ts.toString()}>
                      {new Date(message.ts).toLocaleString()}
                    </time>
                  </div>
                  <div>
                    {message.type === 'responded' ? (
                      <div className="text-sm">
                        <b>{message.fromName}: </b>
                        <p className="bubble">
                          <div className="bg-white">{message.content}</div>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm">
                        <b>{message.fromName} </b>
                        {message.type === 'left' ? 'left' : 'started'}
                        {' the conversation'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
              <Messages conversationId={playerState.lastChat?.conversationId} />
            </div>
          )}
        </ul>
      )}
    </div>
  );
}

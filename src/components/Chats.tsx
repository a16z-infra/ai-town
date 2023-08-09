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
          <li key={message.ts}>
            <div className="relative pb-8">
              {messageIdx !== messages.length - 1 ? (
                <span
                  className="absolute left-1 top-2 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-2 w-2 rounded-full flex items-center justify-center ring-3 ring-white bg-gray-400"></span>
                </div>
                <div className="flex flex-col min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div className="whitespace-nowrap text-top text-sm text-gray-500">
                    <time dateTime={message.ts.toString()}>
                      {new Date(message.ts).toLocaleString()}
                    </time>
                  </div>
                  <div>
                    {message.type === 'responded' ? (
                      <p className="text-sm text-gray-500">
                        <b>{message.fromName}: </b>
                        {message.content}{' '}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        <b>{message.fromName} </b>
                        {message.type === 'left' ? 'left' : 'started'}
                        {' the conversation'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
    </>
  );
}

export default function Chats({ playerState }: { playerState: PlayerState | undefined }) {
  return (
    <div className="flow-root  max-h-full">
      {!playerState ? (
        <div className="relative pb-8">Click on an agent on the map to see chat history</div>
      ) : (
        <ul role="list" className="-mb-8 overflow-auto">
          <li className="mb-5">
            <h3 className="text-base font-semibold leading-6 text-gray-900">{playerState.name}</h3>
            <p className="text-sm text-gray-500">
              <span>{playerState.identity}</span>
            </p>
          </li>
          {playerState.lastChat?.conversationId && (
            <Messages conversationId={playerState.lastChat?.conversationId} />
          )}
        </ul>
      )}
    </div>
  );
}

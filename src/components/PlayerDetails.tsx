import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import type { Player as PlayerState } from '../../convex/schema';
import clsx from 'clsx';
import LoginButton from './LoginButton';
import { SignedIn, SignedOut } from '@clerk/nextjs';

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
                <div className={clsx('bubble', message.from === currentPlayerId && 'bubble-mine')}>
                  <p className="bg-white -mx-3 -my-1">{message.content}</p>
                </div>
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

export default function PlayerDetails({ playerId }: { playerId: Id<'players'> }) {
  const playerState = useQuery(api.players.playerState, { playerId });

  return (
    playerState && (
      <>
        <div className="box">
          <h2 className="bg-brown-700 p-2 font-display text-4xl tracking-wider shadow-solid text-center">
            {playerState.name}
          </h2>
        </div>

        <div className="desc my-6">
          <p className="leading-tight -m-4 bg-brown-700 text-lg">{playerState.identity}</p>
        </div>

        {/*
      We could also check authentication on the backend side,
      but it’s not a priority at the moment since logged in users don’t really
      get special permissions.
      */}
        <SignedIn>
          {playerState.lastChat?.conversationId && (
            <div className="chats">
              <div className="bg-brown-200 text-black p-2">
                <Messages
                  conversationId={playerState.lastChat?.conversationId}
                  currentPlayerId={playerState.id}
                />
              </div>
            </div>
          )}
        </SignedIn>

        <SignedOut>
          <div className="login-prompt">
            <div className="bg-clay-300 text-clay-900 -m-6">
              <p className="text-center">You need to be logged in to read the conversations.</p>

              <div className="text-center mt-4 text-xl">
                <LoginButton />
              </div>
            </div>
          </div>
        </SignedOut>
      </>
    )
  );
}

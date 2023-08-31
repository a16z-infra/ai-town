import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Message } from '../../convex/schema';
import closeImg from "../../assets/close.svg";
import { SelectPlayer } from './Player';
import { SignedIn } from '@clerk/clerk-react';

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
  const controlMessage = (message: Message, idx: number) => {
    if (message.type === 'started' && idx > 0) {
      // Conversation already started.
      return null;
    }
    return <p className="text-brown-700 text-center">
      {message.fromName} {message.type === 'left' ? 'left' : 'started'}
      {' the conversation.'}
    </p>;
  };

  return (
    <>
      {[...messages]
        .reverse()
        // We can filter out the "started" and "left" conversations with this:
        // .filter((m) => m.data.type === 'responded')
        .map((message, idx) => (
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
              controlMessage(message, idx)
            )}
          </div>
        ))}
        <MessageInput currentPlayerId={currentPlayerId} conversationId={conversationId} />
    </>
  );
}

function MessageInput({
  conversationId,
  currentPlayerId,
}: {
  conversationId: Id<'conversations'>;
  currentPlayerId: Id<'players'>;
}) {
  const activePlayer = useQuery(api.players.getActivePlayer);
  const waitingToTalk = useQuery(api.players.waitingToTalk, {conversationId});
  const userTalkModerated = useAction(api.journal.userTalkModerated);
  const userTalk = useMutation(api.journal.userTalk);
  const inputRef = useRef<HTMLParagraphElement>(null);
  const [inputFlagged, setInputFlagged] = useState(false);

  const enterKeyPress = async () => {
    const {contentId, flagged} = await userTalkModerated({content: inputRef.current!.innerText});
    if (flagged) {
      setInputFlagged(true);
      setTimeout(() => setInputFlagged(false), 3000);
    } else {
      await userTalk({contentId});
    }
    inputRef.current!.innerText = '';
  };

  if (!activePlayer || !waitingToTalk) {
    return null;
  }
  return <div className="leading-tight mb-6">
    <div className="flex gap-4">
      <span className="uppercase flex-grow">{activePlayer.name}</span>
      <span>{inputFlagged ? "be nice" : null}</span>
    </div>
    <div className={clsx('bubble', currentPlayerId === activePlayer.id && 'bubble-mine')}>
      <p
        className="bg-white -mx-3 -my-1"
        ref={inputRef}
        contentEditable
        style={{outline: 'none'}}
        tabIndex={0}
        placeholder='Type here'
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            void enterKeyPress();
          }
        }}
      >
      </p>
    </div>
  </div>;
}

export default function PlayerDetails({ playerId, setSelectedPlayer }: { playerId?: Id<'players'>, setSelectedPlayer: SelectPlayer }) {
  const currentConversationPlayers = useQuery(api.agent.myCurrentConversation, {});
  const inConversation = currentConversationPlayers !== undefined && currentConversationPlayers !== null;
  if (inConversation) {
    if (!playerId || !currentConversationPlayers.includes(playerId)) {
      playerId = currentConversationPlayers[0];
    }
  }
  const playerState = useQuery(api.players.playerState, playerId ? { playerId } : "skip");
  const playerDetails = useQuery(api.agent.playerDetails, playerId ? { playerId } : "skip");
  const talkToMe = useMutation(api.agent.talkToMe);
  const leaveCurrentConversation = useMutation(api.agent.leaveMyCurrentConversation);

  const [playerApproaching, setPlayerApproaching] = useState<Id<"players"> | undefined>();
  useEffect(() => {
    if (playerApproaching && playerApproaching !== playerId) {
      setPlayerApproaching(undefined);
    }
  }, [playerApproaching, playerId, setPlayerApproaching]);

  const startConversation = () => {
    void talkToMe({ playerId: playerId! });
    setPlayerApproaching(playerId);
  }
  const approaching = playerApproaching == playerId;
  const startConversationMsg = approaching ? "Walking over..." : "Start conversation";
  let startConversationCls = "mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto";
  if (approaching) {
    startConversationCls += " opacity-50"
  }
  if (!playerId) {
    return (
      <div className="h-full text-xl flex text-center items-center p-4">
        Click on an agent on the map to see chat history.
      </div>
    )
  }
  return (
    playerId && playerState && playerDetails !== undefined && (
      <>
        <div className="flex gap-4">
          <div className="box flex-grow">
            <h2 className="bg-brown-700 p-2 font-display text-4xl tracking-wider shadow-solid text-center">
              {playerState.name}
            </h2>
          </div>
          <a className="button text-white shadow-solid text-2xl cursor-pointer pointer-events-auto"
            onClick={() => {
              if (inConversation) {
                void leaveCurrentConversation();
              }
              setSelectedPlayer(undefined)
            }}
          >
            <h2 className="h-full bg-clay-700">
              <img className="w-5 h-5" src={closeImg} />
            </h2>
          </a>
        </div>

        {playerDetails.canTalk && (
          <SignedIn>
          <a className={startConversationCls}
            title="Start a conversation"
            onClick={startConversation}
          >
            <div className="h-full bg-clay-700 text-center">
              <span>{startConversationMsg}</span>
            </div>
          </a>
        </SignedIn>
        )}

        <div className="desc my-6">
          <p className="leading-tight -m-4 bg-brown-700 text-lg">
            {!playerDetails.isMe && playerState.identity}
            {playerDetails.isMe && (<i>This is you!</i>)}
            {inConversation && (<><br/><br/>(<i>Conversing with you!</i>)</>)}
          </p>
        </div>

        {!playerDetails.isMe && playerState.lastChat?.conversationId && (
          <div className="chats">
            <div className="bg-brown-200 text-black p-2">
              <Messages
                conversationId={playerState.lastChat?.conversationId}
                currentPlayerId={playerState.id}
              />
            </div>
          </div>
        )}
      </>
    )
  );
}

// Removed Convex imports
// import { useQuery } from 'convex/react';
// import { api } from '../../convex/_generated/api';
// import { Id } from '../../convex/_generated/dataModel';
import closeImg from '../../assets/close.svg';
import { SelectElement } from './Player'; // This is likely a type, should be fine or moved.
import { Messages } from './Messages';
// import { toastOnError } from '../toasts'; // Keep if used by non-Convex logic
// import { useSendInput } from '../hooks/sendInput'; // Removed
// import { Player } from '../../convex/aiTown/player'; // Use Player from dataModels
import { GameId, PlayerId } from '../dataModels/ids'; // Use GameId from dataModels
// import { ServerGame } from '../hooks/serverGame'; // Removed, use ClientGame
import { ClientGame } from '../hooks/useClientGame'; // Import ClientGame
import { Player } from '../dataModels/player'; // Import Player class from dataModels

export default function PlayerDetails({
  // worldId, // Now part of game object
  // engineId, // Now part of game object
  game,
  playerId, // This is the selected player's ID
  setSelectedElement,
  scrollViewRef,
}: {
  // worldId: Id<'worlds'>; // Replaced by game prop
  // engineId: Id<'engines'>; // Replaced by game prop
  game?: ClientGame; // Changed ServerGame to ClientGame, make it optional for loading state
  playerId?: GameId<'players'>;
  setSelectedElement: SelectElement;
  scrollViewRef: React.RefObject<HTMLDivElement>;
}) {
  // const humanTokenIdentifier = useQuery(api.world.userStatus, { worldId }); // Removed

  // --- Human Player Identification (Simplified) ---
  // For now, assume a fixed human player ID or that 'human' field is set in DB.
  // This needs a proper mechanism later (e.g. Clerk auth, or a way to set human player in DB)
  const humanPlayerId: PlayerId | undefined = 'p:0' as PlayerId; // Placeholder for "player1" or first player
  // const humanPlayer = game?.world?.players.get(humanPlayerId);

  // A more robust way to find a human player if the 'human' field is populated:
  let humanPlayer: Player | undefined;
  if (game?.world?.players) {
    for (const p of game.world.players.values()) {
      if (p.human) { // Assuming 'human' field on Player object indicates it's a human-controlled player
        humanPlayer = p;
        break;
      }
    }
    // If no player has a 'human' field, fallback to the placeholder for testing.
    if (!humanPlayer && humanPlayerId) {
        humanPlayer = game.world.players.get(humanPlayerId);
    }
  }

  const humanConversation = humanPlayer && game?.world ? game.world.playerConversation(humanPlayer) : undefined;

  // Auto-select other player if human is in conversation (logic retained)
  let activePlayerId = playerId;
  if (humanPlayer && humanConversation) {
    const otherPlayerIds = [...humanConversation.participants.keys()].filter(
      (p) => p !== humanPlayer.id,
    );
    if (otherPlayerIds.length > 0) {
      activePlayerId = otherPlayerIds[0];
    }
  }

  const player = activePlayerId && game?.world?.players.get(activePlayerId);
  const playerConversation = player && game?.world ? game.world.playerConversation(player) : undefined;

  // const previousConversation = useQuery( api.world.previousConversation, ...); // Removed
  const previousConversation = undefined; // Simplified for now

  const playerDescription = activePlayerId && game?.playerDescriptions.get(activePlayerId);

  // const startConversation = useSendInput(engineId, 'startConversation'); // Removed
  // const acceptInvite = useSendInput(engineId, 'acceptInvite'); // Removed
  // const rejectInvite = useSendInput(engineId, 'rejectInvite'); // Removed
  // const leaveConversation = useSendInput(engineId, 'leaveConversation'); // Removed

  if (!game || !activePlayerId) { // Check for game object
    return (
      <div className="h-full text-xl flex text-center items-center p-4">
        { game ? "Click on an agent on the map to see chat history." : "Loading game details..."}
      </div>
    );
  }
  if (!player) {
     console.log("Player not found for ID:", activePlayerId, "Available players:", Array.from(game.world.players.keys()));
    return <div>Player not found.</div>; // Or some other handling
  }

  const isMe = humanPlayer && player.id === humanPlayer.id;
  const canInvite = !isMe && !playerConversation && humanPlayer && !humanConversation;
  const sameConversation =
    !isMe &&
    humanPlayer &&
    humanConversation &&
    playerConversation &&
    humanConversation.id === playerConversation.id;

  const humanStatus =
    humanPlayer && humanConversation && humanConversation.participants.get(humanPlayer.id)?.status;
  const playerStatus = playerConversation && playerConversation.participants.get(activePlayerId)?.status;

  const haveInvite = sameConversation && humanStatus?.kind === 'invited';
  const waitingForAccept =
    sameConversation && playerConversation.participants.get(activePlayerId)?.status.kind === 'invited';
  const waitingForNearby =
    sameConversation && playerStatus?.kind === 'walkingOver' && humanStatus?.kind === 'walkingOver';

  const inConversationWithMe =
    sameConversation &&
    playerStatus?.kind === 'participating' &&
    humanStatus?.kind === 'participating';

  const onStartConversation = async () => {
    console.log("Attempting to start conversation (currently disabled)");
    // if (!humanPlayer || !activePlayerId) return;
    // await toastOnError(startConversation({ playerId: humanPlayer.id, invitee: activePlayerId }));
  };
  const onAcceptInvite = async () => {
    console.log("Attempting to accept invite (currently disabled)");
    // if (!humanPlayer || !humanConversation || !activePlayerId) return;
    // await toastOnError(acceptInvite({ playerId: humanPlayer.id, conversationId: humanConversation.id }));
  };
  const onRejectInvite = async () => {
    console.log("Attempting to reject invite (currently disabled)");
    // if (!humanPlayer || !humanConversation) return;
    // await toastOnError(rejectInvite({ playerId: humanPlayer.id, conversationId: humanConversation.id }));
  };
  const onLeaveConversation = async () => {
    console.log("Attempting to leave conversation (currently disabled)");
    // if (!humanPlayer || !inConversationWithMe || !humanConversation) return;
    // await toastOnError(leaveConversation({ playerId: humanPlayer.id, conversationId: humanConversation.id }));
  };

  const pendingSuffix = (s: string) => ''; // Placeholder for pending state styling
  return (
    <>
      <div className="flex gap-4">
        <div className="box w-3/4 sm:w-full mr-auto">
          <h2 className="bg-brown-700 p-2 font-display text-2xl sm:text-4xl tracking-wider shadow-solid text-center">
            {playerDescription?.name}
          </h2>
        </div>
        <a
          className="button text-white shadow-solid text-2xl cursor-pointer pointer-events-auto"
          onClick={() => setSelectedElement(undefined)}
        >
          <h2 className="h-full bg-clay-700">
            <img className="w-4 h-4 sm:w-5 sm:h-5" src={closeImg} />
          </h2>
        </a>
      </div>
      {canInvite && (
        <a
          className={
            'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
            pendingSuffix('startConversation')
          }
          onClick={onStartConversation}
        >
          <div className="h-full bg-clay-700 text-center">
            <span>Start conversation</span>
          </div>
        </a>
      )}
      {waitingForAccept && (
        <a className="mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto opacity-50">
          <div className="h-full bg-clay-700 text-center">
            <span>Waiting for accept...</span>
          </div>
        </a>
      )}
      {waitingForNearby && (
        <a className="mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto opacity-50">
          <div className="h-full bg-clay-700 text-center">
            <span>Walking over...</span>
          </div>
        </a>
      )}
      {inConversationWithMe && (
        <a
          className={
            'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
            pendingSuffix('leaveConversation')
          }
          onClick={onLeaveConversation}
        >
          <div className="h-full bg-clay-700 text-center">
            <span>Leave conversation</span>
          </div>
        </a>
      )}
      {haveInvite && (
        <>
          <a
            className={
              'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
              pendingSuffix('acceptInvite')
            }
            onClick={onAcceptInvite}
          >
            <div className="h-full bg-clay-700 text-center">
              <span>Accept</span>
            </div>
          </a>
          <a
            className={
              'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
              pendingSuffix('rejectInvite')
            }
            onClick={onRejectInvite}
          >
            <div className="h-full bg-clay-700 text-center">
              <span>Reject</span>
            </div>
          </a>
        </>
      )}
      {!playerConversation && player.activity && player.activity.until > Date.now() && (
        <div className="box flex-grow mt-6">
          <h2 className="bg-brown-700 text-base sm:text-lg text-center">
            {player.activity.description}
          </h2>
        </div>
      )}
      <div className="desc my-6">
        <p className="leading-tight -m-4 bg-brown-700 text-base sm:text-sm">
          {!isMe && playerDescription?.description}
          {isMe && <i>This is you!</i>}
          {!isMe && inConversationWithMe && (
            <>
              <br />
              <br />(<i>Conversing with you!</i>)
            </>
          )}
        </p>
      </div>
      {!isMe && playerConversation && playerStatus?.kind === 'participating' && (
        <Messages
          worldId={worldId}
          engineId={engineId}
          inConversationWithMe={inConversationWithMe ?? false}
          conversation={{ kind: 'active', doc: playerConversation }}
          humanPlayer={humanPlayer}
          scrollViewRef={scrollViewRef}
        />
      )}
      {!playerConversation && previousConversation && (
        <>
          <div className="box flex-grow">
            <h2 className="bg-brown-700 text-lg text-center">Previous conversation</h2>
          </div>
          <Messages
            worldId={worldId}
            engineId={engineId}
            inConversationWithMe={false}
            conversation={{ kind: 'archived', doc: previousConversation }}
            humanPlayer={humanPlayer}
            scrollViewRef={scrollViewRef}
          />
        </>
      )}
    </>
  );
}

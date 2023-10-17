import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import closeImg from '../../assets/close.svg';
import { SelectElement } from './Player';
// import { SignedIn } from '@clerk/clerk-react';
import { Messages } from './Messages';
import { toastOnError } from '../toasts';
import { useSendInput } from '../hooks/sendInput';

export default function PlayerDetails({
  worldId,
  playerId,
  setSelectedElement,
}: {
  worldId: Id<'worlds'>;
  playerId?: Id<'players'>;
  setSelectedElement: SelectElement;
}) {
  const humanPlayerId = useQuery(api.world.userStatus, { worldId });
  const players = useQuery(api.world.activePlayers, { worldId }) ?? [];

  const humanConversation = useQuery(
    api.world.loadConversationState,
    humanPlayerId ? { playerId: humanPlayerId } : 'skip',
  );
  // Always select the other player if we're in a conversation with them.
  if (humanConversation) {
    playerId = humanConversation.otherPlayerId;
  }

  const playerConversation = useQuery(
    api.world.loadConversationState,
    playerId ? { playerId } : 'skip',
  );
  const previousConversation = useQuery(
    api.world.previousConversation,
    playerId ? { playerId } : 'skip',
  );

  const player = players.find((p) => p._id === playerId);
  const humanPlayer = players.find((p) => p._id === humanPlayerId);

  const startConversation = useSendInput(worldId, 'startConversation');
  const acceptInvite = useSendInput(worldId, 'acceptInvite');
  const rejectInvite = useSendInput(worldId, 'rejectInvite');
  const leaveConversation = useSendInput(worldId, 'leaveConversation');

  if (!playerId) {
    return (
      <div className="h-full text-xl flex text-center items-center p-4">
        Click on an agent on the map to see chat history.
      </div>
    );
  }
  if (humanPlayerId === undefined || !player) {
    return null;
  }
  const isMe = humanPlayerId && playerId === humanPlayerId;
  const canInvite =
    !isMe && playerConversation === null && humanPlayer && humanConversation === null;
  const sameConversation =
    !isMe &&
    humanPlayer &&
    humanConversation &&
    playerConversation &&
    humanConversation._id === playerConversation._id;
  const haveInvite = sameConversation && humanConversation.member.status.kind === 'invited';
  const waitingForAccept = sameConversation && playerConversation.member.status.kind === 'invited';
  const waitingForNearby =
    sameConversation &&
    playerConversation.member.status.kind === 'walkingOver' &&
    humanConversation.member.status.kind === 'walkingOver';

  const inConversationWithMe =
    sameConversation &&
    playerConversation.member.status.kind === 'participating' &&
    humanConversation.member.status.kind === 'participating';

  const onStartConversation = async () => {
    if (!humanPlayerId || !playerId) {
      return;
    }
    console.log(`Starting conversation`);
    await toastOnError(startConversation({ playerId: humanPlayerId, invitee: playerId }));
  };
  const onAcceptInvite = async () => {
    if (!humanPlayerId || !playerId) {
      return;
    }
    if (!humanPlayer || !humanConversation) {
      return;
    }
    await toastOnError(
      acceptInvite({
        playerId: humanPlayerId,
        conversationId: humanConversation._id,
      }),
    );
  };
  const onRejectInvite = async () => {
    if (!humanPlayerId || !humanConversation) {
      return;
    }
    await toastOnError(
      rejectInvite({
        playerId: humanPlayerId,
        conversationId: humanConversation._id,
      }),
    );
  };
  const onLeaveConversation = async () => {
    if (!humanPlayerId || !humanPlayerId || !inConversationWithMe || !humanConversation) {
      return;
    }
    await toastOnError(
      leaveConversation({
        playerId: humanPlayerId,
        conversationId: humanConversation._id,
      }),
    );
  };
  // const pendingSuffix = (inputName: string) =>
  //   [...inflightInputs.values()].find((i) => i.name === inputName) ? ' opacity-50' : '';

  const pendingSuffix = (s: string) => '';
  return (
    <>
      <div className="flex gap-4">
        <div className="box flex-grow">
          <h2 className="bg-brown-700 p-2 font-display text-4xl tracking-wider shadow-solid text-center">
            {player.name}
          </h2>
        </div>
        <a
          className="button text-white shadow-solid text-2xl cursor-pointer pointer-events-auto"
          onClick={() => setSelectedElement(undefined)}
        >
          <h2 className="h-full bg-clay-700">
            <img className="w-5 h-5" src={closeImg} />
          </h2>
        </a>
      </div>
      {/* <SignedIn> */}
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
      {/* </SignedIn> */}
      <div className="desc my-6">
        <p className="leading-tight -m-4 bg-brown-700 text-lg">
          {!isMe && player.description}
          {isMe && <i>This is you!</i>}
          {!isMe && inConversationWithMe && (
            <>
              <br />
              <br />(<i>Conversing with you!</i>)
            </>
          )}
        </p>
      </div>
      {!isMe && playerConversation && playerConversation.member.status.kind === 'participating' && (
        <Messages
          worldId={worldId}
          inConversationWithMe={inConversationWithMe ?? false}
          conversation={playerConversation}
          humanPlayer={humanPlayer}
        />
      )}
      {(!playerConversation || playerConversation.member.status.kind !== 'participating') &&
        previousConversation && (
          <>
            <div className="box flex-grow">
              <h2 className="bg-brown-700 text-lg text-center">Previous conversation</h2>
            </div>
            <Messages
              worldId={worldId}
              inConversationWithMe={false}
              conversation={previousConversation}
              humanPlayer={humanPlayer}
            />
          </>
        )}
    </>
  );
}

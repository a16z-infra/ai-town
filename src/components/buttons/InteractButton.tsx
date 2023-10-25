import Button from './Button';
import { toast } from 'react-toastify';
import interactImg from '../../../assets/interact.svg';
import { useConvex, useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ConvexError } from 'convex/values';
import { Id } from '../../../convex/_generated/dataModel';
import { useCallback } from 'react';
import { waitForInput } from '../../hooks/sendInput';
import { useServerGame } from '../../hooks/serverGame';
import { useSessionMutation, useSessionQuery } from '../../hooks/useServerSession';

export default function InteractButton() {
  const { isAuthenticated } = useConvexAuth();
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const game = useServerGame(worldId);
  const sessionData = useSessionQuery(api.auth.sessionData);
  const userId = useSessionQuery(api.world.userStatus, worldId ? { worldId } : 'skip');
  const userPlayerId = game && [...game.world.players.values()].find((p) => p.human === userId)?.id;
  const join = useSessionMutation(api.world.joinWorld);
  const leave = useSessionMutation(api.world.leaveWorld);
  const isPlaying = !!userPlayerId;

  const convex = useConvex();
  const joinInput = useCallback(
    async (worldId: Id<'worlds'>) => {
      let inputId;
      try {
        inputId = await join({ worldId });
      } catch (e: any) {
        if (e instanceof ConvexError) {
          toast.error(e.data);
          return;
        }
        throw e;
      }
      try {
        await waitForInput(convex, inputId);
      } catch (e: any) {
        toast.error(e.message);
      }
    },
    [convex],
  );

  const joinOrLeaveGame = () => {
    if (!worldId || userPlayerId === undefined || game === undefined) return;
    if (!sessionData?.userId) {
      // TODO: handle log in
      // return;
    }
    if (isPlaying) {
      console.log(`Leaving game for player ${userPlayerId}`);
      void leave({ worldId });
    } else {
      console.log(`Joining game`);
      void joinInput(worldId);
    }
  };
  return (
    <Button imgUrl={interactImg} onClick={joinOrLeaveGame}>
      {isPlaying ? 'Leave' : 'Interact'}
    </Button>
  );
}

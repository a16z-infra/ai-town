import Button from './Button';
import interactImg from '../../../assets/interact.svg';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { SignInButton } from '@clerk/clerk-react';

export default function InteractButton() {
  const { isAuthenticated } = useConvexAuth();
  const world = useQuery(api.world.defaultWorld);
  const userPlayerId = useQuery(api.world.userStatus, world ? { worldId: world._id } : 'skip');
  const join = useMutation(api.world.joinWorld);
  const leave = useMutation(api.world.leaveWorld);
  const isPlaying = !!userPlayerId;

  const joinOrLeaveGame = () => {
    if (!world || !isAuthenticated || userPlayerId === undefined) {
      return;
    }
    if (isPlaying) {
      console.log(`Leaving game for player ${userPlayerId}`);
      void leave({ worldId: world._id });
    } else {
      console.log(`Joining game`);
      void join({ worldId: world._id });
    }
  };
  if (!isAuthenticated || userPlayerId === undefined) {
    return (
      <SignInButton>
        <button className="button text-white shadow-solid text-2xl pointer-events-auto">
          <div className="inline-block bg-clay-700">
            <div className="inline-flex h-full items-center gap-4">
              <img className="w-[30px] h-[30px]" src={interactImg} />
              Interact
            </div>
          </div>
        </button>
      </SignInButton>
    );
  }
  return (
    <Button imgUrl={interactImg} onClick={joinOrLeaveGame}>
      {isPlaying ? 'Leave' : 'Interact'}
    </Button>
  );
}

'use client';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEffect, useState } from 'react';

export default function FreezeButton() {
  const worldState = useQuery(api.players.getWorld, {});
  const worldId = worldState?.world._id;
  const frozen: boolean | undefined = worldState?.world.frozen;

  const [isFrozen, setFrozen] = useState(frozen);

  useEffect(() => {
    setFrozen(frozen);
  }, [frozen]);

  const unfreeze = useMutation(api.engine.unfreeze);
  const freezeAll = useMutation(api.engine.freezeAll);

  const flipSwitch = async () => {
    if (isFrozen) {
      await unfreeze({ worldId }); // use the mutation function here
    } else {
      await freezeAll(); // use the mutation function here
    }
    setFrozen(!isFrozen);
  };

  return (
    <>
      <a
        className="button text-white shadow-solid text-2xl pointer-events-auto"
        onClick={flipSwitch}
        title="When freezing a world, the agents will take some time to stop what they are doing before they become frozen. "
      >
        <div className="inline-block bg-clay-700">
          <span>
            <div className="inline-flex items-center gap-4">
              <img className="w-6 h-6" src="/assets/star.svg" />
              {isFrozen ? 'Unfreeze' : 'Freeze'}
            </div>
          </span>
        </div>
      </a>
    </>
  );
}

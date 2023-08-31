import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useCallback, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { characters } from '../../convex/characterdata/data';

export default function InteractButton() {
  const player = useQuery(api.players.getActivePlayer);
  const navigate = useMutation(api.players.navigateActivePlayer);
  const createCharacter = useMutation(api.players.createCharacter);
  const createPlayer = useMutation(api.players.createPlayer);
  const deletePlayer = useMutation(api.players.deletePlayer);
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const isPlaying = !!player;

  const startPlaying = async () => {
    if (!isAuthenticated || isPlaying || !user) {
      return;
    }
    const characterId = await createCharacter({
      name: "user",
      spritesheetData: randomSpritesheet(),
    });
    await createPlayer({
      forUser: true,
      name: user.firstName ?? "Me",
      characterId,
      pose: {
        position: {x: 1, y: 1},
        orientation: 1,
      },
    });
  };

  const leave = async () => {
    if (!isAuthenticated || !isPlaying) {
      return;
    }
    await deletePlayer();
  }

  const pendingNavigations = useRef(0);
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (isPlaying) {
        let key = event.key;
        if (key === 'ArrowLeft') {
          key = 'a';
        } else if (key === 'ArrowRight') {
          key = 'd';
        } else if (key === 'ArrowUp') {
          key = 'w';
        } else if (key === 'ArrowDown') {
          key = 's';
        }
        if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
          event.preventDefault();
          // Single-flighting.
          if (pendingNavigations.current > 0) {
            return;
          }
          pendingNavigations.current += 1;
          void navigate({direction: key}).finally(() => {
            pendingNavigations.current -= 1;
          });
        }
      }
    },
    [isPlaying],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <a
        className="button text-white shadow-solid text-2xl pointer-events-auto"
        onClick={() => {
          if (isPlaying) {
            void leave();
          } else {
            void startPlaying();
          }
        }}
        title="Join the town (press w/a/s/d to walk)"
      >
        <div className="inline-block h-full bg-clay-700 cursor-pointer">
          <span>
            <div className="inline-flex items-center gap-4">
              <img className="w-[48px] h-[30px] max-w-[54px]" src="/assets/interact.svg" />
              {isPlaying ? 'Leave' : 'Interact'}
            </div>
          </span>
        </div>
      </a>
    </>
  );
}

const randomSpritesheet = () => {
  const character = characters[Math.floor(Math.random() * characters.length)];
  return character.spritesheetData;
}

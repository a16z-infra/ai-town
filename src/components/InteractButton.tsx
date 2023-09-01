import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { characters } from '../../convex/characterdata/data';
import interactImg from "../../assets/interact.svg";
import ReactModal from 'react-modal';

type WaitlistStatusFn = typeof api.players.waitlistStatus;
type WaitlistStatus = WaitlistStatusFn["_returnType"];

const modalStyles = {
  overlay: {
    backgroundColor: "rgb(0, 0, 0, 75%)",
    zIndex: 12,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: "50%",

    border: '10px solid rgb(23, 20, 33)',
    borderRadius: "0",
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
  },
};

export default function InteractButton(props: {waitlistStatus?: WaitlistStatus}) {
  const player = useQuery(api.players.getActivePlayer);
  const navigate = useMutation(api.players.navigateActivePlayer);
  const createCharacter = useMutation(api.players.createCharacter);
  const createPlayer = useMutation(api.players.createPlayer);
  const deletePlayer = useMutation(api.players.deletePlayer);
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const isPlaying = !!player;

  const [waitlistModalOpen, setWaitlistModalOpen] = useState<boolean>(false);

  const startPlaying = async () => {
    if (!isAuthenticated || isPlaying || !user) {
      return;
    }
    const characterId = await createCharacter({
      name: "user",
      spritesheetData: randomSpritesheet(),
    });
    const resp = await createPlayer({
      forUser: true,
      name: user.firstName ?? "Me",
      characterId,
      pose: {
        position: {x: 1, y: 1},
        orientation: 1,
      },
    });
    if (resp.kind === "waitlist") {
      setWaitlistModalOpen(true);
    }
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
  const onWaitlist = props.waitlistStatus && props.waitlistStatus.ticketNumber !== null;
  return (
    <>
      {onWaitlist && (
        <ReactModal
          isOpen={waitlistModalOpen}
          onRequestClose={() => setWaitlistModalOpen(false)}
          style={modalStyles}
          contentLabel="Waitlist modal"
          ariaHideApp={false}
        >
          <Waitlist waitlistStatus={props.waitlistStatus!} />
        </ReactModal>
      )}
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
              <img className="w-[48px] h-[30px] max-w-[54px]" src={interactImg} />
              {isPlaying ? 'Leave' : !onWaitlist ? 'Interact' : 'Waitlist'}
            </div>
          </span>
        </div>
      </a>
    </>
  );
}

function Waitlist(props: {waitlistStatus: WaitlistStatus}) {
  const { firstTicket, ticketNumber, lastTicket, maxHumans } = props.waitlistStatus;

  if (firstTicket === null || ticketNumber === null || lastTicket === null) {
    throw new Error(`Invalid waitlist status: ${JSON.stringify(props.waitlistStatus)}`);
  }
  const position = ticketNumber - firstTicket;
  const numTickets = lastTicket - firstTicket;
  const progressPct = 5 + Math.round((numTickets - position) / numTickets * 95);
  return (
    <div className="font-body">
      <h1 className="text-center text-4xl font-bold font-display game-title">You're on the waitlist!</h1>
      <p>AI town currently only supports at most {maxHumans} humans at a time.</p>

      <div className="mt-4 ml-4 mr-4 game-progress-bar">
        <div className="h-4 game-progress-bar-progress" style={{width: `${progressPct}%`}}/>
      </div>

      {position > 0 && (
        <p className="mt-4 text-center">
        You're position {position + 1} of {numTickets + 1} in the queue.
      </p>
      )}
      {position == 0 && (
        <p className="mt-4 font-bold text-center">
          You're next up! Waiting for a player to leave...
        </p>
      )}
      <p className="mt-4">
        Don't want to wait? <a className="font-bold underline" href="https://github.com/get-convex/ai-town/">Fork AI town</a> to create your own game world!
      </p>
      <p className="mt-4">
        (You can close this window to watch conversations going on, and we won't lose your spot. Click "Waitlist" to reopen this window.)
      </p>
    </div>
  )
}

export const randomSpritesheet = () => {
  const character = characters[Math.floor(Math.random() * characters.length)];
  return character.spritesheetData;
}
